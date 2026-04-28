import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const roomSessionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: randomUUID,
    },
    roomId: { type: String, required: true, trim: true, index: true },
    userId: { type: String, required: true, trim: true, index: true },
    userName: { type: String, required: true, trim: true },
    date: { type: String, required: true, index: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date, default: null },
    totalFocusMinutes: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
    sessionsCompleted: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

roomSessionSchema.index({ roomId: 1, userId: 1, date: 1 }, { unique: true });
roomSessionSchema.index({ roomId: 1, leftAt: 1 });

export default mongoose.models.RoomSession || mongoose.model("RoomSession", roomSessionSchema);
