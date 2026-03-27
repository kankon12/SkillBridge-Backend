import { Router } from "express";
import { createReview } from "./reviews.controller";
import { authenticate, requireStudent } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", authenticate, requireStudent, createReview);

export default router;