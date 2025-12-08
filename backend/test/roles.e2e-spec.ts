import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { loginAsSecretary } from "./utils/auth-helpers";

describe("Roles (e2e)", () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureTestSeed(app.get(DataSource));
    const login = await loginAsSecretary(app);
    token = login.token || "";
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it("lista roles disponibles", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/roles")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
