import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export type ErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_IMPLEMENTED"
  | "INVALID_TRANSITION"
  | "INVALID_STATE";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
  }
}

export class UnauthorisedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotImplementedError extends AppError {
  constructor() {
    super(501, "NOT_IMPLEMENTED", "Not implemented");
  }
}

export class InvalidTransitionError extends AppError {
  constructor(message = "Invalid state transition") {
    super(422, "INVALID_TRANSITION", message);
  }
}

export class InvalidStateError extends AppError {
  constructor(message = "Invalid state") {
    super(400, "INVALID_STATE", message);
  }
}

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: { code: error.code, message: error.message, requestId: request.id },
    });
    return;
  }

  if (error instanceof ZodError) {
    reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.issues.map((e) => ({ path: e.path.join("."), message: e.message })),
      },
    });
    return;
  }

  const fastifyError = error as FastifyError;

  if (
    fastifyError.statusCode === 401 ||
    fastifyError.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER" ||
    fastifyError.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID" ||
    fastifyError.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED"
  ) {
    reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    return;
  }

  if (fastifyError.validation) {
    reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: fastifyError.validation,
      },
    });
    return;
  }

  reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
}
