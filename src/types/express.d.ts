import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        userId: string;
        email: string;
        role: string;
      };
      rawBody?: Buffer;
    }
  }
}
