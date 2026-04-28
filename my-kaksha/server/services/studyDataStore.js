import { ensureDatabaseConnection } from "../config/database.js";
import StudyData from "../models/StudyData.js";

export const DEFAULT_STUDY_DATA = {
  goals: [],
  goalStats: {},
  tasks: [],
  taskEvents: {},
};

export function normalizeStudyData(payload = {}) {
  return {
    goals: Array.isArray(payload.goals) ? payload.goals : [],
    goalStats: payload.goalStats && typeof payload.goalStats === "object" ? payload.goalStats : {},
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
    taskEvents: payload.taskEvents && typeof payload.taskEvents === "object" ? payload.taskEvents : {},
  };
}

export async function readStudyDataForUser(userId) {
  await ensureDatabaseConnection();

  const doc = await StudyData.findOne({ userId }).lean();
  if (!doc) {
    return { ...DEFAULT_STUDY_DATA };
  }

  return normalizeStudyData(doc);
}

export async function writeStudyDataForUser(userId, payload) {
  await ensureDatabaseConnection();

  const normalized = normalizeStudyData(payload);
  const updated = await StudyData.findOneAndUpdate(
    { userId },
    {
      userId,
      ...normalized,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  ).lean();

  return normalizeStudyData(updated);
}
