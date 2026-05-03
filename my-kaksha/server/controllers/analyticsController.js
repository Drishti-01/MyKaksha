import { getWeeklyRoomContribution, getWeeklyUserSummary } from "../services/roomStore.js";

function ok(res, data) {
  res.status(200).json({ success: true, data });
}

export async function getWeeklySummary(req, res) {
  const summary = await getWeeklyUserSummary(req.auth.user.id);
  ok(res, { summary });
}

export async function getRoomContribution(req, res) {
  const rooms = await getWeeklyRoomContribution(req.auth.user.id);
  ok(res, { rooms });
}
