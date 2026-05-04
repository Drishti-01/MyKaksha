import { getWeeklyRoomContribution, getWeeklyUserSummary } from "../services/roomStore.js";

function ok(res, data) {
  res.status(200).json({ success: true, data });
}

export async function getWeeklySummary(req, res) {
  // MongoDB verified — aggregates from RoomSession collection in MongoDB
  const summary = await getWeeklyUserSummary(req.auth.user.id);
  ok(res, { summary });
}

export async function getRoomContribution(req, res) {
  // MongoDB verified — aggregates from RoomSession collection in MongoDB
  const rooms = await getWeeklyRoomContribution(req.auth.user.id);
  ok(res, { rooms });
}
