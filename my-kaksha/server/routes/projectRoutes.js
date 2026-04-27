import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createProject,
  deleteProject,
  listProjects,
  patchProjectStatus,
  replaceProject,
} from "../controllers/projectController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateProjectPayload, validateProjectStatusPatch } from "../middleware/validation.js";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(listProjects));
router.post("/", validateProjectPayload, asyncHandler(createProject));
router.put("/:projectId", validateProjectPayload, asyncHandler(replaceProject));
router.patch("/:projectId/status", validateProjectStatusPatch, asyncHandler(patchProjectStatus));
router.delete("/:projectId", asyncHandler(deleteProject));

export default router;
