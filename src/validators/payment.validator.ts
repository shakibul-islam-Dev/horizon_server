import { z } from "zod";

export const createPaymentSchema = z.object({
  item: z.string().min(1, "Item is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().max(3).optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  stripePaymentId: z.string().optional(),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(["pending", "completed", "failed", "refunded"]),
});
