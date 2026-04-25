

import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import tutorRoutes from "../modules/tutors/tutors.routes.js";
import bookingRoutes from "../modules/bookings/bookings.routes.js";
import reviewRoutes from "../modules/reviews/reviews.routes.js";
import categoryRoutes from "../modules/categories/categories.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tutors", tutorRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);
router.use("/categories", categoryRoutes);
router.use("/admin", adminRoutes);

export default router;