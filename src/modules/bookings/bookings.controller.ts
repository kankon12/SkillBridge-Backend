// import { Request, Response, NextFunction } from "express";
// import { prisma } from "../../lib/prisma.js";
// import { sendSuccess, sendError, sendPaginated } from "../../lib/response.js";
// import { z } from "zod";

// const createBookingSchema = z.object({
//   tutorId: z.string().cuid(),
//   subject: z.string().min(2).max(200),
//   notes: z.string().max(500).optional(),
//   scheduledAt: z.string().datetime(),
//   durationMins: z.number().min(30).max(240).default(60),
// });

// const cancelBookingSchema = z.object({
//   reason: z.string().max(300).optional(),
// });

// // POST /api/bookings  (Student)
// export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const studentId = req.user!.id;
//     const data = createBookingSchema.parse(req.body);

    
//     const tutorProfile = await prisma.tutorProfile.findUnique({
//       where: { id: data.tutorId },
//       include: { user: { select: { id: true } } },
//     });

//     if (!tutorProfile) return sendError(res, "Tutor not found", 404);
//     if (!tutorProfile.isActive) return sendError(res, "Tutor is not accepting bookings", 400);

//     if (tutorProfile.userId === studentId) {
//       return sendError(res, "You cannot book your own profile", 400);
//     }

    
//     const newStart = new Date(data.scheduledAt);
//     const newEnd = new Date(newStart.getTime() + data.durationMins * 60 * 1000);


//     const conflictingBookings = await prisma.booking.findMany({
//       where: {
//         tutorId: data.tutorId,
//         status: "CONFIRMED",
//         scheduledAt: {
          
//           lt: newEnd,
          
//           gte: new Date(newStart.getTime() - 240 * 60 * 1000),
//         },
//       },
//     });

    
//     const hasConflict = conflictingBookings.some((booking: { scheduledAt: Date; durationMins: number }) => {
//       const existStart = booking.scheduledAt;
//       const existEnd = new Date(existStart.getTime() + booking.durationMins * 60 * 1000);
//       return newStart < existEnd && existStart < newEnd;
//     });

//     if (hasConflict) {
//       return sendError(res, "This time slot is already booked", 409);
//     }

    
//     const studentConflict = await prisma.booking.findMany({
//       where: {
//         studentId,
//         status: "CONFIRMED",
//         scheduledAt: {
//           lt: newEnd,
//           gte: new Date(newStart.getTime() - 240 * 60 * 1000),
//         },
//       },
//     });

//     const hasStudentConflict = studentConflict.some((booking: { scheduledAt: Date; durationMins: number }) => {
//       const existStart = booking.scheduledAt;
//       const existEnd = new Date(existStart.getTime() + booking.durationMins * 60 * 1000);
//       return newStart < existEnd && existStart < newEnd;
//     });

//     if (hasStudentConflict) {
//       return sendError(res, "You already have a booking at this time", 409);
//     }

//     // মোট মূল্য হিসাব
//     const totalPrice = (tutorProfile.hourlyRate / 60) * data.durationMins;

//     const booking = await prisma.booking.create({
//       data: {
//         studentId,
//         tutorId: tutorProfile.id,
//         subject: data.subject,
//         notes: data.notes,
//         scheduledAt: newStart,
//         durationMins: data.durationMins,
//         totalPrice,
//         status: "CONFIRMED",
//       },
//       include: {
//         tutor: {
//           include: { user: { select: { name: true, email: true } } },
//         },
//       },
//     });

//     return sendSuccess(res, booking, "Booking confirmed!", 201);
//   } catch (error) {
//     next(error);
//   }
// };

// // GET /api/bookings  (Student বা Tutor — role অনুযায়ী)
// export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user!.id;
//     const userRole = req.user!.role;
//     const { status, page = "1", limit = "10" } = req.query;

//     const pageNum = Math.max(1, parseInt(page as string));
//     const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
//     const skip = (pageNum - 1) * limitNum;

//     let where: any = {};
//     if (userRole === "STUDENT") {
//       where.studentId = userId;
//     } else if (userRole === "TUTOR") {
//       const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
//       if (!tutorProfile) return sendError(res, "Tutor profile not found", 404);
//       where.tutorId = tutorProfile.id;
//     }
    

//     if (status) where.status = status;

//     const [bookings, total] = await Promise.all([
//       prisma.booking.findMany({
//         where,
//         include: {
//           tutor: {
//             include: {
//               user: { select: { id: true, name: true, image: true } },
//               category: true,
//             },
//           },
//           student: { select: { id: true, name: true, image: true } },
//           review: true,
//         },
//         skip,
//         take: limitNum,
//         orderBy: { scheduledAt: "desc" },
//       }),
//       prisma.booking.count({ where }),
//     ]);

