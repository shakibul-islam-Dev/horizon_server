const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Item = require('../models/Item');
const { sendSuccess, sendError, sendCreated } = require('../helpers/response');
const { paginate, buildMeta } = require('../helpers/request');

// ===== CART =====
exports.getCart = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  let cart = await Cart.findOne({ user: user.userId }).populate('items.item', 'title price images status');
  if (!cart) cart = await Cart.create({ user: user.userId, items: [] });
  sendSuccess(res, 'Cart fetched', cart);
};

exports.addToCart = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const itemId = body.itemId || body.item;
  if (!itemId) return sendError(res, 400, 'Item ID is required');
  const item = await Item.findById(itemId);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.status !== 'active') return sendError(res, 400, 'Item not available');

  let cart = await Cart.findOne({ user: user.userId });
  if (!cart) cart = await Cart.create({ user: user.userId, items: [] });

  const existing = cart.items.find(i => i.item.toString() === itemId);
  if (existing) existing.quantity += (body.quantity || 1);
  else cart.items.push({ item: itemId, quantity: body.quantity || 1 });

  await cart.save();
  await cart.populate('items.item', 'title price images status');
  sendSuccess(res, 'Item added to cart', cart);
};

exports.updateCart = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const itemId = body.itemId || body.item;
  if (!itemId || !body.quantity) return sendError(res, 400, 'Item ID and quantity required');
  const cart = await Cart.findOne({ user: user.userId });
  if (!cart) return sendError(res, 404, 'Cart not found');
  const existing = cart.items.find(i => i.item.toString() === itemId);
  if (!existing) return sendError(res, 404, 'Item not in cart');
  existing.quantity = body.quantity;
  await cart.save();
  await cart.populate('items.item', 'title price images status');
  sendSuccess(res, 'Cart updated', cart);
};

exports.removeFromCart = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const cart = await Cart.findOne({ user: user.userId });
  if (!cart) return sendError(res, 404, 'Cart not found');
  cart.items = cart.items.filter(i => i.item.toString() !== params.itemId);
  await cart.save();
  await cart.populate('items.item', 'title price images status');
  sendSuccess(res, 'Item removed from cart', cart);
};

exports.clearCart = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const cart = await Cart.findOne({ user: user.userId });
  if (!cart) return sendError(res, 404, 'Cart not found');
  cart.items = [];
  await cart.save();
  sendSuccess(res, 'Cart cleared', cart);
};

exports.getCartTotal = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const cart = await Cart.findOne({ user: user.userId }).populate('items.item', 'price');
  if (!cart) return sendSuccess(res, 'Cart total', { total: 0 });
  const total = cart.items.reduce((sum, i) => sum + ((i.item?.price || 0) * i.quantity), 0);
  sendSuccess(res, 'Cart total', { total });
};

// ===== WISHLIST =====
exports.getWishlist = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const [items, total] = await Promise.all([
    Wishlist.find({ user: user.userId }).populate({ path: 'item', populate: [{ path: 'author', select: 'name image' }] }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Wishlist.countDocuments({ user: user.userId }),
  ]);
  sendSuccess(res, 'Wishlist fetched', items, buildMeta(page, limit, total));
};

exports.addToWishlist = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const itemId = body.itemId || body.item;
  if (!itemId) return sendError(res, 400, 'Item ID is required');
  const item = await Item.findById(itemId);
  if (!item) return sendError(res, 404, 'Item not found');
  const existing = await Wishlist.findOne({ user: user.userId, item: itemId });
  if (existing) return sendError(res, 409, 'Item already in wishlist');
  const wl = await Wishlist.create({ user: user.userId, item: itemId });
  sendCreated(res, 'Added to wishlist', wl);
};

exports.removeFromWishlist = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const wl = await Wishlist.findOneAndDelete({ user: user.userId, item: params.itemId });
  if (!wl) return sendError(res, 404, 'Item not in wishlist');
  sendSuccess(res, 'Removed from wishlist');
};

exports.checkWishlist = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const exists = await Wishlist.findOne({ user: user.userId, item: params.itemId });
  sendSuccess(res, 'Check result', { inWishlist: !!exists });
};

exports.clearWishlist = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  await Wishlist.deleteMany({ user: user.userId });
  sendSuccess(res, 'Wishlist cleared');
};
