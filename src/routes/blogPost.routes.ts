import { Router } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createBlogPostSchema, updateBlogPostSchema } from "../validators/blogPost.validator";
import { BlogPostService } from "../services/blogPost.service";
import { sendSuccess, sendCreated } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";

const router = Router();

router.get("/", optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await BlogPostService.getBlogPosts(req.query as any);
  sendSuccess(res, "Blog posts fetched", result.posts, { pagination: result.pagination });
}));

router.get("/my/posts", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await BlogPostService.getMyPosts(req.user!.userId, req.query as any);
  sendSuccess(res, "Your posts fetched", result.posts, { pagination: result.pagination });
}));

router.get("/slug/:slug", optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const post = await BlogPostService.getBlogPostBySlug(req.params.slug as string);
  sendSuccess(res, "Blog post fetched", post);
}));

router.get("/:id", optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const post = await BlogPostService.getBlogPostById(req.params.id as string);
  sendSuccess(res, "Blog post fetched", post);
}));

router.post("/", authenticate, validate(createBlogPostSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const post = await BlogPostService.createBlogPost(req.body, req.user!.userId);
  sendCreated(res, "Blog post created", post);
}));

router.put("/:id", authenticate, validate(updateBlogPostSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const post = await BlogPostService.updateBlogPost(req.params.id as string, req.body, req.user!.userId);
  sendSuccess(res, "Blog post updated", post);
}));

router.delete("/:id", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await BlogPostService.deleteBlogPost(req.params.id as string, req.user!.userId);
  sendSuccess(res, "Blog post deleted");
}));

router.post("/:id/like", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const post = await BlogPostService.likeBlogPost(req.params.id as string);
  sendSuccess(res, "Blog post liked", post);
}));

export default router;
