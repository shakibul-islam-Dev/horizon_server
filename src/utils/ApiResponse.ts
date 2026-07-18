import { Response } from "express";

export function sendSuccess(res: Response, message: string, data?: unknown, meta?: Record<string, unknown>, statusCode = 200) {
  const payload: Record<string, unknown> = { success: true, message };
  if (data !== undefined) payload.data = data;
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

export function sendCreated(res: Response, message: string, data?: unknown) {
  return sendSuccess(res, message, data, undefined, 201);
}

export function sendError(res: Response, message: string, statusCode = 500) {
  return res.status(statusCode).json({ success: false, message });
}
