import { z } from "zod";

export const createItemSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(300, "Short description cannot exceed 300 characters"),
  fullDescription: z
    .string()
    .min(20, "Full description must be at least 20 characters")
    .max(5000, "Full description cannot exceed 5000 characters"),
  price: z.number().min(0, "Price cannot be negative"),
  category: z.string().min(1, "Category is required"),
  images: z.array(z.string().url("Image must be a valid URL")).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().max(200).optional(),
});

export const updateItemSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(300, "Short description cannot exceed 300 characters")
    .optional(),
  fullDescription: z
    .string()
    .min(20, "Full description must be at least 20 characters")
    .max(5000, "Full description cannot exceed 5000 characters")
    .optional(),
  price: z.number().min(0, "Price cannot be negative").optional(),
  category: z.string().min(1, "Category is required").optional(),
  images: z.array(z.string().url("Image must be a valid URL")).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().max(200).optional(),
  status: z.enum(["active", "sold", "archived"]).optional(),
});

export const itemQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sortBy: z
    .enum(["price", "rating", "createdAt", "title", "views"])
    .optional(),
  order: z.enum(["asc", "desc"]).optional(),
  status: z.enum(["active", "sold", "archived"]).optional(),
});
