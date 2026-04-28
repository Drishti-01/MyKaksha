import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const chatMessageSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: randomUUID,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

chatMessageSchema.index({ roomId: 1, timestamp: -1 });

export default mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
