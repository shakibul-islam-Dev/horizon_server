import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { AboutService } from "../services/about.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => {
  const about = await AboutService.getAbout();
  sendSuccess(res, "About data fetched successfully", about);
}));

router.put("/", authenticate, authorize("admin"), asyncHandler(async (req, res) => {
  const about = await AboutService.updateAbout(req.body);
  sendSuccess(res, "About data updated successfully", about);
}));

export default router;
