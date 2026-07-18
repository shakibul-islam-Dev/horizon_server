import OpenAI from "openai";
import { env } from "../config/env";
import { ContentGenerationRequest } from "../types";
import { CONTENT_LENGTH_TOKENS } from "../utils/constants";
import { BadRequestError } from "../utils/ApiError";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const PROMPT_TEMPLATES: Record<string, string> = {
  blog: `You are an expert blog writer. Write a high-quality, engaging blog article on the given topic.
The article should be well-structured with an introduction, body sections, and conclusion.
Use clear headings, short paragraphs, and actionable insights.
Tone: {tone}
Include relevant keywords naturally: {keywords}
Additional context: {context}`,

  product_desc: `You are a professional copywriter specializing in product descriptions.
Write a compelling, persuasive product description that highlights key features and benefits.
Focus on value proposition and call-to-action.
Tone: {tone}
Include keywords naturally: {keywords}
Additional context: {context}`,

  social_post: `You are a social media expert. Create an engaging social media post.
Make it concise, attention-grabbing, and shareable.
Include relevant hashtags where appropriate.
Tone: {tone}
Topic keywords: {keywords}
Additional context: {context}`,

  documentation: `You are a technical documentation writer. Create clear, comprehensive documentation.
Use proper formatting with sections, code examples where applicable, and step-by-step instructions.
Tone: {tone}
Topic keywords: {keywords}
Additional context: {context}`,
};

export class AIContentService {
  static async generateContent(request: ContentGenerationRequest) {
    const { type, topic, keywords = [], length, tone = "professional", additionalContext = "" } = request;

    const template = PROMPT_TEMPLATES[type];
    if (!template) {
      throw new BadRequestError("Invalid content type");
    }

    const maxTokens = CONTENT_LENGTH_TOKENS[length] || 600;

    const prompt = template
      .replace("{tone}", tone)
      .replace("{keywords}", keywords.join(", "))
      .replace("{context}", additionalContext || "No additional context.");

    const systemMessage = `You are a skilled content creator. Generate high-quality, original content about "${topic}". 
    Respond only with the content, no meta-commentary.`;

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || "";

    return {
      content,
      type,
      topic,
      tone,
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  }

  static async regenerateContent(
    request: ContentGenerationRequest,
    previousContent?: string
  ) {
    const modifiedRequest = {
      ...request,
      additionalContext: previousContent
        ? `Previous version was: "${previousContent.slice(0, 500)}". Please generate a completely different version.`
        : request.additionalContext,
    };

    return this.generateContent(modifiedRequest);
  }
}
