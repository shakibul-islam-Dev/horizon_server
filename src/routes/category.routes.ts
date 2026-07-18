import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createCategorySchema } from "../validators/review.validator";
import { CategoryService } from "../services/category.service";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  const categories = await CategoryService.getAllCategories();
  sendSuccess(res, "Categories fetched", categories);
}));

router.post("/", authenticate, authorize("admin"), validate(createCategorySchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const category = await CategoryService.createCategory(req.body);
  sendCreated(res, "Category created", category);
}));

router.put("/:id", authenticate, authorize("admin"), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const category = await CategoryService.updateCategory(req.params.id as string, req.body);
  sendSuccess(res, "Category updated", category);
}));

router.delete("/:id", authenticate, authorize("admin"), asyncHandler(async (req: AuthenticatedRequest, res) => {
  await CategoryService.deleteCategory(req.params.id as string);
  sendSuccess(res, "Category deleted");
}));

export default router;
