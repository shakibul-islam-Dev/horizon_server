import { Request } from "express";
import { Types } from "mongoose";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ItemQuery extends PaginationQuery {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  status?: string;
}

export interface BlogPostQuery extends PaginationQuery {
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface ContentGenerationRequest {
  type: "blog" | "product_desc" | "social_post" | "documentation";
  topic: string;
  keywords?: string[];
  length: "short" | "medium" | "long";
  tone?: string;
  additionalContext?: string;
}

export interface RecommendationRequest {
  categoryId?: string;
  priceRange?: { min: number; max: number };
  limit?: number;
}

export interface AnalysisResult {
  summary: string;
  trends: string[];
  insights: string[];
  kpis: Record<string, any>;
  risks: string[];
  recommendations: string[];
}

export interface IItem {
  _id: Types.ObjectId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  category: Types.ObjectId;
  images: string[];
  tags: string[];
  location: string;
  rating: number;
  reviewCount: number;
  author: string;
  status: "active" | "sold" | "archived";
  meta: { views: number; favorites: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id: Types.ObjectId;
  item: Types.ObjectId;
  user: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  _id: Types.ObjectId;
  user: string;
  item?: Types.ObjectId;
  blogPost?: Types.ObjectId;
  parentComment?: Types.ObjectId;
  content: string;
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  images: string[];
  status: "draft" | "published" | "archived";
  meta: { views: number; likes: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICart {
  _id: Types.ObjectId;
  user: string;
  items: { item: Types.ObjectId; quantity: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlist {
  _id: Types.ObjectId;
  user: string;
  item: Types.ObjectId;
  createdAt: Date;
}

export interface IPayment {
  _id: Types.ObjectId;
  user: string;
  item: Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string;
  stripePaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  _id: Types.ObjectId;
  buyer: string;
  seller: string;
  item: Types.ObjectId;
  payment: Types.ObjectId;
  amount: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecommendation {
  _id: Types.ObjectId;
  user: string;
  item: Types.ObjectId;
  interactionType: "view" | "favorite" | "purchase" | "rating";
  rating?: number;
  createdAt: Date;
}

export interface IAnalyticsData {
  _id: Types.ObjectId;
  user: string;
  fileName: string;
  fileType: string;
  rawData: Record<string, any>;
  analysis: {
    summary: string;
    trends: string[];
    insights: string[];
    kpis: Record<string, any>;
    risks: string[];
  };
  createdAt: Date;
}
