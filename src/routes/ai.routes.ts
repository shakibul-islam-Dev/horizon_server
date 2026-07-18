import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { aiLimiter } from "../middleware/rateLimiter";
import { uploadData } from "../middleware/upload";
import { AIContentService } from "../services/ai-content.service";
import { AIRecommendationService } from "../services/ai-recommendation.service";
import { AIAnalyzerService } from "../services/ai-analyzer.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";
import { BadRequestError } from "../utils/ApiError";
import OpenAI from "openai";
import { env } from "../config/env";
import { z } from "zod";

const router = Router();
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const contentSchema = z.object({
  type: z.enum(["blog", "product_desc", "social_post", "documentation"]),
  topic: z.string().min(1, "Topic is required"),
  keywords: z.array(z.string()).optional(),
  length: z.enum(["short", "medium", "long"]),
  tone: z.string().optional(),
  additionalContext: z.string().optional(),
});

const regenerateSchema = contentSchema.extend({
  previousContent: z.string().optional(),
});

const recommendationSchema = z.object({
  categoryId: z.string().optional(),
  priceRange: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  limit: z.number().min(1).max(20).optional(),
});

const interactionSchema = z.object({
  itemId: z.string().min(1),
  interactionType: z.enum(["view", "favorite", "purchase", "rating"]),
  rating: z.number().min(1).max(5).optional(),
});

const classifySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

router.post("/generate-content", authenticate, aiLimiter, validate(contentSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await AIContentService.generateContent(req.body);
  sendSuccess(res, "Content generated successfully", result);
}));

router.post("/regenerate-content", authenticate, aiLimiter, validate(regenerateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { previousContent, ...rest } = req.body;
  const result = await AIContentService.regenerateContent(rest, previousContent);
  sendSuccess(res, "Content regenerated successfully", result);
}));

router.post("/recommendations", authenticate, aiLimiter, validate(recommendationSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await AIRecommendationService.getRecommendations(req.user!.userId, req.body);
  sendSuccess(res, "Recommendations generated", result.recommendations, { reason: result.reason, userProfile: result.userProfile });
}));

router.post("/track-interaction", authenticate, validate(interactionSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await AIRecommendationService.trackInteraction(req.user!.userId, req.body.itemId, req.body.interactionType, req.body.rating);
  sendSuccess(res, "Interaction tracked", result);
}));

router.post("/analyze", authenticate, aiLimiter, uploadData.single("data"), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.file) throw new BadRequestError("No data file provided");

  let data: Record<string, any>[] = [];
  const fileContent = req.file.buffer.toString("utf-8");

  if (req.file.mimetype === "application/json" || req.file.originalname.endsWith(".json")) {
    const parsed = JSON.parse(fileContent);
    data = Array.isArray(parsed) ? parsed : [parsed];
  } else if (req.file.mimetype === "text/csv" || req.file.originalname.endsWith(".csv")) {
    const lines = fileContent.split("\n").filter((line: string) => line.trim());
    if (lines.length < 2) throw new BadRequestError("CSV file must have headers and at least one data row");
    const headers = lines[0].split(",").map((h: string) => h.trim().replace(/"/g, ""));
    data = lines.slice(1).map((line: string) => {
      const values = line.split(",").map((v: string) => v.trim().replace(/"/g, ""));
      const row: Record<string, any> = {};
      headers.forEach((header: string, i: number) => {
        const num = parseFloat(values[i]);
        row[header] = isNaN(num) ? values[i] : num;
      });
      return row;
    });
  } else {
    throw new BadRequestError("Unsupported file type. Please upload CSV or JSON.");
  }

  const result = await AIAnalyzerService.analyzeData(req.user!.userId, req.file.originalname, req.file.mimetype.includes("json") ? "json" : "csv", data);
  sendSuccess(res, "Data analyzed successfully", result);
}));

router.get("/analyses", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await AIAnalyzerService.getUserAnalyses(req.user!.userId, page, limit);
  sendSuccess(res, "Analyses fetched", result.analyses, { pagination: result.pagination });
}));

router.get("/analyses/:id", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const analysis = await AIAnalyzerService.getAnalysisById(req.params.id as string, req.user!.userId);
  sendSuccess(res, "Analysis fetched", analysis);
}));

router.get("/analytics/summary", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await AIAnalyzerService.generateSummary(req.user!.userId);
  sendSuccess(res, "Analytics summary generated", result);
}));

router.post("/classify", authenticate, aiLimiter, validate(classifySchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { title, description } = req.body;
  if (!title || !description) throw new BadRequestError("Title and description are required");

  const completion = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      { role: "system", content: `You are a classification AI. Given an item title and description, return a JSON object with:\n{\n  "suggestedCategory": "string - most appropriate category name",\n  "tags": ["array of 3-5 relevant tags"],\n  "keywords": ["array of 2-3 search keywords"],\n  "confidence": number between 0 and 1\n}\nReturn ONLY valid JSON.` },
      { role: "user", content: `Title: ${title}\nDescription: ${description}` },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  let classification;
  try {
    const content = completion.choices[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    classification = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    classification = { suggestedCategory: "", tags: [], keywords: [], confidence: 0 };
  }

  sendSuccess(res, "Classification generated", classification);
}));

export default router;
