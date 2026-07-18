import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .optional(),
  image: z.string().url("Image must be a valid URL").optional(),
  preferences: z
    .object({
      categories: z.array(z.string()).optional(),
      priceRange: z
        .object({
          min: z.number().min(0).optional(),
          max: z.number().min(0).optional(),
        })
        .optional(),
    })
    .optional(),
});
