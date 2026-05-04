// Mongoose Schema — defines structure of MongoDB collection
// MongoDB is schema-less but Mongoose adds structure and validation
// required: true — field must exist or save/create will throw ValidationError
// default: value — used if field not provided in the document
// index: true — speeds up queries on this field (creates a B-tree index)
// Concept 9 — MongoDB + Mongoose (Backend Engineering-I Eval-II)

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
