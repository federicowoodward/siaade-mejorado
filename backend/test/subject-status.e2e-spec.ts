import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { loginAsSecretary } from "./utils/auth-helpers";
import { findSubjectTeacherStudent } from "./utils/test-data";

describe("Subject status and grades (e2e)", () => {
  let app: INestApplication;
  let token: string;
  let subjectId: number;
  let commissionId: number;
  let studentId: string;
  let teacherId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureTestSeed(app.get(DataSource));
    token = (await loginAsSecretary(app)).token || "";

    const mapping = await findSubjectTeacherStudent(app.get(DataSource));
    if (!mapping) {
      throw new Error("No hay datos de materia/comisión para pruebas de status");
    }
    subjectId = mapping.subjectId;
    commissionId = mapping.commissionId || mapping.subjectId;
    studentId = mapping.studentId;
    teacherId = mapping.teacherId;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it("obtiene situación académica de la materia", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/subjects/${subjectId}/academic-situation`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("rows");
  });

  it("actualiza ventana de notas", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/subjects/commissions/${commissionId}/grade-window`)
      .set("Authorization", `Bearer ${token}`)
      .send({ deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() });

    expect(res.status).toBe(200);
  });

  it("actualiza nota puntual de alumno", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/subjects/${subjectId}/grades/${studentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ note1: 7 });

    expect(res.status).toBe(200);
    expect(res.body?.studentId ?? res.body?.data?.studentId).toBe(studentId);
  });

  it("actualiza docente de materia", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/subjects/${subjectId}/teacher`)
      .set("Authorization", `Bearer ${token}`)
      .send({ teacherId });

    expect(res.status).toBe(200);
  });

  it("mueve alumno de comisión", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/subjects/${subjectId}/students/${studentId}/commission`)
      .set("Authorization", `Bearer ${token}`)
      .send({ toCommissionId: commissionId });

    expect(res.status).toBe(200);
    expect(res.body?.studentId ?? res.body?.data?.studentId).toBe(studentId);
  });

  it("actualiza celda individual via subject-status", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/subject-status/${commissionId}/grades/${studentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ path: "note1", value: 6 });

    expect(res.status).toBe(200);
    expect(res.body?.studentId ?? res.body?.data?.studentId).toBe(studentId);
  });

  it("lista estados de materia", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/subject-status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("lista notas de una comisión", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/subject-status/${commissionId}/grades`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("lista notas por materia", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/subject-status/${subjectId}/grades`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("commissions");
  });
});
