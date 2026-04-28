import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const messageSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: randomUUID,
    },
    roomId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sender: {
      userId: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    type: {
      type: String,
      enum: ["user", "system"],
      default: "user",
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

messageSchema.index({ roomId: 1, timestamp: -1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
