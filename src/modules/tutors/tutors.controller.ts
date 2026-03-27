import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { sendSuccess, sendError, sendPaginated } from "../../lib/response";
import { z } from "zod";

const tutorProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  headline: z.string().max(200).optional(),
  hourlyRate: z.number().min(1).max(1000),
  experience: z.number().min(0).max(50).optional(),
  education: z.string().optional(),
  languages: z.array(z.string()).optional(),
  categoryId: z.string().cuid(),
});

const availabilitySchema = z.object({
  slots: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })
  ),
});

// GET /api/tutors  (Public - with filters)
export const getTutors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      minRating,
      search,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { isActive: true };

    if (category) where.category = { slug: category };
    if (minPrice || maxPrice) {
      where.hourlyRate = {};
      if (minPrice) where.hourlyRate.gte = parseFloat(minPrice as string);
      if (maxPrice) where.hourlyRate.lte = parseFloat(maxPrice as string);
    }
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };
    if (search) {
      where.OR = [
        { headline: { contains: search as string, mode: "insensitive" } },
        { bio: { contains: search as string, mode: "insensitive" } },
        { user: { name: { contains: search as string, mode: "insensitive" } } },
      ];
    }

    const [tutors, total] = await Promise.all([
      prisma.tutorProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          category: true,
          availability: { where: { isActive: true } },
          _count: { select: { reviews: true, bookings: true } },
        },
        skip,
        take: limitNum,
        orderBy: { avgRating: "desc" },
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    return sendPaginated(res, tutors, total, pageNum, limitNum);
  } catch (error) {
    next(error);
  }
};

// GET /api/tutors/:id (Public)
export const getTutorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const tutor = await prisma.tutorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, createdAt: true } },
        category: true,
        availability: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        reviews: {
          include: {
            student: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!tutor) return sendError(res, "Tutor not found", 404);

    return sendSuccess(res, tutor);
  } catch (error) {
    next(error);
  }
};

// PUT /api/tutor/profile (Tutor only)
export const updateTutorProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const data = tutorProfileSchema.partial().parse(req.body);

    const profile = await prisma.tutorProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        hourlyRate: data.hourlyRate || 10,
        categoryId: data.categoryId!,
        ...data,
      },
      include: { category: true },
    });

    return sendSuccess(res, profile, "Profile updated");
  } catch (error) {
    next(error);
  }
};

// PUT /api/tutor/availability (Tutor only)
export const updateAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { slots } = availabilitySchema.parse(req.body);

    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutorProfile) return sendError(res, "Tutor profile not found. Create profile first than come.", 404);

   
    await prisma.availability.deleteMany({ where: { tutorId: tutorProfile.id } });

    const availability = await prisma.availability.createMany({
      data: slots.map((slot) => ({
        tutorId: tutorProfile.id,
        ...slot,
      })),
    });

    return sendSuccess(res, availability, "Availability updated");
  } catch (error) {
    next(error);
  }
};

// GET /api/tutor/sessions (Tutor - their bookings)
export const getTutorSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { status, page = "1", limit = "10" } = req.query;

    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!tutorProfile) return sendError(res, "Tutor profile not found", 404);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tutorId: tutorProfile.id };
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true, image: true } },
          review: true,
        },
        skip,
        take: limitNum,
        orderBy: { scheduledAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    return sendPaginated(res, sessions, total, pageNum, limitNum);
  } catch (error) {
    next(error);
  }
};