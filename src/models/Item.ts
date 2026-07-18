import mongoose, { Schema, Document } from "mongoose";
import { IItem } from "../types";

export interface ItemDocument extends IItem, Document {}

const itemSchema = new Schema<ItemDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },
    fullDescription: {
      type: String,
      required: [true, "Full description is required"],
      trim: true,
      maxlength: [5000, "Full description cannot exceed 5000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    images: [
      {
        type: String,
        validate: {
          validator: (v: string) => /^https?:\/\/.+/.test(v),
          message: "Image must be a valid URL",
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    location: {
      type: String,
      trim: true,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    author: {
      type: String,
      ref: "User",
      required: [true, "Author is required"],
    },
    status: {
      type: String,
      enum: ["active", "sold", "archived"],
      default: "active",
    },
    meta: {
      views: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
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

itemSchema.index({ title: "text", shortDescription: "text", tags: "text" });
itemSchema.index({ category: 1 });
itemSchema.index({ author: 1 });
itemSchema.index({ price: 1 });
itemSchema.index({ rating: -1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ status: 1 });

export const Item = mongoose.model<ItemDocument>("Item", itemSchema);
