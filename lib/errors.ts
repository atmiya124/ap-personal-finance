/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTH_REQUIRED", 401);
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(message, "DATABASE_ERROR", 500);
    this.name = "DatabaseError";
  }
}

/**
 * Wraps a server action with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  action: T,
  errorMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await action(...args);
    } catch (error) {
      // If it's already an AppError, re-throw it
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Prisma errors
      if (error && typeof error === "object" && "code" in error) {
        const prismaError = error as { code: string; meta?: any };
        
        switch (prismaError.code) {
          case "P2002":
            throw new ValidationError("A record with this value already exists");
          case "P2025":
            throw new NotFoundError("Record");
          case "P2003":
            throw new ValidationError("Invalid reference to related record");
          default:
            throw new DatabaseError(
              errorMessage || "Database operation failed. Please try again."
            );
        }
      }

      // Handle generic errors
      if (error instanceof Error) {
        // Don't expose internal error messages in production
        if (process.env.NODE_ENV === "production") {
          throw new AppError(
            errorMessage || "An error occurred. Please try again.",
            "UNKNOWN_ERROR",
            500
          );
        }
        throw error;
      }

      throw new AppError(
        errorMessage || "An unexpected error occurred",
        "UNKNOWN_ERROR",
        500
      );
    }
  }) as T;
}

/**
 * Gets a user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // In production, don't expose technical error messages
    if (process.env.NODE_ENV === "production") {
      return "An error occurred. Please try again.";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

