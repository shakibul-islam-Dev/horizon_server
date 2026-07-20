import { Request, Response } from 'express';
import User from '../models/User';
import { sendSuccess, sendError } from '../helpers/response';

export const getAll = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (user.role !== 'admin') return sendError(res, 403, 'Admin access required');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '') || 1);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '') || 20));
  const skip = (page - 1) * limit;
  const filter: any = {};
  const search = url.searchParams.get('search');
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select('name image role createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, 'Users fetched', users, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

export const getMe = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const found = await User.findById(user.userId);
  if (!found) return sendError(res, 404, 'User not found');
  sendSuccess(res, 'Profile fetched', found);
};

export const updateMe = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body) return sendError(res, 400, 'Invalid request body');
  const found = await User.findById(user.userId);
  if (!found) return sendError(res, 404, 'User not found');
  if (body.name) found.name = body.name;
  if (body.image !== undefined) found.image = body.image;
  if (body.preferences) {
    if (body.preferences.categories) found.preferences.categories = body.preferences.categories;
    if (body.preferences.priceRange) {
      if (body.preferences.priceRange.min !== undefined) found.preferences.priceRange.min = body.preferences.priceRange.min;
      if (body.preferences.priceRange.max !== undefined) found.preferences.priceRange.max = body.preferences.priceRange.max;
    }
  }
  await found.save();
  sendSuccess(res, 'Profile updated', found);
};

export const getById = async (req: Request, res: Response, params: any) => {
  const found = await User.findById(params.id).select('name image createdAt');
  if (!found) return sendError(res, 404, 'User not found');
  sendSuccess(res, 'User fetched', found);
};

