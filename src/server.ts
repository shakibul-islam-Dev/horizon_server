import app from "./app";
import connectDB from "./config/db";
import { env } from "./config/env";
import mongoose from "mongoose";

const startServer = async () => {
  try {
    await connectDB();

    const PORT = parseInt(env.PORT);

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        console.log("HTTP server closed.");
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
        process.exit(0);
      });
      setTimeout(() => {
        console.error("Graceful shutdown timed out. Forcing exit.");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err);
    });

    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      shutdown("uncaughtException");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
