const mongoose = require('mongoose');
const { Schema } = mongoose;

const recommendationSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  interactionType: { type: String, enum: ['view', 'favorite', 'purchase', 'rating'], required: true },
  rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

recommendationSchema.index({ user: 1, item: 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
