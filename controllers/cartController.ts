import { Request, Response } from 'express';
import Cart from '../models/Cart';
import Wishlist from '../models/Wishlist';
import Item from '../models/Item';
import { sendSuccess, sendError, sendCreated } from '../helpers/response';

// ===== CART =====
export const getCart = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  let cart = await Cart.findOne({ user: user.userId }).populate('items.item', 'title price images status');
  if (!cart) cart = await Cart.create({ user: user.userId, items: [] });
  sendSuccess(res, 'Cart fetched', cart);
};

export const addToCart = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const itemId = body.itemId || body.item;
  if (!itemId) return sendError(res, 400, 'Item ID is required');
  const item = await Item.findById(itemId);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.status !== 'active') return sendError(res, 400, 'Item not available');

  let cart = await Cart.findOne({ user: user.userId });
  if (!cart) cart = await Cart.create({ user: user.userId, items: [] });

  const existing = cart.items.find((i: any) => i.item.toString() === itemId);
  if (existing) existing.quantity += (body.quantity || 1);
  else cart.items.push({ item: itemId, quantity: body.quantity || 1 });

  await cart.save();
  await cart.populate('items.item', 'title price images status');
  sendSuccess(res, 'Item added to cart', cart);
};

export const updateCart = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const itemId = body.itemId || body.item;
  if (!itemId || !body.quantity) return sendError(res, 400, 'Item ID and quantity required');
  const cart = await Cart.findOne({ user: user.userId });
  if (!cart) return sendError(res, 404, 'Cart not found');
  const existing = cart.items.find((i: any) => i.item.toString() === itemId);
  if (!existing) return sendError(res, 404, 'Item not in cart');
  existing.quantity = body.quantity;
  await cart.save();
  await cart.populate('items.item', 'title price images status');
  sendSuccess(res, 'Cart updated', cart);
};

export const removeFromCart = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const cart = await Cart.findOne({ user: user.userId });
  if (!cart) return sendError(res, 404, 'Cart not found');
  cart.items = cart.items.filter((i: any) => i.item.toString() !== params.itemId);
  await cart.save();
  await cart.populate('items.item', 'title price images status');
  sendSuccess(res, 'Item removed from cart', cart);
};

export const clearCart = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const cart = await Cart.findOne({ user: user.userId });
  if (!cart) return sendError(res, 404, 'Cart not found');
  cart.items = [];
  await cart.save();
  sendSuccess(res, 'Cart cleared', cart);
};

export const getCartTotal = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const cart = await Cart.findOne({ user: user.userId }).populate('items.item', 'price');
  if (!cart) return sendSuccess(res, 'Cart total', { total: 0 });
  const total = cart.items.reduce((sum: any, i: any) => sum + ((i.item?.price || 0) * i.quantity), 0);
  sendSuccess(res, 'Cart total', { total });
};

// ===== WISHLIST =====
export const getWishlist = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const items = await Wishlist.find({ user: user.userId }).populate({ path: 'item', populate: [{ path: 'author', select: 'name image' }] }).sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'Wishlist fetched', items);
};

export const addToWishlist = async (req: Request, res: Response, params: any, body: any, user: any) => {
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

export const removeFromWishlist = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const wl = await Wishlist.findOneAndDelete({ user: user.userId, item: params.itemId });
  if (!wl) return sendError(res, 404, 'Item not in wishlist');
  sendSuccess(res, 'Removed from wishlist');
};

export const checkWishlist = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const exists = await Wishlist.findOne({ user: user.userId, item: params.itemId });
  sendSuccess(res, 'Check result', { inWishlist: !!exists });
};

export const clearWishlist = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  await Wishlist.deleteMany({ user: user.userId });
  sendSuccess(res, 'Wishlist cleared');
};
