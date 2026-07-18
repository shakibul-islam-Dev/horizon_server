import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { addToWishlistSchema } from "../validators/wishlist.validator";
import { WishlistService } from "../services/wishlist.service";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await WishlistService.getMyWishlist(req.user!.userId, page, limit);
  sendSuccess(res, "Wishlist fetched", result.items, { pagination: result.pagination });
}));

router.get("/check/:itemId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const isIn = await WishlistService.isInWishlist(req.params.itemId as string, req.user!.userId);
  sendSuccess(res, "Wishlist status checked", { isIn });
}));

router.post("/", authenticate, validate(addToWishlistSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const wishlist = await WishlistService.addToWishlist(req.body.item, req.user!.userId);
  sendCreated(res, "Item added to wishlist", wishlist);
}));

router.delete("/:itemId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await WishlistService.removeFromWishlist(req.params.itemId as string, req.user!.userId);
  sendSuccess(res, "Item removed from wishlist");
}));

router.delete("/", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await WishlistService.clearWishlist(req.user!.userId);
  sendSuccess(res, "Wishlist cleared");
}));

export default router;
