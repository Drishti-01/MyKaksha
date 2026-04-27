import http from "node:http";
import { Server } from "socket.io";
import "dotenv/config";
import { createApp } from "./app.js";
import { createChatMessage, readRecentChatMessages } from "./services/chatStore.js";

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

io.on("connection", (socket) => {
  socket.on("join-room", async ({ roomId, username }) => {
    const normalizedRoom = typeof roomId === "string" && roomId.trim() ? roomId.trim() : "study-room-1";
    const normalizedUser = typeof username === "string" && username.trim() ? username.trim() : "Guest";

    socket.join(normalizedRoom);
    socket.data.roomId = normalizedRoom;
    socket.data.username = normalizedUser;

    socket.to(normalizedRoom).emit("user-joined", {
      username: normalizedUser,
      text: `${normalizedUser} joined the room`,
      timestamp: new Date().toISOString(),
    });

    try {
      const history = await readRecentChatMessages(normalizedRoom, 100);
      socket.emit("chat-history", history);
    } catch {
      socket.emit("chat-history", []);
    }
  });

  socket.on("typing", ({ roomId, username }) => {
    const normalizedRoom = typeof roomId === "string" && roomId.trim() ? roomId.trim() : socket.data.roomId;
    const normalizedUser = typeof username === "string" && username.trim() ? username.trim() : socket.data.username;

    if (!normalizedRoom || !normalizedUser) {
      return;
    }

    socket.to(normalizedRoom).emit("typing", { username: normalizedUser });
  });

  socket.on("send-message", async ({ roomId, username, text }) => {
    const normalizedRoom = typeof roomId === "string" && roomId.trim() ? roomId.trim() : socket.data.roomId;
    const normalizedUser = typeof username === "string" && username.trim() ? username.trim() : socket.data.username;
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
    } catch {
      io.to(normalizedRoom).emit("receive-message", {
        id: Date.now(),
        username: normalizedUser,
        text: cleanText,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on("disconnect", () => {
    const leftRoom = socket.data.roomId;
    const leftUser = socket.data.username;

    if (!leftRoom || !leftUser) {
      return;
    }

    socket.to(leftRoom).emit("user-left", {
      username: leftUser,
      text: `${leftUser} left the room`,
      timestamp: new Date().toISOString(),
    });
  });
});

server.listen(PORT, () => {
  console.log(`My Kaksha API + chat socket running on http://localhost:${PORT}`);
});
