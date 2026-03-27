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
    const { id } = req.params;
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

