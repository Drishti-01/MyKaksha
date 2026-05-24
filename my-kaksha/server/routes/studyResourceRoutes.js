// Study Resources — REST API backed by PostgreSQL + Prisma
// Isolated feature: does not read or write MongoDB collections

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateStudyResourcePayload } from "../middleware/validation.js";
import {
  createStudyResource,
  deleteStudyResource,
  getPostgresStatus,
  getResourceStats,
  listResourceCategories,
  listStudyResources,
  updateStudyResource,
} from "../controllers/studyResourceController.js";

const router = Router();

router.get("/status", asyncHandler(getPostgresStatus));

router.use(requireAuth);
router.get("/categories", asyncHandler(listResourceCategories));
router.get("/stats", asyncHandler(getResourceStats));
router.get("/", asyncHandler(listStudyResources));
router.post("/", validateStudyResourcePayload, asyncHandler(createStudyResource));
router.put("/:resourceId", validateStudyResourcePayload, asyncHandler(updateStudyResource));
router.delete("/:resourceId", asyncHandler(deleteStudyResource));

export default router;
