import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { FastifyInstance } from "fastify";
import postgres from "postgres";
import { afterAll, afterEach, beforeAll } from "vitest";
import { buildApp } from "../src/app.js";
import * as schema from "../src/db/schema.js";
import {
  fundNavSnapshots,
  funds,
  investments,
  investors,
  transactionAuditLog,
  transactions,
  users,
} from "../src/db/schema.js";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://titanbay:titanbay@localhost:5432/titanbay_test";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = "test-secret-do-not-use-in-prod";
process.env.NODE_ENV = "test";

let queryClient: ReturnType<typeof postgres>;
let testDb: ReturnType<typeof drizzle<typeof schema>>;

export let app: FastifyInstance;

beforeAll(async () => {
  queryClient = postgres(TEST_DATABASE_URL, { max: 1 });
  testDb = drizzle(queryClient, { schema });

  await migrate(testDb, { migrationsFolder: "./src/migrations" });

  await seedTestData(testDb);

  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  if (app) await app.close();
  await queryClient.end();
});

afterEach(async () => {
  await truncateAll(testDb);
  await seedTestData(testDb);
});

async function truncateAll(db: ReturnType<typeof drizzle<typeof schema>>) {
  await db.delete(transactionAuditLog);
  await db.delete(transactions);
  await db.delete(fundNavSnapshots);
  await db.delete(investments);
  await db.delete(investors);
  await db.delete(funds);
  await db.delete(users);
}

async function seedTestData(db: ReturnType<typeof drizzle<typeof schema>>) {
  const adminHash = await bcrypt.hash("admin123", 12);
  const investorHash = await bcrypt.hash("investor123", 12);

  await db
    .insert(users)
    .values([
      { email: "admin@titanbay.com", passwordHash: adminHash, role: "admin" },
      { email: "investor@titanbay.com", passwordHash: investorHash, role: "investor" },
    ])
    .onConflictDoNothing();

  await db
    .insert(funds)
    .values([
      {
        id: "11111111-1111-4111-a111-111111111111",
        name: "Seed Test Fund",
        vintageYear: 2023,
        targetSizeUsd: "100000000.00",
        status: "Fundraising",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(investors)
    .values([
      {
        id: "33333333-3333-4333-a333-333333333333",
        name: "Seed Test Investor",
        investorType: "Institution",
        email: "seed@investor.test",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(transactions)
    .values([
      {
        transactionId: "22222222-2222-4222-a222-222222222222",
        fundId: "11111111-1111-4111-a111-111111111111",
        amount: "50000.00",
        feePercentage: "2.00",
        calculatedFees: "1000.00",
        status: "pending",
        transactionType: "capital_call",
      },
    ])
    .onConflictDoNothing();
}