//     return sendPaginated(res, bookings, total, pageNum, limitNum);
//   } catch (error) {
//     next(error);
//   }
// };

// // GET /api/bookings/:id
// export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const id = req.params.id as string;
//     const userId = req.user!.id;
//     const userRole = req.user!.role;

//     const booking = await prisma.booking.findUnique({
//       where: { id },
//       include: {
//         student: { select: { id: true, name: true, email: true, image: true } },
//         tutor: {
//           include: { user: { select: { id: true, name: true, email: true } } },
//         },
//         review: true,
//       },
//     });

//     if (!booking) return sendError(res, "Booking not found", 404);

//     const isStudent = booking.studentId === userId;
//     const isTutor = booking.tutor.userId === userId;
//     const isAdmin = userRole === "ADMIN";

//     if (!isStudent && !isTutor && !isAdmin) {
//       return sendError(res, "Access denied", 403);
//     }

//     return sendSuccess(res, booking);
//   } catch (error) {
//     next(error);
//   }
// };

// // PATCH /api/bookings/:id/cancel  (Student)
// export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const id = req.params.id as string;
//     const studentId = req.user!.id;
//     const { reason } = cancelBookingSchema.parse(req.body);

//     const booking = await prisma.booking.findUnique({ where: { id } });

//     if (!booking) return sendError(res, "Booking not found", 404);
//     if (booking.studentId !== studentId) return sendError(res, "Access denied", 403);
//     if (booking.status !== "CONFIRMED") {
//       return sendError(res, `Cannot cancel a ${booking.status.toLowerCase()} booking`, 400);
//     }

//     // BUG FIX: Past booking cancel করতে দেওয়া উচিত নয়
//     if (new Date(booking.scheduledAt) <= new Date()) {
//       return sendError(res, "Cannot cancel a past booking", 400);
//     }

//     const updated = await prisma.booking.update({
//       where: { id },
//       data: { status: "CANCELLED", cancelReason: reason },
//     });

//     return sendSuccess(res, updated, "Booking cancelled");
//   } catch (error) {
//     next(error);
//   }
// };

// // PATCH /api/bookings/:id/complete  (Tutor)
// export const completeBooking = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const id = req.params.id as string;
//     const userId = req.user!.id;

//     const booking = await prisma.booking.findUnique({
//       where: { id },
//       include: { tutor: true },
//     });

//     if (!booking) return sendError(res, "Booking not found", 404);
//     if (booking.tutor.userId !== userId) return sendError(res, "Access denied", 403);
//     if (booking.status !== "CONFIRMED") {
//       return sendError(res, `Cannot complete a ${booking.status.toLowerCase()} booking`, 400);
//     }

//     const [updated] = await prisma.$transaction([
//       prisma.booking.update({
//         where: { id },
//         data: { status: "COMPLETED" },
//       }),
//       prisma.tutorProfile.update({
//         where: { id: booking.tutorId },
//         data: { totalSessions: { increment: 1 } },
//       }),
//     ]);

//     return sendSuccess(res, updated, "Session marked as completed");
//   } catch (error) {
//     next(error);
//   }
// };



import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { sendSuccess, sendError, sendPaginated } from "../../lib/response.js";
import { stripe } from "../../lib/stripe.js";
import config from "../../config/index.js";
import { z } from "zod";

const createBookingSchema = z.object({
  tutorId: z.string().cuid(),
  subject: z.string().min(2).max(200),
  notes: z.string().max(500).optional(),
  scheduledAt: z.string().datetime(),
  durationMins: z.number().min(30).max(240).default(60),
});

const cancelBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});

