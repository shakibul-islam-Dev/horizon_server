const mongoose = require('mongoose');
const { Schema } = mongoose;

const blogPostSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  content: { type: String, required: true, maxlength: 50000 },
  excerpt: { type: String, trim: true, maxlength: 500, default: '' },
  author: { type: String, ref: 'User', required: true },
  category: { type: String, trim: true, default: 'general' },
  tags: [{ type: String, trim: true, lowercase: true }],
  images: [{ type: String }],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  meta: { views: { type: Number, default: 0 }, likes: { type: Number, default: 0 }, likedBy: [{ type: String }] },
}, { timestamps: true });

blogPostSchema.pre('save', function (this: any) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
});

blogPostSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
