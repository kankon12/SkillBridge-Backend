import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { sendSuccess, sendError } from "../../lib/response";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  image: z.string().url().optional(),
});

// GET /api/auth/me
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        tutorProfile: {
          include: {
            category: true,
            availability: { where: { isActive: true } },
          },
        },
        _count: {
          select: { bookingsAsStudent: true },
        },
      },
    });

    if (!user) return sendError(res, "User not found", 404);

    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, name: true, email: true,
        image: true, role: true,
      },
    });

    return sendSuccess(res, user, "Profile updated");
  } catch (error) {
    next(error);
  }
};