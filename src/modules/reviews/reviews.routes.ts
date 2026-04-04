import { Router } from "express";
import { createReview, getTutorReviews } from "./reviews.controller.js";
import { authenticate, requireStudent } from "../../middlewares/auth.middleware.js";

const router = Router()

// Public
router.get("/tutor/:tutorId", getTutorReviews);

// Student only
router.post("/", authenticate, requireStudent, createReview);

export default router;


