import http from "node:http";
<<<<<<< HEAD
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
=======
import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "mykaksha";
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-this-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Using development fallback secret.");
}
>>>>>>> 6c2e25d335b4e6c3415eb972c70e09fd5eb59ce1

const defaultData = {
  goals: [],
  goalStats: {},
  tasks: [],
  taskEvents: {},
};

let dbRef;

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
    throw new Error("MONGODB_URI is missing. Set it before starting the server.");
  }

  const client = new MongoClient(MONGODB_URI, {
    // Assumption: this runs as a long-lived Node server (not serverless).
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
  await dbRef.collection("studyData").createIndex({ userId: 1 }, { unique: true });

  return dbRef;
}

<<<<<<< HEAD
async function writeStudyData(data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}

async function readUsers() {
=======
function writeJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function writeNoContent(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end();
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const index = entry.indexOf("=");
      if (index <= 0) {
        return acc;
      }
      const key = entry.slice(0, index).trim();
      const value = entry.slice(index + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function getTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies.auth_token || "";
}

function getUserIdFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

>>>>>>> 6c2e25d335b4e6c3415eb972c70e09fd5eb59ce1
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return typeof decoded.sub === "string" ? decoded.sub : null;
  } catch {
    return null;
  }
}

function buildAuthCookie(token) {
  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `auth_token=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secureFlag}`;
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

<<<<<<< HEAD
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
=======
  if (req.method === "GET" && url.pathname === "/api/study-data") {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        writeJson(res, 401, { ok: false, error: "Unauthorized" });
        return;
      }

      const db = await getDb();
      const doc = await db.collection("studyData").findOne({ userId });
      writeJson(res, 200, normalizeStudyData(doc || defaultData));
    } catch (error) {
      writeJson(res, 500, { ok: false, error: "Failed to load study data" });
    }
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/study-data") {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        writeJson(res, 401, { ok: false, error: "Unauthorized" });
        return;
      }

      const body = await parseBody(req);
      const payload = normalizeStudyData(body);
      const db = await getDb();

      await db.collection("studyData").updateOne(
        { userId },
        {
          $set: {
            ...payload,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            userId,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      writeJson(res, 200, { ok: true });
    } catch {
      writeJson(res, 500, { ok: false, error: "Unable to save study data" });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/signup") {
    try {
      const body = await parseBody(req);
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!name || !email || !password) {
        writeJson(res, 400, { ok: false, error: "Missing required fields" });
        return;
      }

      const db = await getDb();
      const users = db.collection("users");

      const existing = await users.findOne({ email });
      if (existing) {
        writeJson(res, 409, { ok: false, error: "Email already registered" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const insertResult = await users.insertOne({
        name,
        email,
        passwordHash,
        createdAt: new Date(),
      });

      const userId = insertResult.insertedId.toString();
      const token = jwt.sign({ email }, JWT_SECRET, { subject: userId, expiresIn: JWT_EXPIRES_IN });

      writeJson(
        res,
        201,
        { ok: true, message: "Signup successful" },
        { "Set-Cookie": buildAuthCookie(token) }
      );
    } catch (error) {
      if (error?.code === 11000) {
        writeJson(res, 409, { ok: false, error: "Email already registered" });
        return;
      }

      writeJson(res, 500, { ok: false, error: "Unable to create account" });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/login") {
    try {
      const body = await parseBody(req);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!email || !password) {
        writeJson(res, 400, { ok: false, error: "Missing credentials" });
        return;
      }

      const db = await getDb();
      const users = db.collection("users");
      const match = await users.findOne({ email });

      if (!match || !(await bcrypt.compare(password, match.passwordHash || ""))) {
        writeJson(res, 401, { ok: false, error: "Invalid email or password" });
        return;
      }

      const token = jwt.sign({ email: match.email }, JWT_SECRET, {
        subject: match._id.toString(),
        expiresIn: JWT_EXPIRES_IN,
      });

      writeJson(
        res,
        200,
        { ok: true, message: "Login successful", user: { email: match.email, name: match.name } },
        { "Set-Cookie": buildAuthCookie(token) }
      );
    } catch {
      writeJson(res, 500, { ok: false, error: "Unable to login" });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/logout") {
    writeJson(
      res,
      200,
      { ok: true, message: "Logged out" },
      { "Set-Cookie": "auth_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" }
    );
    return;
  }

  writeJson(res, 404, { ok: false, error: "Not found" });
>>>>>>> 6c2e25d335b4e6c3415eb972c70e09fd5eb59ce1
});

server.listen(PORT, () => {
  console.log(`Study data API + chat socket running on http://localhost:${PORT}`);
});
