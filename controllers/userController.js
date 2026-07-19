const User = require('../models/User');
const { sendSuccess, sendError } = require('../helpers/response');
const { paginate, buildMeta } = require('../helpers/request');

exports.getAll = async (req, res, params, body, user) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const [users, total] = await Promise.all([
    User.find().select('name email image role createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(),
  ]);
  sendSuccess(res, 'Users fetched', users, buildMeta(page, limit, total));
};

exports.getMe = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const found = await User.findById(user.userId);
  if (!found) return sendError(res, 404, 'User not found');
  sendSuccess(res, 'Profile fetched', found);
};

exports.updateMe = async (req, res, params, body, user) => {
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

exports.getById = async (req, res, params) => {
  const found = await User.findById(params.id).select('name image createdAt');
  if (!found) return sendError(res, 404, 'User not found');
  sendSuccess(res, 'User fetched', found);
};
