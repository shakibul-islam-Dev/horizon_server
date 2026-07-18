import { z } from "zod";

export const createBlogPostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(50000, "Content cannot exceed 50000 characters"),
  excerpt: z.string().max(500, "Excerpt cannot exceed 500 characters").optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url("Image must be a valid URL")).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const updateBlogPostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(50000, "Content cannot exceed 50000 characters")
    .optional(),
  excerpt: z.string().max(500, "Excerpt cannot exceed 500 characters").optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url("Image must be a valid URL")).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});
