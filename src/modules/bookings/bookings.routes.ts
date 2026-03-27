import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  completeBooking,
} from "./bookings.controller";
import { authenticate, requireStudent, requireTutor } from "../../middlewares/auth.middleware";


const router = Router();

router.use(authenticate); // all booking routes require auth

router.post("/", requireStudent, createBooking);
router.get("/", getMyBookings);
router.get("/:id", getBookingById);
router.patch("/:id/cancel", requireStudent, cancelBooking);
router.patch("/:id/complete", requireTutor, completeBooking);

export default router;