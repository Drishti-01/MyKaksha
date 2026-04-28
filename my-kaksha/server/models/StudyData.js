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
