import type { FastifyReply, FastifyRequest } from "fastify";
import { ForbiddenError, UnauthorisedError } from "./errors.js";
import "./types.js";

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorisedError();
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(request, reply);
  if (request.user.role !== "admin") {
    throw new ForbiddenError();
  }
}
