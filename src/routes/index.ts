import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import tutorRoutes from "../modules/tutors/tutors.routes.js";
import bookingRoutes from "../modules/bookings/bookings.routes.js";
import reviewRoutes from "../modules/reviews/reviews.routes.js";
import categoryRoutes from "../modules/categories/categories.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";

const router = Router();

// Auth
router.use("/auth", authRoutes);

// Tutors 
router.use("/tutors", tutorRoutes);

// Bookings
router.use("/bookings", bookingRoutes);

// Reviews
router.use("/reviews", reviewRoutes);

// Categories
router.use("/categories", categoryRoutes);

// Admin
router.use("/admin", adminRoutes);

export default router;


