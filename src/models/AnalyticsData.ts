import mongoose, { Schema, Document } from "mongoose";
import { IAnalyticsData } from "../types";

export interface AnalyticsDataDocument extends IAnalyticsData, Document {}

const analyticsDataSchema = new Schema<AnalyticsDataDocument>(
  {
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
      enum: ["csv", "json", "xlsx"],
    },
    rawData: {
      type: Schema.Types.Mixed,
      required: [true, "Raw data is required"],
    },
    analysis: {
      summary: { type: String, default: "" },
      trends: [{ type: String }],
      insights: [{ type: String }],
      kpis: { type: Schema.Types.Mixed, default: {} },
      risks: [{ type: String }],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        delete (ret as any).rawData;
        return ret;
      },
    },
  }
);

analyticsDataSchema.index({ user: 1, createdAt: -1 });

export const AnalyticsData = mongoose.model<AnalyticsDataDocument>(
  "AnalyticsData",
  analyticsDataSchema
);
