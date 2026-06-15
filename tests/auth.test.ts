import supertest from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./setup.js";

describe("Auth", () => {
  it("POST /auth/login returns 200 with token for valid credentials", async () => {
    const res = await supertest(app.server)
      .post("/auth/login")
      .send({ email: "admin@titanbay.com", password: "admin123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({ email: "admin@titanbay.com", role: "admin" });
  });

  it("POST /auth/login returns 401 for wrong password", async () => {
    const res = await supertest(app.server)
      .post("/auth/login")
      .send({ email: "admin@titanbay.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("POST /auth/login returns 404 for unknown email", async () => {
    const res = await supertest(app.server)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(res.status).toBe(404);
  });

  it("GET /funds returns 401 when no token provided", async () => {
    const res = await supertest(app.server).get("/funds");
    expect(res.status).toBe(401);
  });

  it("GET /funds returns non-401 when valid token provided", async () => {
    const loginRes = await supertest(app.server)
      .post("/auth/login")
      .send({ email: "investor@titanbay.com", password: "investor123" });

    const token = `Bearer ${loginRes.body.token}`;

    const res = await supertest(app.server).get("/funds").set("Authorization", token);

    expect(res.status).not.toBe(401);
  });
});
