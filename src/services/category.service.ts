import { Category, CategoryDocument } from "../models/Category";
import { NotFoundError, ConflictError } from "../utils/ApiError";

export class CategoryService {
  static async getAllCategories() {
    return Category.find().sort({ name: 1 }).lean();
  }

  static async getCategoryBySlug(slug: string): Promise<CategoryDocument> {
    const category = await Category.findOne({ slug });
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return category;
  }

  static async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    parent?: string;
  }): Promise<CategoryDocument> {
    const existing = await Category.findOne({ name: data.name });
    if (existing) {
      throw new ConflictError("Category already exists");
    }

    if (data.parent) {
      const parentExists = await Category.findById(data.parent);
      if (!parentExists) {
        throw new NotFoundError("Parent category not found");
      }
    }

    return Category.create(data);
  }

  static async updateCategory(
    id: string,
    data: { name?: string; description?: string; icon?: string }
  ): Promise<CategoryDocument> {
    const category = await Category.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    Object.assign(category, data);
    await category.save();
    return category;
  }

  static async deleteCategory(id: string): Promise<void> {
    const category = await Category.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    await Category.findByIdAndDelete(id);
  }
}
