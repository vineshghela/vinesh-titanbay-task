import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/db/client.js";
import { funds, investments, investors, users } from "../src/db/schema.js";

async function seed() {
  console.log("Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 12);
  const investorHash = await bcrypt.hash("investor123", 12);

  const [admin, investor] = await db
    .insert(users)
    .values([
      { email: "admin@titanbay.com", passwordHash: adminHash, role: "admin" },
      { email: "investor@titanbay.com", passwordHash: investorHash, role: "investor" },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`Users seeded: ${admin?.email ?? "skipped"}, ${investor?.email ?? "skipped"}`);

  const [fund1, fund2] = await db
    .insert(funds)
    .values([
      {
        name: "Titanbay Growth Fund I",
        vintageYear: 2023,
        targetSizeUsd: "250000000.00",
        status: "Fundraising",
      },
      {
        name: "Titanbay Buyout Fund II",
        vintageYear: 2024,
        targetSizeUsd: "500000000.00",
        status: "Investing",
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`Funds seeded: ${fund1?.name ?? "skipped"}, ${fund2?.name ?? "skipped"}`);

  const [investor1, investor2] = await db
    .insert(investors)
    .values([
      {
        name: "Goldman Sachs Asset Management",
        investorType: "Institution",
        email: "investments@gsam.com",
      },
      {
        name: "Jane Smith",
        investorType: "Individual",
        email: "jane.smith@example.com",
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`Investors seeded: ${investor1?.name ?? "skipped"}, ${investor2?.name ?? "skipped"}`);

  if (fund1 && investor1 && fund2 && investor2) {
    await db
      .insert(investments)
      .values([
        {
          investorId: investor1.id,
          fundId: fund1.id,
          amountUsd: "50000000.00",
          investmentDate: "2024-03-15",
        },
        {
          investorId: investor2.id,
          fundId: fund2.id,
          amountUsd: "25000000.00",
          investmentDate: "2024-06-01",
        },
      ])
      .onConflictDoNothing();

    console.log("Investments seeded.");
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
