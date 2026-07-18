import { z } from "zod";

export const createTransactionSchema = z.object({
  item: z.string().min(1, "Item is required"),
  payment: z.string().min(1, "Payment is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
});

export const updateTransactionStatusSchema = z.object({
  status: z.enum(["pending", "completed", "cancelled", "refunded"]),
});
