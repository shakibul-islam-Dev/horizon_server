import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { addToCartSchema, updateCartItemSchema } from "../validators/cart.validator";
import { CartService } from "../services/cart.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const cart = await CartService.getCart(req.user!.userId);
  sendSuccess(res, "Cart fetched", cart);
}));

router.get("/total", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const total = await CartService.getCartTotal(req.user!.userId);
  sendSuccess(res, "Cart total fetched", { total });
}));

router.post("/", authenticate, validate(addToCartSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const cart = await CartService.addToCart(req.user!.userId, req.body.item, req.body.quantity);
  sendSuccess(res, "Item added to cart", cart);
}));

router.put("/:itemId", authenticate, validate(updateCartItemSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const cart = await CartService.updateCartItem(req.user!.userId, req.params.itemId as string, req.body.quantity);
  sendSuccess(res, "Cart updated", cart);
}));

router.delete("/:itemId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const cart = await CartService.removeFromCart(req.user!.userId, req.params.itemId as string);
  sendSuccess(res, "Item removed from cart", cart);
}));

router.delete("/", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const cart = await CartService.clearCart(req.user!.userId);
  sendSuccess(res, "Cart cleared", cart);
}));

export default router;
