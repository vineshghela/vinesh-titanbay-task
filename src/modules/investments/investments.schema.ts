import { z } from "zod";
import {
  baseResponseFields,
  currencyCode,
  isoDate,
  positiveDecimal,
  uuidParam,
} from "../../shared/validators.js";

export const createInvestmentBodySchema = z.object({
  investor_id: uuidParam,
  amount_usd: positiveDecimal,
  investment_date: isoDate,
  currency: currencyCode.optional(),
  notes: z.string().optional(),
});

export const fundIdParamsSchema = z.object({
  fundId: uuidParam,
});

export const investmentResponseSchema = z.object({
  id: uuidParam,
  investor_id: uuidParam,
  fund_id: uuidParam,
  amount_usd: z.string(),
  investment_date: z.string(),
  currency: currencyCode,
  notes: z.string().nullable(),
  ...baseResponseFields,
});

export type CreateInvestmentBody = z.infer<typeof createInvestmentBodySchema>;
export type FundIdParams = z.infer<typeof fundIdParamsSchema>;
export type InvestmentResponse = z.infer<typeof investmentResponseSchema>;
