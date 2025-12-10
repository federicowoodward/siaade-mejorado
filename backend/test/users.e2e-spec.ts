import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import request from "supertest";
import { createTestApp, closeTestApp } from "./utils/test-app.factory";
import { ensureTestSeed } from "./utils/test-seed";
import { loginAsSecretary } from "./utils/auth-helpers";
import { ROLE, ROLE_IDS } from "@/shared/rbac/roles.constants";
import { User } from "@/entities/users/user.entity";

describe("Users (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let secretaryToken: string;

  const createdUsers: Record<string, string> = {};

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    await ensureTestSeed(dataSource);
    const login = await loginAsSecretary(app);
    secretaryToken = login.token || "";
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  const auth = () => ({ Authorization: `Bearer ${secretaryToken}` });
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  it("rechaza listado sin token", async () => {
    const res = await request(app.getHttpServer()).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("crea un secretary", async () => {
    const email = `secretary+${Date.now()}@test.local`;
    const payload = {
      name: "Sec",
      lastName: "Tester",
      email,
      password: "secret12",
      cuil: `20${Date.now().toString().slice(-9)}`,
      isDirective: true,
    };

    const res = await request(app.getHttpServer())
      .post("/api/users/secretary")
      .set(auth())
      .send(payload);

    expect(res.status).toBe(201);

    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email } });
    expect(user?.roleId).toBe(ROLE_IDS[ROLE.SECRETARY]);
    if (user?.id) createdUsers.secretary = user.id;
  });

  it("crea un preceptor", async () => {
    const email = `preceptor+${Date.now()}@test.local`;
    const payload = {
      name: "Prec",
      lastName: "Tester",
      email,
      password: "secret12",
      cuil: `23${Date.now().toString().slice(-9)}`,
      userInfo: {
        documentValue: `40${Date.now().toString().slice(-6)}`,
        phone: "3511234567",
      },
    };

    const res = await request(app.getHttpServer())
      .post("/api/users/preceptor")
      .set(auth())
      .send(payload);

    expect(res.status).toBe(201);

    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email } });
    expect(user?.roleId).toBe(ROLE_IDS[ROLE.PRECEPTOR]);
    if (user?.id) createdUsers.preceptor = user.id;
  });

  it("crea un teacher", async () => {
    const email = `teacher+${Date.now()}@test.local`;
    const payload = {
      name: "Teach",
      lastName: "Tester",
      email,
      password: "secret12",
      cuil: `24${Date.now().toString().slice(-9)}`,
      userInfo: {
        documentValue: `41${Date.now().toString().slice(-6)}`,
      },
      commonData: {
        sex: "X",
        birthDate: "1990-01-01",
      },
    };

    const res = await request(app.getHttpServer())
      .post("/api/users/teacher")
      .set(auth())
      .send(payload);

    expect(res.status).toBe(201);

    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email } });
    expect(user?.roleId).toBe(ROLE_IDS[ROLE.TEACHER]);
    if (user?.id) createdUsers.teacher = user.id;
  });

  it("rechaza un teacher menor de 16 años", async () => {
    const email = `teacher-underage+${Date.now()}@test.local`;
    const birthDate = new Date();
    birthDate.setUTCFullYear(birthDate.getUTCFullYear() - 15);
    const payload = {
      name: "Teach",
      lastName: "Young",
      email,
      password: "secret12",
      cuil: `28${Date.now().toString().slice(-9)}`,
      userInfo: {
        documentValue: `41${Date.now().toString().slice(-6)}`,
      },
      commonData: {
        sex: "X",
        birthDate: formatDate(birthDate),
      },
    };

    const res = await request(app.getHttpServer())
      .post("/api/users/teacher")
      .set(auth())
      .send(payload);

    expect(res.status).toBe(400);
    const msg = Array.isArray(res.body?.message)
      ? res.body.message.join(" ")
      : res.body?.message;
    expect(String(msg)).toContain("16");
  });

  it("crea un student", async () => {
    const email = `student+${Date.now()}@test.local`;
    const payload = {
      name: "Stu",
      lastName: "Tester",
      email,
      password: "secret12",
      cuil: `25${Date.now().toString().slice(-9)}`,
      legajo: `LEG${Date.now().toString().slice(-5)}`,
      userInfo: {
        documentValue: `42${Date.now().toString().slice(-6)}`,
      },
      commonData: {
        sex: "F",
        birthDate: "1995-05-05",
      },
      studentStartYear: 2024,
    };

    const res = await request(app.getHttpServer())
      .post("/api/users/student")
      .set(auth())
      .send(payload);

    expect(res.status).toBe(201);

    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email }, relations: ["student"] });
    expect(user?.roleId).toBe(ROLE_IDS[ROLE.STUDENT]);
    expect(user?.student?.legajo).toBe(payload.legajo);
    if (user?.id) {
      createdUsers.student = user.id;
    }
  });

  it("rechaza un student con año de inicio menor a 16 años desde el nacimiento", async () => {
    const email = `student-underage-year+${Date.now()}@test.local`;
    const birthDate = new Date();
    birthDate.setUTCFullYear(birthDate.getUTCFullYear() - 18);
    const invalidStartYear = birthDate.getUTCFullYear() + 10;
    const payload = {
      name: "Stu",
      lastName: "Tester",
      email,
      password: "secret12",
      cuil: `29${Date.now().toString().slice(-9)}`,
      legajo: `LEG${Date.now().toString().slice(-5)}`,
      userInfo: {
        documentValue: `43${Date.now().toString().slice(-6)}`,
      },
      commonData: {
        sex: "F",
        birthDate: formatDate(birthDate),
      },
      studentStartYear: invalidStartYear,
    };

    const res = await request(app.getHttpServer())
      .post("/api/users/student")
      .set(auth())
      .send(payload);

    expect(res.status).toBe(400);
    const msg = Array.isArray(res.body?.message)
      ? res.body.message.join(" ")
      : res.body?.message;
    expect(String(msg)).toContain("16");
  });

  it("bloquea un usuario", async () => {
    const targetId = createdUsers.student;
    const res = await request(app.getHttpServer())
      .patch(`/api/users/${targetId}/block`)
      .set(auth())
      .send({ reason: "Prueba de bloqueo" });

    expect(res.status).toBe(200);
    expect(res.body?.data?.isBlocked).toBe(true);
    expect(res.body?.data?.blockedReason).toBe("Prueba de bloqueo");
  });

  it("desbloquea un usuario", async () => {
    const targetId = createdUsers.student;
    const res = await request(app.getHttpServer())
      .patch(`/api/users/${targetId}/unblock`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body?.data?.isBlocked).toBe(false);
  });

  it("inactiva un usuario", async () => {
    const targetId = createdUsers.student;
    const res = await request(app.getHttpServer())
      .patch(`/api/users/${targetId}/inactivate`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body?.data?.isActive).toBe(false);
  });

  it("activa un usuario", async () => {
    const targetId = createdUsers.student;
    const res = await request(app.getHttpServer())
      .patch(`/api/users/${targetId}/activate`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body?.data?.isActive).toBe(true);
  });

  it("lista usuarios", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/users")
      .set(auth());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it("obtiene usuario por id", async () => {
    const targetId = createdUsers.teacher;
    const res = await request(app.getHttpServer())
      .get(`/api/users/${targetId}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body?.data?.id).toBe(targetId);
  });

  it("actualiza nombre de usuario", async () => {
    const targetId = createdUsers.teacher;
    const newName = "Teacher Updated";
    const res = await request(app.getHttpServer())
      .put(`/api/users/${targetId}`)
      .set(auth())
      .send({ name: newName });

    expect(res.status).toBe(200);
    expect(res.body?.data?.name ?? res.body?.data?.user?.name).toBe(newName);
  });

  it("elimina un usuario", async () => {
    const email = `delete+${Date.now()}@test.local`;
    const payload = {
      name: "ToDelete",
      lastName: "Tester",
      email,
      password: "secret12",
      cuil: `26${Date.now().toString().slice(-9)}`,
    };
    const createRes = await request(app.getHttpServer())
      .post("/api/users/secretary")
      .set(auth())
      .send(payload);
    expect(createRes.status).toBe(201);
    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email } });
    const res = await request(app.getHttpServer())
      .delete(`/api/users/${user?.id}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body?.data?.deleted).toBe(true);
  });
});
