// Socket.io — Full Duplex Real-time Communication
// HTTP is one-directional: client requests, server responds
// WebSocket/Socket.io is bidirectional: both can initiate
// Used here for: live chat, presence, timer sync, study updates
// Each socket event is like an HTTP route but for real-time data
// Concept 8 — Socket.io (Backend Engineering-I Eval-II)

import http from "node:http";
import { Server } from "socket.io";
import "dotenv/config";
import { createApp } from "./app.js";
import { ensureDatabaseConnection } from "./config/database.js";
import Room from "./models/Room.js";
import Message from "./models/Message.js";
import { seedDefaultRooms } from "./services/roomStore.js";
import { createChatMessage, readRecentChatMessages } from "./services/chatStore.js";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "./utils/auth.js";
import {
  createRoomSessionEntry,
  closeRoomSessionEntry,
  getRoomStats,
  markRoomActivity,
  upsertUserRoomStats,
} from "./services/roomStore.js";
import {
  getRoomMembersForClient,
  registerLobbySocket,
  removeSocketEverywhere,
  unregisterLobbySocket,
  updateMemberStatus,
  upsertRoomMember,
  getGlobalStudyingApproxCount,
} from "./services/studyPresenceRegistry.js";
import { readSession, touchSession } from "./services/sessionStore.js";

const PORT = Number(process.env.PORT) || 4000;

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

const groupTimerByRoom = new Map();
const timerStarterByRoom = new Map();

function readCookieValue(cookieHeader, name) {
  if (!cookieHeader) return "";
  const pairs = String(cookieHeader).split(/;\s*/);
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.split("=");
    if (rawKey === name) return decodeURIComponent(rest.join("=") || "");
  }
  return "";
}

function dedupeMembersByUserId(members = []) {
  const map = new Map();
  for (const member of members) {
    const key = String(member?.userId || "");
    if (!key || map.has(key)) continue;
    map.set(key, member);
  }
  return [...map.values()];
}

function broadcastPresence(roomId) {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  if (!roomSockets) return;
  for (const socketId of roomSockets) {
    const sock = io.sockets.sockets.get(socketId);
    if (!sock) continue;
    const members = dedupeMembersByUserId(getRoomMembersForClient(roomId, socketId));
    sock.emit("room-members-update", { roomId, members });
  }
}

function emitLobbyCount() {
  io.to("lobby").emit("lobby-presence", { count: getGlobalStudyingApproxCount() });
}

function normalizedStatus(status) {
  const allowed = new Set(["focusing", "break", "online", "away", "invisible"]);
  return allowed.has(status) ? status : "online";
}

