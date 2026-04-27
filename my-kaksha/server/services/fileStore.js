import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dataDir = path.resolve(__dirname, "..", "data");

export function resolveDataFile(fileName) {
  return path.join(dataDir, fileName);
}

export function hasDataDirectory() {
  // This sync check only happens during small bootstrapping work.
  // All request-path file reads/writes stay async so the event loop is not blocked per request.
  return existsSync(dataDir);
}

export async function ensureDataDir() {
  if (!hasDataDirectory()) {
    await mkdir(dataDir, { recursive: true });
    return;
  }

  await mkdir(dataDir, { recursive: true });
}

export async function readJsonFile(filePath, fallbackValue) {
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

export async function writeJsonFile(filePath, data) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
