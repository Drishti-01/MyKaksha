import StudyData from "../models/StudyData.js";
import { ensureDatabaseConnection } from "../config/database.js";
import { readJsonFile, resolveDataFile } from "./fileStore.js";

export const DEFAULT_STUDY_DATA = {
  goals: [],
  goalStats: {},
  tasks: [],
  taskEvents: {},
};

const studyDataFile = resolveDataFile("study-data.json");

export function normalizeStudyData(payload = {}) {
  return {
    goals: Array.isArray(payload.goals) ? payload.goals : [],
    goalStats: payload.goalStats && typeof payload.goalStats === "object" ? payload.goalStats : {},
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
    taskEvents: payload.taskEvents && typeof payload.taskEvents === "object" ? payload.taskEvents : {},
  };
}

function createDefaultStudyData() {
  return {
    goals: [],
    goalStats: {},
    tasks: [],
    taskEvents: {},
  };
}

function isLegacyStudyPayload(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      ("goals" in payload || "goalStats" in payload || "tasks" in payload || "taskEvents" in payload)
  );
}

function normalizeStudyContainer(payload) {
  if (isLegacyStudyPayload(payload)) {
    return {
      legacyShared: normalizeStudyData(payload),
      users: {},
    };
  }

  return {
    legacyShared: isLegacyStudyPayload(payload?.legacyShared)
      ? normalizeStudyData(payload.legacyShared)
      : { ...DEFAULT_STUDY_DATA },
    users: payload?.users && typeof payload.users === "object" ? payload.users : {},
  };
}

export async function readStudyDataForUser(userId) {
  await ensureDatabaseConnection();

  const existingRecord = await StudyData.findOne({ userId }).lean();
  if (existingRecord) {
    return normalizeStudyData(existingRecord.data);
  }

  const payload = await readJsonFile(studyDataFile, { ...DEFAULT_STUDY_DATA });
  const legacyData = isLegacyStudyPayload(payload)
    ? normalizeStudyData(payload)
    : normalizeStudyData(normalizeStudyContainer(payload).users[userId] ?? normalizeStudyContainer(payload).legacyShared);

  const hasLegacyData =
    legacyData.goals.length > 0 ||
    legacyData.tasks.length > 0 ||
    Object.keys(legacyData.goalStats).length > 0 ||
    Object.keys(legacyData.taskEvents).length > 0;

  if (hasLegacyData) {
    await StudyData.create({
      userId,
      data: legacyData,
    });
    return legacyData;
  }

  const emptyData = createDefaultStudyData();
  await StudyData.create({
    userId,
    data: emptyData,
  });
  return emptyData;
}

export async function writeStudyDataForUser(userId, payload) {
  await ensureDatabaseConnection();

  const normalizedData = normalizeStudyData(payload);
  const updatedRecord = await StudyData.findOneAndUpdate(
    { userId },
    { $set: { data: normalizedData } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return normalizeStudyData(updatedRecord?.data);
}
