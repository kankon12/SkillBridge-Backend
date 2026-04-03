import { Router } from "express";
import { createReview, getTutorReviews } from "./reviews.controller";
import { authenticate, requireStudent } from "../../middlewares/auth.middleware";

const router = Router()

// Public
router.get("/tutor/:tutorId", getTutorReviews);

// Student only
router.post("/", authenticate, requireStudent, createReview);

export default router;
