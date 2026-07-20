const Category = require('../models/Category');
const Item = require('../models/Item');
const { sendSuccess, sendError, sendCreated } = require('../helpers/response');

exports.getAll = async (req: any, res: any) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();

  const counts = await Item.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap: any = {};
  for (const c of counts) countMap[c._id] = c.count;

  const data = categories.map((c: any) => ({ ...c, itemCount: countMap[c.name] || 0 }));
  sendSuccess(res, 'Categories fetched', data);
};

exports.getById = async (req: any, res: any, params: any) => {
  const category = await Category.findById(params.id);
  if (!category) return sendError(res, 404, 'Category not found');
  sendSuccess(res, 'Category fetched', { ...category.toObject(), itemCount: 0 });
};

exports.create = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user || user.role !== 'admin') return sendError(res, 403, 'Not authorized');
  if (!body || !body.name) return sendError(res, 400, 'Name is required');
  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = await Category.findOne({ $or: [{ name: body.name }, { slug }] });
  if (existing) return sendError(res, 409, 'Category already exists');
  const category = await Category.create({
    name: body.name,
    slug,
    description: body.description || '',
    icon: body.icon || 'laptop',
    image: body.image || '',
    order: body.order || 0,
  });
  sendCreated(res, 'Category created', category);
};

exports.update = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user || user.role !== 'admin') return sendError(res, 403, 'Not authorized');
  const category = await Category.findById(params.id);
  if (!category) return sendError(res, 404, 'Category not found');
  if (body.name) category.name = body.name;
  if (body.slug) category.slug = body.slug;
  if (body.description !== undefined) category.description = body.description;
  if (body.icon !== undefined) category.icon = body.icon;
  if (body.image !== undefined) category.image = body.image;
  if (body.order !== undefined) category.order = body.order;
  if (body.isActive !== undefined) category.isActive = body.isActive;
  await category.save();
  sendSuccess(res, 'Category updated', category);
};

exports.remove = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user || user.role !== 'admin') return sendError(res, 403, 'Not authorized');
  const category = await Category.findById(params.id);
  if (!category) return sendError(res, 404, 'Category not found');
  await Category.findByIdAndDelete(params.id);
  sendSuccess(res, 'Category deleted');
};
