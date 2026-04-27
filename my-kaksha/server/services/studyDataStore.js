import { readJsonFile, resolveDataFile, writeJsonFile } from "./fileStore.js";

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
  const payload = await readJsonFile(studyDataFile, { ...DEFAULT_STUDY_DATA });

  if (isLegacyStudyPayload(payload)) {
    return normalizeStudyData(payload);
  }

  const container = normalizeStudyContainer(payload);
  const perUserData = container.users[userId];
  if (perUserData) {
    return normalizeStudyData(perUserData);
  }

  return normalizeStudyData(container.legacyShared);
}

export async function writeStudyDataForUser(userId, payload) {
  const existing = await readJsonFile(studyDataFile, { users: {}, legacyShared: { ...DEFAULT_STUDY_DATA } });
  const container = normalizeStudyContainer(existing);

  container.users[userId] = normalizeStudyData(payload);
  await writeJsonFile(studyDataFile, container);

  return container.users[userId];
}
