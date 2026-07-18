import mongoose, { Schema, Document } from "mongoose";
import { IBlogPost } from "../types";

export interface BlogPostDocument extends IBlogPost, Document {}

const blogPostSchema = new Schema<BlogPostDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: [50000, "Content cannot exceed 50000 characters"],
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
      default: "",
    },
    author: {
      type: String,
      ref: "User",
      required: [true, "Author is required"],
    },
    category: {
      type: String,
      trim: true,
      default: "general",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    images: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    meta: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
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

blogPostSchema.pre("save", function () {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

blogPostSchema.index({ title: "text", content: "text", tags: "text" });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ status: 1 });
blogPostSchema.index({ createdAt: -1 });

export const BlogPost = mongoose.model<BlogPostDocument>("BlogPost", blogPostSchema);
