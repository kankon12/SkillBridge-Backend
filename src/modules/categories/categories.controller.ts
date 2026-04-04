import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { sendSuccess, sendError } from "../../lib/response.js";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
});

// GET /api/categories
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { tutorProfiles: true } } },
      orderBy: { name: "asc" },
    });
    return sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/categories
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data });
    return sendSuccess(res, category, "Category created", 201);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/categories/:id
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({ where: { id }, data });
    return sendSuccess(res, category, "Category updated");
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/categories/:id
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    return sendSuccess(res, null, "Category deactivated");
  } catch (error) {
    next(error);
  }
};


