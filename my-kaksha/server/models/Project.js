// Mongoose Schema — defines structure of MongoDB collection
// MongoDB is schema-less but Mongoose adds structure and validation
// required: true — field must exist or save/create will throw ValidationError
// default: value — used if field not provided in the document
// index: true — speeds up queries on this field (creates a B-tree index)
// Concept 9 — MongoDB + Mongoose (Backend Engineering-I Eval-II)

import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const ALLOWED_STATUSES = ["In Progress", "Completed"];

const projectSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: randomUUID,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    startDate: {
      type: String,
      default: "",
      trim: true,
    },
    endDate: {
      type: String,
      default: "",
      trim: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ALLOWED_STATUSES,
      default: "In Progress",
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.Project || mongoose.model("Project", projectSchema);
