import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Comment cannot exceed 2000 characters"),
  item: z.string().optional(),
  blogPost: z.string().optional(),
  parentComment: z.string().optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Comment cannot exceed 2000 characters"),
});
