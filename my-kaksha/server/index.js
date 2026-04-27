import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(globalThis.process?.env?.PORT) || 4000;
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "study-data.json");
const usersFile = path.join(dataDir, "users.json");

const defaultData = {
  goals: [],
  goalStats: {},
  tasks: [],
  taskEvents: {},
};

async function readStudyData() {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return {
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      goalStats: parsed.goalStats && typeof parsed.goalStats === "object" ? parsed.goalStats : {},
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      taskEvents: parsed.taskEvents && typeof parsed.taskEvents === "object" ? parsed.taskEvents : {},
    };
  } catch {
    return defaultData;
  }
}

async function writeStudyData(data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}

async function readUsers() {
  try {
    const raw = await readFile(usersFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(usersFile, JSON.stringify(users, null, 2), "utf8");
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/study-data", async (_req, res) => {
  const data = await readStudyData();
  res.status(200).json(data);
});

app.put("/api/study-data", async (req, res) => {
  try {
    const body = req.body ?? {};
    const payload = {
      goals: Array.isArray(body.goals) ? body.goals : [],
      goalStats: body.goalStats && typeof body.goalStats === "object" ? body.goalStats : {},
      tasks: Array.isArray(body.tasks) ? body.tasks : [],
      taskEvents: body.taskEvents && typeof body.taskEvents === "object" ? body.taskEvents : {},
    };
    await writeStudyData(payload);
    res.status(200).json({ ok: true });
  } catch {
    res.status(400).json({ ok: false, error: "Invalid request body" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const body = req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      res.status(400).json({ ok: false, error: "Missing required fields" });
      return;
    }

    const users = await readUsers();
    if (users.some((user) => user.email === email)) {
      res.status(409).json({ ok: false, error: "Email already registered" });
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
    };

    users.push(newUser);
    await writeUsers(users);
    res.status(201).json({ ok: true, message: "Signup successful" });
  } catch {
    res.status(400).json({ ok: false, error: "Invalid request body" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const body = req.body ?? {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      res.status(400).json({ ok: false, error: "Missing credentials" });
      return;
    }

    const users = await readUsers();
    const match = users.find((user) => user.email === email && user.password === password);

    if (!match) {
      res.status(401).json({ ok: false, error: "Invalid email or password" });
      return;
    }

    res.status(200).json({ ok: true, message: "Login successful", user: { email: match.email, name: match.name } });
  } catch {
    res.status(400).json({ ok: false, error: "Invalid request body" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, username }) => {
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
  });

  socket.on("typing", ({ roomId, username }) => {
    const normalizedRoom = typeof roomId === "string" && roomId.trim() ? roomId.trim() : socket.data.roomId;
    const normalizedUser = typeof username === "string" && username.trim() ? username.trim() : socket.data.username;
    if (!normalizedRoom || !normalizedUser) return;
    socket.to(normalizedRoom).emit("typing", { username: normalizedUser });
  });

  socket.on("send-message", ({ roomId, username, text }) => {
    const normalizedRoom = typeof roomId === "string" && roomId.trim() ? roomId.trim() : socket.data.roomId;
    const normalizedUser = typeof username === "string" && username.trim() ? username.trim() : socket.data.username;
    const cleanText = typeof text === "string" ? text.trim() : "";
    if (!normalizedRoom || !normalizedUser || !cleanText) return;

    io.to(normalizedRoom).emit("receive-message", {
      id: Date.now(),
      username: normalizedUser,
      text: cleanText,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    const leftRoom = socket.data.roomId;
    const leftUser = socket.data.username;
    if (!leftRoom || !leftUser) return;
    socket.to(leftRoom).emit("user-left", {
      username: leftUser,
      text: `${leftUser} left the room`,
      timestamp: new Date().toISOString(),
    });
  });
});

server.listen(PORT, () => {
  console.log(`Study data API + chat socket running on http://localhost:${PORT}`);
});
