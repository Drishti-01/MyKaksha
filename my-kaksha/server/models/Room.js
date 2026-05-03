// Mongoose Schema — defines structure of MongoDB collection
// MongoDB is schema-less but Mongoose adds structure and validation
// required: true — field must exist or save/create will throw ValidationError
// default: value — used if field not provided in the document
// index: true — speeds up queries on this field (creates a B-tree index)
// Concept 9 — MongoDB + Mongoose (Backend Engineering-I Eval-II)

import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const roomMemberSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, enum: ["public", "private"], default: "public" },
    focusStyle: { type: String, enum: ["discussion", "silent"], default: "discussion" },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 6,
      maxlength: 6,
      unique: true,
      index: true,
    },
    createdBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true, trim: true },
    },
    members: { type: [roomMemberSchema], default: [] },
    weeklyGoalHours: { type: Number, default: null },
    sharedNotes: { type: String, default: "" },
    activityScore: { type: Number, default: 0 },
    focusPoints: { type: Map, of: Number, default: {} },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    _id: false,
  }
);

roomSchema.index({ type: 1, createdAt: -1 });
roomSchema.index({ "createdBy.userId": 1, createdAt: -1 });

export default mongoose.models.Room || mongoose.model("Room", roomSchema);
