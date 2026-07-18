import { BlogPost, BlogPostDocument } from "../models/BlogPost";
import { BlogPostQuery } from "../types";
import { NotFoundError, ForbiddenError } from "../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";

export class BlogPostService {
  static async getBlogPosts(query: BlogPostQuery) {
    const { page: pageStr, limit: limitStr, search, category, status = "published", sortBy = "createdAt", order = "desc" } = query;
    const { page, limit, skip } = parsePagination({ page: pageStr, limit: limitStr });

    const filter: Record<string, any> = { status };
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;

    const sortOptions: Record<string, 1 | -1> = {};
    if (search) sortOptions.score = { $meta: "textScore" } as any;
    sortOptions[sortBy] = order === "asc" ? 1 : -1;

    const [posts, total] = await Promise.all([
      BlogPost.find(filter).populate("author", "name image").sort(sortOptions).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(filter),
    ]);

    return { posts, pagination: buildPaginationMeta(page, limit, total) };
  }

  static async getBlogPostById(postId: string): Promise<BlogPostDocument> {
    const post = await BlogPost.findById(postId).populate("author", "name image");
    if (!post) throw new NotFoundError("Blog post not found");
    post.meta.views += 1;
    await post.save();
    return post;
  }

  static async getBlogPostBySlug(slug: string): Promise<BlogPostDocument> {
    const post = await BlogPost.findOne({ slug }).populate("author", "name image");
    if (!post) throw new NotFoundError("Blog post not found");
    post.meta.views += 1;
    await post.save();
    return post;
  }

  static async createBlogPost(data: { title: string; content: string; excerpt?: string; category?: string; tags?: string[]; images?: string[]; status?: string }, authorId: string): Promise<BlogPostDocument> {
    const post = await BlogPost.create({ ...data, author: authorId } as any);
    return post.populate("author", "name image");
  }

  static async updateBlogPost(postId: string, updateData: Record<string, any>, userId: string): Promise<BlogPostDocument> {
    const post = await BlogPost.findById(postId);
    if (!post) throw new NotFoundError("Blog post not found");
    if (post.author.toString() !== userId) throw new ForbiddenError("You can only update your own posts");
    Object.assign(post, updateData);
    await post.save();
    return post.populate("author", "name image");
  }

  static async deleteBlogPost(postId: string, userId: string): Promise<void> {
    const post = await BlogPost.findById(postId);
    if (!post) throw new NotFoundError("Blog post not found");
    if (post.author.toString() !== userId) throw new ForbiddenError("You can only delete your own posts");
    await BlogPost.findByIdAndDelete(postId);
  }

  static async likeBlogPost(postId: string): Promise<BlogPostDocument> {
    const post = await BlogPost.findById(postId);
    if (!post) throw new NotFoundError("Blog post not found");
    post.meta.likes += 1;
    await post.save();
    return post;
  }

  static async getMyPosts(userId: string, query: BlogPostQuery) {
    const { page: pageStr, limit: limitStr, status } = query;
    const { page, limit, skip } = parsePagination({ page: pageStr, limit: limitStr });

    const filter: Record<string, any> = { author: userId };
    if (status) filter.status = status;

    const [posts, total] = await Promise.all([
      BlogPost.find(filter).populate("author", "name image").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(filter),
    ]);

    return { posts, pagination: buildPaginationMeta(page, limit, total) };
  }
}
