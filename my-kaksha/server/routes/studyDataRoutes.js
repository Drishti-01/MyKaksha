import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getStudyData, saveStudyData } from "../controllers/studyDataController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateStudyDataPayload } from "../middleware/validation.js";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getStudyData));
router.put("/", validateStudyDataPayload, asyncHandler(saveStudyData));

export default router;
