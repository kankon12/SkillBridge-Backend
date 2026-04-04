import { Router } from "express";
import {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getStats,
  verifyTutor,
} from "./admin.controller.js";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../categories/categories.controller.js";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";


const router = Router();

router.use(authenticate, requireAdmin); // all admin routes are protected

router.get("/stats", getStats);

router.get("/users", getAllUsers);
router.patch("/users/:id", updateUserStatus);

router.get("/bookings", getAllBookings);

router.patch("/tutors/:id/verify", verifyTutor);

router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

export default router;


