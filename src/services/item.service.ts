import { Item, ItemDocument } from "../models/Item";
import { Category } from "../models/Category";
import { Recommendation } from "../models/Recommendation";
import { ItemQuery } from "../types";
import { NotFoundError, ForbiddenError } from "../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";

export class ItemService {
  static async getItems(query: ItemQuery) {
    const { page: pageStr, limit: limitStr, search, category, minPrice, maxPrice, sortBy = "createdAt", order = "desc", status = "active" } = query;
    const { page, limit, skip } = parsePagination({ page: pageStr, limit: limitStr });

    const filter: Record<string, any> = { status };
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (search) sortOptions.score = { $meta: "textScore" } as any;
    sortOptions[sortBy] = order === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      Item.find(filter).populate("category", "name slug").populate("author", "name image").sort(sortOptions).skip(skip).limit(limit).lean(),
      Item.countDocuments(filter),
    ]);

    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  static async getItemById(itemId: string, userId?: string): Promise<ItemDocument> {
    const item = await Item.findById(itemId).populate("category", "name slug icon").populate("author", "name image");
    if (!item) throw new NotFoundError("Item not found");

    item.meta.views += 1;
    await item.save();

    if (userId) {
      await Recommendation.findOneAndUpdate(
        { user: userId, item: itemId, interactionType: "view" },
        { user: userId, item: itemId, interactionType: "view" },
        { upsert: true }
      );
    }

    return item;
  }

  static async createItem(data: { title: string; shortDescription: string; fullDescription: string; price: number; category: string; images?: string[]; tags?: string[]; location?: string }, authorId: string): Promise<ItemDocument> {
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) throw new NotFoundError("Category not found");

    const item = await Item.create({ ...data, author: authorId });
    return item.populate([{ path: "category", select: "name slug" }, { path: "author", select: "name image" }]);
  }

  static async updateItem(itemId: string, updateData: Record<string, any>, userId: string): Promise<ItemDocument> {
    const item = await Item.findById(itemId);
    if (!item) throw new NotFoundError("Item not found");
    if (item.author.toString() !== userId) throw new ForbiddenError("You can only update your own items");

    Object.assign(item, updateData);
    await item.save();
    return item.populate([{ path: "category", select: "name slug" }, { path: "author", select: "name image" }]);
  }

  static async deleteItem(itemId: string, userId: string): Promise<void> {
    const item = await Item.findById(itemId);
    if (!item) throw new NotFoundError("Item not found");
    if (item.author.toString() !== userId) throw new ForbiddenError("You can only delete your own items");
    await Item.findByIdAndDelete(itemId);
  }

  static async getMyItems(userId: string, query: ItemQuery) {
    const { page: pageStr, limit: limitStr, status } = query;
    const { page, limit, skip } = parsePagination({ page: pageStr, limit: limitStr });

    const filter: Record<string, any> = { author: userId };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Item.find(filter).populate("category", "name slug").populate("author", "name image").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Item.countDocuments(filter),
    ]);

    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }
}
