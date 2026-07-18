export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request") { super(400, message); }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") { super(401, message); }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") { super(403, message); }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") { super(404, message); }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource already exists") { super(409, message); }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = "Too many requests") { super(429, message); }
}
