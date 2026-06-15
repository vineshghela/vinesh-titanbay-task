import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { loginBodySchema, loginResponseSchema } from "./auth.schema.js";
import { login } from "./auth.service.js";

const RATE_LIMIT_MAX = process.env.NODE_ENV === "test" ? 10_000 : 10;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.post(
    "/auth/login",
    {
      config: {
        rateLimit: { max: RATE_LIMIT_MAX, timeWindow: "1 minute" },
      },
      schema: {
        body: loginBodySchema,
        response: { 200: loginResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await login(request.body, app.jwt.sign.bind(app.jwt));
      return reply.send(result);
    },
  );
}
