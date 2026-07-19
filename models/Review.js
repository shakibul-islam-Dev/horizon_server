const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  user: { type: String, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true });

reviewSchema.index({ item: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRating = async function (itemId) {
  const result = await this.aggregate([
    { $match: { item: itemId } },
    { $group: { _id: '$item', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);
  const Item = mongoose.model('Item');
  if (result.length > 0) {
    await Item.findByIdAndUpdate(itemId, {
      rating: Math.round(result[0].averageRating * 10) / 10,
      reviewCount: result[0].reviewCount,
    });
  } else {
    await Item.findByIdAndUpdate(itemId, { rating: 0, reviewCount: 0 });
  }
};

reviewSchema.post('save', function () { this.constructor.calcAverageRating(this.item); });
reviewSchema.post('findOneAndDelete', function (doc) { if (doc) doc.constructor.calcAverageRating(doc.item); });

module.exports = mongoose.model('Review', reviewSchema);
