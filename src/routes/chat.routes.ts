import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { aiLimiter } from "../middleware/rateLimiter";
import { ChatService } from "../services/chat.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types";
import { z } from "zod";

const router = Router();

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1, "Message content is required"),
      })
    )
    .min(1, "At least one message is required"),
});

router.post(
  "/chat",
  authenticate,
  aiLimiter,
  validate(chatSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { messages } = req.body;
    const result = await ChatService.sendMessage(req.user!.userId, messages);
    sendSuccess(res, "Chat response generated", { reply: result.reply });
  })
);

router.get(
  "/chat/conversations",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await ChatService.getConversations(
      req.user!.userId,
      page,
      limit
    );
    sendSuccess(
      res,
      "Conversations fetched",
      result.conversations,
      { pagination: result.pagination }
    );
  })
);

router.get(
  "/chat/conversations/:id",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const conversation = await ChatService.getConversationById(
      req.params.id as string,
      req.user!.userId
    );
    sendSuccess(res, "Conversation fetched", conversation);
  })
);

router.delete(
  "/chat/conversations/:id",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    await ChatService.deleteConversation(
      req.params.id as string,
      req.user!.userId
    );
    sendSuccess(res, "Conversation deleted");
  })
);

export default router;