// POST /api/bookings  (Student)
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;
    const data = createBookingSchema.parse(req.body);

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id: data.tutorId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!tutorProfile) return sendError(res, "Tutor not found", 404);
    if (!tutorProfile.isActive) return sendError(res, "Tutor is not accepting bookings", 400);

    if (tutorProfile.userId === studentId) {
      return sendError(res, "You cannot book your own profile", 400);
    }

    const newStart = new Date(data.scheduledAt);
    const newEnd = new Date(newStart.getTime() + data.durationMins * 60 * 1000);

    // Tutor conflict check (CONFIRMED only — PENDING গুলো ignore করা হবে)
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        tutorId: data.tutorId,
        status: "CONFIRMED",
        scheduledAt: {
          lt: newEnd,
          gte: new Date(newStart.getTime() - 240 * 60 * 1000),
        },
      },
    });

    const hasConflict = conflictingBookings.some((booking) => {
      const existStart = booking.scheduledAt;
      const existEnd = new Date(existStart.getTime() + booking.durationMins * 60 * 1000);
      return newStart < existEnd && existStart < newEnd;
    });

    if (hasConflict) {
      return sendError(res, "This time slot is already booked", 409);
    }

    // Student conflict check
    const studentConflict = await prisma.booking.findMany({
      where: {
        studentId,
        status: "CONFIRMED",
        scheduledAt: {
          lt: newEnd,
          gte: new Date(newStart.getTime() - 240 * 60 * 1000),
        },
      },
    });

    const hasStudentConflict = studentConflict.some((booking) => {
      const existStart = booking.scheduledAt;
      const existEnd = new Date(existStart.getTime() + booking.durationMins * 60 * 1000);
      return newStart < existEnd && existStart < newEnd;
    });

    if (hasStudentConflict) {
      return sendError(res, "You already have a booking at this time", 409);
    }

    // মোট মূল্য হিসাব
    const totalPrice = (tutorProfile.hourlyRate / 60) * data.durationMins;

    // Booking তৈরি করো PENDING status-এ (payment এর আগে)
    const booking = await prisma.booking.create({
      data: {
        studentId,
        tutorId: tutorProfile.id,
        subject: data.subject,
        notes: data.notes,
        scheduledAt: newStart,
        durationMins: data.durationMins,
        totalPrice,
        status: "PENDING",
        isPaid: false,
      },
    });

    // Stripe Checkout Session তৈরি করো
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Tutoring Session — ${data.subject}`,
              description: `${data.durationMins} min session with ${tutorProfile.user.name}`,
            },
            unit_amount: Math.round(totalPrice * 100), // Stripe cents-এ নেয়
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${config.frontend_url}/payment/success?bookingId=${booking.id}`,
      cancel_url: `${config.frontend_url}/payment/cancel?bookingId=${booking.id}`,
      metadata: {
        bookingId: booking.id,
        studentId,
        tutorId: tutorProfile.id,
      },
    });

    // Booking-এ stripeSessionId save করো
    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return sendSuccess(
      res,
      {
        booking,
        checkoutUrl: checkoutSession.url, // frontend এই URL-এ redirect করবে
      },
      "Booking created! Redirecting to payment...",
      201
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings  (Student বা Tutor — role অনুযায়ী)
export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { status, page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};
    if (userRole === "STUDENT") {
      where.studentId = userId;
    } else if (userRole === "TUTOR") {
      const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
      if (!tutorProfile) return sendError(res, "Tutor profile not found", 404);
      where.tutorId = tutorProfile.id;
    }

    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          tutor: {
            include: {
              user: { select: { id: true, name: true, image: true } },
              category: true,
            },
          },
          student: { select: { id: true, name: true, image: true } },
          review: true,
        },
        skip,
        take: limitNum,
        orderBy: { scheduledAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    return sendPaginated(res, bookings, total, pageNum, limitNum);
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id
export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true, image: true } },
        tutor: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        review: true,
      },
    });

    if (!booking) return sendError(res, "Booking not found", 404);

    const isStudent = booking.studentId === userId;
    const isTutor = booking.tutor.userId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isStudent && !isTutor && !isAdmin) {
      return sendError(res, "Access denied", 403);
    }

    return sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/cancel  (Student)
export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const studentId = req.user!.id;
    const { reason } = cancelBookingSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) return sendError(res, "Booking not found", 404);
    if (booking.studentId !== studentId) return sendError(res, "Access denied", 403);

    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      return sendError(res, `Cannot cancel a ${booking.status.toLowerCase()} booking`, 400);
    }

    if (booking.status === "CONFIRMED" && new Date(booking.scheduledAt) <= new Date()) {
      return sendError(res, "Cannot cancel a past booking", 400);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED", cancelReason: reason },
    });

    return sendSuccess(res, updated, "Booking cancelled");
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/complete  (Tutor)
export const completeBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { tutor: true },
    });

    if (!booking) return sendError(res, "Booking not found", 404);
    if (booking.tutor.userId !== userId) return sendError(res, "Access denied", 403);
    if (booking.status !== "CONFIRMED") {
      return sendError(res, `Cannot complete a ${booking.status.toLowerCase()} booking`, 400);
    }

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "COMPLETED" },
      }),
      prisma.tutorProfile.update({
        where: { id: booking.tutorId },
        data: { totalSessions: { increment: 1 } },
      }),
    ]);

    return sendSuccess(res, updated, "Session marked as completed");
  } catch (error) {
    next(error);
  }
};