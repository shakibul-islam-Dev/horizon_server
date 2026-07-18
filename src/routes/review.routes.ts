import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createReviewSchema } from "../validators/review.validator";
import { ReviewService } from "../services/review.service";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/:itemId", asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await ReviewService.getReviewsByItem(req.params.itemId as string, page, limit);
  sendSuccess(res, "Reviews fetched", result.reviews, { pagination: result.pagination });
}));

router.post("/:itemId", authenticate, validate(createReviewSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { rating, comment } = req.body;
  const review = await ReviewService.createReview(req.params.itemId as string, req.user!.userId, rating, comment);
  sendCreated(res, "Review created", review);
}));

router.delete("/:id", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await ReviewService.deleteReview(req.params.id as string, req.user!.userId);
  sendSuccess(res, "Review deleted");
}));

export default router;
