import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireAuth } from "../../shared/auth.middleware.js";
import {
  createInvestmentBodySchema,
  fundIdParamsSchema,
  investmentResponseSchema,
} from "./investments.schema.js";
import { createInvestment, listInvestmentsByFund } from "./investments.service.js";

export async function investmentsRoutes(app: FastifyInstance): Promise<void> {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get(
    "/funds/:fundId/investments",
    {
      preHandler: [requireAuth],
      schema: {
        params: fundIdParamsSchema,
        response: { 200: z.array(investmentResponseSchema) },
      },
    },
    async (request, reply) => {
      const investments = await listInvestmentsByFund(request.params.fundId);
      return reply.status(200).send(investments);
    },
  );

  router.post(
    "/funds/:fundId/investments",
    {
      preHandler: [requireAuth],
      schema: {
        params: fundIdParamsSchema,
        body: createInvestmentBodySchema,
        response: { 201: investmentResponseSchema },
      },
    },
    async (request, reply) => {
      const investment = await createInvestment(request.params.fundId, request.body);
      return reply.status(201).send(investment);
    },
  );
}
