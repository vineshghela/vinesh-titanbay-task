import { z } from "zod";

export const positiveDecimal = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Must be a positive decimal with up to 2 decimal places")
  .refine((v) => Number(v) > 0, { message: "Must be greater than zero" });

export const feePercentage = positiveDecimal.refine((v) => Number(v) <= 100, {
  message: "Fee percentage cannot exceed 100",
});

export const uuidParam = z.string().uuid("Must be a valid UUID");

export const nonEmptyString = (field: string) => z.string().min(1, `${field} cannot be empty`);

export const optionalReason = z.string().min(1, "Reason cannot be empty").optional();

export const isoTimestamp = z.string().datetime();
export const isoDate = z.string().date();
export const currencyCode = z.string().length(3);

export const baseResponseFields = {
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
};
