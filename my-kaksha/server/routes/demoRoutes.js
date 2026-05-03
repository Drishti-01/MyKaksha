// Concept 2 — Blocking vs Non-blocking I/O
// This file demonstrates the difference for Backend Engineering-I Evaluation-II

import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Non-blocking example — correct Node.js approach
// Uses fs.promises so event loop is NOT blocked
// Other requests can be handled while awaiting file read
router.get("/nonblocking", async (req, res) => {
  const start = Date.now();
  try {
    const filePath = path.join(__dirname, "../data/study-data.json");
    const data = await fs.promises.readFile(filePath, "utf8");
    res.json({
      method: "non-blocking",
      message: "Event loop was free during file read",
      timeTaken: Date.now() - start + "ms",
      bytesRead: data.length,
    });
  } catch {
    // File may not exist — that is fine, the point is the async pattern
    res.json({
      method: "non-blocking",
      message: "Event loop was free during file read (file not found, but async pattern demonstrated)",
      timeTaken: Date.now() - start + "ms",
    });
  }
});

// Blocking example — demonstration of what NOT to do
// fs.readFileSync blocks the entire event loop
// No other requests can process until this completes
router.get("/blocking", (req, res) => {
  const start = Date.now();
  try {
    const filePath = path.join(__dirname, "../data/study-data.json");
    const data = fs.readFileSync(filePath, "utf8");
    res.json({
      method: "blocking",
      message: "Event loop was BLOCKED during file read",
      timeTaken: Date.now() - start + "ms",
      bytesRead: data.length,
    });
  } catch {
    res.json({
      method: "blocking",
      message: "Event loop was BLOCKED during file read (file not found, but sync pattern demonstrated)",
      timeTaken: Date.now() - start + "ms",
    });
  }
});

export default router;
