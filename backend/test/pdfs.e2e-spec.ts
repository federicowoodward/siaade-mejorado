import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { loginAsSecretary } from "./utils/auth-helpers";
import { findSubjectTeacherStudent } from "./utils/test-data";

describe("PDFs (e2e)", () => {
  let app: INestApplication;
  let token: string;
  let studentId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureTestSeed(app.get(DataSource));
    token = (await loginAsSecretary(app)).token || "";

    const mapping = await findSubjectTeacherStudent(app.get(DataSource));
    if (!mapping) {
      throw new Error("No hay alumno para probar PDFs");
    }
    studentId = mapping.studentId;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  const expectPdf = (res: request.Response) => {
    expect(res.status).toBe(200);
    expect(res.headers["content-type"] || "").toContain("pdf");
    expect(Buffer.isBuffer(res.body)).toBe(true);
  };

  it("genera certificado de alumno", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/generatePdf/student-certificate/${studentId}`)
      .set("Authorization", `Bearer ${token}`)
      .buffer()
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expectPdf(res);
  });

  it("genera recibo de inscripción a examen", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/generatePdf/exam-registration-receipt/${studentId}`)
      .set("Authorization", `Bearer ${token}`)
      .buffer()
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expectPdf(res);
  });

  it("genera rendimiento académico", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/generatePdf/academic-performance/${studentId}`)
      .set("Authorization", `Bearer ${token}`)
      .buffer()
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expectPdf(res);
  });
});
