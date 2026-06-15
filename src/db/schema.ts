import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "investor"]);
export const fundStatusEnum = pgEnum("fund_status", ["Fundraising", "Investing", "Closed"]);
export const investorTypeEnum = pgEnum("investor_type", [
  "Individual",
  "Institution",
  "Family Office",
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "completed",
  "pending",
  "reversed",
]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "approved", "rejected"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "capital_call",
  "distribution",
  "fee",
  "other",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("investor"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const funds = pgTable("funds", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  vintageYear: integer("vintage_year").notNull(),
  targetSizeUsd: numeric("target_size_usd", { precision: 20, scale: 2 }).notNull(),
  status: fundStatusEnum("status").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const investors = pgTable("investors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  investorType: investorTypeEnum("investor_type").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  countryOfDomicile: varchar("country_of_domicile", { length: 2 }),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const investments = pgTable(
  "investments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    investorId: uuid("investor_id")
      .notNull()
      .references(() => investors.id),
    fundId: uuid("fund_id")
      .notNull()
      .references(() => funds.id),
    amountUsd: numeric("amount_usd", { precision: 20, scale: 2 }).notNull(),
    investmentDate: date("investment_date").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [check("amount_usd_positive", sql`${table.amountUsd} > 0`)],
);

export const transactions = pgTable(
  "transactions",
  {
    transactionId: uuid("transaction_id").primaryKey().default(sql`gen_random_uuid()`),
    fundId: uuid("fund_id")
      .notNull()
      .references(() => funds.id),
    amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
    feePercentage: numeric("fee_percentage", { precision: 5, scale: 2 }).notNull(),
    calculatedFees: numeric("calculated_fees", { precision: 20, scale: 2 }),
    status: transactionStatusEnum("status").default("pending"),
    transactionType: transactionTypeEnum("transaction_type").notNull().default("fee"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [check("amount_positive", sql`${table.amount} > 0`)],
);

export const transactionAuditLog = pgTable("transaction_audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.transactionId),
  previousStatus: transactionStatusEnum("previous_status").notNull(),
  newStatus: transactionStatusEnum("new_status").notNull(),
  reason: text("reason"),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const fundNavSnapshots = pgTable("fund_nav_snapshots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fundId: uuid("fund_id")
    .notNull()
    .references(() => funds.id),
  totalValue: numeric("total_value", { precision: 20, scale: 2 }).notNull(),
  pendingValue: numeric("pending_value", { precision: 20, scale: 2 }).notNull().default("0"),
  transactionCount: integer("transaction_count").notNull().default(0),
  snapshotAt: timestamp("snapshot_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});
