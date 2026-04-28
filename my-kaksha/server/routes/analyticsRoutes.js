import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getWeeklySummary } from "../controllers/analyticsController.js";

const router = Router();

router.use(requireAuth);
router.get("/weekly-summary", asyncHandler(getWeeklySummary));

export default router;
