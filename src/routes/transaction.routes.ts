import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createTransactionSchema, updateTransactionStatusSchema } from "../validators/transaction.validator";
import { TransactionService } from "../services/transaction.service";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/purchases", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await TransactionService.getTransactionsByBuyer(req.user!.userId, page, limit);
  sendSuccess(res, "Purchases fetched", result.transactions, { pagination: result.pagination });
}));

router.get("/sales", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await TransactionService.getTransactionsBySeller(req.user!.userId, page, limit);
  sendSuccess(res, "Sales fetched", result.transactions, { pagination: result.pagination });
}));

router.get("/:id", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const transaction = await TransactionService.getTransactionById(req.params.id as string, req.user!.userId);
  sendSuccess(res, "Transaction fetched", transaction);
}));

router.post("/", authenticate, validate(createTransactionSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const transaction = await TransactionService.createTransaction(req.body, req.user!.userId);
  sendCreated(res, "Transaction created", transaction);
}));

router.patch("/:id/status", authenticate, validate(updateTransactionStatusSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const transaction = await TransactionService.updateTransactionStatus(req.params.id as string, req.body.status, req.user!.userId);
  sendSuccess(res, "Transaction status updated", transaction);
}));

export default router;
