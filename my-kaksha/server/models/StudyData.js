// Mongoose Schema — defines structure of MongoDB collection
// MongoDB is schema-less but Mongoose adds structure and validation
// required: true — field must exist or save/create will throw ValidationError
// default: value — used if field not provided in the document
// index: true — speeds up queries on this field (creates a B-tree index)
// Concept 9 — MongoDB + Mongoose (Backend Engineering-I Eval-II)

import mongoose from "mongoose";

const studyDataSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    goals: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    goalStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tasks: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    taskEvents: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.StudyData || mongoose.model("StudyData", studyDataSchema);
