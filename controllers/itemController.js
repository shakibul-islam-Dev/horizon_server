const Item = require('../models/Item');
const Review = require('../models/Review');
const { sendSuccess, sendError, sendCreated } = require('../helpers/response');
const { paginate, buildMeta } = require('../helpers/request');

exports.getItems = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const search = url.searchParams.get('search');
  const category = url.searchParams.get('category');
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';
  const status = url.searchParams.get('status') || 'active';
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));

  const filter = { status };
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  const sortOptions = {};
  sortOptions[sortBy] = order === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Item.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
    Item.countDocuments(filter),
  ]);
  sendSuccess(res, 'Items fetched', items, buildMeta(page, limit, total));
};

exports.getMyItems = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const status = url.searchParams.get('status');
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const filter = { author: user.userId };
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Item.countDocuments(filter),
  ]);
  sendSuccess(res, 'My items fetched', items, buildMeta(page, limit, total));
};

exports.getTags = async (req, res) => {
  const result = await Item.aggregate([
    { $match: { status: 'active', tags: { $exists: true, $not: { $size: 0 } } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 },
  ]);
  sendSuccess(res, 'Tags fetched', result.map(r => r._id));
};

exports.createItem = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.title || !body.shortDescription || !body.fullDescription || !body.price || !body.category) {
    return sendError(res, 400, 'Missing required fields');
  }
  const item = await Item.create({ ...body, author: user.userId });
  sendCreated(res, 'Item created', item);
};

exports.getItemById = async (req, res, params) => {
  const item = await Item.findById(params.id);
  if (!item) return sendError(res, 404, 'Item not found');
  item.meta.views += 1;
  await item.save();
  sendSuccess(res, 'Item fetched', item);
};

exports.updateItem = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body) return sendError(res, 400, 'Invalid request body');
  const item = await Item.findById(params.id);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.author.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  Object.assign(item, body);
  await item.save();
  sendSuccess(res, 'Item updated', item);
};

exports.deleteItem = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const item = await Item.findById(params.id);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.author.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await Item.findByIdAndDelete(params.id);
  sendSuccess(res, 'Item deleted');
};

exports.getReviews = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const [reviews, total] = await Promise.all([
    Review.find().populate('user', 'name image').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(),
  ]);
  sendSuccess(res, 'Reviews fetched', reviews, buildMeta(page, limit, total));
};

exports.getReviewsByItem = async (req, res, params) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const [reviews, total] = await Promise.all([
    Review.find({ item: params.itemId }).populate('user', 'name image').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments({ item: params.itemId }),
  ]);
  sendSuccess(res, 'Reviews fetched', reviews, buildMeta(page, limit, total));
};

exports.getMyReviews = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const [reviews, total] = await Promise.all([
    Review.find({ user: user.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments({ user: user.userId }),
  ]);
  sendSuccess(res, 'Reviews fetched', reviews, buildMeta(page, limit, total));
};

exports.getReviewsByUser = async (req, res, params) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const [reviews, total] = await Promise.all([
    Review.find({ user: params.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments({ user: params.userId }),
  ]);
  sendSuccess(res, 'Reviews fetched', reviews, buildMeta(page, limit, total));
};

exports.getReviewStats = async (req, res, params) => {
  const result = await Review.aggregate([
    { $match: { item: require('mongoose').Types.ObjectId.createFromHexString(params.itemId) } },
    { $group: { _id: '$item', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 }, ratingDistribution: { $push: '$rating' } } },
  ]);
  if (result.length === 0) {
    return sendSuccess(res, 'Review stats', { averageRating: 0, reviewCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  }
  const { averageRating, reviewCount, ratingDistribution } = result[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratingDistribution) distribution[r] = (distribution[r] || 0) + 1;
  sendSuccess(res, 'Review stats', { averageRating: Math.round(averageRating * 10) / 10, reviewCount, distribution });
};

exports.createReview = async (req, res, params, body, user) => {
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

exports.updateReview = async (req, res, params, body, user) => {
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

exports.deleteReview = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const review = await Review.findById(params.id);
  if (!review) return sendError(res, 404, 'Review not found');
  if (review.user.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await Review.findByIdAndDelete(params.id);
  sendSuccess(res, 'Review deleted');
};
