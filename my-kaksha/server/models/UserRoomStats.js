// Mongoose Schema — defines structure of MongoDB collection
// MongoDB is schema-less but Mongoose adds structure and validation
// required: true — field must exist or save/create will throw ValidationError
// default: value — used if field not provided in the document
// index: true — speeds up queries on this field (creates a B-tree index)
// Concept 9 — MongoDB + Mongoose (Backend Engineering-I Eval-II)

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
