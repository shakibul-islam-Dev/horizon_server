import OpenAI from "openai";
import { env } from "../config/env";
import { Item } from "../models/Item";
import { Recommendation } from "../models/Recommendation";
import { User } from "../models/User";
import { RecommendationRequest } from "../types";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export class AIRecommendationService {
  static async getRecommendations(userId: string, request: RecommendationRequest) {
    const { categoryId, priceRange, limit = 6 } = request;

    const userInteractions = await Recommendation.find({ user: userId })
      .populate({
        path: "item",
        select: "title category price tags rating",
        populate: { path: "category", select: "name" },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const userPreferences = await User.findById(userId).select("preferences").lean();

    const viewedCategories = [
      ...new Set(
        userInteractions
          .filter((i) => i.item && (i.item as any).category)
          .map((i) => ((i.item as any).category as any).name || "")
          .filter(Boolean)
      ),
    ];

    const avgPrice =
      userInteractions.length > 0
        ? userInteractions.reduce((sum, i) => {
            const item = i.item as any;
            return sum + (item?.price || 0);
          }, 0) / userInteractions.length
        : 100;

    const allInteractedItemIds = userInteractions.map((i) => i.item.toString());

    const availableItemsFilter: Record<string, any> = {
      status: "active",
      _id: { $nin: allInteractedItemIds },
    };

    if (categoryId) {
      availableItemsFilter.category = categoryId;
    }

    if (priceRange) {
      availableItemsFilter.price = {};
      if (priceRange.min) availableItemsFilter.price.$gte = priceRange.min;
      if (priceRange.max) availableItemsFilter.price.$lte = priceRange.max;
    }

    const availableItems = await Item.find(availableItemsFilter)
      .populate("category", "name slug")
      .populate("author", "name image")
      .limit(30)
      .lean();

    if (availableItems.length === 0) {
      const fallbackItems = await Item.find({ status: "active", ...availableItemsFilter })
        .populate("category", "name slug")
        .populate("author", "name image")
        .sort({ rating: -1 })
        .limit(limit)
        .lean();

      return {
        recommendations: fallbackItems,
        reason: "Showing top-rated items since no personalized recommendations are available yet.",
        userProfile: { preferredCategories: viewedCategories, avgPrice },
      };
    }

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a recommendation engine. Given a user profile and available items, 
          return a JSON array of item IDs ranked by relevance. Return ONLY a JSON array of item IDs, nothing else.
          Return at most ${limit} IDs.`,
        },
        {
          role: "user",
          content: `User profile:
- Preferred categories: ${viewedCategories.join(", ") || "None yet"}
- Average price preference: $${avgPrice.toFixed(2)}
- Total interactions: ${userInteractions.length}
- User preferences: ${JSON.stringify(userPreferences?.preferences || {})}

Available items (provide IDs as JSON array):
${availableItems.map((item) => `ID: ${item._id}, Title: ${item.title}, Category: ${(item.category as any)?.name || "N/A"}, Price: $${item.price}, Rating: ${item.rating}`).join("\n")}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    let recommendedIds: string[] = [];
    try {
      const content = completion.choices[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        recommendedIds = JSON.parse(jsonMatch[0]);
      }
    } catch {
      recommendedIds = availableItems.slice(0, limit).map((item) => (item._id as any).toString());
    }

    const recommendedItems = await Item.find({ _id: { $in: recommendedIds } })
      .populate("category", "name slug")
      .populate("author", "name image")
      .lean();

    const sortedItems = recommendedIds
      .map((id) => recommendedItems.find((item) => (item._id as any).toString() === id))
      .filter(Boolean);

    return {
      recommendations: sortedItems,
      reason: `Personalized recommendations based on your interest in ${viewedCategories.join(", ") || "browsing history"}.`,
      userProfile: { preferredCategories: viewedCategories, avgPrice },
    };
  }

  static async trackInteraction(
    userId: string,
    itemId: string,
    interactionType: "view" | "favorite" | "purchase" | "rating",
    rating?: number
  ) {
    return Recommendation.findOneAndUpdate(
      { user: userId, item: itemId, interactionType },
      {
        user: userId,
        item: itemId,
        interactionType,
        rating,
      },
      { upsert: true, new: true }
    );
  }
}
