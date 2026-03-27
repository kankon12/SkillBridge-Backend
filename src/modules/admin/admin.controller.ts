import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { sendSuccess, sendError, sendPaginated } from "../../lib/response";
import { z } from "zod";

const updateUserStatusSchema = z.object({
  isBanned: z.boolean(),
  banReason: z.string().max(300).optional(),
});

// GET /api/admin/users
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, isBanned, search, page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role;
    if (isBanned !== undefined) where.isBanned = isBanned === "true";
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBanned: true,
          banReason: true,
          emailVerified: true,
          createdAt: true,
          tutorProfile: {
            select: {
              id: true,
              hourlyRate: true,
              avgRating: true,
              totalSessions: true,
              isVerified: true,
            },
          },
          _count: {
            select: { bookingsAsStudent: true },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return sendPaginated(res, users, total, pageNum, limitNum);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id  (ban/unban)
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { isBanned, banReason } = updateUserStatusSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return sendError(res, "User not found", 404);
    if (user.role === "ADMIN") return sendError(res, "Cannot ban an admin", 400);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isBanned,
        banReason: isBanned ? banReason : null,
      },
      select: {
        id: true, name: true, email: true,
        role: true, isBanned: true, banReason: true,
      },
    });

    return sendSuccess(res, updated, `User ${isBanned ? "banned" : "unbanned"} successfully`);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/bookings
export const getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true } },
          tutor: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          review: { select: { rating: true, comment: true } },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    return sendPaginated(res, bookings, total, pageNum, limitNum);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/stats
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTutors,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      topTutors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TUTOR" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
      prisma.booking.aggregate({
        where: { status: "COMPLETED" },
        _sum: { totalPrice: true },
      }),
      prisma.tutorProfile.findMany({
        take: 5,
        orderBy: { totalSessions: "desc" },
        include: {
          user: { select: { name: true, email: true, image: true } },
          category: { select: { name: true } },
        },
      }),
    ]);

    return sendSuccess(res, {
      users: { total: totalUsers, students: totalStudents, tutors: totalTutors },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        pending: totalBookings - completedBookings - cancelledBookings,
      },
      revenue: { total: totalRevenue._sum.totalPrice || 0 },
      topTutors,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/tutors/:id/verify
export const verifyTutor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const tutor = await prisma.tutorProfile.findUnique({ where: { id } });
    if (!tutor) return sendError(res, "Tutor profile not found", 404);

    const updated = await prisma.tutorProfile.update({
      where: { id },
      data: { isVerified: !tutor.isVerified },
    });

    return sendSuccess(res, updated, `Tutor ${updated.isVerified ? "verified" : "unverified"}`);
  } catch (error) {
    next(error);
  }
};
