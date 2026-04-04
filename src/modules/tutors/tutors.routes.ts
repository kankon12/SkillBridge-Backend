import { Router } from "express";
import {
  getTutors,
  getTutorById,
  updateTutorProfile,
  updateAvailability,
  getTutorSessions,
} from "./tutors.controller.js";
import { authenticate, requireTutor } from "../../middlewares/auth.middleware.js";

const router = Router();

// ─── Private Tutor Routes  ──────────────────
router.put("/me/profile", authenticate, requireTutor, updateTutorProfile);
router.put("/me/availability", authenticate, requireTutor, updateAvailability);
router.get("/me/sessions", authenticate, requireTutor, getTutorSessions);

// ─── Public Routes ────────────────────────────────
router.get("/", getTutors);
router.get("/:id", getTutorById);

export default router;


