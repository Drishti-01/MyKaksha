import { readStudyDataForUser, writeStudyDataForUser } from "../services/studyDataStore.js";

export async function getStudyData(req, res) {
  const data = await readStudyDataForUser(req.auth.user.id);
  res.status(200).json(data);
}

export async function saveStudyData(req, res) {
  await writeStudyDataForUser(req.auth.user.id, req.validatedStudyData);
  res.status(200).json({ ok: true });
}
