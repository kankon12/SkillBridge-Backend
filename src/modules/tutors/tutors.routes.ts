import { Router } from "express";
import {
  getTutors,
  getTutorById,
  updateTutorProfile,
  updateAvailability,
  getTutorSessions,
} from "./tutors.controller";
import { authenticate, requireTutor } from "../../middleware/auth.middleware";

const router = Router();

// Public
router.get("/", getTutors);
router.get("/:id", getTutorById);

// Tutor private routes (prefixed /tutor in main router)
router.put("/profile", authenticate, requireTutor, updateTutorProfile);
router.put("/availability", authenticate, requireTutor, updateAvailability);
router.get("/sessions", authenticate, requireTutor, getTutorSessions);

export default router;