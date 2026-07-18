import { z } from "zod";

export const addToWishlistSchema = z.object({
  item: z.string().min(1, "Item is required"),
});
