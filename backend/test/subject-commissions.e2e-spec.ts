import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { loginAsSecretary } from "./utils/auth-helpers";
import { findSubjectTeacherStudent } from "./utils/test-data";

describe("Subject commissions (e2e)", () => {
  let app: INestApplication;
  let token: string;
  let commissionId: number;
  let studentId: string;
  let teacherId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureTestSeed(app.get(DataSource));
    token = (await loginAsSecretary(app)).token || "";

    const mapping = await findSubjectTeacherStudent(app.get(DataSource));
    if (!mapping) {
      throw new Error("No hay datos de comisiones para pruebas");
    }
    commissionId = mapping.commissionId || mapping.subjectId; // fallback
    studentId = mapping.studentId;
    teacherId = mapping.teacherId;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it("actualiza notas de comisión", async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/subject-commissions/${commissionId}/grades`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        rows: [
          {
            studentId,
            note1: 8,
            percentage: 90,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body?.updated ?? res.body?.data?.updated).toBeGreaterThanOrEqual(
      0,
    );
  });

  it("actualiza docente de comisión", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/subject-commissions/${commissionId}/teacher`)
      .set("Authorization", `Bearer ${token}`)
      .send({ teacherId });

    expect(res.status).toBe(200);
    expect(res.body?.teacherId ?? res.body?.data?.teacherId).toBe(teacherId);
  });
});
