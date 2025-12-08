import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { login, loginAsSecretary } from "./utils/auth-helpers";
import { getAnyCareerSubject } from "./utils/test-data";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { User } from "@/entities/users/user.entity";

describe("Prerequisites (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let secretaryToken: string;
  let studentToken: string;
  let careerId: number;
  let orderNo: number;
  let studentId: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    await ensureTestSeed(dataSource);

    secretaryToken = (await loginAsSecretary(app)).token || "";

    const careerSubject = await getAnyCareerSubject(dataSource);
    if (!careerSubject) {
      throw new Error("No hay career_subjects cargados");
    }
    careerId = careerSubject.careerId;
    orderNo = careerSubject.orderNo;

    const careerStudent = await dataSource
      .getRepository(CareerStudent)
      .findOne({ where: { careerId }, order: { id: "ASC" } });
    if (!careerStudent) {
      throw new Error("No hay career_students para validar correlativas");
    }

    studentId = careerStudent.studentId;
    const studentEmail =
      (
        await dataSource
          .getRepository(User)
          .findOne({ where: { id: studentId } })
      )?.email || "carla.suarez@siaade.local";
    studentToken = (await login(app, studentEmail)).token ?? "";
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it("obtiene correlativas de una materia", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/prerequisites/careers/${careerId}/subjects/${orderNo}`)
      .set("Authorization", `Bearer ${secretaryToken}`);

    expect(res.status).toBe(200);
    expect(res.body?.careerId ?? res.body?.data?.careerId).toBe(careerId);
  });

  it("actualiza correlativas (PUT)", async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/prerequisites/careers/${careerId}/subjects/${orderNo}`)
      .set("Authorization", `Bearer ${secretaryToken}`)
      .send({ prereqs: [] });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.prereqs ?? res.body?.data?.prereqs)).toBe(
      true,
    );
  });

  it("valida correlativas para un alumno", async () => {
    const res = await request(app.getHttpServer())
      .get(
        `/api/prerequisites/careers/${careerId}/students/${studentId}/validate`,
      )
      .query({ targetOrderNo: orderNo })
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("canEnroll");
  });

  it("devuelve overview de correlativas", async () => {
    const res = await request(app.getHttpServer())
      .get(
        `/api/prerequisites/careers/${careerId}/students/${studentId}/overview`,
      )
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
