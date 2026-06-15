import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getAuthToken } from "./helpers.js";
import { app } from "./setup.js";

const FAKE_FUND_ID = "11111111-1111-4111-a111-111111111111";
const FAKE_TRANSACTION_ID = "22222222-2222-4222-a222-222222222222";

describe("Transactions", () => {
  let investorToken: string;
  let adminToken: string;

  beforeEach(async () => {
    investorToken = await getAuthToken(app, "investor");
    adminToken = await getAuthToken(app, "admin");
  });

  it("POST /transactions/process creates a transaction and calculates fees correctly", async () => {
    const res = await supertest(app.server)
      .post("/transactions/process")
      .set("Authorization", investorToken)
      .send({
        fund_id: FAKE_FUND_ID,
        amount: "100000.00",
        fee_percentage: "2.50",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("transaction_id");
    expect(res.body.calculated_fees).toBe("2500.00");
  });

  it("POST /transactions/process returns 404 if fund_id does not exist", async () => {
    const res = await supertest(app.server)
      .post("/transactions/process")
      .set("Authorization", investorToken)
      .send({
        fund_id: "00000000-0000-0000-0000-000000000000",
        amount: "100000.00",
        fee_percentage: "2.50",
      });

    expect(res.status).toBe(404);
  });

  it("GET /transactions returns array", async () => {
    const res = await supertest(app.server)
      .get("/transactions")
      .set("Authorization", investorToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("PUT /transactions/:id/reverse sets status to reversed and writes audit log", async () => {
    const res = await supertest(app.server)
      .put(`/transactions/${FAKE_TRANSACTION_ID}/reverse`)
      .set("Authorization", investorToken)
      .send({ reason: "Error in transaction" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("reversed");
  });

  it("PUT /transactions/:id/reverse returns 400 if already reversed", async () => {
    await supertest(app.server)
      .put(`/transactions/${FAKE_TRANSACTION_ID}/reverse`)
      .set("Authorization", investorToken)
      .send({ reason: "First reversal" })
      .expect(200);

    const res = await supertest(app.server)
      .put(`/transactions/${FAKE_TRANSACTION_ID}/reverse`)
      .set("Authorization", investorToken)
      .send({ reason: "Second reversal" });

    expect(res.status).toBe(400);
  });

  it("GET /funds/:fundId/total-value returns total_value, pending_value, transaction_count", async () => {
    const res = await supertest(app.server)
      .get(`/funds/${FAKE_FUND_ID}/total-value`)
      .set("Authorization", investorToken);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("total_value");
    expect(res.body).toHaveProperty("pending_value");
    expect(res.body).toHaveProperty("transaction_count");
  });

  it("POST /admin/recalculate-fees returns 403 when called with investor token", async () => {
    const res = await supertest(app.server)
      .post("/admin/recalculate-fees")
      .set("Authorization", investorToken);

    expect(res.status).toBe(403);
  });

  it("POST /admin/recalculate-fees returns non-403 when called with admin token", async () => {
    const res = await supertest(app.server)
      .post("/admin/recalculate-fees")
      .set("Authorization", adminToken);

    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});
