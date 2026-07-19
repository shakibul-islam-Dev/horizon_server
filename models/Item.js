const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemSchema = new Schema({
  title: { type: String, required: true, trim: true },
  shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
  fullDescription: { type: String, required: true, trim: true, maxlength: 5000 },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  images: [{ type: String }],
  tags: [{ type: String, trim: true, lowercase: true }],
  location: { type: String, trim: true, default: '' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  author: { type: String, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'sold', 'archived'], default: 'active' },
  meta: { views: { type: Number, default: 0 }, favorites: { type: Number, default: 0 } },
}, { timestamps: true });

itemSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });
itemSchema.index({ category: 1 });
itemSchema.index({ author: 1 });
itemSchema.index({ price: 1 });
itemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema);
