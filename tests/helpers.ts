import type { FastifyInstance } from "fastify";
import supertest from "supertest";

export async function getAuthToken(
  app: FastifyInstance,
  role: "admin" | "investor",
): Promise<string> {
  const credentials =
    role === "admin"
      ? { email: "admin@titanbay.com", password: "admin123" }
      : { email: "investor@titanbay.com", password: "investor123" };

  const response = await supertest(app.server).post("/auth/login").send(credentials).expect(200);

  return `Bearer ${response.body.token}`;
}
