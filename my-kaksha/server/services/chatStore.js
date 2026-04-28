import { randomUUID } from "node:crypto";
import { ensureDatabaseConnection } from "../config/database.js";
import ChatMessage from "../models/ChatMessage.js";
import { readJsonFile, resolveDataFile, writeJsonFile } from "./fileStore.js";

const MESSAGES_FILE = resolveDataFile("messages.json");

function toClientMessage(doc) {
  const username = doc.username;
  return {
    id: doc._id,
    username,
    text: doc.text,
    timestamp: new Date(doc.timestamp).toISOString(),
    type: username === "System" ? "system" : "user",
  };
}

async function appendFileMessage({ roomId, username, text }) {
  const data = await readJsonFile(MESSAGES_FILE, { byRoom: {} });
  if (!data.byRoom || typeof data.byRoom !== "object") {
    data.byRoom = {};
  }
  if (!Array.isArray(data.byRoom[roomId])) {
    data.byRoom[roomId] = [];
  }

  const message = {
    id: randomUUID(),
    username,
    text,
    timestamp: new Date().toISOString(),
    type: username === "System" ? "system" : "user",
  };

  data.byRoom[roomId].push(message);
  const list = data.byRoom[roomId];
  if (list.length > 500) {
    data.byRoom[roomId] = list.slice(-500);
  }

  await writeJsonFile(MESSAGES_FILE, data);
  return {
    id: message.id,
    username: message.username,
    text: message.text,
    timestamp: message.timestamp,
    type: message.type,
  };
}

export async function createChatMessage({ roomId, username, text }) {
  try {
    await ensureDatabaseConnection();
    const message = await ChatMessage.create({
      roomId,
      username,
      text,
      timestamp: new Date(),
    });
    return toClientMessage(message);
  } catch (error) {
    console.warn("[chatStore] Mongo unavailable, using messages.json fallback:", error?.message || error);
    return appendFileMessage({ roomId, username, text });
  }
}

export async function readRecentChatMessages(roomId, limit = 100) {
  try {
    await ensureDatabaseConnection();
    const docs = await ChatMessage.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return docs.reverse().map(toClientMessage);
  } catch (error) {
    console.warn("[chatStore] Mongo unavailable, reading messages.json fallback:", error?.message || error);
    const data = await readJsonFile(MESSAGES_FILE, { byRoom: {} });
    const list = Array.isArray(data.byRoom?.[roomId]) ? data.byRoom[roomId] : [];
    const sliced = list.slice(-limit).map((m) => ({
      id: m.id,
      username: m.username,
      text: m.text,
      timestamp: m.timestamp,
      type: m.username === "System" || m.type === "system" ? "system" : "user",
    }));
    return sliced;
  }
}
