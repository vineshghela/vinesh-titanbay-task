import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireAuth } from "../../shared/auth.middleware.js";
import { createInvestorBodySchema, investorResponseSchema } from "./investors.schema.js";
import { createInvestor, listInvestors } from "./investors.service.js";

export async function investorsRoutes(app: FastifyInstance): Promise<void> {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get(
    "/investors",
    {
      preHandler: [requireAuth],
      schema: { response: { 200: z.array(investorResponseSchema) } },
    },
    async (_request, reply) => {
      const investors = await listInvestors();
      return reply.status(200).send(investors);
    },
  );

  router.post(
    "/investors",
    {
      preHandler: [requireAuth],
      schema: { body: createInvestorBodySchema, response: { 201: investorResponseSchema } },
    },
    async (request, reply) => {
      const investor = await createInvestor(request.body);
      return reply.status(201).send(investor);
    },
  );
}
