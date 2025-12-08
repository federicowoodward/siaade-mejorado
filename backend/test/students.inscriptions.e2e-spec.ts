import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { login, loginAsSecretary } from "./utils/auth-helpers";
import { findSubjectTeacherStudent } from "./utils/test-data";
import { User } from "@/entities/users/user.entity";

describe("Students inscriptions (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let studentToken: string;
  let secretaryToken: string;
  let examTableId: number;
  let finalExamId: number;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    await ensureTestSeed(dataSource);

    secretaryToken = (await loginAsSecretary(app)).token || "";

    const mapping = await findSubjectTeacherStudent(dataSource);
    if (!mapping) {
      throw new Error("No hay datos de materia/alumno para pruebas de inscripciones");
    }

    const studentEmail =
      (
        await dataSource
          .getRepository(User)
          .findOne({ where: { id: mapping.studentId } })
      )?.email || "carla.suarez@siaade.local";
    studentToken = (await login(app, studentEmail)).token ?? "";

    const tableRes = await request(app.getHttpServer())
      .post("/api/finals/exam-table/init")
      .set("Authorization", `Bearer ${secretaryToken}`)
      .send({
        name: `Mesa inscripciones ${Date.now()}`,
        start_date: "2025-04-01",
        end_date: "2025-04-05",
      });
    examTableId =
      tableRes.body?.id ?? tableRes.body?.data?.id ?? tableRes.body?.data?.examTableId;

    const examRes = await request(app.getHttpServer())
      .post("/api/finals/exam/create")
      .set("Authorization", `Bearer ${secretaryToken}`)
      .send({
        exam_table_id: examTableId,
        subject_id: mapping.subjectId,
        exam_date: "2025-04-03",
      });
    finalExamId = examRes.body?.id ?? examRes.body?.data?.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it("lista mesas disponibles para alumno", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/students/inscriptions/exam-tables")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const list = res.body?.data ?? [];
    const found = list.some((entry: any) => entry.mesaId === examTableId);
    expect(found).toBe(true);
  });

  it("inscribe al alumno en una mesa", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/students/inscriptions/exam-tables/${examTableId}/enroll`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ callId: finalExamId });

    expect(res.status).toBe(201);
    expect(res.body?.ok).toBe(true);
  });

  it("muestra la mesa en enrolled", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/students/inscriptions/exam-tables/enrolled")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const data = res.body?.data ?? [];
    const found = data.some((entry: any) => entry.mesaId === examTableId);
    expect(found).toBe(true);
  });

  it("desinscribe al alumno", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/students/inscriptions/exam-tables/${examTableId}/unenroll`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ callId: finalExamId });

    expect(res.status).toBe(201);
    expect(res.body?.ok).toBe(true);
  });

  it("ya no aparece en enrolled después de desinscribir", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/students/inscriptions/exam-tables/enrolled")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const data = res.body?.data ?? [];
    const found = data.some((entry: any) => entry.mesaId === examTableId);
    expect(found).toBe(false);
  });

  it("audita un evento de inscripción", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/students/inscriptions/audit-events")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        context: "test-audit",
        mesaId: examTableId,
        callId: finalExamId,
        outcome: "blocked",
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body?.ok).toBe(true);
  });
});
