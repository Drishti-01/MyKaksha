import { ensureDatabaseConnection } from "../config/database.js";
import ChatMessage from "../models/ChatMessage.js";

function toClientMessage(doc) {
  return {
    id: doc._id,
    username: doc.username,
    text: doc.text,
    timestamp: new Date(doc.timestamp).toISOString(),
  };
}

export async function createChatMessage({ roomId, username, text }) {
  await ensureDatabaseConnection();

  const message = await ChatMessage.create({
    roomId,
    username,
    text,
    timestamp: new Date(),
  });

  return toClientMessage(message);
}

export async function readRecentChatMessages(roomId, limit = 100) {
  await ensureDatabaseConnection();

  const docs = await ChatMessage.find({ roomId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return docs.reverse().map(toClientMessage);
}
