import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes";
import tutorRoutes from "../modules/tutors/tutors.routes";
import bookingRoutes from "../modules/bookings/bookings.routes";
import reviewRoutes from "../modules/reviews/reviews.routes";
import categoryRoutes from "../modules/categories/categories.routes";
import adminRoutes from "../modules/admin/admin.routes";

const router = Router();

// Auth
router.use("/auth", authRoutes);

// Tutors
router.use("/tutors", tutorRoutes);
router.use("/tutor", tutorRoutes);

// Bookings
router.use("/bookings", bookingRoutes);

// Reviews
router.use("/reviews", reviewRoutes);

// Categories
router.use("/categories", categoryRoutes);

// Admin
router.use("/admin", adminRoutes);

export default router;