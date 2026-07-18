import mongoose, { Schema, Document } from "mongoose";
import { IReview } from "../types";

export interface ReviewDocument extends IReview, Document {}

const reviewSchema = new Schema<ReviewDocument>(
  {
    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item reference is required"],
    },
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

reviewSchema.index({ item: 1, user: 1 }, { unique: true });
reviewSchema.index({ item: 1, createdAt: -1 });

reviewSchema.statics.calcAverageRating = async function (itemId: mongoose.Types.ObjectId) {
  const result = await this.aggregate([
    { $match: { item: itemId } },
    {
      $group: {
        _id: "$item",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const Item = mongoose.model("Item");
  if (result.length > 0) {
    await Item.findByIdAndUpdate(itemId, {
      rating: Math.round(result[0].averageRating * 10) / 10,
      reviewCount: result[0].reviewCount,
    });
  } else {
    await Item.findByIdAndUpdate(itemId, { rating: 0, reviewCount: 0 });
  }
};

reviewSchema.post("save", function () {
  (this.constructor as any).calcAverageRating(this.item);
});

reviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) {
    (doc.constructor as any).calcAverageRating(doc.item);
  }
});

export const Review = mongoose.model<ReviewDocument>("Review", reviewSchema);
