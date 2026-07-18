import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createPaymentSchema, updatePaymentStatusSchema } from "../validators/payment.validator";
import { PaymentService } from "../services/payment.service";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/my", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await PaymentService.getPaymentsByUser(req.user!.userId, page, limit);
  sendSuccess(res, "Payments fetched", result.payments, { pagination: result.pagination });
}));

router.get("/:id", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payment = await PaymentService.getPaymentById(req.params.id as string, req.user!.userId);
  sendSuccess(res, "Payment fetched", payment);
}));

router.get("/item/:itemId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await PaymentService.getPaymentsByItem(req.params.itemId as string, page, limit);
  sendSuccess(res, "Payments fetched", result.payments, { pagination: result.pagination });
}));

router.post("/", authenticate, validate(createPaymentSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payment = await PaymentService.createPayment(req.body, req.user!.userId);
  sendCreated(res, "Payment created", payment);
}));

router.patch("/:id/status", authenticate, validate(updatePaymentStatusSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payment = await PaymentService.updatePaymentStatus(req.params.id as string, req.body.status, req.user!.userId);
  sendSuccess(res, "Payment status updated", payment);
}));

export default router;
