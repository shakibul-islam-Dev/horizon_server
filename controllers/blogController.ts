const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const Item = require('../models/Item');
const { sendSuccess, sendError, sendCreated } = require('../helpers/response');

// ===== BLOG POSTS =====
exports.getBlogPosts = async (req: any, res: any) => {
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

exports.getMyPosts = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const status = url.searchParams.get('status');
  const filter: any = { author: user.userId };
  if (status) filter.status = status;
  const posts = await BlogPost.find(filter).populate('author', 'name image').sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'My posts fetched', posts);
};

exports.createBlogPost = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.title || !body.content) return sendError(res, 400, 'Title and content are required');
  const post = await BlogPost.create({ ...body, author: user.userId });
  await post.populate('author', 'name image');
  sendCreated(res, 'Blog post created', post);
};

exports.getBlogPostById = async (req: any, res: any, params: any) => {
  const post = await BlogPost.findById(params.id).populate('author', 'name image');
  if (!post) return sendError(res, 404, 'Blog post not found');
  post.meta.views += 1;
  await post.save();
  sendSuccess(res, 'Blog post fetched', post);
};

exports.updateBlogPost = async (req: any, res: any, params: any, body: any, user: any) => {
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

exports.deleteBlogPost = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const post = await BlogPost.findById(params.id);
  if (!post) return sendError(res, 404, 'Blog post not found');
  if (post.author.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await BlogPost.findByIdAndDelete(params.id);
  sendSuccess(res, 'Blog post deleted');
};

exports.getBlogPostBySlug = async (req: any, res: any, params: any) => {
  const post = await BlogPost.findOne({ slug: params.slug }).populate('author', 'name image');
  if (!post) return sendError(res, 404, 'Blog post not found');
  post.meta.views += 1;
  await post.save();
  sendSuccess(res, 'Blog post fetched', post);
};

exports.likeBlogPost = async (req: any, res: any, params: any, body: any, user: any) => {
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

exports.getCommentsByItem = async (req: any, res: any, params: any) => {
  const comments = await getCommentsWithReplies({ item: params.itemId, parentComment: null });
  sendSuccess(res, 'Comments fetched', comments);
};

exports.getCommentsByBlog = async (req: any, res: any, params: any) => {
  const comments = await getCommentsWithReplies({ blogPost: params.blogPostId, parentComment: null });
  sendSuccess(res, 'Comments fetched', comments);
};

exports.createComment = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.content) return sendError(res, 400, 'Content is required');
  if (body.item) { const item = await Item.findById(body.item); if (!item) return sendError(res, 404, 'Item not found'); }
  if (body.blogPost) { const post = await BlogPost.findById(body.blogPost); if (!post) return sendError(res, 404, 'Blog post not found'); }
  if (body.parentComment) { const parent = await Comment.findById(body.parentComment); if (!parent) return sendError(res, 404, 'Parent comment not found'); }
  const comment = await Comment.create({ ...body, user: user.userId });
  await comment.populate('user', 'name image');
  sendCreated(res, 'Comment created', comment);
};

exports.updateComment = async (req: any, res: any, params: any, body: any, user: any) => {
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

exports.deleteComment = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const comment = await Comment.findById(params.id);
  if (!comment) return sendError(res, 404, 'Comment not found');
  if (comment.user.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await Comment.deleteMany({ parentComment: params.id });
  await Comment.findByIdAndDelete(params.id);
  sendSuccess(res, 'Comment deleted');
};

exports.toggleCommentLike = async (req: any, res: any, params: any, body: any, user: any) => {
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
