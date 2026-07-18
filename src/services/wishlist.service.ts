import { Wishlist, WishlistDocument } from "../models/Wishlist";
import { Item } from "../models/Item";
import { NotFoundError, ConflictError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";

export class WishlistService {
  static async getMyWishlist(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Wishlist.find({ user: userId }).populate({ path: "item", populate: [{ path: "category", select: "name slug" }, { path: "author", select: "name image" }] }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Wishlist.countDocuments({ user: userId }),
    ]);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  static async addToWishlist(itemId: string, userId: string): Promise<WishlistDocument> {
    const item = await Item.findById(itemId);
    if (!item) throw new NotFoundError("Item not found");
    const existing = await Wishlist.findOne({ user: userId, item: itemId });
    if (existing) throw new ConflictError("Item already in wishlist");
    return Wishlist.create({ user: userId, item: itemId });
  }

  static async removeFromWishlist(itemId: string, userId: string): Promise<void> {
    const wishlist = await Wishlist.findOneAndDelete({ user: userId, item: itemId });
    if (!wishlist) throw new NotFoundError("Item not found in wishlist");
  }

  static async isInWishlist(itemId: string, userId: string): Promise<boolean> {
    const exists = await Wishlist.findOne({ user: userId, item: itemId });
    return !!exists;
  }

  static async clearWishlist(userId: string): Promise<void> {
    await Wishlist.deleteMany({ user: userId });
  }
}
