import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getAuthToken } from "./helpers.js";
import { app } from "./setup.js";

const FAKE_FUND_ID = "11111111-1111-4111-a111-111111111111";

const VALID_FUND = {
  name: "Test Fund I",
  vintage_year: 2023,
  target_size_usd: "100000000.00",
  status: "Fundraising",
};

describe("Funds", () => {
  let token: string;

  beforeEach(async () => {
    token = await getAuthToken(app, "investor");
  });

  it("POST /funds creates a fund and returns 201 with id and created_at", async () => {
    const res = await supertest(app.server)
      .post("/funds")
      .set("Authorization", token)
      .send(VALID_FUND);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("created_at");
    expect(res.body.name).toBe(VALID_FUND.name);
  });

  it("POST /funds returns 400 if name is missing", async () => {
    const { name: _name, ...body } = VALID_FUND;
    const res = await supertest(app.server).post("/funds").set("Authorization", token).send(body);

    expect(res.status).toBe(400);
  });

  it("POST /funds returns 400 if status is not a valid enum value", async () => {
    const res = await supertest(app.server)
      .post("/funds")
      .set("Authorization", token)
      .send({ ...VALID_FUND, status: "Invalid" });

    expect(res.status).toBe(400);
  });

  it("GET /funds returns an array", async () => {
    const res = await supertest(app.server).get("/funds").set("Authorization", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /funds/:id returns the fund", async () => {
    const res = await supertest(app.server)
      .get(`/funds/${FAKE_FUND_ID}`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(FAKE_FUND_ID);
  });

  it("GET /funds/:id returns 404 for unknown id", async () => {
    const res = await supertest(app.server)
      .get("/funds/00000000-0000-0000-0000-000000000000")
      .set("Authorization", token);

    expect(res.status).toBe(404);
  });

  it("PUT /funds/:id updates fields and returns updated record", async () => {
    const res = await supertest(app.server)
      .put(`/funds/${FAKE_FUND_ID}`)
      .set("Authorization", token)
      .send({ status: "Investing" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Investing");
  });

  it("PUT /funds/:id returns 404 for unknown id", async () => {
    const res = await supertest(app.server)
      .put("/funds/00000000-0000-0000-0000-000000000000")
      .set("Authorization", token)
      .send({ status: "Closed" });

    expect(res.status).toBe(404);
  });
});
