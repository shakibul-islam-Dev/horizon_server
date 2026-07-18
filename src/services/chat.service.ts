import OpenAI from "openai";
import { env } from "../config/env";
import { Conversation } from "../models/Conversation";
import { BadRequestError } from "../utils/ApiError";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are Horizon AI, a helpful assistant for the Horizon Marketplace.
You help users with buying, selling, and navigating the platform.
You are friendly, concise, and knowledgeable about marketplace best practices.
Never make up information. If you don't know something, say so.
Always prioritize user safety and platform guidelines.`;

const DEVELOPER_PROMPT = `Rules:
- Keep responses under 200 words unless detail is requested.
- Use bullet points for lists.
- Be encouraging and helpful.
- For transaction disputes, advise contacting support.
- Never share personal information about other users.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class ChatService {
  static async sendMessage(
    userId: string,
    messages: ChatMessage[]
  ): Promise<{ reply: string; conversationId: string }> {
    if (!messages || messages.length === 0) {
      throw new BadRequestError("Messages array is required and cannot be empty");
    }

    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: DEVELOPER_PROMPT },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "I could not generate a response. Please try again.";

    const conversation = await Conversation.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
              createdAt: new Date(),
            })),
            {
              role: "assistant" as const,
              content: reply,
              createdAt: new Date(),
            },
          ],
        },
      },
      { upsert: true, new: true }
    );

    return { reply, conversationId: String(conversation._id) };
  }

  static async getConversations(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      Conversation.find({ user: userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({ user: userId }),
    ]);

    return {
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  static async getConversationById(conversationId: string, userId: string) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: userId,
    }).lean();

    return conversation;
  }

  static async deleteConversation(conversationId: string, userId: string) {
    return Conversation.findOneAndDelete({
      _id: conversationId,
      user: userId,
    });
  }
}
