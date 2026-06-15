import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireAuth } from "../../shared/auth.middleware.js";
import {
  createFundBodySchema,
  fundIdParamsSchema,
  fundResponseSchema,
  updateFundBodySchema,
} from "./funds.schema.js";
import { createFund, getFundById, listFunds, updateFund } from "./funds.service.js";

export async function fundsRoutes(app: FastifyInstance): Promise<void> {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get(
    "/funds",
    {
      preHandler: [requireAuth],
      schema: { response: { 200: z.array(fundResponseSchema) } },
    },
    async (_request, reply) => {
      const result = await listFunds();
      return reply.status(200).send(result);
    },
  );

  router.post(
    "/funds",
    {
      preHandler: [requireAuth],
      schema: { body: createFundBodySchema, response: { 201: fundResponseSchema } },
    },
    async (request, reply) => {
      const fund = await createFund(request.body);
      return reply.status(201).send(fund);
    },
  );

  router.get(
    "/funds/:id",
    {
      preHandler: [requireAuth],
      schema: { params: fundIdParamsSchema, response: { 200: fundResponseSchema } },
    },
    async (request, reply) => {
      const fund = await getFundById(request.params.id);
      return reply.status(200).send(fund);
    },
  );

  router.put(
    "/funds/:id",
    {
      preHandler: [requireAuth],
      schema: {
        params: fundIdParamsSchema,
        body: updateFundBodySchema,
        response: { 200: fundResponseSchema },
      },
    },
    async (request, reply) => {
      const fund = await updateFund(request.params.id, request.body);
      return reply.status(200).send(fund);
    },
  );
}
