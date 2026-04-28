import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  awardFocusPoint,
  createRoom,
  getRoom,
  joinRoomByCode,
  leaveRoom,
  listMessages,
  listRooms,
  saveNotes,
} from "../controllers/roomController.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listRooms));
router.post("/", asyncHandler(createRoom));
router.get("/join/:code", asyncHandler(joinRoomByCode));
router.post("/join/:code", asyncHandler(joinRoomByCode));
router.get("/:id", asyncHandler(getRoom));
router.post("/:id/leave", asyncHandler(leaveRoom));
router.get("/:id/messages", asyncHandler(listMessages));
router.post("/:id/notes", asyncHandler(saveNotes));
router.post("/:id/focus-point", asyncHandler(awardFocusPoint));

export default router;
