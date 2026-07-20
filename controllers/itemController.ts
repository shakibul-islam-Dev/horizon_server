import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Item from '../models/Item';
import Review from '../models/Review';
import { sendSuccess, sendError, sendCreated } from '../helpers/response';

export const getItems = async (req: Request, res: Response) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const search = url.searchParams.get('search');
  const category = url.searchParams.get('category');
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';
  const status = url.searchParams.get('status') || 'active';
  const filter: any = { status };
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  const sortOptions: any = {};
  sortOptions[sortBy] = order === 'asc' ? 1 : -1;

  const items = await Item.find(filter).sort(sortOptions).lean();
  sendSuccess(res, 'Items fetched', items);
};

export const getMyItems = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const status = url.searchParams.get('status');
  const filter: any = { author: user.userId };
  if (status) filter.status = status;
  const items = await Item.find(filter).sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'My items fetched', items);
};

export const getTags = async (req: Request, res: Response) => {
  const result = await Item.aggregate([
    { $match: { status: 'active', tags: { $exists: true, $not: { $size: 0 } } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 },
  ]);
  sendSuccess(res, 'Tags fetched', result.map((r: any) => r._id));
};

export const createItem = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.title || !body.shortDescription || !body.fullDescription || !body.price || !body.category) {
    return sendError(res, 400, 'Missing required fields');
  }
  const item = await Item.create({ ...body, author: user.userId });
  sendCreated(res, 'Item created', item);
};

export const getItemById = async (req: Request, res: Response, params: any) => {
  const item = await Item.findById(params.id);
  if (!item) return sendError(res, 404, 'Item not found');
  item.meta.views += 1;
  await item.save();
  sendSuccess(res, 'Item fetched', item);
};

export const updateItem = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body) return sendError(res, 400, 'Invalid request body');
  const item = await Item.findById(params.id);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.author.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  const allowed = ['title', 'shortDescription', 'fullDescription', 'price', 'category', 'images', 'tags', 'location', 'status', 'specifications'];
  for (const key of allowed) {
    if (body[key] !== undefined) item[key] = body[key];
  }
  await item.save();
  sendSuccess(res, 'Item updated', item);
};

export const deleteItem = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const item = await Item.findById(params.id);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.author.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await Item.findByIdAndDelete(params.id);
  sendSuccess(res, 'Item deleted');
};

export const getReviews = async (req: Request, res: Response) => {
  const reviews = await Review.find().populate('user', 'name image').sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'Reviews fetched', reviews);
};

export const getReviewsByItem = async (req: Request, res: Response, params: any) => {
  const reviews = await Review.find({ item: params.itemId }).populate('user', 'name image').sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'Reviews fetched', reviews);
};

export const getMyReviews = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const reviews = await Review.find({ user: user.userId }).sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'Reviews fetched', reviews);
};

export const getReviewsByUser = async (req: Request, res: Response, params: any) => {
  const reviews = await Review.find({ user: params.userId }).sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'Reviews fetched', reviews);
};

export const getReviewStats = async (req: Request, res: Response, params: any) => {
  const result = await Review.aggregate([
    { $match: { item: mongoose.Types.ObjectId.createFromHexString(params.itemId) } },
    { $group: { _id: '$item', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 }, ratingDistribution: { $push: '$rating' } } },
  ]);
  if (result.length === 0) {
    return sendSuccess(res, 'Review stats', { averageRating: 0, reviewCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  }
  const { averageRating, reviewCount, ratingDistribution } = result[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratingDistribution) distribution[r as keyof typeof distribution] = (distribution[r as keyof typeof distribution] || 0) + 1;
  sendSuccess(res, 'Review stats', { averageRating: Math.round(averageRating * 10) / 10, reviewCount, totalReviews: reviewCount, distribution });
};

export const createReview = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const itemId = body.itemId || body.item;
  if (!itemId || !body.rating) return sendError(res, 400, 'Item ID and rating are required');
  if (body.rating < 1 || body.rating > 5) return sendError(res, 400, 'Rating must be between 1 and 5');
  const item = await Item.findById(itemId);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.author.toString() === user.userId) return sendError(res, 403, 'Cannot review your own item');
  const existing = await Review.findOne({ item: itemId, user: user.userId });
  if (existing) return sendError(res, 409, 'Already reviewed this item');
  const review = await Review.create({ item: itemId, user: user.userId, rating: body.rating, comment: body.comment || '' });
  await review.populate('user', 'name image');
  sendCreated(res, 'Review created', review);
};

export const updateReview = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const review = await Review.findById(params.id);
  if (!review) return sendError(res, 404, 'Review not found');
  if (review.user.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  if (body.rating !== undefined) {
    if (body.rating < 1 || body.rating > 5) return sendError(res, 400, 'Rating must be between 1 and 5');
    review.rating = body.rating;
  }
  if (body.comment !== undefined) review.comment = body.comment;
  await review.save();
  await review.populate('user', 'name image');
  sendSuccess(res, 'Review updated', review);
};

export const deleteReview = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const review = await Review.findById(params.id);
  if (!review) return sendError(res, 404, 'Review not found');
  if (review.user.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await Review.findByIdAndDelete(params.id);
  sendSuccess(res, 'Review deleted');
};
