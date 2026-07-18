import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createCommentSchema, updateCommentSchema } from "../validators/comment.validator";
import { CommentService } from "../services/comment.service";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/item/:itemId", asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await CommentService.getCommentsByItem(req.params.itemId as string, page, limit);
  sendSuccess(res, "Comments fetched", result.comments, { pagination: result.pagination });
}));

router.get("/blog/:blogPostId", asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await CommentService.getCommentsByBlogPost(req.params.blogPostId as string, page, limit);
  sendSuccess(res, "Comments fetched", result.comments, { pagination: result.pagination });
}));

router.post("/", authenticate, validate(createCommentSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const comment = await CommentService.createComment(req.body, req.user!.userId);
  sendCreated(res, "Comment created", comment);
}));

router.put("/:id", authenticate, validate(updateCommentSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const comment = await CommentService.updateComment(req.params.id as string, req.body.content, req.user!.userId);
  sendSuccess(res, "Comment updated", comment);
}));

router.delete("/:id", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await CommentService.deleteComment(req.params.id as string, req.user!.userId);
  sendSuccess(res, "Comment deleted");
}));

router.post("/:id/like", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const comment = await CommentService.toggleLike(req.params.id as string, req.user!.userId);
  sendSuccess(res, "Like toggled", comment);
}));

export default router;
