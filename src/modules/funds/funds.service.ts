import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { funds } from "../../db/schema.js";
import { InvalidTransitionError, NotFoundError } from "../../shared/errors.js";
import type { CreateFundBody, FundResponse, UpdateFundBody } from "./funds.schema.js";

const VALID_TRANSITIONS: Record<string, string[]> = {
  Fundraising: ["Investing"],
  Investing: ["Closed"],
  Closed: [],
};

function toFundResponse(fund: typeof funds.$inferSelect): FundResponse {
  return {
    id: fund.id,
    name: fund.name,
    vintage_year: fund.vintageYear,
    target_size_usd: fund.targetSizeUsd,
    status: fund.status,
    currency: fund.currency,
    created_at: fund.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: fund.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function listFunds(): Promise<FundResponse[]> {
  const result = await db.select().from(funds).orderBy(desc(funds.createdAt));
  return result.map(toFundResponse);
}

export async function createFund(body: CreateFundBody): Promise<FundResponse> {
  const [fund] = await db
    .insert(funds)
    .values({
      name: body.name,
      vintageYear: body.vintage_year,
      targetSizeUsd: body.target_size_usd,
      status: body.status,
      currency: body.currency ?? "USD",
    })
    .returning();
  return toFundResponse(fund);
}

export async function getFundById(id: string): Promise<FundResponse> {
  const [fund] = await db.select().from(funds).where(eq(funds.id, id));
  if (!fund) throw new NotFoundError("Fund not found");
  return toFundResponse(fund);
}

export async function updateFund(id: string, body: UpdateFundBody): Promise<FundResponse> {
  const [existing] = await db.select().from(funds).where(eq(funds.id, id));
  if (!existing) throw new NotFoundError("Fund not found");

  if (body.status !== undefined && body.status !== existing.status) {
    const allowed = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(body.status)) {
      throw new InvalidTransitionError(
        `Cannot transition fund from ${existing.status} to ${body.status}`,
      );
    }
  }

  const updates: Partial<typeof funds.$inferInsert> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.vintage_year !== undefined) updates.vintageYear = body.vintage_year;
  if (body.target_size_usd !== undefined) updates.targetSizeUsd = body.target_size_usd;
  if (body.status !== undefined) updates.status = body.status;
  if (body.currency !== undefined) updates.currency = body.currency;

  const [updated] = await db.update(funds).set(updates).where(eq(funds.id, id)).returning();
  return toFundResponse(updated);
}
