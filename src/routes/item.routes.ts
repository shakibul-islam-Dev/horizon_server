import { Router } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createItemSchema, updateItemSchema } from "../validators/item.validator";
import { ItemService } from "../services/item.service";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/", optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await ItemService.getItems(req.query as any);
  sendSuccess(res, "Items fetched successfully", result.items, { pagination: result.pagination });
}));

router.get("/my/listings", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await ItemService.getMyItems(req.user!.userId, req.query as any);
  sendSuccess(res, "Your items fetched", result.items, { pagination: result.pagination });
}));

router.get("/:id", optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const item = await ItemService.getItemById(req.params.id as string, req.user?.userId);
  sendSuccess(res, "Item fetched successfully", item);
}));

router.post("/", authenticate, validate(createItemSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const item = await ItemService.createItem(req.body, req.user!.userId);
  sendCreated(res, "Item created successfully", item);
}));

router.put("/:id", authenticate, validate(updateItemSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const item = await ItemService.updateItem(req.params.id as string, req.body, req.user!.userId);
  sendSuccess(res, "Item updated successfully", item);
}));

router.delete("/:id", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await ItemService.deleteItem(req.params.id as string, req.user!.userId);
  sendSuccess(res, "Item deleted successfully");
}));

export default router;
