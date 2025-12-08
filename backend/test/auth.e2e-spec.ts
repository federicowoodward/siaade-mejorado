import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { loginAsSecretary } from "./utils/auth-helpers";

describe("Auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureTestSeed(app.get(DataSource));
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it("login válido devuelve token", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ identity: "sec.auto4@example.com", password: "changeme" });

    expect(res.status).toBe(200);
    expect(res.body?.accessToken).toBeDefined();
  });

  it("login inválido responde 401", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ identity: "sec.auto4@example.com", password: "wrong-pass" });

    expect(res.status).toBe(401);
  });

  it("logout con token válido responde OK", async () => {
    const { token } = await loginAsSecretary(app);

    const res = await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("success");
  });
});
