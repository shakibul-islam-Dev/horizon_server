import { Comment, CommentDocument } from "../models/Comment";
import { Item } from "../models/Item";
import { BlogPost } from "../models/BlogPost";
import { NotFoundError, ForbiddenError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";

async function getCommentsWithReplies(filter: Record<string, any>, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [comments, total] = await Promise.all([
    Comment.find(filter).populate("user", "name image").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Comment.countDocuments(filter),
  ]);

  const commentIds = comments.map((c: any) => c._id);
  const replies = await Comment.find({ parentComment: { $in: commentIds } }).populate("user", "name image").sort({ createdAt: 1 }).lean();

  const commentsWithReplies = comments.map((comment: any) => ({
    ...comment,
    replies: replies.filter((r: any) => r.parentComment?.toString() === comment._id.toString()),
  }));

  return { comments: commentsWithReplies, pagination: buildPaginationMeta(page, limit, total) };
}

export class CommentService {
  static async getCommentsByItem(itemId: string, page = 1, limit = 20) {
    return getCommentsWithReplies({ item: itemId, parentComment: null }, page, limit);
  }

  static async getCommentsByBlogPost(blogPostId: string, page = 1, limit = 20) {
    return getCommentsWithReplies({ blogPost: blogPostId, parentComment: null }, page, limit);
  }

  static async createComment(data: { content: string; item?: string; blogPost?: string; parentComment?: string }, userId: string): Promise<CommentDocument> {
    if (data.item) {
      const item = await Item.findById(data.item);
      if (!item) throw new NotFoundError("Item not found");
    }
    if (data.blogPost) {
      const post = await BlogPost.findById(data.blogPost);
      if (!post) throw new NotFoundError("Blog post not found");
    }
    if (data.parentComment) {
      const parent = await Comment.findById(data.parentComment);
      if (!parent) throw new NotFoundError("Parent comment not found");
    }

    const comment = await Comment.create({ ...data, user: userId });
    return comment.populate("user", "name image");
  }

  static async updateComment(commentId: string, content: string, userId: string): Promise<CommentDocument> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");
    if (comment.user.toString() !== userId) throw new ForbiddenError("You can only update your own comments");
    comment.content = content;
    await comment.save();
    return comment.populate("user", "name image");
  }

  static async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");
    if (comment.user.toString() !== userId) throw new ForbiddenError("You can only delete your own comments");
    await Comment.deleteMany({ parentComment: commentId });
    await Comment.findByIdAndDelete(commentId);
  }

  static async toggleLike(commentId: string, userId: string): Promise<CommentDocument> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");
    const likeIndex = comment.likes.findIndex((id) => id.toString() === userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId as any);
    }
    await comment.save();
    return comment.populate("user", "name image");
  }
}
