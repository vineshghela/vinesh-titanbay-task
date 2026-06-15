import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getAuthToken } from "./helpers.js";
import { app } from "./setup.js";

const FAKE_FUND_ID = "11111111-1111-4111-a111-111111111111";
const FAKE_INVESTOR_ID = "33333333-3333-4333-a333-333333333333";

describe("Investments", () => {
  let token: string;

  beforeEach(async () => {
    token = await getAuthToken(app, "investor");
  });

  it("POST /funds/:fundId/investments creates an investment and returns 201", async () => {
    const res = await supertest(app.server)
      .post(`/funds/${FAKE_FUND_ID}/investments`)
      .set("Authorization", token)
      .send({
        investor_id: FAKE_INVESTOR_ID,
        amount_usd: "1000000.00",
        investment_date: "2024-01-15",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.fund_id).toBe(FAKE_FUND_ID);
  });

  it("POST /funds/:fundId/investments returns 404 if fund does not exist", async () => {
    const res = await supertest(app.server)
      .post("/funds/00000000-0000-0000-0000-000000000000/investments")
      .set("Authorization", token)
      .send({
        investor_id: FAKE_INVESTOR_ID,
        amount_usd: "1000000.00",
        investment_date: "2024-01-15",
      });

    expect(res.status).toBe(404);
  });

  it("POST /funds/:fundId/investments returns 400 if amount_usd is invalid", async () => {
    const res = await supertest(app.server)
      .post(`/funds/${FAKE_FUND_ID}/investments`)
      .set("Authorization", token)
      .send({
        investor_id: FAKE_INVESTOR_ID,
        amount_usd: "-500.00",
        investment_date: "2024-01-15",
      });

    expect(res.status).toBe(400);
  });

  it("GET /funds/:fundId/investments returns list for that fund only", async () => {
    const res = await supertest(app.server)
      .get(`/funds/${FAKE_FUND_ID}/investments`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const inv of res.body as { fund_id: string }[]) {
      expect(inv.fund_id).toBe(FAKE_FUND_ID);
    }
  });
});
