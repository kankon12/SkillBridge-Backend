import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { sendSuccess, sendError } from "../../lib/response";
import { z } from "zod";

const reviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// POST /api/reviews  (Student)
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;
    const data = reviewSchema.parse(req.body);

    // Verify booking exists, belongs to student, and is COMPLETED
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { review: true },
    });

    if (!booking) return sendError(res, "Booking not found", 404);
    if (booking.studentId !== studentId) return sendError(res, "Access denied", 403);
    if (booking.status !== "COMPLETED") {
      return sendError(res, "You can only review completed sessions", 400);
    }
    if (booking.review) {
      return sendError(res, "You have already reviewed this session", 409);
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        studentId,
        tutorId: booking.tutorId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Recalculate tutor's average rating
    const stats = await prisma.review.aggregate({
      where: { tutorId: booking.tutorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.tutorProfile.update({
      where: { id: booking.tutorId },
      data: {
        avgRating: Math.round((stats._avg.rating || 0) * 10) / 10,
        totalReviews: stats._count.rating,
      },
    });

    return sendSuccess(res, review, "Review submitted", 201);
  } catch (error) {
    next(error);
  }
};