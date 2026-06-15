import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { funds, investments, investors } from "../../db/schema.js";
import { NotFoundError } from "../../shared/errors.js";
import type { CreateInvestmentBody, InvestmentResponse } from "./investments.schema.js";

function toInvestmentResponse(investment: typeof investments.$inferSelect): InvestmentResponse {
  return {
    id: investment.id,
    investor_id: investment.investorId,
    fund_id: investment.fundId,
    amount_usd: investment.amountUsd,
    investment_date: investment.investmentDate,
    currency: investment.currency,
    notes: investment.notes,
    created_at: investment.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: investment.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function listInvestmentsByFund(fundId: string): Promise<InvestmentResponse[]> {
  const [fund] = await db.select().from(funds).where(eq(funds.id, fundId));
  if (!fund) throw new NotFoundError("Fund not found");

  const result = await db
    .select()
    .from(investments)
    .where(eq(investments.fundId, fundId))
    .orderBy(desc(investments.investmentDate));
  return result.map(toInvestmentResponse);
}

export async function createInvestment(
  fundId: string,
  body: CreateInvestmentBody,
): Promise<InvestmentResponse> {
  const [fund] = await db.select().from(funds).where(eq(funds.id, fundId));
  if (!fund) throw new NotFoundError("Fund not found");

  const [investor] = await db.select().from(investors).where(eq(investors.id, body.investor_id));
  if (!investor) throw new NotFoundError("Investor not found");

  const [investment] = await db
    .insert(investments)
    .values({
      investorId: body.investor_id,
      fundId,
      amountUsd: body.amount_usd,
      investmentDate: body.investment_date,
      currency: body.currency ?? "USD",
      notes: body.notes ?? null,
    })
    .returning();
  return toInvestmentResponse(investment);
}
