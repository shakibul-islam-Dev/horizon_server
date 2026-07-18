import mongoose, { Schema, Document } from "mongoose";
import { IWishlist } from "../types";

export interface WishlistDocument extends IWishlist, Document {}

const wishlistSchema = new Schema<WishlistDocument>(
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

wishlistSchema.index({ user: 1, item: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });

export const Wishlist = mongoose.model<WishlistDocument>("Wishlist", wishlistSchema);