io.use(async (socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token || readCookieValue(socket.request.headers.cookie, AUTH_COOKIE_NAME);
    if (!authToken) {
      console.warn("[socket] Auth failed: no token");
      return next(new Error("Authentication required"));
    }

    const payload = verifyAuthToken(authToken);
    if (!payload?.sub || !payload.sessionId) {
      console.warn("[socket] Auth failed: invalid token payload");
      return next(new Error("Invalid token"));
    }

    const session = await readSession(payload.sessionId);
    if (!session || session.userId !== payload.sub) {
      console.warn("[socket] Auth failed: session not found or userId mismatch");
      return next(new Error("Authentication required"));
    }

    await touchSession(payload.sessionId);

    socket.userId = String(payload.sub);
    socket.userName = String(payload.name || "Student");
    socket.sessionId = String(payload.sessionId);
    console.log(`[socket] Auth success: userId=${socket.userId} name=${socket.userName}`);
    next();
  } catch (err) {
    console.error("[socket] Auth error:", err?.message || err);
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("[socket] Client connected:", socket.id, socket.userName);
  socket.data.userId = socket.userId;
  socket.data.username = socket.userName;

  socket.on("lobby-join", () => {
    registerLobbySocket(socket.id);
    socket.join("lobby");
    emitLobbyCount();
    console.log("Socket: lobby join", socket.id);
  });

  socket.on("lobby-leave", () => {
    unregisterLobbySocket(socket.id);
    socket.leave("lobby");
    emitLobbyCount();
  });

  socket.on("room-created", (payload) => {
    socket.broadcast.emit("room-created", payload);
  });

  socket.on("join-room", async (payload = {}) => {
    try {
      const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : "";
      if (!roomId) return;

      const userId = socket.userId || socket.id;
      const username = socket.userName || "Student";
      const privacy = payload.privacy && typeof payload.privacy === "object" ? payload.privacy : {};

      console.log(`[socket] join-room: userId=${userId} roomId=${roomId} (prev joinedRoomId=${socket.data.joinedRoomId})`);

      // Allow re-join if socket reconnected (joinedRoomId may be stale from previous connection)
      // Only skip if this exact socket already joined this exact room in this session
      if (socket.data.joinedRoomId === roomId) {
        console.log(`[socket] join-room: already joined, skipping duplicate for userId=${userId}`);
        socket.emit("room-joined", { roomId, userId, success: true });
        return;
      }

      const prevRoom = socket.data.roomId;
      if (prevRoom && prevRoom !== roomId) {
        socket.leave(prevRoom);
        io.to(prevRoom).emit("user-left-room", {
          userId: socket.data.userId,
          username: socket.data.username,
          text: `${socket.data.username} left the room`,
          timestamp: new Date().toISOString(),
        });
        broadcastPresence(prevRoom);
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
      socket.data.username = username;
      socket.data.privacy = privacy;
      socket.data.joinedRoomId = roomId;

      upsertRoomMember(roomId, {
        socketId: socket.id,
        userId,
        name: username,
        status: "online",
        showOnline: privacy.showOnline !== false,
        showFocus: privacy.showFocus !== false,
        appearInLeaderboard: privacy.appearInLeaderboard !== false,
      });

      // Add user to Room.members in MongoDB
      // Use $or to handle BOTH cases: empty array AND array where userId not present
      // { "members.userId": { $ne: userId } } fails on empty arrays in some MongoDB versions
      try {
        const updateResult = await Room.updateOne(
          {
            _id: roomId,
            $or: [
              { members: { $size: 0 } },
              { "members.userId": { $ne: userId } },
            ],
          },
          {
            $push: { members: { userId, name: username, joinedAt: new Date() } },
            $set: { lastActiveAt: new Date(), isActive: true },
          }
        );
        console.log(`[socket] join-room: Room.updateOne matched=${updateResult.matchedCount} modified=${updateResult.modifiedCount} userId=${userId} roomId=${roomId}`);
      } catch (memberErr) {
        console.error("[socket] join-room: Room.updateOne FAILED:", memberErr?.message, memberErr);
      }

      await createRoomSessionEntry({ roomId, userId, userName: username });
      await markRoomActivity(roomId);

      io.to(roomId).emit("user-joined-room", {
        userId,
        username,
        text: `${username} joined the room`,
        timestamp: new Date().toISOString(),
      });

      socket.emit("room-joined", { roomId, userId, success: true });
      broadcastPresence(roomId);
      emitLobbyCount();

      const history = await readRecentChatMessages(roomId, 50);
      socket.emit("chat-history", history);

      const roomStats = await getRoomStats(roomId);
      io.to(roomId).emit("room-stats", { roomId, stats: roomStats });

      console.log(`[socket] join-room: complete userId=${userId} roomId=${roomId}`);
    } catch (error) {
      console.error("[socket] join-room failed:", error);
      socket.emit("room-joined", { success: false, message: "Join failed" });
    }
  });

  socket.on("room-stats-request", async (payload = {}, cb) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
    if (!roomId) {
      if (typeof cb === "function") cb({ success: false, message: "roomId required" });
      return;
    }
    try {
      const stats = await getRoomStats(roomId);
      if (typeof cb === "function") cb({ success: true, roomId, stats });
      socket.emit("room-stats", { roomId, stats });
    } catch {
      if (typeof cb === "function") cb({ success: false, message: "stats unavailable" });
    }
  });

  socket.on("study-time-update", async (payload = {}) => {
    try {
      const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
      if (!roomId) return;
      const userId = socket.userId || socket.data.userId;
      const userName = socket.userName || socket.data.username;
      const todayMinutes = Math.max(0, Number(payload.todayMinutes) || 0);
      const sessionsToday = Math.max(0, Number(payload.sessionsToday) || 0);

      const stats = await upsertUserRoomStats({
        roomId,
        userId,
        userName,
        deltaMinutes: todayMinutes,
        deltaSessions: sessionsToday,
      });

      io.to(roomId).emit("study-time-updated", {
        roomId,
        userId,
        userName,
        totalFocusMinutes: stats.totalFocusMinutes || 0,
        sessionsCompleted: stats.sessionsCompleted || 0,
      });

      io.to(roomId).emit("study-time-update", {
        roomId,
        userId,
        name: userName,
        todayMinutes: stats.totalFocusMinutes || 0,
        sessionsToday: stats.sessionsCompleted || 0,
      });

      const allStats = await getRoomStats(roomId);
      io.to(roomId).emit("room-stats", { roomId, stats: allStats });
    } catch (error) {
      console.warn("Socket study-time-update failed:", error?.message || error);
    }
  });

  socket.on("session-complete", async (payload = {}) => {
    try {
      const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
      if (!roomId) return;
      const sessionNumber = Math.max(1, Number(payload.sessionNumber) || 1);
      await upsertUserRoomStats({
        roomId,
        userId: socket.userId || socket.data.userId,
        userName: socket.userName || socket.data.username,
        deltaMinutes: 25,
        deltaSessions: 1,
      });
      io.to(roomId).emit("session-complete", {
        roomId,
        userId: socket.userId || socket.data.userId,
        name: socket.userName || socket.data.username,
        sessionNumber,
      });
      const allStats = await getRoomStats(roomId);
      io.to(roomId).emit("room-stats", { roomId, stats: allStats });
    } catch (error) {
      console.warn("Socket session-complete failed:", error?.message || error);
    }
  });

  socket.on("user-status-update", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
    if (!roomId) return;
    const status = normalizedStatus(String(payload.status || "online"));
    updateMemberStatus(roomId, socket.id, status);
    broadcastPresence(roomId);
    io.to(roomId).emit("user-status-update", {
      roomId,
      userId: socket.userId || socket.data.userId,
      name: socket.userName || socket.data.username,
      status,
    });
  });

  socket.on("typing", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
    if (!roomId) return;
    const name = typeof payload.username === "string" && payload.username.trim() ? payload.username.trim() : socket.data.username;
    socket.to(roomId).emit("typing", { username: name });
    socket.to(roomId).emit("typing-start", { userId: socket.data.userId, name });
  });

  socket.on("typing-stop", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("typing-stop", { userId: socket.data.userId });
  });

  socket.on("send-message", async (payload = {}, cb) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
    if (!roomId) {
      console.warn("[socket] send-message: no roomId");
      return;
    }
    // BUG 2 FIX — frontend sends 'content', server was reading 'text' only
    // Accept both field names so either works
    const text = String(payload.content || payload.text || "").trim();
    if (!text) {
      console.warn("[socket] send-message: empty text, ignoring");
      return;
    }

    console.log(`[socket] send-message: roomId=${roomId} userId=${socket.userId} len=${text.length}`);

    try {
      const message = await createChatMessage({
        roomId,
        userId: socket.userId || socket.data.userId,
        username: socket.userName || socket.data.username,
        text,
        type: payload.type === "system" ? "system" : "user",
      });
      const emittedMessage = {
        ...message,
        clientMessageId: typeof payload.clientMessageId === "string" ? payload.clientMessageId : undefined,
      };
      // Emit to ALL sockets in room including sender — io.to() not socket.to()
      io.to(roomId).emit("receive-message", emittedMessage);
      console.log(`[socket] send-message: broadcast to room ${roomId} msgId=${message.id || message._id}`);
      if (typeof cb === "function") {
        cb({ success: true, message: emittedMessage });
      }
      await markRoomActivity(roomId);
    } catch (error) {
      console.error("[socket] send-message failed:", error?.message || error);
      // Notify sender so frontend can re-enable the send button
      socket.emit("message-error", { error: "Failed to send message" });
      if (typeof cb === "function") {
        cb({ success: false, message: "Send failed" });
      }
    }
  });

  socket.on("notes-sync", async (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
    const content = typeof payload.content === "string" ? payload.content : "";
    if (!roomId) return;

    // Persist shared notes to Room document in MongoDB
    try {
      await Room.findByIdAndUpdate(
        roomId,
        { sharedNotes: content, lastActiveAt: new Date() }
      );
    } catch (err) {
      console.warn("[notes-sync] MongoDB save failed:", err?.message || err);
    }

    // Broadcast updated notes to all other clients in the room
    socket.to(roomId).emit("notes-sync", {
      roomId,
      content,
      updatedBy: socket.data.username,
      updatedAt: new Date().toISOString(),
    });
  });

  socket.on("timer-sync", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
    if (!roomId) return;

    const action = payload.action;
    if (!["start", "pause", "reset"].includes(action)) return;

    const starter = timerStarterByRoom.get(roomId);
    if (action === "start") {
      if (starter && starter.userId && starter.userId !== socket.data.userId) {
        socket.emit("timer-sync-denied", {
          roomId,
          message: `Group session is currently controlled by ${starter.name}`,
        });
        return;
      }
      timerStarterByRoom.set(roomId, { userId: socket.data.userId, name: socket.data.username });
    }

    if ((action === "pause" || action === "reset") && starter && starter.userId !== socket.data.userId) {
      socket.emit("timer-sync-denied", {
        roomId,
        message: `Only ${starter.name} can ${action} this group timer`,
      });
      return;
    }

    if (action === "reset") {
      timerStarterByRoom.delete(roomId);
      groupTimerByRoom.delete(roomId);
    } else {
      groupTimerByRoom.set(roomId, {
        action,
        startTimestamp: Number(payload.startTimestamp) || Date.now(),
        duration: Number(payload.duration) || Number(payload.durationSec) || 1500,
        startedBy: socket.data.userId,
      });
    }

    io.to(roomId).emit("timer-sync", {
      roomId,
      action,
      startTimestamp: Number(payload.startTimestamp) || Date.now(),
      duration: Number(payload.duration) || Number(payload.durationSec) || 1500,
      startedBy: { userId: socket.data.userId, name: socket.data.username },
    });
  });

  socket.on("get-room-members", (cb) => {
    const roomId = socket.data.roomId;
    if (typeof cb !== "function") return;
    if (!roomId) return cb({ members: [] });
    cb({ members: dedupeMembersByUserId(getRoomMembersForClient(roomId, socket.id)) });
  });

  // Explicit leave-room event — called when user clicks "Leave Room" button
  socket.on("leave-room", async ({ roomId } = {}) => {
    const targetRoom = typeof roomId === "string" ? roomId.trim() : socket.data.roomId;
    if (!targetRoom) return;
    const userId = socket.userId || socket.data.userId;
    const username = socket.userName || socket.data.username;

    console.log(`[socket] leave-room: userId=${userId} roomId=${targetRoom}`);

    socket.leave(targetRoom);
    socket.data.roomId = null;
    socket.data.joinedRoomId = null;

    // Remove from in-memory presence registry using already-imported function
    removeSocketEverywhere(socket.id);

    io.to(targetRoom).emit("user-left-room", {
      roomId: targetRoom,
      userId,
      username,
      text: `${username} left the room`,
      timestamp: new Date().toISOString(),
    });

    broadcastPresence(targetRoom);
    emitLobbyCount();
  });

  socket.on("disconnect", async () => {
    const roomId = socket.data.roomId;
    const userId = socket.userId || socket.data.userId;
    const username = socket.userName || socket.data.username;

    removeSocketEverywhere(socket.id);
    emitLobbyCount();

    if (!roomId || !userId) return;

    try {
      const closed = await closeRoomSessionEntry({ roomId, userId });
      // Do NOT add raw session time to focus stats on disconnect
      // Focus minutes are only tracked via trackSessionComplete (Pomodoro completion)
      // We just close the session record cleanly

      const starter = timerStarterByRoom.get(roomId);
      if (starter?.userId === userId) {
        timerStarterByRoom.delete(roomId);
        groupTimerByRoom.delete(roomId);
        io.to(roomId).emit("timer-sync", {
          roomId,
          action: "pause",
          startedBy: { userId, name: username },
          reason: `Timer paused — ${username} left`,
        });
      }

      io.to(roomId).emit("user-left-room", {
        roomId,
        userId,
        username,
        text: `${username} left the room`,
        timestamp: new Date().toISOString(),
      });

      const stats = await getRoomStats(roomId);
      io.to(roomId).emit("room-stats", { roomId, stats });
    } catch (error) {
      console.warn("Socket disconnect cleanup failed:", error?.message || error);
    }

    broadcastPresence(roomId);
  });
});

server.listen(PORT, async () => {
  // Connect to MongoDB on startup and seed default rooms
  try {
    await ensureDatabaseConnection();
    await seedDefaultRooms();
  } catch (err) {
    console.error("[Startup] MongoDB connection failed:", err.message);
  }
  console.log(`My Kaksha API + chat socket running on http://localhost:${PORT}`);
});
