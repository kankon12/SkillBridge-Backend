import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { sendError } from "../lib/response";
import { prisma } from "../lib/prisma";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        isBanned: boolean;
      };
    }
  }
}

// ─── Verify session via Better Auth 
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      return sendError(res, "Unauthorized. Please login.", 401);
    }

    // Fetch full user from DB to get role and ban status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, isBanned: true },
    });

    if (!user) {
      return sendError(res, "User not found.", 401);
    }

    if (user.isBanned) {
      return sendError(res, "Your account has been banned. Contact support.", 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, "Authentication failed.", 401);
  }
};

// ─── Role-based guards 
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Unauthorized.", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${roles.join(" or ")}`,
        403
      );
    }

    next();
  };
};

export const requireAdmin = requireRole("ADMIN");
export const requireTutor = requireRole("TUTOR", "ADMIN");
export const requireStudent = requireRole("STUDENT", "ADMIN");