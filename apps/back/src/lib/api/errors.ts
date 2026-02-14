import { NextResponse } from "next/server";
import { ApiAuthError } from "@/lib/auth";
import { ForbiddenError } from "@/lib/auth/permissions";
import { z } from "zod";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super("VALIDATION_ERROR", message, 400);
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiAuthError) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: error.message } },
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues.map((issue) => ({
            field: issue.path.map(String).join("."),
            message: issue.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError && error.details
            ? { details: error.details }
            : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  // Log unexpected errors
  console.error("Unhandled API error:", error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
