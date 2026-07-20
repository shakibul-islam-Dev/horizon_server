import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import routes from "./routes";
import { getSession } from "./helpers/auth";

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://horizon-client-eight.vercel.app";
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

app.set("trust proxy", 1);

// CORS Config
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie", "X-Total-Count"],
  }),
);

// Parsers with rawBody support
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Auth Session Middleware
app.use(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.currentUser = await getSession(req) as any;
  } catch (error) {
    req.currentUser = undefined;
  }
  next();
});

// Root Route (ওয়েব পেজে দেখার জন্য)
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully!",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", routes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

// Connect to MongoDB lazily. On Vercel (serverless) we connect per cold start,
// and reuse the cached connection; locally we connect on boot.
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGO_DB_URI;
  if (!mongoUri) {
    throw new Error("MONGO_DB_URI environment variable is not defined.");
  }
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}

// Ensure DB connection before handling requests (works for both local and serverless).
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
  } catch (err) {
    return next(err);
  }
  next();
});

// Server Initialization (local development & non-serverless production like Render)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${NODE_ENV}`);
        console.log(`Health Check: http://localhost:${PORT}/api/health`);
      });
    })
    .catch((err) => console.error("Failed to start server:", err));

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down...`);
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (err) =>
  console.error("Unhandled Rejection:", err),
);
process.on("uncaughtException", (err) =>
  console.error("Uncaught Exception:", err),
);

// Export the app for serverless platforms (Vercel / @vercel/node)
export default app;

