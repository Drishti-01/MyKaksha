import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const roomSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, enum: ["public", "private"], default: "public" },
    focusStyle: { type: String, enum: ["discussion", "silent"], default: "discussion" },
    code: { type: String, required: true, trim: true, uppercase: true, minlength: 6, maxlength: 6, unique: true },
    createdBy: { type: String, required: true },
    creatorName: { type: String, default: "" },
    members: { type: [String], default: [] },
    weeklyGoalHours: { type: Number, default: null },
    sharedNotes: { type: String, default: "" },
    activityScore: { type: Number, default: 0 },
    focusPoints: { type: Map, of: Number, default: {} },
  },
  {
    timestamps: true,
    _id: false,
  }
);

roomSchema.index({ type: 1, createdAt: -1 });

export default mongoose.models.Room || mongoose.model("Room", roomSchema);
