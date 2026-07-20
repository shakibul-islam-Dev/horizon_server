const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  item: { type: Schema.Types.ObjectId, ref: 'Item' },
  blogPost: { type: Schema.Types.ObjectId, ref: 'BlogPost' },
  parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  likes: [{ type: String, ref: 'User' }],
}, { timestamps: true });

commentSchema.index({ item: 1, createdAt: -1 });
commentSchema.index({ blogPost: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

module.exports = mongoose.model('Comment', commentSchema);
