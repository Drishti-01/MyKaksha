import http from "node:http";
import { Server } from "socket.io";
import "dotenv/config";
import { createApp } from "./app.js";
import { createChatMessage, readRecentChatMessages } from "./services/chatStore.js";
import {
  getRoomMembersForClient,
  registerLobbySocket,
  removeRoomMember,
  removeSocketEverywhere,
  unregisterLobbySocket,
  updateMemberStatus,
  upsertRoomMember,
} from "./services/studyPresenceRegistry.js";

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

/** @type {Map<string, { phase: string, durationSec: number, endsAt: number | null, isPaused: boolean, pausedRemaining: number | null, updatedAt: number }>} */
const groupTimerByRoom = new Map();

function broadcastPresence(ioInstance, roomId) {
  const map = ioInstance.sockets.adapter.rooms.get(roomId);
  if (!map) return;
  for (const socketId of map) {
    const sock = ioInstance.sockets.sockets.get(socketId);
    if (!sock) continue;
    const members = getRoomMembersForClient(roomId, socketId);
    sock.emit("room-members-update", { roomId, members });
  }
}

io.on("connection", (socket) => {
  console.log("[socket] Client connected:", socket.id);

  socket.on("lobby-join", () => {
    registerLobbySocket(socket.id);
    socket.join("lobby");
    const count = io.sockets.adapter.rooms.get("lobby")?.size ?? 0;
    console.log("[socket] lobby-join → lobby size:", count);
    io.to("lobby").emit("lobby-presence", { count });
  });

  socket.on("lobby-leave", () => {
    unregisterLobbySocket(socket.id);
    socket.leave("lobby");
    const count = io.sockets.adapter.rooms.get("lobby")?.size ?? 0;
    io.to("lobby").emit("lobby-presence", { count });
  });

  socket.on("room-created", (payload) => {
    console.log("[socket] room-created relay for lobby refresh");
    socket.broadcast.emit("room-created", payload);
  });

  socket.on("join-room", async (payload = {}) => {
    const roomId =
      typeof payload.roomId === "string" && payload.roomId.trim() ? payload.roomId.trim() : "study-room-1";
    const username =
      typeof payload.username === "string" && payload.username.trim() ? payload.username.trim() : "Guest";
    const userId = typeof payload.userId === "string" && payload.userId.trim() ? payload.userId.trim() : socket.id;
    const privacy = payload.privacy && typeof payload.privacy === "object" ? payload.privacy : {};

    const prevRoom = socket.data.roomId;
    if (prevRoom && prevRoom !== roomId) {
      socket.leave(prevRoom);
      removeRoomMember(prevRoom, socket.id);
      socket.to(prevRoom).emit("user-left-room", {
        userId: socket.data.userId,
        username: socket.data.username,
        text: `${socket.data.username} left the room`,
        timestamp: new Date().toISOString(),
      });
      socket.to(prevRoom).emit("user-left", {
        username: socket.data.username,
        text: `${socket.data.username} left the room`,
        timestamp: new Date().toISOString(),
      });
      broadcastPresence(io, prevRoom);
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;
    socket.data.userId = userId;
    socket.data.privacy = privacy;

    upsertRoomMember(roomId, {
      socketId: socket.id,
      userId,
      name: username,
      status: "online",
      showOnline: privacy.showOnline !== false,
      showFocus: privacy.showFocus !== false,
      appearInLeaderboard: privacy.appearInLeaderboard !== false,
    });

    const notice = {
      userId,
      username,
      text: `${username} joined the room`,
      timestamp: new Date().toISOString(),
    };

    socket.to(roomId).emit("user-joined", {
      username,
      text: notice.text,
      timestamp: notice.timestamp,
    });
    socket.to(roomId).emit("user-joined-room", notice);

    console.log("[socket] join-room:", { roomId, username, userId });

    // Confirms to the joining client that the server registered the room (viva traceability).
    socket.emit("room-joined", { roomId, userId });

    broadcastPresence(io, roomId);

    try {
      const history = await readRecentChatMessages(roomId, 100);
      socket.emit("chat-history", history);
    } catch {
      socket.emit("chat-history", []);
    }
  });

  socket.on("user-status-update", (payload = {}) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const status = typeof payload.status === "string" ? payload.status : "online";
    updateMemberStatus(roomId, socket.id, status);
    console.log("[socket] user-status-update:", { roomId, status, user: socket.data.username });
    broadcastPresence(io, roomId);
    socket.to(roomId).emit("user-status-broadcast", {
      userId: socket.data.userId,
      username: socket.data.username,
      status,
    });
  });

  socket.on("typing", ({ roomId, username }) => {
    const normalizedRoom =
      typeof roomId === "string" && roomId.trim() ? roomId.trim() : socket.data.roomId;
    const normalizedUser =
      typeof username === "string" && username.trim() ? username.trim() : socket.data.username;

    if (!normalizedRoom || !normalizedUser) {
      return;
    }

    socket.to(normalizedRoom).emit("typing", { username: normalizedUser });
    socket.to(normalizedRoom).emit("typing-start", { userId: socket.data.userId, name: normalizedUser });
  });

  socket.on("typing-stop", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("typing-stop", { userId: socket.data.userId });
  });

  socket.on("send-message", async ({ roomId, username, text }) => {
    const normalizedRoom =
      typeof roomId === "string" && roomId.trim() ? roomId.trim() : socket.data.roomId;
    const normalizedUser =
      typeof username === "string" && username.trim() ? username.trim() : socket.data.username;
    const cleanText = typeof text === "string" ? text.trim() : "";

    if (!normalizedRoom || !normalizedUser || !cleanText) {
      return;
    }

    try {
      const message = await createChatMessage({
        roomId: normalizedRoom,
        username: normalizedUser,
        text: cleanText,
      });

      io.to(normalizedRoom).emit("receive-message", message);
      console.log("[socket] receive-message broadcast:", normalizedRoom, message.id);
    } catch (error) {
      console.warn("[socket] send-message persistence failed, still broadcasting:", error?.message || error);
      const fallback = {
        id: Date.now(),
        username: normalizedUser,
        text: cleanText,
        timestamp: new Date().toISOString(),
        type: "user",
      };
      io.to(normalizedRoom).emit("receive-message", fallback);
    }
  });

  socket.on("notes-update", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : "";
    const content = typeof payload.content === "string" ? payload.content : "";
    if (!roomId || socket.data.roomId !== roomId) return;
    socket.to(roomId).emit("notes-updated", { roomId, content });
    console.log("[socket] notes-update broadcast (chars):", content.length);
  });

  socket.on("group-timer-sync", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : "";
    if (!roomId || socket.data.roomId !== roomId) return;
    const state = payload.state && typeof payload.state === "object" ? payload.state : {};
    groupTimerByRoom.set(roomId, { ...state, updatedAt: Date.now() });
    socket.to(roomId).emit("group-timer-state", { roomId, state, from: socket.data.userId });
    console.log("[socket] group-timer-sync relayed for room:", roomId);
  });

  socket.on("timer-start", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit("timer-start", {
      ...payload,
      roomId,
      startedBy: socket.data.userId,
      startedByName: socket.data.username,
    });
    console.log("[socket] timer-start (compat broadcast)");
  });

  socket.on("timer-pause", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit("timer-pause", { ...payload, roomId, pausedBy: socket.data.userId });
  });

  socket.on("timer-reset", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId.trim() : socket.data.roomId;
    if (!roomId) return;
    groupTimerByRoom.delete(roomId);
    io.to(roomId).emit("timer-reset", { ...payload, roomId });
  });

  socket.on("get-room-members", (cb) => {
    const roomId = socket.data.roomId;
    if (typeof cb !== "function") return;
    if (!roomId) {
      cb({ members: [] });
      return;
    }
    const members = getRoomMembersForClient(roomId, socket.id);
    cb({ members });
    console.log("[socket] get-room-members → count:", members.length);
  });

  socket.on("disconnect", () => {
    const leftRoom = socket.data.roomId;
    const leftUser = socket.data.username;
    const leftUserId = socket.data.userId;

    removeSocketEverywhere(socket.id);

    if (!leftRoom || !leftUser) {
      console.log("[socket] Client disconnected (no room):", socket.id);
      return;
    }

    const notice = {
      userId: leftUserId,
      username: leftUser,
      text: `${leftUser} left the room`,
      timestamp: new Date().toISOString(),
    };

    io.to(leftRoom).emit("user-left", {
      username: leftUser,
      text: notice.text,
      timestamp: notice.timestamp,
    });
    io.to(leftRoom).emit("user-left-room", notice);

    broadcastPresence(io, leftRoom);

    console.log("[socket] disconnect from room:", leftRoom, leftUser);
  });
});

server.listen(PORT, () => {
  console.log(`My Kaksha API + chat socket running on http://localhost:${PORT}`);
});
