import http from "node:http";
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

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    writeNoContent(res);
    return;
  }

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
});

server.listen(PORT, () => {
  console.log(`Study data API running on http://localhost:${PORT}`);
});
