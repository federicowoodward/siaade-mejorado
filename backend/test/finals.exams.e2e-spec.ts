import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { login, loginAsSecretary, loginAsTeacher } from "./utils/auth-helpers";
import { findSubjectTeacherStudent } from "./utils/test-data";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { User } from "@/entities/users/user.entity";

describe("Final exams (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let secretaryToken: string;
  let teacherToken: string;
  let examTableId: number;
  let finalExamId: number;
  let linkId: number;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    await ensureTestSeed(dataSource);

    secretaryToken = (await loginAsSecretary(app)).token || "";

    const mapping = (await findSubjectTeacherStudent(dataSource)) ??
      // #ASUMIENDO NEGOCIO: fallback simple
      { subjectId: 1, studentId: "", teacherId: "" };

    const teacherEmail =
      (
        await dataSource
          .getRepository(User)
          .findOne({ where: { id: mapping.teacherId } })
      )?.email || "ana.martinez@siaade.local"; // #ASUMIENDO NEGOCIO
    teacherToken = (await login(app, teacherEmail)).token ?? "";

    const tableRes = await request(app.getHttpServer())
      .post("/api/finals/exam-table/init")
      .set("Authorization", `Bearer ${secretaryToken}`)
      .send({
        name: `Mesa finales ${Date.now()}`,
        start_date: "2025-03-01",
        end_date: "2025-03-10",
      });
    examTableId =
      tableRes.body?.id ??
      tableRes.body?.data?.id ??
      tableRes.body?.data?.examTableId;

    const examRes = await request(app.getHttpServer())
      .post("/api/finals/exam/create")
      .set("Authorization", `Bearer ${secretaryToken}`)
      .send({
        exam_table_id: examTableId,
        subject_id: mapping.subjectId,
        exam_date: "2025-03-05",
        aula: "101",
      });

    finalExamId = examRes.body?.id ?? examRes.body?.data?.id;

    const link = await dataSource.getRepository(FinalExamsStudent).findOne({
      where: {
        finalExamId,
        studentId: mapping.studentId,
      },
    });
    if (link?.id) {
      linkId = link.id;
    }
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it("crea examen final dentro de mesa", async () => {
    expect(finalExamId).toBeDefined();
  });

  it("lista examenes de la mesa", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/finals/exam/list-all/${examTableId}`)
      .set("Authorization", `Bearer ${secretaryToken}`);

    expect(res.status).toBe(200);
    const list = res.body?.data ?? res.body;
    const found = (list || []).some((row: any) => row.id === finalExamId);
    expect(found).toBe(true);
  });

  it("obtiene detalle de examen final", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/finals/exam/list/${finalExamId}`)
      .set("Authorization", `Bearer ${secretaryToken}`);

    expect(res.status).toBe(200);
    expect(res.body?.id ?? res.body?.data?.id).toBe(finalExamId);
  });

  it("registra nota de final", async () => {
    if (!linkId) {
      // crear vínculo mínimo si no existía
      const repo = dataSource.getRepository(FinalExamsStudent);
      const created = await repo.save({
        finalExamId,
        studentId: (await findSubjectTeacherStudent(dataSource))?.studentId,
        enrolledAt: new Date(),
        enrolledBy: "student" as const,
        score: null,
        notes: "",
      });
      linkId = created.id;
    }

    const res = await request(app.getHttpServer())
      .post("/api/finals/exam/record")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        final_exams_student_id: linkId,
        score: 9,
        notes: "Excelente",
        recorded_by: undefined,
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body?.ok).toBe(true);
  });

  it("elimina examen final", async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/finals/exam/delete/${finalExamId}`)
      .set("Authorization", `Bearer ${secretaryToken}`);

    expect(res.status).toBe(200);
    expect(res.body?.deleted ?? res.body?.data?.deleted).toBe(true);
  });
});
