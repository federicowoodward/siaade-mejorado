import { DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";
import { ROLE, ROLE_IDS } from "@/shared/rbac/roles.constants";
import { Role } from "@/entities/roles/role.entity";
import { User } from "@/entities/users/user.entity";
import { Teacher } from "@/entities/users/teacher.entity";
import { Student } from "@/entities/users/student.entity";
import { Preceptor } from "@/entities/users/preceptor.entity";
import { Secretary } from "@/entities/users/secretary.entity";

let seeded = false;

type SeedUser = {
  email: string;
  role: ROLE;
  name: string;
  lastName: string;
  cuil: string;
  password: string;
  kind?: "teacher" | "student" | "preceptor" | "secretary";
};

const DEFAULT_PASSWORD = process.env.TEST_USER_PASSWORD || "changeme";

// #ASUMIENDO NEGOCIO: usuarios base para autenticarse en tests
const SEED_USERS: SeedUser[] = [
  {
    email: process.env.TEST_ADMIN_EMAIL || "executive@siad.local",
    role: ROLE.EXECUTIVE_SECRETARY,
    name: "Exec",
    lastName: "Test",
    cuil: "20999900001",
    password: DEFAULT_PASSWORD,
    kind: "secretary",
  },
  {
    email: process.env.TEST_SECRETARY_EMAIL || "sec.auto4@example.com",
    role: ROLE.SECRETARY,
    name: "Secretario",
    lastName: "Sistema",
    cuil: "21000000000",
    password: DEFAULT_PASSWORD,
    kind: "secretary",
  },
  {
    email: process.env.TEST_PRECEPTOR_EMAIL || "preceptor@siad.local",
    role: ROLE.PRECEPTOR,
    name: "Preceptor",
    lastName: "Test",
    cuil: "22000000000",
    password: DEFAULT_PASSWORD,
    kind: "preceptor",
  },
  {
    email: process.env.TEST_TEACHER_EMAIL || "ana.martinez@siad.local",
    role: ROLE.TEACHER,
    name: "Ana",
    lastName: "Martinez",
    cuil: "20000000101",
    password: DEFAULT_PASSWORD,
    kind: "teacher",
  },
  {
    email: process.env.TEST_STUDENT_EMAIL || "carla.suarez@siad.local",
    role: ROLE.STUDENT,
    name: "Carla",
    lastName: "Suarez",
    cuil: "20300000101",
    password: DEFAULT_PASSWORD,
    kind: "student",
  },
];

export async function ensureTestSeed(dataSource: DataSource) {
  if (seeded) return;
  seeded = true;

  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const teacherRepo = dataSource.getRepository(Teacher);
  const studentRepo = dataSource.getRepository(Student);
  const preceptorRepo = dataSource.getRepository(Preceptor);
  const secretaryRepo = dataSource.getRepository(Secretary);

  for (const role of Object.values(ROLE)) {
    const desiredId = ROLE_IDS[role];
    const exists = await roleRepo.findOne({ where: { name: role } });
    if (!exists) {
      await roleRepo.insert({ id: desiredId, name: role });
    }
  }

  for (const seed of SEED_USERS) {
    let user = await userRepo.findOne({ where: { email: seed.email } });
    if (!user) {
      const hashed = await bcrypt.hash(seed.password, 10);
      user = userRepo.create({
        email: seed.email,
        name: seed.name,
        lastName: seed.lastName,
        cuil: seed.cuil,
        password: hashed,
        roleId: ROLE_IDS[seed.role],
      });
      await userRepo.save(user);
    }
    // Refrescar datos clave para estabilidad de tests (password/role/flags)
    const updates: Partial<User> = {};
    const hashed = await bcrypt.hash(seed.password, 10);
    updates.password = hashed;
    if (user.roleId !== ROLE_IDS[seed.role]) {
      updates.roleId = ROLE_IDS[seed.role];
    }
    if ((user as any).isBlocked) {
      (updates as any).isBlocked = false;
      (updates as any).blockedReason = null;
    }
    if ((user as any).isActive === false) {
      (updates as any).isActive = true;
    }
    if (Object.keys(updates).length) {
      await userRepo.update({ id: user.id }, updates);
      user = await userRepo.findOneOrFail({ where: { id: user.id } });
    }

    switch (seed.kind) {
      case "teacher": {
        const existing = await teacherRepo.findOne({
          where: { userId: user.id },
        });
        if (!existing) {
          await teacherRepo.insert({ userId: user.id, isActive: true });
        }
        break;
      }
      case "student": {
        const existing = await studentRepo.findOne({
          where: { userId: user.id },
        });
        if (!existing) {
          await studentRepo.insert({
            userId: user.id,
            legajo: "ATST01",
            commissionId: null,
            isActive: true,
            studentStartYear: 2026,
          });
        }
        break;
      }
      case "preceptor": {
        const existing = await preceptorRepo.findOne({
          where: { userId: user.id },
        });
        if (!existing) {
          await preceptorRepo.insert({ userId: user.id, isActive: true });
        }
        break;
      }
      case "secretary": {
        const existing = await secretaryRepo.findOne({
          where: { userId: user.id },
        });
        if (!existing) {
          await secretaryRepo.insert({ userId: user.id, isDirective: false });
        }
        break;
      }
      default:
        break;
    }
  }
}
