import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { fundNavSnapshots, funds, transactionAuditLog, transactions } from "../../db/schema.js";
import { InvalidStateError, NotFoundError } from "../../shared/errors.js";
import type {
  FundTotalValueResponse,
  ProcessTransactionBody,
  ReverseTransactionBody,
  TransactionResponse,
} from "./transactions.schema.js";

function toTransactionResponse(txn: typeof transactions.$inferSelect): TransactionResponse {
  return {
    transaction_id: txn.transactionId,
    fund_id: txn.fundId,
    transaction_type: txn.transactionType,
    amount: txn.amount,
    fee_percentage: txn.feePercentage,
    calculated_fees: txn.calculatedFees,
    status: txn.status ?? "pending",
    created_at: txn.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: txn.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function listTransactions(): Promise<TransactionResponse[]> {
  const result = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  return result.map(toTransactionResponse);
}

export async function processTransaction(
  body: ProcessTransactionBody,
): Promise<TransactionResponse> {
  const [fund] = await db.select().from(funds).where(eq(funds.id, body.fund_id));
  if (!fund) throw new NotFoundError("Fund not found");

  const calculatedFees = (
    (Number.parseFloat(body.amount) * Number.parseFloat(body.fee_percentage)) /
    100
  ).toFixed(2);

  const [transaction] = await db
    .insert(transactions)
    .values({
      fundId: body.fund_id,
      amount: body.amount,
      feePercentage: body.fee_percentage,
      calculatedFees,
      status: "pending",
      transactionType: "fee",
    })
    .returning();

  const [stats] = await db
    .select({
      totalValue: sql<string>`COALESCE(SUM(${transactions.amount}), 0)::text`,
      pendingValue: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN ${transactions.amount} ELSE 0 END), 0)::text`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(transactions)
    .where(and(eq(transactions.fundId, body.fund_id), ne(transactions.status, "reversed")));

  await db.insert(fundNavSnapshots).values({
    fundId: body.fund_id,
    totalValue: stats.totalValue,
    pendingValue: stats.pendingValue,
    transactionCount: stats.count,
  });

  return toTransactionResponse(transaction);
}

export async function reverseTransaction(
  transactionId: string,
  body: ReverseTransactionBody,
): Promise<TransactionResponse> {
  const [existing] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.transactionId, transactionId));
  if (!existing) throw new NotFoundError("Transaction not found");

  if (existing.status === "reversed") {
    throw new InvalidStateError("Transaction has already been reversed");
  }

  const updated = await db.transaction(async (tx) => {
    const [txn] = await tx
      .update(transactions)
      .set({ status: "reversed" })
      .where(eq(transactions.transactionId, transactionId))
      .returning();

    await tx.insert(transactionAuditLog).values({
      transactionId,
      previousStatus: existing.status ?? "pending",
      newStatus: "reversed",
      reason: body.reason ?? null,
    });

    return txn;
  });

  return toTransactionResponse(updated);
}

export async function getFundTotalValue(fundId: string): Promise<FundTotalValueResponse> {
  const [fund] = await db.select().from(funds).where(eq(funds.id, fundId));
  if (!fund) throw new NotFoundError("Fund not found");

  const [snapshot] = await db
    .select()
    .from(fundNavSnapshots)
    .where(eq(fundNavSnapshots.fundId, fundId))
    .orderBy(desc(fundNavSnapshots.snapshotAt))
    .limit(1);

  if (!snapshot) {
    return { fund_id: fundId, total_value: "0.00", pending_value: "0.00", transaction_count: 0 };
  }

  return {
    fund_id: fundId,
    total_value: snapshot.totalValue,
    pending_value: snapshot.pendingValue,
    transaction_count: snapshot.transactionCount,
  };
}

export async function recalculateFees(): Promise<{ updated: number }> {
  const allTxns = await db.select().from(transactions).where(ne(transactions.status, "reversed"));

  if (allTxns.length === 0) return { updated: 0 };

  await db.transaction(async (tx) => {
    for (const txn of allTxns) {
      const fees = (
        (Number.parseFloat(txn.amount) * Number.parseFloat(txn.feePercentage)) /
        100
      ).toFixed(2);
      await tx
        .update(transactions)
        .set({ calculatedFees: fees })
        .where(eq(transactions.transactionId, txn.transactionId));
    }
  });

  return { updated: allTxns.length };
}
