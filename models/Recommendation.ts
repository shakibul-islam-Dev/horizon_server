import mongoose, { Schema } from 'mongoose';

const recommendationSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  interactionType: { type: String, enum: ['view', 'favorite', 'purchase', 'rating'], required: true },
  rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

recommendationSchema.index({ user: 1, item: 1 });

export default mongoose.models.Recommendation || mongoose.model('Recommendation', recommendationSchema);

