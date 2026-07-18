import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema, source: "body" | "query" | "params" = "body") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        _res.status(400).json({
          success: false,
          message: "Validation error",
          errors: messages,
        });
        return;
      }
      next(error);
    }
  };
};
