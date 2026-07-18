import { z } from "zod";

export const addToCartSchema = z.object({
  item: z.string().min(1, "Item is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});
