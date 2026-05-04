import { randomUUID } from "node:crypto";
import { ensureDatabaseConnection } from "../config/database.js";
import Message from "../models/Message.js";
import { readJsonFile, resolveDataFile, writeJsonFile } from "./fileStore.js";

const MESSAGES_FILE = resolveDataFile("messages.json");

function normalizeSender({ userId, name, username }) {
  return {
    userId: String(userId || "").trim() || "guest",
    name: String(name || username || "Guest").trim() || "Guest",
  };
}

function toClientMessage(doc) {
  const senderName = doc?.sender?.name || "Guest";
  const stableId = doc._id || doc.id;
  return {
    id: stableId,
    _id: stableId,
    sender: {
      userId: doc?.sender?.userId || "guest",
      name: senderName,
    },
    username: senderName,
    text: doc.content,
    content: doc.content,
    timestamp: new Date(doc.timestamp).toISOString(),
    type: doc.type || "user",
  };
}

async function appendFileMessage({ roomId, sender, content, type }) {
  const data = await readJsonFile(MESSAGES_FILE, { byRoom: {} });
  if (!data.byRoom || typeof data.byRoom !== "object") {
    data.byRoom = {};
  }
  if (!Array.isArray(data.byRoom[roomId])) {
    data.byRoom[roomId] = [];
  }

  const message = {
    id: randomUUID(),
    roomId,
    sender,
    content,
    type,
    timestamp: new Date().toISOString(),
  };

  data.byRoom[roomId].push(message);
  const list = data.byRoom[roomId];
  if (list.length > 500) {
    data.byRoom[roomId] = list.slice(-500);
  }

  await writeJsonFile(MESSAGES_FILE, data);
  return toClientMessage(message);
}

export async function createChatMessage({ roomId, username, userId, text, type = "user" }) {
  const sender = normalizeSender({ userId, name: username, username });
  const content = String(text || "").trim();
  if (!content) {
    throw new Error("Message content is required");
  }

  try {
    await ensureDatabaseConnection();
    const message = await Message.create({
      roomId,
      sender,
      content,
      type: type === "system" ? "system" : "user",
      timestamp: new Date(),
    });
    return toClientMessage(message);
  } catch (error) {
    console.warn("[chatStore] Mongo unavailable, using messages.json fallback:", error?.message || error);
    return appendFileMessage({
      roomId,
      sender,
      content,
      type: type === "system" ? "system" : "user",
    });
  }
}

export async function readRecentChatMessages(roomId, limit = 50, beforeTimestamp) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  try {
    await ensureDatabaseConnection();
    const query = { roomId };
    if (beforeTimestamp) {
      const parsed = new Date(beforeTimestamp);
      if (!Number.isNaN(parsed.getTime())) {
        query.timestamp = { $lt: parsed };
      }
    }

    const docs = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(safeLimit)
      .lean();

    return docs.reverse().map(toClientMessage);
  } catch (error) {
    console.warn("[chatStore] Mongo unavailable, reading messages.json fallback:", error?.message || error);
    const data = await readJsonFile(MESSAGES_FILE, { byRoom: {} });
    let list = Array.isArray(data.byRoom?.[roomId]) ? data.byRoom[roomId] : [];

    if (beforeTimestamp) {
      const parsed = new Date(beforeTimestamp);
      if (!Number.isNaN(parsed.getTime())) {
        list = list.filter((m) => new Date(m.timestamp) < parsed);
      }
    }

    return list.slice(-safeLimit).map((m) => toClientMessage(m));
  }
}
