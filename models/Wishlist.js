const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
}, { timestamps: true });

wishlistSchema.index({ user: 1, item: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
