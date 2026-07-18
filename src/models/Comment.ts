import mongoose, { Schema, Document } from "mongoose";
import { IComment } from "../types";

export interface CommentDocument extends IComment, Document {}

const commentSchema = new Schema<CommentDocument>(
  {
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
    blogPost: {
      type: Schema.Types.ObjectId,
      ref: "BlogPost",
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    likes: [
      {
        type: String,
        ref: "User",
      },
    ],
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

commentSchema.index({ item: 1, createdAt: -1 });
commentSchema.index({ blogPost: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ parentComment: 1 });

export const Comment = mongoose.model<CommentDocument>("Comment", commentSchema);
