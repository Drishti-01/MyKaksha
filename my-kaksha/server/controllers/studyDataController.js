import { readStudyDataForUser, writeStudyDataForUser } from "../services/studyDataStore.js";

export async function getStudyData(req, res) {
  // MongoDB verified — StudyData.findOne() reads from MongoDB
  const data = await readStudyDataForUser(req.auth.user.id);
  res.status(200).json(data);
}

export async function saveStudyData(req, res) {
  // MongoDB verified — StudyData.findOneAndUpdate() with upsert saves to MongoDB
  await writeStudyDataForUser(req.auth.user.id, req.validatedStudyData);
  res.status(200).json({ ok: true });
}
