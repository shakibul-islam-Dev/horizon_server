const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const Item = require('../models/Item');
const { sendSuccess, sendError, sendCreated } = require('../helpers/response');
const { paginate, buildMeta } = require('../helpers/request');

// ===== BLOG POSTS =====
exports.getBlogPosts = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const search = url.searchParams.get('search');
  const category = url.searchParams.get('category');
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';
  const status = url.searchParams.get('status') || 'published';
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));

  const filter = { status };
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;

  const sortOptions = {};
  sortOptions[sortBy] = order === 'asc' ? 1 : -1;

  const [posts, total] = await Promise.all([
    BlogPost.find(filter).populate('author', 'name image').sort(sortOptions).skip(skip).limit(limit).lean(),
    BlogPost.countDocuments(filter),
  ]);
  sendSuccess(res, 'Blog posts fetched', posts, buildMeta(page, limit, total));
};

exports.getMyPosts = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const status = url.searchParams.get('status');
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const filter = { author: user.userId };
  if (status) filter.status = status;
  const [posts, total] = await Promise.all([
    BlogPost.find(filter).populate('author', 'name image').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    BlogPost.countDocuments(filter),
  ]);
  sendSuccess(res, 'My posts fetched', posts, buildMeta(page, limit, total));
};

exports.createBlogPost = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.title || !body.content) return sendError(res, 400, 'Title and content are required');
  const post = await BlogPost.create({ ...body, author: user.userId });
  await post.populate('author', 'name image');
  sendCreated(res, 'Blog post created', post);
};

exports.getBlogPostById = async (req, res, params) => {
  const post = await BlogPost.findById(params.id).populate('author', 'name image');
  if (!post) return sendError(res, 404, 'Blog post not found');
  post.meta.views += 1;
  await post.save();
  sendSuccess(res, 'Blog post fetched', post);
};

exports.updateBlogPost = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const post = await BlogPost.findById(params.id);
  if (!post) return sendError(res, 404, 'Blog post not found');
  if (post.author.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  Object.assign(post, body);
  await post.save();
  await post.populate('author', 'name image');
  sendSuccess(res, 'Blog post updated', post);
};

exports.deleteBlogPost = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const post = await BlogPost.findById(params.id);
  if (!post) return sendError(res, 404, 'Blog post not found');
  if (post.author.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await BlogPost.findByIdAndDelete(params.id);
  sendSuccess(res, 'Blog post deleted');
};

exports.getBlogPostBySlug = async (req, res, params) => {
  const post = await BlogPost.findOne({ slug: params.slug }).populate('author', 'name image');
  if (!post) return sendError(res, 404, 'Blog post not found');
  post.meta.views += 1;
  await post.save();
  sendSuccess(res, 'Blog post fetched', post);
};

exports.likeBlogPost = async (req, res, params) => {
  const post = await BlogPost.findById(params.id);
  if (!post) return sendError(res, 404, 'Blog post not found');
  post.meta.likes += 1;
  await post.save();
  sendSuccess(res, 'Blog post liked', post);
};

// ===== COMMENTS =====
async function getCommentsWithReplies(filter, req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const [comments, total] = await Promise.all([
    Comment.find(filter).populate('user', 'name image').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Comment.countDocuments(filter),
  ]);
  const ids = comments.map(c => c._id);
  const replies = await Comment.find({ parentComment: { $in: ids } }).populate('user', 'name image').sort({ createdAt: 1 }).lean();
  const withReplies = comments.map(c => ({ ...c, replies: replies.filter(r => r.parentComment?.toString() === c._id.toString()) }));
  return { comments: withReplies, pagination: buildMeta(page, limit, total) };
}

exports.getCommentsByItem = async (req, res, params) => {
  const result = await getCommentsWithReplies({ item: params.itemId, parentComment: null }, req);
  sendSuccess(res, 'Comments fetched', result.comments, result.pagination);
};

exports.getCommentsByBlog = async (req, res, params) => {
  const result = await getCommentsWithReplies({ blogPost: params.blogPostId, parentComment: null }, req);
  sendSuccess(res, 'Comments fetched', result.comments, result.pagination);
};

exports.createComment = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.content) return sendError(res, 400, 'Content is required');
  if (body.item) { const item = await Item.findById(body.item); if (!item) return sendError(res, 404, 'Item not found'); }
  if (body.blogPost) { const post = await BlogPost.findById(body.blogPost); if (!post) return sendError(res, 404, 'Blog post not found'); }
  if (body.parentComment) { const parent = await Comment.findById(body.parentComment); if (!parent) return sendError(res, 404, 'Parent comment not found'); }
  const comment = await Comment.create({ ...body, user: user.userId });
  await comment.populate('user', 'name image');
  sendCreated(res, 'Comment created', comment);
};

exports.updateComment = async (req, res, params, body, user) => {
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

exports.deleteComment = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const comment = await Comment.findById(params.id);
  if (!comment) return sendError(res, 404, 'Comment not found');
  if (comment.user.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await Comment.deleteMany({ parentComment: params.id });
  await Comment.findByIdAndDelete(params.id);
  sendSuccess(res, 'Comment deleted');
};

exports.toggleCommentLike = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const comment = await Comment.findById(params.id);
  if (!comment) return sendError(res, 404, 'Comment not found');
  const idx = comment.likes.findIndex(id => id.toString() === user.userId);
  if (idx > -1) comment.likes.splice(idx, 1);
  else comment.likes.push(user.userId);
  await comment.save();
  await comment.populate('user', 'name image');
  sendSuccess(res, 'Like toggled', comment);
};
