import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, logout, me, signup, resetStats } from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateLogin, validateSignup } from "../middleware/validation.js";

const router = Router();

router.post("/signup", validateSignup, asyncHandler(signup));
router.post("/login", validateLogin, asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));
router.post("/logout", requireAuth, asyncHandler(logout));
router.post("/reset-stats", requireAuth, asyncHandler(resetStats));

export default router;
