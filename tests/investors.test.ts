import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getAuthToken } from "./helpers.js";
import { app } from "./setup.js";

const VALID_INVESTOR = {
  name: "Test Institution",
  investor_type: "Institution",
  email: "test@institution.com",
};

describe("Investors", () => {
  let token: string;

  beforeEach(async () => {
    token = await getAuthToken(app, "investor");
  });

  it("POST /investors creates an investor and returns 201", async () => {
    const res = await supertest(app.server)
      .post("/investors")
      .set("Authorization", token)
      .send(VALID_INVESTOR);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe(VALID_INVESTOR.email);
  });

  it("POST /investors returns 400 for invalid email", async () => {
    const res = await supertest(app.server)
      .post("/investors")
      .set("Authorization", token)
      .send({ ...VALID_INVESTOR, email: "not-an-email" });

    expect(res.status).toBe(400);
  });

  it("POST /investors returns 409 if email already exists", async () => {
    await supertest(app.server)
      .post("/investors")
      .set("Authorization", token)
      .send(VALID_INVESTOR)
      .expect(201);

    const res = await supertest(app.server)
      .post("/investors")
      .set("Authorization", token)
      .send(VALID_INVESTOR);

    expect(res.status).toBe(409);
  });

  it("GET /investors returns an array", async () => {
    const res = await supertest(app.server).get("/investors").set("Authorization", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
