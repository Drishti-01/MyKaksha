import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const userRoomStatsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: randomUUID,
    },
    userId: { type: String, required: true, trim: true, index: true },
    roomId: { type: String, required: true, trim: true, index: true },
    totalFocusMinutes: { type: Number, default: 0 },
    sessionsCompleted: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    weeklyMinutes: { type: Number, default: 0 },
    focusPoints: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

userRoomStatsSchema.index({ userId: 1, roomId: 1 }, { unique: true });

export default mongoose.models.UserRoomStats || mongoose.model("UserRoomStats", userRoomStatsSchema);
