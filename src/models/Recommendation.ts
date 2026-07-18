import mongoose, { Schema, Document } from "mongoose";
import { IRecommendation } from "../types";

export interface RecommendationDocument extends IRecommendation, Document {}

const recommendationSchema = new Schema<RecommendationDocument>(
  {
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item reference is required"],
    },
    interactionType: {
      type: String,
      enum: ["view", "favorite", "purchase", "rating"],
      required: [true, "Interaction type is required"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

recommendationSchema.index({ user: 1, item: 1 });
recommendationSchema.index({ user: 1, interactionType: 1 });
recommendationSchema.index({ item: 1, interactionType: 1 });

export const Recommendation = mongoose.model<RecommendationDocument>(
  "Recommendation",
  recommendationSchema
);
