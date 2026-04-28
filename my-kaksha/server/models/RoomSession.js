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
    joinedAt: { type: Date, default: Date.now, index: true },
    leftAt: { type: Date, default: null },
    totalMinutes: { type: Number, default: 0 },
    sessionsCompleted: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

roomSessionSchema.index({ roomId: 1, userId: 1, joinedAt: -1 });
roomSessionSchema.index({ roomId: 1, leftAt: 1 });

export default mongoose.models.RoomSession || mongoose.model("RoomSession", roomSessionSchema);
