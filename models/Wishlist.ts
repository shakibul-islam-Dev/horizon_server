import mongoose, { Schema } from 'mongoose';

const wishlistSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
}, { timestamps: true });

wishlistSchema.index({ user: 1, item: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);

