import { Request, Response } from 'express';
import BlogPost from '../models/BlogPost';
import Comment from '../models/Comment';
import Item from '../models/Item';
import { sendSuccess, sendError, sendCreated } from '../helpers/response';

// ===== BLOG POSTS =====
export const getBlogPosts = async (req: Request, res: Response) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const search = url.searchParams.get('search');
  const category = url.searchParams.get('category');
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';
  const status = url.searchParams.get('status') || 'published';
  const filter: any = { status };
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;

  const sortOptions: any = {};
  sortOptions[sortBy] = order === 'asc' ? 1 : -1;

  const posts = await BlogPost.find(filter).populate('author', 'name image').sort(sortOptions).lean();
  sendSuccess(res, 'Blog posts fetched', posts);
};

export const getMyPosts = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const status = url.searchParams.get('status');
  const filter: any = { author: user.userId };
  if (status) filter.status = status;
  const posts = await BlogPost.find(filter).populate('author', 'name image').sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'My posts fetched', posts);
};

export const createBlogPost = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.title || !body.content) return sendError(res, 400, 'Title and content are required');
  const post = await BlogPost.create({ ...body, author: user.userId });
  await post.populate('author', 'name image');
  sendCreated(res, 'Blog post created', post);
};

export const getBlogPostById = async (req: Request, res: Response, params: any) => {
  const post = await BlogPost.findById(params.id).populate('author', 'name image');
  if (!post) return sendError(res, 404, 'Blog post not found');
  post.meta.views += 1;
  await post.save();
  sendSuccess(res, 'Blog post fetched', post);
};

export const updateBlogPost = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const post = await BlogPost.findById(params.id);
  if (!post) return sendError(res, 404, 'Blog post not found');
  if (post.author.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  const allowed = ['title', 'content', 'excerpt', 'category', 'tags', 'images', 'status'];
  for (const key of allowed) {
    if (body[key] !== undefined) post[key] = body[key];
  }
  await post.save();
  await post.populate('author', 'name image');
  sendSuccess(res, 'Blog post updated', post);
};

export const deleteBlogPost = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const post = await BlogPost.findById(params.id);
  if (!post) return sendError(res, 404, 'Blog post not found');
  if (post.author.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await BlogPost.findByIdAndDelete(params.id);
  sendSuccess(res, 'Blog post deleted');
};

export const getBlogPostBySlug = async (req: Request, res: Response, params: any) => {
  const post = await BlogPost.findOne({ slug: params.slug }).populate('author', 'name image');
  if (!post) return sendError(res, 404, 'Blog post not found');
  post.meta.views += 1;
  await post.save();
  sendSuccess(res, 'Blog post fetched', post);
};

export const likeBlogPost = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const post = await BlogPost.findById(params.id);
  if (!post) return sendError(res, 404, 'Blog post not found');
  if (!post.meta.likedBy) post.meta.likedBy = [];
  const idx = post.meta.likedBy.indexOf(user.userId);
  if (idx > -1) {
    post.meta.likedBy.splice(idx, 1);
    post.meta.likes = Math.max(0, post.meta.likes - 1);
    await post.save();
    sendSuccess(res, 'Blog post unliked', post);
  } else {
    post.meta.likedBy.push(user.userId);
    post.meta.likes += 1;
    await post.save();
    sendSuccess(res, 'Blog post liked', post);
  }
};

// ===== COMMENTS =====
async function getCommentsWithReplies(filter: any) {
  const comments = await Comment.find(filter).populate('user', 'name image').sort({ createdAt: -1 }).lean();
  const ids = comments.map((c: any) => c._id);
  const replies = await Comment.find({ parentComment: { $in: ids } }).populate('user', 'name image').sort({ createdAt: 1 }).lean();
  const withReplies = comments.map((c: any) => ({ ...c, replies: replies.filter((r: any) => r.parentComment?.toString() === c._id.toString()) }));
  return withReplies;
}

export const getCommentsByItem = async (req: Request, res: Response, params: any) => {
  const comments = await getCommentsWithReplies({ item: params.itemId, parentComment: null });
  sendSuccess(res, 'Comments fetched', comments);
};

export const getCommentsByBlog = async (req: Request, res: Response, params: any) => {
  const comments = await getCommentsWithReplies({ blogPost: params.blogPostId, parentComment: null });
  sendSuccess(res, 'Comments fetched', comments);
};

export const createComment = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.content) return sendError(res, 400, 'Content is required');
  if (body.item) { const item = await Item.findById(body.item); if (!item) return sendError(res, 404, 'Item not found'); }
  if (body.blogPost) { const post = await BlogPost.findById(body.blogPost); if (!post) return sendError(res, 404, 'Blog post not found'); }
  if (body.parentComment) { const parent = await Comment.findById(body.parentComment); if (!parent) return sendError(res, 404, 'Parent comment not found'); }
  const comment = await Comment.create({ ...body, user: user.userId });
  await comment.populate('user', 'name image');
  sendCreated(res, 'Comment created', comment);
};

export const updateComment = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const comment = await Comment.findById(params.id);
  if (!comment) return sendError(res, 404, 'Comment not found');
  if (comment.user.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  if (!body || !body.content) return sendError(res, 400, 'Content is required');
  comment.content = body.content;
  await comment.save();
  await comment.populate('user', 'name image');
  sendSuccess(res, 'Comment updated', comment);
};

export const deleteComment = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const comment = await Comment.findById(params.id);
  if (!comment) return sendError(res, 404, 'Comment not found');
  if (comment.user.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await Comment.deleteMany({ parentComment: params.id });
  await Comment.findByIdAndDelete(params.id);
  sendSuccess(res, 'Comment deleted');
};

export const toggleCommentLike = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const comment = await Comment.findById(params.id);
  if (!comment) return sendError(res, 404, 'Comment not found');
  const idx = comment.likes.findIndex((id: any) => id.toString() === user.userId);
  if (idx > -1) comment.likes.splice(idx, 1);
  else comment.likes.push(user.userId);
  await comment.save();
  await comment.populate('user', 'name image');
  sendSuccess(res, 'Like toggled', comment);
};
