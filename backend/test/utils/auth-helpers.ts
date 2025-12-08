import { INestApplication } from "@nestjs/common";
import request from "supertest";

export type LoginResponse = {
  token: string | null;
  user?: any;
  raw: request.Response;
};

const DEFAULT_PASSWORD =
  process.env.TEST_USER_PASSWORD || "changeme"; // #ASUMIENDO NEGOCIO: contraseñas semilla

const DEFAULT_EMAILS = {
  admin: process.env.TEST_ADMIN_EMAIL || "executive@siaade.local", // #ASUMIENDO NEGOCIO
  secretary:
    process.env.TEST_SECRETARY_EMAIL || "sec.auto4@example.com", // seeded in InitSchema
  preceptor: process.env.TEST_PRECEPTOR_EMAIL || "preceptor@siaade.local",
  teacher: process.env.TEST_TEACHER_EMAIL || "ana.martinez@siaade.local",
  student: process.env.TEST_STUDENT_EMAIL || "carla.suarez@siaade.local",
};

export async function login(
  app: INestApplication,
  identity: string,
  password: string = DEFAULT_PASSWORD,
): Promise<LoginResponse> {
  const raw = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ identity, password });

  const token = raw.body?.accessToken ?? raw.body?.data?.accessToken ?? null;
  const user = raw.body?.user ?? raw.body?.data?.user;
  return { token, user, raw };
}

export async function loginAsAdmin(
  app: INestApplication,
): Promise<LoginResponse> {
  return login(app, DEFAULT_EMAILS.admin);
}

export async function loginAsSecretary(
  app: INestApplication,
): Promise<LoginResponse> {
  return login(app, DEFAULT_EMAILS.secretary);
}

export async function loginAsTeacher(
  app: INestApplication,
): Promise<LoginResponse> {
  return login(app, DEFAULT_EMAILS.teacher);
}

export async function loginAsPreceptor(
  app: INestApplication,
): Promise<LoginResponse> {
  return login(app, DEFAULT_EMAILS.preceptor);
}

export async function loginAsStudent(
  app: INestApplication,
): Promise<LoginResponse> {
  return login(app, DEFAULT_EMAILS.student);
}
