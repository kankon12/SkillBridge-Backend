import { Response } from "express";
 
export const sendSuccess = (
  res: Response,
  data: unknown,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
 
export const sendError = (
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  errors?: Record<string, unknown> | unknown[]
) => {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };
 
  if (errors !== undefined) {
    body.errors = errors;
  }
 
  return res.status(statusCode).json(body);
};
 
export const sendPaginated = (
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  message = "Success"
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};


