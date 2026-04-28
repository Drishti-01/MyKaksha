import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createMessage,
  createRoom,
  getMyRoomStatsController,
  getNotes,
  getRoom,
  getRoomLeaderboard,
  getRoomStatsController,
  getRoomStudyTimes,
  joinRoomByCode,
  leaveRoom,
  listMessages,
  listRooms,
  saveNotes,
  trackSessionComplete,
} from "../controllers/roomController.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listRooms));
router.post("/", asyncHandler(createRoom));
router.post("/join/:code", asyncHandler(joinRoomByCode));
router.get("/:id", asyncHandler(getRoom));
router.get("/:id/study-times", asyncHandler(getRoomStudyTimes));
router.get("/:id/leaderboard", asyncHandler(getRoomLeaderboard));
router.post("/:id/leave", asyncHandler(leaveRoom));
router.get("/:id/messages", asyncHandler(listMessages));
router.post("/:id/messages", asyncHandler(createMessage));
router.put("/:id/notes", asyncHandler(saveNotes));
router.get("/:id/notes", asyncHandler(getNotes));
router.get("/:id/stats", asyncHandler(getRoomStatsController));
router.get("/:id/my-stats", asyncHandler(getMyRoomStatsController));
router.post("/:id/session-complete", asyncHandler(trackSessionComplete));

export default router;
