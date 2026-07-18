import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { UnauthorizedError, ForbiddenError } from "../utils/ApiError";
import { env } from "../config/env";

const FRONTEND_URL = env.FRONTEND_URL || "http://localhost:3000";

interface BetterAuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface BetterAuthResponse {
  data?: {
    user?: BetterAuthUser;
    session?: { user: BetterAuthUser; token?: string };
  };
  user?: BetterAuthUser;
  session?: { user: BetterAuthUser; token?: string };
}

async function getSessionFromFrontend(
  reqHeaders: Record<string, string | string[] | undefined>
): Promise<{ userId: string; email: string; role: string } | null> {
  const cookie = reqHeaders.cookie;
  if (!cookie) return null;

  const cookieStr = typeof cookie === "string" ? cookie : cookie.join("; ");

  let fetchRes: globalThis.Response;
  try {
    fetchRes = await fetch(`${FRONTEND_URL}/api/auth/get-session`, {
      headers: {
        cookie: cookieStr,
        origin: FRONTEND_URL,
      },
    });
  } catch {
    return null;
  }

  if (!fetchRes.ok) return null;

  const body = (await fetchRes.json()) as BetterAuthResponse;

  const user = body?.data?.user || body?.data?.session?.user || body?.user || body?.session?.user;
  if (!user?.id || !user?.email) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role ?? "user",
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getSessionFromFrontend(req.headers);
    if (!user) return next(new UnauthorizedError("Not authenticated"));

    req.user = user;
    next();
  } catch {
    next(new UnauthorizedError("Not authenticated"));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have permission to perform this action"));
    }
    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getSessionFromFrontend(req.headers);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
};
