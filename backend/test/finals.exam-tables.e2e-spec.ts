import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { loginAsSecretary } from "./utils/auth-helpers";

describe("Final exam tables (e2e)", () => {
  let app: INestApplication;
  let token: string;
  let createdId: number;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureTestSeed(app.get(DataSource));
    const login = await loginAsSecretary(app);
    token = login.token || "";
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it("requiere autenticación para crear", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/finals/exam-table/init")
      .send({});
    expect(res.status).toBe(401);
  });

  it("crea mesa de examen", async () => {
    const payload = {
      name: `Mesa ${Date.now()}`,
      start_date: "2025-02-01",
      end_date: "2025-02-10",
    };

    const res = await request(app.getHttpServer())
      .post("/api/finals/exam-table/init")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    createdId =
      res.body?.id ?? res.body?.data?.id ?? res.body?.data?.examTableId;
    expect(createdId).toBeDefined();
  });

  it("edita mesa de examen", async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/finals/exam-table/edit/${createdId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Mesa Editada" });

    expect(res.status).toBe(200);
    expect(res.body?.name ?? res.body?.data?.name).toBe("Mesa Editada");
  });

  it("lista mesas e incluye la creada", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/finals/exam-table/list")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const list = Array.isArray(res.body) ? res.body : res.body?.data;
    const found = (list || []).some(
      (row: any) => row.id === createdId || row?.exam_table_id === createdId,
    );
    expect(found).toBe(true);
  });

  it("elimina mesa de examen", async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/finals/exam-table/delete/${createdId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.deleted ?? res.body?.data?.deleted).toBe(true);
  });
});
