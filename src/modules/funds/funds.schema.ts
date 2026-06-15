import { z } from "zod";
import {
  baseResponseFields,
  currencyCode,
  nonEmptyString,
  positiveDecimal,
  uuidParam,
} from "../../shared/validators.js";

export const fundStatusSchema = z.enum(["Fundraising", "Investing", "Closed"]);

export const createFundBodySchema = z.object({
  name: nonEmptyString("Name"),
  vintage_year: z.number().int().min(1900).max(2100),
  target_size_usd: positiveDecimal,
  status: fundStatusSchema,
  currency: currencyCode.optional(),
});

export const updateFundBodySchema = z.object({
  name: nonEmptyString("Name").optional(),
  vintage_year: z.number().int().min(1900).max(2100).optional(),
  target_size_usd: positiveDecimal.optional(),
  status: fundStatusSchema.optional(),
  currency: currencyCode.optional(),
});

export const fundIdParamsSchema = z.object({
  id: uuidParam,
});

export const fundResponseSchema = z.object({
  id: uuidParam,
  name: z.string(),
  vintage_year: z.number(),
  target_size_usd: z.string(),
  status: fundStatusSchema,
  currency: currencyCode,
  ...baseResponseFields,
});

export type CreateFundBody = z.infer<typeof createFundBodySchema>;
export type UpdateFundBody = z.infer<typeof updateFundBodySchema>;
export type FundIdParams = z.infer<typeof fundIdParamsSchema>;
export type FundResponse = z.infer<typeof fundResponseSchema>;
