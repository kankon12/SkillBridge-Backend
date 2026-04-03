import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { sendSuccess, sendError, sendPaginated } from "../../lib/response";
import { z } from "zod";

const reviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// POST /api/reviews  (Student only)
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

    // Create review and recalculate tutor rating in a transaction
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          bookingId: data.bookingId,
          studentId,
          tutorId: booking.tutorId,
          rating: data.rating,
          comment: data.comment,
        },
      });

      // Recalculate tutor's average rating
      const stats = await tx.review.aggregate({
        where: { tutorId: booking.tutorId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.tutorProfile.update({
        where: { id: booking.tutorId },
        data: {
          avgRating: Math.round((stats._avg.rating || 0) * 10) / 10,
          totalReviews: stats._count.rating,
        },
      });

      return newReview;
    });

    return sendSuccess(res, review, "Review submitted", 201);
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/tutor/:tutorId  (Public - get reviews for a tutor)
export const getTutorReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const  tutorId  = req.params.tutorId as string;
    const { page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { tutorId },
        include: {
          student: { select: { id: true, name: true, image: true } },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { tutorId } }),
    ]);

    return sendPaginated(res, reviews, total, pageNum, limitNum);
  } catch (error) {
    next(error);
  }
};
