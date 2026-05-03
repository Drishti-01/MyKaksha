import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getRoomContribution, getWeeklySummary } from "../controllers/analyticsController.js";

const router = Router();

router.use(requireAuth);
router.get("/weekly-summary", asyncHandler(getWeeklySummary));
router.get("/room-contribution", asyncHandler(getRoomContribution));

export default router;
