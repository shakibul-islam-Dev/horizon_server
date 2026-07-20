import { Response } from 'express';

export function sendSuccess(res: Response, message: string, data?: any, meta?: any, statusCode = 200) {
  const payload = { success: true, message } as any;
  if (data !== undefined) payload.data = data;
  if (meta) payload.meta = meta;
  res.status(statusCode).json(payload);
}

export function sendError(res: Response, statusCode: number, message: string) {
  res.status(statusCode).json({ success: false, message });
}

export function sendCreated(res: Response, message: string, data?: any) {
  sendSuccess(res, message, data, undefined, 201);
}

