import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateProfileSchema } from "../validators/auth.validator";
import { UserService } from "../services/user.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/me", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await UserService.getProfile(req.user!.userId);
  sendSuccess(res, "Profile fetched successfully", user);
}));

router.put("/me", authenticate, validate(updateProfileSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await UserService.updateProfile(req.user!.userId, req.body);
  sendSuccess(res, "Profile updated successfully", user);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const user = await UserService.getPublicProfile(req.params.id as string);
  sendSuccess(res, "Public profile fetched", user);
}));

export default router;
