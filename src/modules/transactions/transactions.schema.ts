import { z } from "zod";
import {
  baseResponseFields,
  feePercentage,
  optionalReason,
  positiveDecimal,
  uuidParam,
} from "../../shared/validators.js";

export const transactionStatusSchema = z.enum(["completed", "pending", "reversed"]);
export const transactionTypeSchema = z.enum(["capital_call", "distribution", "fee", "other"]);

export const processTransactionBodySchema = z.object({
  fund_id: uuidParam,
  amount: positiveDecimal,
  fee_percentage: feePercentage,
});

export const transactionIdParamsSchema = z.object({
  transactionId: uuidParam,
});

export const fundIdParamsSchema = z.object({
  fundId: uuidParam,
});

export const reverseTransactionBodySchema = z.object({
  reason: optionalReason,
});

export const transactionResponseSchema = z.object({
  transaction_id: uuidParam,
  fund_id: uuidParam,
  transaction_type: transactionTypeSchema,
  amount: z.string(),
  fee_percentage: z.string(),
  calculated_fees: z.string().nullable(),
  status: transactionStatusSchema,
  ...baseResponseFields,
});

export const fundTotalValueResponseSchema = z.object({
  fund_id: uuidParam,
  total_value: z.string(),
  pending_value: z.string(),
  transaction_count: z.number(),
});

export type ProcessTransactionBody = z.infer<typeof processTransactionBodySchema>;
export type TransactionIdParams = z.infer<typeof transactionIdParamsSchema>;
export type FundIdParams = z.infer<typeof fundIdParamsSchema>;
export type ReverseTransactionBody = z.infer<typeof reverseTransactionBodySchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
export type FundTotalValueResponse = z.infer<typeof fundTotalValueResponseSchema>;
