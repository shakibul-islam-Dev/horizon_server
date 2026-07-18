import { Review, ReviewDocument } from "../models/Review";
import { Item } from "../models/Item";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";

export class ReviewService {
  static async getReviewsByItem(itemId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ item: itemId }).populate("user", "name image").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments({ item: itemId }),
    ]);
    return { reviews, pagination: buildPaginationMeta(page, limit, total) };
  }

  static async createReview(itemId: string, userId: string, rating: number, comment?: string): Promise<ReviewDocument> {
    const item = await Item.findById(itemId);
    if (!item) throw new NotFoundError("Item not found");
    if (item.author.toString() === userId) throw new ForbiddenError("You cannot review your own item");

    const existingReview = await Review.findOne({ item: itemId, user: userId });
    if (existingReview) throw new ConflictError("You have already reviewed this item");

    const review = await Review.create({ item: itemId, user: userId, rating, comment });
    return review.populate("user", "name image");
  }

  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await Review.findById(reviewId);
    if (!review) throw new NotFoundError("Review not found");
    if (review.user.toString() !== userId) throw new ForbiddenError("You can only delete your own reviews");
    await Review.findByIdAndDelete(reviewId);
  }
}
