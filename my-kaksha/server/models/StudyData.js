import mongoose from "mongoose";

const studyDataSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        goals: [],
        goalStats: {},
        tasks: [],
        taskEvents: {},
      }),
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.StudyData || mongoose.model("StudyData", studyDataSchema);
