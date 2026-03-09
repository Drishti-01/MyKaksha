import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "study-data.json");

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

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function writeNoContent(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end();
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
    const data = await readStudyData();
    writeJson(res, 200, data);
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/study-data") {
    try {
      const body = await parseBody(req);
      const payload = {
        goals: Array.isArray(body.goals) ? body.goals : [],
        goalStats: body.goalStats && typeof body.goalStats === "object" ? body.goalStats : {},
        tasks: Array.isArray(body.tasks) ? body.tasks : [],
        taskEvents: body.taskEvents && typeof body.taskEvents === "object" ? body.taskEvents : {},
      };
      await writeStudyData(payload);
      writeJson(res, 200, { ok: true });
    } catch {
      writeJson(res, 400, { ok: false, error: "Invalid request body" });
    }
    return;
  }

  writeJson(res, 404, { ok: false, error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Study data API running on http://localhost:${PORT}`);
});
