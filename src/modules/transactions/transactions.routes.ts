import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../../shared/auth.middleware.js";
import {
  fundIdParamsSchema,
  fundTotalValueResponseSchema,
  processTransactionBodySchema,
  reverseTransactionBodySchema,
  transactionIdParamsSchema,
  transactionResponseSchema,
} from "./transactions.schema.js";
import {
  getFundTotalValue,
  listTransactions,
  processTransaction,
  recalculateFees,
  reverseTransaction,
} from "./transactions.service.js";

export async function transactionsRoutes(app: FastifyInstance): Promise<void> {
  const router = app.withTypeProvider<ZodTypeProvider>();

  router.get(
    "/transactions",
    {
      preHandler: [requireAuth],
      schema: { response: { 200: z.array(transactionResponseSchema) } },
    },
    async (_request, reply) => {
      const result = await listTransactions();
      return reply.status(200).send(result);
    },
  );

  router.post(
    "/transactions/process",
    {
      preHandler: [requireAuth],
      schema: { body: processTransactionBodySchema, response: { 201: transactionResponseSchema } },
    },
    async (request, reply) => {
      const transaction = await processTransaction(request.body);
      return reply.status(201).send(transaction);
    },
  );

  router.put(
    "/transactions/:transactionId/reverse",
    {
      preHandler: [requireAuth],
      schema: {
        params: transactionIdParamsSchema,
        body: reverseTransactionBodySchema,
        response: { 200: transactionResponseSchema },
      },
    },
    async (request, reply) => {
      const transaction = await reverseTransaction(request.params.transactionId, request.body);
      return reply.status(200).send(transaction);
    },
  );

  router.get(
    "/funds/:fundId/total-value",
    {
      preHandler: [requireAuth],
      schema: { params: fundIdParamsSchema, response: { 200: fundTotalValueResponseSchema } },
    },
    async (request, reply) => {
      const result = await getFundTotalValue(request.params.fundId);
      return reply.status(200).send(result);
    },
  );

  router.post(
    "/admin/recalculate-fees",
    {
      preHandler: [requireAdmin],
      schema: { response: { 200: z.object({ updated: z.number() }) } },
    },
    async (_request, reply) => {
      const result = await recalculateFees();
      return reply.status(200).send(result);
    },
  );
}
