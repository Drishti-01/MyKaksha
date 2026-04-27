import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "mykaksha";
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "study-data.json");

let dbRef;

const defaultData = {
  goals: [],
  goalStats: {},
  tasks: [],
  taskEvents: {},
};

function normalizeStudyData(payload = {}) {
  return {
    goals: Array.isArray(payload.goals) ? payload.goals : [],
    goalStats: payload.goalStats && typeof payload.goalStats === "object" ? payload.goalStats : {},
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
    taskEvents: payload.taskEvents && typeof payload.taskEvents === "object" ? payload.taskEvents : {},
  };
}

async function getDb() {
  if (dbRef) {
    return dbRef;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Set it in .env");
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 50,
    minPoolSize: 10,
    maxIdleTimeMS: 300000,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  });

  await client.connect();
  dbRef = client.db(MONGODB_DB);
  await dbRef.collection("users").createIndex({ email: 1 }, { unique: true });
  return dbRef;
}

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function readJsonFile(filePath, fallbackValue) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return fallbackValue;
    }
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function readStudyData() {
  const payload = await readJsonFile(dataFile, defaultData);
  return normalizeStudyData(payload);
}

async function writeStudyData(data) {
  await writeJsonFile(dataFile, normalizeStudyData(data));
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/study-data", async (_req, res) => {
  try {
    const data = await readStudyData();
    res.status(200).json(data);
  } catch {
    res.status(500).json({ ok: false, error: "Unable to load study data" });
  }
});

app.put("/api/study-data", async (req, res) => {
  try {
    await writeStudyData(req.body ?? {});
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

    const db = await getDb();
    const users = db.collection("users");
    const existing = await users.findOne({ email });
    if (existing) {
      res.status(409).json({ ok: false, error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await users.insertOne({
      name,
      email,
      passwordHash,
      createdAt: new Date(),
    });

    res.status(201).json({ ok: true, message: "Signup successful" });
  } catch (error) {
    if (error?.code === 11000) {
      res.status(409).json({ ok: false, error: "Email already registered" });
      return;
    }
    res.status(500).json({ ok: false, error: "Unable to create account" });
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

    const db = await getDb();
    const users = db.collection("users");
    const match = await users.findOne({ email });

    if (!match || !(await bcrypt.compare(password, match.passwordHash || ""))) {
      res.status(401).json({ ok: false, error: "Invalid email or password" });
      return;
    }

    res.status(200).json({
      ok: true,
      message: "Login successful",
      user: { email: match.email, name: match.name },
    });
  } catch {
    res.status(500).json({ ok: false, error: "Unable to login" });
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

    if (!normalizedRoom || !normalizedUser) {
      return;
    }

    socket.to(normalizedRoom).emit("typing", { username: normalizedUser });
  });

  socket.on("send-message", ({ roomId, username, text }) => {
    const normalizedRoom = typeof roomId === "string" && roomId.trim() ? roomId.trim() : socket.data.roomId;
    const normalizedUser = typeof username === "string" && username.trim() ? username.trim() : socket.data.username;
    const cleanText = typeof text === "string" ? text.trim() : "";

    if (!normalizedRoom || !normalizedUser || !cleanText) {
      return;
    }

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
  console.log(`Study data API + chat socket running on http://localhost:${PORT}`);
});
