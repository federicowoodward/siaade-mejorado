import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { login, loginAsPreceptor } from "./utils/auth-helpers";
import { findSubjectTeacherStudent } from "./utils/test-data";
import { User } from "@/entities/users/user.entity";

describe("Subject enrollments toggle (e2e)", () => {
  let app: INestApplication;
  let token: string;
  let commissionId: number;
  let studentId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureTestSeed(app.get(DataSource));

    const mapping = await findSubjectTeacherStudent(app.get(DataSource));
    if (!mapping) {
      throw new Error("No hay subject_commissions disponibles");
    }
    commissionId = mapping.commissionId || mapping.subjectId;
    studentId = mapping.studentId;

    // usar token de preceptor para inscribir
    const preceptorLogin = await loginAsPreceptor(app);
    token = preceptorLogin.token || "";

    if (!token) {
      const email =
        (
          await app
            .get(DataSource)
            .getRepository(User)
            .findOne({ where: { id: studentId } })
        )?.email || "carla.suarez@siad.local";
      token = (await login(app, email)).token || "";
    }
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it("inscribe alumno en comisión", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/subjects/enrollments/toggle")
      .set("Authorization", `Bearer ${token}`)
      .send({
        entity: "subject",
        action: "enroll",
        studentId,
        subjectCommissionId: commissionId,
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body?.enrolled ?? res.body?.data?.enrolled).toBe(true);
  });

  it("desinscribe alumno de comisión", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/subjects/enrollments/toggle")
      .set("Authorization", `Bearer ${token}`)
      .send({
        entity: "subject",
        action: "unenroll",
        studentId,
        subjectCommissionId: commissionId,
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body?.enrolled ?? res.body?.data?.enrolled).toBe(false);
  });
});
