import { desc } from "drizzle-orm";
import { db } from "../../db/client.js";
import { investors } from "../../db/schema.js";
import { ConflictError } from "../../shared/errors.js";
import type { CreateInvestorBody, InvestorResponse } from "./investors.schema.js";

function isUniqueViolation(err: unknown): boolean {
  const code = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e ? (e as { code: unknown }).code : undefined;
  return code(err) === "23505" || code((err as { cause?: unknown })?.cause) === "23505";
}

function toInvestorResponse(investor: typeof investors.$inferSelect): InvestorResponse {
  return {
    id: investor.id,
    name: investor.name,
    investor_type: investor.investorType,
    email: investor.email,
    country_of_domicile: investor.countryOfDomicile,
    kyc_status: investor.kycStatus,
    created_at: investor.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: investor.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function listInvestors(): Promise<InvestorResponse[]> {
  const result = await db.select().from(investors).orderBy(desc(investors.createdAt));
  return result.map(toInvestorResponse);
}

export async function createInvestor(body: CreateInvestorBody): Promise<InvestorResponse> {
  try {
    const [investor] = await db
      .insert(investors)
      .values({
        name: body.name,
        investorType: body.investor_type,
        email: body.email,
        countryOfDomicile: body.country_of_domicile ?? null,
        kycStatus: body.kyc_status ?? "pending",
      })
      .returning();
    return toInvestorResponse(investor);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError("An investor with this email already exists");
    }
    throw err;
  }
}
