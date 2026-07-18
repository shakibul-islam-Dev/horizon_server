import OpenAI from "openai";
import { env } from "../config/env";
import { AnalyticsData, AnalyticsDataDocument } from "../models/AnalyticsData";
import { AnalysisResult } from "../types";
import { BadRequestError, NotFoundError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export class AIAnalyzerService {
  static async analyzeData(userId: string, fileName: string, fileType: string, data: Record<string, any>[]): Promise<AnalyticsDataDocument> {
    if (!data || data.length === 0) throw new BadRequestError("No data to analyze");

    const sampleData = data.slice(0, 20);
    const columns = Object.keys(data[0]);

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: `You are a data analyst AI. Analyze the provided data and return a JSON object with these fields:\n{\n  "summary": "string - A clear summary of the data",\n  "trends": ["string array of identified trends"],\n  "insights": ["string array of actionable insights"],\n  "kpis": { "key metric names and values" },\n  "risks": ["string array of potential risks or concerns"],\n  "recommendations": ["string array of recommendations"]\n}\nReturn ONLY valid JSON, no markdown formatting.` },
        { role: "user", content: `Analyze this dataset (${data.length} rows, columns: ${columns.join(", ")}).\n\nSample data:\n${JSON.stringify(sampleData, null, 2)}\n\nTotal rows: ${data.length}\nColumns: ${columns.join(", ")}` },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    let analysis: AnalysisResult;
    try {
      const content = completion.choices[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      analysis = { summary: "Analysis could not be fully parsed. Please review the raw data.", trends: [], insights: [], kpis: {}, risks: [], recommendations: [] };
    }

    return AnalyticsData.create({ user: userId, fileName, fileType, rawData: { rows: data, columns }, analysis });
  }

  static async getAnalysisById(analysisId: string, userId: string): Promise<AnalyticsDataDocument> {
    const record = await AnalyticsData.findOne({ _id: analysisId, user: userId });
    if (!record) throw new NotFoundError("Analysis not found");
    return record;
  }

  static async getUserAnalyses(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [analyses, total] = await Promise.all([
      AnalyticsData.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AnalyticsData.countDocuments({ user: userId }),
    ]);
    return { analyses, pagination: buildPaginationMeta(page, limit, total) };
  }

  static async generateSummary(userId: string) {
    const analyses = await AnalyticsData.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean();
    if (analyses.length === 0) return { summary: "No analyses found. Upload a data file to get started.", totalAnalyses: 0 };

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are a data analyst. Given multiple analysis summaries, create an overarching executive summary.\nReturn a concise summary (2-3 paragraphs) covering key findings across all analyses." },
        { role: "user", content: `Previous analyses:\n${analyses.map((a, i) => `${i + 1}. File: ${a.fileName} - ${a.analysis.summary}`).join("\n")}` },
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    return {
      summary: completion.choices[0]?.message?.content || "Summary unavailable",
      totalAnalyses: analyses.length,
      recentAnalyses: analyses.map((a) => ({ fileName: a.fileName, createdAt: a.createdAt, summary: a.analysis.summary })),
    };
  }
}
