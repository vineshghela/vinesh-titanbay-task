import { z } from "zod";
import { baseResponseFields, nonEmptyString, uuidParam } from "../../shared/validators.js";

export const investorTypeSchema = z.enum(["Individual", "Institution", "Family Office"]);
export const kycStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const createInvestorBodySchema = z.object({
  name: nonEmptyString("Name"),
  investor_type: investorTypeSchema,
  email: z.string().email(),
  country_of_domicile: z.string().length(2).optional(),
  kyc_status: kycStatusSchema.optional(),
});

export const investorResponseSchema = z.object({
  id: uuidParam,
  name: z.string(),
  investor_type: investorTypeSchema,
  email: z.string(),
  country_of_domicile: z.string().nullable(),
  kyc_status: kycStatusSchema,
  ...baseResponseFields,
});

export type CreateInvestorBody = z.infer<typeof createInvestorBodySchema>;
export type InvestorResponse = z.infer<typeof investorResponseSchema>;
