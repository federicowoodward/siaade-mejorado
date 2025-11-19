import { In, MigrationInterface, QueryRunner } from "typeorm";
import { Commission } from "../../entities/catalogs/commission.entity";
import { Role } from "../../entities/roles/role.entity";
import { User } from "../../entities/users/user.entity";
import { Teacher } from "../../entities/users/teacher.entity";
import { Student } from "../../entities/users/student.entity";
import { Career } from "../../entities/registration/career.entity";
import { CareerSubject } from "../../entities/registration/career-subject.entity";
import { CareerStudent } from "../../entities/registration/career-student.entity";
import { SubjectCommission } from "../../entities/subjects/subject-commission.entity";
import { SubjectStudent } from "../../entities/subjects/subject-student.entity";
import { StudentSubjectProgress } from "../../entities/subjects/student-subject-progress.entity";
import { FinalExam } from "../../entities/finals/final-exam.entity";
import { FinalExamsStudent } from "../../entities/finals/final-exams-student.entity";

/**
 * DUMMY DEV SEED - SIAADE
 * Objetivo: simular procesos reales de inicializacion sin construirlos hoy.
 * Orden: commissions -> teachers/students -> career_students -> subject_commissions -> subject_students -> student_subject_progress -> final_exams_students (opcional).
 * Idempotente, transaccional, con logs.
 * WARNING: Este seed borra SOLO los datos dummy en down(), nunca datos reales.
 */

const DUMMY_ENROLLMENT_DATE = new Date("2026-03-01");
const ENROLL_ALL_SUBJECTS = true;
const PRELOAD_FINALS = true;
const EMAIL_DOMAIN = "@siaade.local";
const LEGAJO_PREFIX = "A";
const TARGET_CAREER_NAME = "Tecnicatura de desarrollo en software";
const MIN_DUMMY_STUDENTS = 20;
const DEFAULT_STUDENT_START_YEAR = 2026;
const CHUNK_SIZE = 500;
type TeacherSeed = {
  name: string;
  lastName: string;
  email: string;
  cuil: string;
};

type StudentSeed = {
  name: string;
  lastName: string;
  email: string;
  cuil: string;
  legajo: string;
};

const DEFAULT_TEACHERS: TeacherSeed[] = [
  {
    name: "Ana",
    lastName: "Martinez",
    email: "ana.martinez@siaade.local",
    cuil: "20000000101",
  },
  {
    name: "Luis",
    lastName: "Fernandez",
    email: "luis.fernandez@siaade.local",
    cuil: "20000000102",
  },
  {
    name: "Maria",
    lastName: "Lopez",
    email: "maria.lopez@siaade.local",
    cuil: "20000000103",
  },
  {
    name: "Jorge",
    lastName: "Ramirez",
    email: "jorge.ramirez@siaade.local",
    cuil: "20000000104",
  },
];

const BASE_STUDENTS: StudentSeed[] = [
  {
    name: "Carla",
    lastName: "Suarez",
    email: "carla.suarez@siaade.local",
    cuil: "20300000101",
    legajo: "A0001",
  },
  {
    name: "Diego",
    lastName: "Mendez",
    email: "diego.mendez@siaade.local",
    cuil: "20300000102",
    legajo: "A0002",
  },
  {
    name: "Lucia",
    lastName: "Perez",
    email: "lucia.perez@siaade.local",
    cuil: "20300000103",
    legajo: "A0003",
  },
  {
    name: "Martin",
    lastName: "Gimenez",
    email: "martin.gimenez@siaade.local",
    cuil: "20300000104",
    legajo: "A0004",
  },
  {
    name: "Sofia",
    lastName: "Rios",
    email: "sofia.rios@siaade.local",
    cuil: "20300000105",
    legajo: "A0005",
  },
  {
    name: "Nicolas",
    lastName: "Vega",
    email: "nicolas.vega@siaade.local",
    cuil: "20300000106",
    legajo: "A0006",
  },
];

const ROLE_SLUGS = {
  STUDENT: "student",
  TEACHER: "teacher",
  PRECEPTOR: "preceptor",
  SECRETARY: "secretary",
  EXECUTIVE_SECRETARY: "executive_secretary",
} as const;

const chunkArray = <T>(values: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
};

const buildStudentSeeds = (): Array<
  StudentSeed & { studentStartYear: number }
> => {
  const seeds: Array<StudentSeed & { studentStartYear: number }> =
    BASE_STUDENTS.map((seed) => ({
      ...seed,
      studentStartYear: DEFAULT_STUDENT_START_YEAR,
    }));

  if (seeds.length < MIN_DUMMY_STUDENTS) {
    for (
      let index = seeds.length + 1;
      index <= MIN_DUMMY_STUDENTS;
      index += 1
    ) {
      const padded = index.toString().padStart(4, "0");
      const legajo = `${LEGAJO_PREFIX}${padded}`;
      const email = `dummy${padded}${EMAIL_DOMAIN}`;
      const cuilNumber = 20300000100 + index;
      seeds.push({
        name: `Dummy ${padded}`,
        lastName: "Student",
        email,
        cuil: cuilNumber.toString(),
        legajo,
        studentStartYear: DEFAULT_STUDENT_START_YEAR,
      });
    }
  }

  return seeds;
};
export class DummyDataMigration1761015167693 implements MigrationInterface {
  name = "DummyDataMigration1761015167693";
  ALLOW_DUMMY_SEED = "true";

  public async up(queryRunner: QueryRunner): Promise<void> {
    //variable temporal para forzar migraciones:

    if (process.env.NODE_ENV === "production") {
      if (this.ALLOW_DUMMY_SEED !== "true") {
        console.log(
          "[DummyData] skipped in production (ALLOW_DUMMY_SEED != true)",
        );
        return;
      }
      console.log("[DummyData] running in production (ALLOW_DUMMY_SEED=true)");
    }

    await queryRunner.startTransaction();
    try {
      const manager = queryRunner.manager;
      const commissionRepo = manager.getRepository(Commission);
      const roleRepo = manager.getRepository(Role);
      const userRepo = manager.getRepository(User);
      const teacherRepo = manager.getRepository(Teacher);
      const studentRepo = manager.getRepository(Student);
      const careerRepo = manager.getRepository(Career);
      const careerSubjectRepo = manager.getRepository(CareerSubject);
      const careerStudentRepo = manager.getRepository(CareerStudent);
      const subjectCommissionRepo = manager.getRepository(SubjectCommission);
      const subjectStudentRepo = manager.getRepository(SubjectStudent);
      const studentSubjectProgressRepo = manager.getRepository(
        StudentSubjectProgress,
      );
      const finalExamRepo = manager.getRepository(FinalExam);
      const finalExamStudentRepo = manager.getRepository(FinalExamsStudent);

      const counters = {
        commissionsCreated: 0,
        teacherUsersCreated: 0,
        teacherUsersUpdated: 0,
        teachersCreated: 0,
        studentUsersCreated: 0,
        studentUsersUpdated: 0,
        studentsCreated: 0,
        studentsUpdated: 0,
        careerStudentsInserted: 0,
        subjectCommissionsCreated: 0,
        subjectStudentsInserted: 0,
        subjectStudentsSkipped: 0,
        studentProgressInserted: 0,
        studentProgressSkipped: 0,
        finalsLinked: 0,
      };

      const existingCommissions = await commissionRepo.find({
        where: { commissionLetter: In(["A", "B"]) },
      });
      const commissionByLetter = new Map<string, Commission>();
      existingCommissions.forEach((commission) => {
        if (commission.commissionLetter) {
          commissionByLetter.set(
            commission.commissionLetter.toUpperCase(),
            commission,
          );
        }
      });

      const missingCommissions = ["A", "B"]
        .filter((letter) => !commissionByLetter.has(letter))
        .map((letter) => ({ commissionLetter: letter }));

      if (missingCommissions.length > 0) {
        for (const chunk of chunkArray(missingCommissions, CHUNK_SIZE)) {
          await commissionRepo
            .createQueryBuilder()
            .insert()
            .values(chunk)
            .execute();
        }
        counters.commissionsCreated += missingCommissions.length;
      }

      const refreshedCommissions = await commissionRepo.find({
        where: { commissionLetter: In(["A", "B"]) },
      });
      refreshedCommissions.forEach((commission) => {
        if (commission.commissionLetter) {
          commissionByLetter.set(
            commission.commissionLetter.toUpperCase(),
            commission,
          );
        }
      });

      const commissionA = commissionByLetter.get("A");
      const commissionB = commissionByLetter.get("B");
      if (!commissionA || !commissionB) {
        throw new Error("Dummy seed: failed to ensure commissions A and B");
      }

      console.log(
        `[DummySeed] Commissions A/B -> created: ${counters.commissionsCreated}, reused: ${
          commissionByLetter.size - counters.commissionsCreated
        }, total available: ${commissionByLetter.size}`,
      );

      const teacherRole = await roleRepo.findOne({
        where: { name: ROLE_SLUGS.TEACHER },
      });
      if (!teacherRole) {
        throw new Error(
          "Dummy seed: role 'teacher' is required but was not found",
        );
      }

      const studentRole = await roleRepo.findOne({
        where: { name: ROLE_SLUGS.STUDENT },
      });
      if (!studentRole) {
        throw new Error(
          "Dummy seed: role 'student' is required but was not found",
        );
      }

      let teachers = await teacherRepo.find();
      if (teachers.length === 0) {
        for (const seed of DEFAULT_TEACHERS) {
          let teacherUser = await userRepo.findOne({
            where: { email: seed.email },
          });
          if (!teacherUser) {
            teacherUser = userRepo.create({
              name: seed.name,
              lastName: seed.lastName,
              email: seed.email,
              password: "changeme",
              cuil: seed.cuil,
              roleId: teacherRole.id,
            });
            await userRepo.save(teacherUser);
            counters.teacherUsersCreated += 1;
          } else {
            let needsUpdate = false;
            if (teacherUser.roleId !== teacherRole.id) {
              teacherUser.roleId = teacherRole.id;
              needsUpdate = true;
            }
            if (teacherUser.cuil !== seed.cuil) {
              teacherUser.cuil = seed.cuil;
              needsUpdate = true;
            }
            if (needsUpdate) {
              await userRepo.save(teacherUser);
              counters.teacherUsersUpdated += 1;
            }
          }

          const existingTeacher = await teacherRepo.findOne({
            where: { userId: teacherUser.id },
          });
          if (!existingTeacher) {
            await teacherRepo.insert({ userId: teacherUser.id });
            counters.teachersCreated += 1;
          }
        }
        teachers = await teacherRepo.find();
      }

      if (teachers.length === 0) {
        throw new Error(
          "Dummy seed: there are no teachers available even after attempting to create defaults",
        );
      }

      const teacherIds = teachers.map((teacher) => teacher.userId);
      console.log(
        `[DummySeed] Teachers -> created: ${counters.teachersCreated}, reused: ${
          teacherIds.length - counters.teachersCreated
        }, total available: ${teacherIds.length}`,
      );
      const careers = await careerRepo.find();
      let career: Career | null = null;
      if (careers.length === 1) {
        career = careers[0];
      } else {
        career =
          careers.find((item) => item.careerName === TARGET_CAREER_NAME) ??
          null;
      }
      if (!career) {
        throw new Error("Dummy seed: target career not found, aborting");
      }

      const careerSubjects = await careerSubjectRepo.find({
        where: { careerId: career.id },
        relations: { subject: true },
        order: { orderNo: "ASC" },
      });
      if (careerSubjects.length === 0) {
        throw new Error("Dummy seed: no subjects found for target career");
      }
      const subjectIds = careerSubjects.map((cs) => cs.subjectId);

      const existingSubjectCommissions = await subjectCommissionRepo.find({
        where: {
          subjectId: In(subjectIds),
          commissionId: In([commissionA.id, commissionB.id]),
        },
      });
      const subjectCommissionMap = new Map<
        number,
        { A?: number; B?: number }
      >();
      existingSubjectCommissions.forEach((entry) => {
        const letter =
          entry.commissionId === commissionA.id
            ? "A"
            : entry.commissionId === commissionB.id
              ? "B"
              : null;
        if (!letter) {
          return;
        }
        const current = subjectCommissionMap.get(entry.subjectId) ?? {};
        current[letter] = entry.id;
        subjectCommissionMap.set(entry.subjectId, current);
      });

      const commissionValuesToInsert: Array<{
        subjectId: number;
        commissionId: number;
        teacherId: string;
        active: boolean;
      }> = [];
      let teacherIndex = 0;
      for (const subjectId of subjectIds) {
        const mapping = subjectCommissionMap.get(subjectId) ?? {};
        if (!mapping.A) {
          commissionValuesToInsert.push({
            subjectId,
            commissionId: commissionA.id,
            teacherId: teacherIds[teacherIndex % teacherIds.length],
            active: true,
          });
          teacherIndex += 1;
        }
        if (!mapping.B) {
          commissionValuesToInsert.push({
            subjectId,
            commissionId: commissionB.id,
            teacherId: teacherIds[teacherIndex % teacherIds.length],
            active: true,
          });
          teacherIndex += 1;
        }
      }

      if (commissionValuesToInsert.length > 0) {
        for (const chunk of chunkArray(commissionValuesToInsert, CHUNK_SIZE)) {
          await subjectCommissionRepo
            .createQueryBuilder()
            .insert()
            .values(chunk)
            .orIgnore()
            .execute();
        }
        counters.subjectCommissionsCreated += commissionValuesToInsert.length;
      }

      const refreshedSubjectCommissions = await subjectCommissionRepo.find({
        where: {
          subjectId: In(subjectIds),
          commissionId: In([commissionA.id, commissionB.id]),
        },
      });
      refreshedSubjectCommissions.forEach((entry) => {
        const letter =
          entry.commissionId === commissionA.id
            ? "A"
            : entry.commissionId === commissionB.id
              ? "B"
              : null;
        if (!letter) {
          return;
        }
        const current = subjectCommissionMap.get(entry.subjectId) ?? {};
        current[letter] = entry.id;
        subjectCommissionMap.set(entry.subjectId, current);
      });

      for (const subjectId of subjectIds) {
        const mapping = subjectCommissionMap.get(subjectId);
        if (!mapping?.A || !mapping?.B) {
          throw new Error(
            `Dummy seed: missing commission mapping for subject ${subjectId}`,
          );
        }
      }

      console.log(
        `[DummySeed] Subject commissions -> created: ${counters.subjectCommissionsCreated}, total mapped: ${
          subjectCommissionMap.size * 2
        }`,
      );
      const studentSeeds = buildStudentSeeds();
      const studentCommissionLetterByUserId = new Map<string, "A" | "B">();
      const dummyStudentIds: string[] = [];

      for (let index = 0; index < studentSeeds.length; index += 1) {
        const seed = studentSeeds[index];
        const targetLetter: "A" | "B" = index % 2 === 0 ? "A" : "B";

        let studentUser = await userRepo.findOne({
          where: { email: seed.email },
        });
        if (!studentUser) {
          studentUser = userRepo.create({
            name: seed.name,
            lastName: seed.lastName,
            email: seed.email,
            password: "changeme",
            cuil: seed.cuil,
            roleId: studentRole.id,
          });
          await userRepo.save(studentUser);
          counters.studentUsersCreated += 1;
        } else {
          let needsUpdate = false;
          if (studentUser.roleId !== studentRole.id) {
            studentUser.roleId = studentRole.id;
            needsUpdate = true;
          }
          if (studentUser.cuil !== seed.cuil) {
            studentUser.cuil = seed.cuil;
            needsUpdate = true;
          }
          if (needsUpdate) {
            await userRepo.save(studentUser);
            counters.studentUsersUpdated += 1;
          }
        }

        let studentRecord = await studentRepo.findOne({
          where: { userId: studentUser.id },
        });
        const targetCommissionId =
          targetLetter === "A" ? commissionA.id : commissionB.id;

        if (!studentRecord) {
          studentRecord = studentRepo.create({
            userId: studentUser.id,
            legajo: seed.legajo,
            commissionId: targetCommissionId,
            canLogin: true,
            isActive: true,
            studentStartYear: seed.studentStartYear,
          });
          await studentRepo.save(studentRecord);
          counters.studentsCreated += 1;
        } else {
          let studentNeedsUpdate = false;
          if (studentRecord.legajo !== seed.legajo) {
            studentRecord.legajo = seed.legajo;
            studentNeedsUpdate = true;
          }
          if (studentRecord.commissionId !== targetCommissionId) {
            studentRecord.commissionId = targetCommissionId;
            studentNeedsUpdate = true;
          }
          if (studentRecord.studentStartYear !== seed.studentStartYear) {
            studentRecord.studentStartYear = seed.studentStartYear;
            studentNeedsUpdate = true;
          }
          if (studentRecord.isActive !== true) {
            studentRecord.isActive = true;
            studentNeedsUpdate = true;
          }
          if (studentRecord.canLogin !== true) {
            studentRecord.canLogin = true;
            studentNeedsUpdate = true;
          }
          if (studentNeedsUpdate) {
            await studentRepo.save(studentRecord);
            counters.studentsUpdated += 1;
          }
        }

        dummyStudentIds.push(studentUser.id);
        studentCommissionLetterByUserId.set(studentUser.id, targetLetter);
      }

      console.log(
        `[DummySeed] Students -> usersCreated: ${counters.studentUsersCreated}, usersUpdated: ${counters.studentUsersUpdated}, studentRecordsCreated: ${counters.studentsCreated}, studentRecordsUpdated: ${counters.studentsUpdated}, total dummy students: ${dummyStudentIds.length}`,
      );

      if (dummyStudentIds.length === 0) {
        throw new Error("Dummy seed: expected at least one dummy student");
      }

      const existingCareerStudents = await careerStudentRepo.find({
        where: {
          careerId: career.id,
          studentId: In(dummyStudentIds),
        },
      });
      const existingCareerStudentIds = new Set(
        existingCareerStudents.map((entry) => entry.studentId),
      );
      const careerStudentValues: Array<{
        careerId: number;
        studentId: string;
        enrolledAt: Date;
      }> = [];
      for (const studentId of dummyStudentIds) {
        if (existingCareerStudentIds.has(studentId)) {
          continue;
        }
        careerStudentValues.push({
          careerId: career.id,
          studentId,
          enrolledAt: new Date(),
        });
      }
      if (careerStudentValues.length > 0) {
        for (const chunk of chunkArray(careerStudentValues, CHUNK_SIZE)) {
          await careerStudentRepo
            .createQueryBuilder()
            .insert()
            .values(chunk)
            .orIgnore()
            .execute();
        }
        counters.careerStudentsInserted += careerStudentValues.length;
      }

      console.log(
        `[DummySeed] Career students -> inserted: ${counters.careerStudentsInserted}, total linked: ${
          existingCareerStudentIds.size + counters.careerStudentsInserted
        }`,
      );
      const subjectStudentEntities = await subjectStudentRepo.find({
        where: {
          subjectId: In(subjectIds),
          studentId: In(dummyStudentIds),
        },
      });
      const subjectStudentsBySubject = new Map<number, Set<string>>();
      const existingSubjectStudentKeys = new Set<string>();
      subjectStudentEntities.forEach((entry) => {
        existingSubjectStudentKeys.add(`${entry.subjectId}|${entry.studentId}`);
        const set =
          subjectStudentsBySubject.get(entry.subjectId) ?? new Set<string>();
        set.add(entry.studentId);
        subjectStudentsBySubject.set(entry.subjectId, set);
      });

      const subjectStudentValues: Array<{
        subjectId: number;
        studentId: string;
        commissionId: number | null;
        enrollmentDate: Date;
        enrolledBy: "system";
      }> = [];

      if (ENROLL_ALL_SUBJECTS) {
        for (const subjectId of subjectIds) {
          for (const studentId of dummyStudentIds) {
            const key = `${subjectId}|${studentId}`;
            if (existingSubjectStudentKeys.has(key)) {
              counters.subjectStudentsSkipped += 1;
              continue;
            }
            const mapping = subjectCommissionMap.get(subjectId);
            const preferredLetter =
              studentCommissionLetterByUserId.get(studentId) ?? "A";
            const commissionId =
              (preferredLetter === "B" ? mapping?.B : mapping?.A) ??
              mapping?.A ??
              mapping?.B ??
              null;
            subjectStudentValues.push({
              subjectId,
              studentId,
              commissionId: commissionId ?? null,
              enrollmentDate: DUMMY_ENROLLMENT_DATE,
              enrolledBy: "system",
            });
            const set =
              subjectStudentsBySubject.get(subjectId) ?? new Set<string>();
            set.add(studentId);
            subjectStudentsBySubject.set(subjectId, set);
          }
        }

        if (subjectStudentValues.length > 0) {
          for (const chunk of chunkArray(subjectStudentValues, CHUNK_SIZE)) {
            await subjectStudentRepo
              .createQueryBuilder()
              .insert()
              .values(chunk)
              .orIgnore()
              .execute();
          }
          counters.subjectStudentsInserted += subjectStudentValues.length;
        }
      }

      const expectedSubjectStudents = ENROLL_ALL_SUBJECTS
        ? subjectIds.length * dummyStudentIds.length
        : 0;
      console.log(
        `[DummySeed] Subject students -> inserted: ${counters.subjectStudentsInserted}, skipped: ${counters.subjectStudentsSkipped}, expected combos: ${expectedSubjectStudents}`,
      );

      const subjectCommissionIds = Array.from(
        subjectCommissionMap.values(),
      ).flatMap((entry) => [entry.A as number, entry.B as number]);

      const existingProgressEntries = await studentSubjectProgressRepo.find({
        where: {
          subjectCommissionId: In(subjectCommissionIds),
          studentId: In(dummyStudentIds),
        },
      });
      const existingProgressKeys = new Set(
        existingProgressEntries.map(
          (entry) => `${entry.subjectCommissionId}|${entry.studentId}`,
        ),
      );

      const progressValues: Array<{
        subjectCommissionId: number;
        studentId: string;
        attendancePercentage: string;
        partialScores: null;
      }> = [];

      for (const subjectId of subjectIds) {
        const mapping = subjectCommissionMap.get(subjectId);
        if (!mapping?.A || !mapping?.B) {
          continue;
        }
        const studentSet = subjectStudentsBySubject.get(subjectId);
        if (!studentSet || studentSet.size === 0) {
          continue;
        }
        for (const studentId of studentSet) {
          const letter = studentCommissionLetterByUserId.get(studentId) ?? "A";
          const subjectCommissionId = letter === "A" ? mapping.A : mapping.B;
          const key = `${subjectCommissionId}|${studentId}`;
          if (existingProgressKeys.has(key)) {
            counters.studentProgressSkipped += 1;
            continue;
          }
          progressValues.push({
            subjectCommissionId,
            studentId,
            attendancePercentage: "0.00",
            partialScores: null,
          });
        }
      }

      if (progressValues.length > 0) {
        for (const chunk of chunkArray(progressValues, CHUNK_SIZE)) {
          await studentSubjectProgressRepo
            .createQueryBuilder()
            .insert()
            .values(chunk)
            .orIgnore()
            .execute();
        }
        counters.studentProgressInserted += progressValues.length;
      }

      const expectedProgress = subjectIds.length * dummyStudentIds.length;
      console.log(
        `[DummySeed] Subject progress -> inserted: ${counters.studentProgressInserted}, skipped: ${counters.studentProgressSkipped}, expected combos: ${expectedProgress}`,
      );
      if (PRELOAD_FINALS) {
        const finals = await finalExamRepo.find({
          where: {
            subjectId: In(subjectIds),
          },
        });
        if (finals.length > 0) {
          const existingFinalLinks = await finalExamStudentRepo.find({
            where: {
              finalExamId: In(finals.map((entry) => entry.id)),
              studentId: In(dummyStudentIds),
            },
          });
          const existingFinalKeys = new Set(
            existingFinalLinks.map(
              (entry) => `${entry.finalExamId}|${entry.studentId}`,
            ),
          );

          const finalValues: Array<{ finalExamId: number; studentId: string }> =
            [];
          for (const finalExam of finals) {
            const studentSet = subjectStudentsBySubject.get(
              finalExam.subjectId,
            );
            if (!studentSet || studentSet.size === 0) {
              continue;
            }
            for (const studentId of studentSet) {
              const key = `${finalExam.id}|${studentId}`;
              if (existingFinalKeys.has(key)) {
                continue;
              }
              finalValues.push({
                finalExamId: finalExam.id,
                studentId,
              });
            }
          }

          if (finalValues.length > 0) {
            for (const chunk of chunkArray(finalValues, CHUNK_SIZE)) {
              await finalExamStudentRepo
                .createQueryBuilder()
                .insert()
                .values(chunk)
                .orIgnore()
                .execute();
            }
            counters.finalsLinked += finalValues.length;
          }

          console.log(
            `[DummySeed] Final exams -> linked: ${counters.finalsLinked}, finals found: ${finals.length}`,
          );
        } else {
          console.log(
            "[DummySeed] Final exams -> no finals found, skipping preload",
          );
        }
      } else {
        console.log("[DummySeed] Final exams -> preload disabled");
      }

      const totalSubjectCommissions = await subjectCommissionRepo.count({
        where: { subjectId: In(subjectIds) },
      });
      console.log(
        `[DummySeed] Check subject_commissions count=${totalSubjectCommissions}, expected >= ${
          subjectIds.length * 2
        }`,
      );

      if (ENROLL_ALL_SUBJECTS) {
        const totalSubjectStudents = await subjectStudentRepo.count({
          where: {
            subjectId: In(subjectIds),
            studentId: In(dummyStudentIds),
          },
        });
        console.log(
          `[DummySeed] Check subject_students count=${totalSubjectStudents}, expected >= ${
            dummyStudentIds.length * subjectIds.length
          }`,
        );
      }

      const totalProgress = await studentSubjectProgressRepo.count({
        where: {
          subjectCommissionId: In(subjectCommissionIds),
          studentId: In(dummyStudentIds),
        },
      });
      console.log(
        `[DummySeed] Check student_subject_progress count=${totalProgress}, expected >= ${
          dummyStudentIds.length * subjectIds.length
        }`,
      );

      if (PRELOAD_FINALS) {
        const totalFinalLinks = await finalExamStudentRepo.count({
          where: {
            studentId: In(dummyStudentIds),
          },
        });
        console.log(
          `[DummySeed] Check final_exams_students count=${totalFinalLinks} (dummy students only)`,
        );
      }

      const totalCareerStudents = await careerStudentRepo.count({
        where: {
          careerId: career.id,
        },
      });
      console.log(
        `[DummySeed] Check career_students (career ${career.id}) count=${totalCareerStudents}, expected >= ${dummyStudentIds.length}`,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      const manager = queryRunner.manager;
      const commissionRepo = manager.getRepository(Commission);
      const userRepo = manager.getRepository(User);
      const teacherRepo = manager.getRepository(Teacher);
      const studentRepo = manager.getRepository(Student);
      const careerRepo = manager.getRepository(Career);
      const careerSubjectRepo = manager.getRepository(CareerSubject);
      const careerStudentRepo = manager.getRepository(CareerStudent);
      const subjectCommissionRepo = manager.getRepository(SubjectCommission);
      const subjectStudentRepo = manager.getRepository(SubjectStudent);
      const studentSubjectProgressRepo = manager.getRepository(
        StudentSubjectProgress,
      );
      const finalExamStudentRepo = manager.getRepository(FinalExamsStudent);

      const commissions = await commissionRepo.find({
        where: { commissionLetter: In(["A", "B"]) },
      });
      const commissionIdByLetter = new Map<string, number>();
      commissions.forEach((commission) => {
        if (commission.commissionLetter) {
          commissionIdByLetter.set(
            commission.commissionLetter.toUpperCase(),
            commission.id,
          );
        }
      });
      const commissionIds = Array.from(commissionIdByLetter.values());

      const careers = await careerRepo.find();
      let career: Career | null = null;
      if (careers.length === 1) {
        career = careers[0];
      } else {
        career =
          careers.find((item) => item.careerName === TARGET_CAREER_NAME) ??
          null;
      }

      const subjectIds = career?.id
        ? (
            await careerSubjectRepo.find({
              where: { careerId: career.id },
              select: ["subjectId"],
            })
          ).map((entry) => entry.subjectId)
        : [];

      const subjectCommissions =
        subjectIds.length && commissionIds.length
          ? await subjectCommissionRepo.find({
              where: {
                subjectId: In(subjectIds),
                commissionId: In(commissionIds),
              },
            })
          : [];

      const subjectCommissionIds = subjectCommissions.map((entry) => entry.id);

      const dummyStudents = await studentRepo
        .createQueryBuilder("student")
        .leftJoinAndSelect("student.user", "user")
        .where("user.email LIKE :email", { email: `%${EMAIL_DOMAIN}` })
        .andWhere("student.legajo LIKE :legajo", {
          legajo: `${LEGAJO_PREFIX}%`,
        })
        .getMany();
      const dummyStudentIds = dummyStudents.map((student) => student.userId);

      if (dummyStudentIds.length > 0) {
        if (subjectCommissionIds.length > 0) {
          await studentSubjectProgressRepo
            .createQueryBuilder()
            .delete()
            .where("student_id IN (:...studentIds)", {
              studentIds: dummyStudentIds,
            })
            .andWhere("subject_commission_id IN (:...subjectCommissionIds)", {
              subjectCommissionIds,
            })
            .execute();
        }

        await subjectStudentRepo
          .createQueryBuilder()
          .delete()
          .where("student_id IN (:...studentIds)", {
            studentIds: dummyStudentIds,
          })
          .andWhere("enrollment_date = :enrollmentDate", {
            enrollmentDate: DUMMY_ENROLLMENT_DATE.toISOString().slice(0, 10),
          })
          .execute();

        if (career?.id) {
          await careerStudentRepo
            .createQueryBuilder()
            .delete()
            .where("career_id = :careerId", { careerId: career.id })
            .andWhere("student_id IN (:...studentIds)", {
              studentIds: dummyStudentIds,
            })
            .execute();
        }

        await finalExamStudentRepo
          .createQueryBuilder()
          .delete()
          .where("student_id IN (:...studentIds)", {
            studentIds: dummyStudentIds,
          })
          .execute();
      }

      const dummyTeacherEmails = DEFAULT_TEACHERS.map((teacher) =>
        teacher.email.toLowerCase(),
      );
      const dummyTeachers = await teacherRepo
        .createQueryBuilder("teacher")
        .leftJoinAndSelect("teacher.user", "user")
        .where("LOWER(user.email) IN (:...emails)", {
          emails: dummyTeacherEmails,
        })
        .getMany();
      const dummyTeacherIds = dummyTeachers.map((teacher) => teacher.userId);

      if (subjectCommissions.length > 0 && dummyTeacherIds.length > 0) {
        const subjectCommissionIdsToDelete = subjectCommissions
          .filter((entry) => dummyTeacherIds.includes(entry.teacherId))
          .map((entry) => entry.id);
        if (subjectCommissionIdsToDelete.length > 0) {
          await subjectCommissionRepo
            .createQueryBuilder()
            .delete()
            .where("id IN (:...ids)", { ids: subjectCommissionIdsToDelete })
            .execute();
        }
      }

      if (dummyTeacherIds.length > 0) {
        await teacherRepo
          .createQueryBuilder()
          .delete()
          .where("user_id IN (:...teacherIds)", { teacherIds: dummyTeacherIds })
          .execute();
      }

      if (dummyStudentIds.length > 0) {
        await studentRepo
          .createQueryBuilder()
          .delete()
          .where("user_id IN (:...studentIds)", { studentIds: dummyStudentIds })
          .execute();
      }

      const userIdsToDelete = new Set<string>();
      dummyStudentIds.forEach((id) => userIdsToDelete.add(id));
      dummyTeacherIds.forEach((id) => userIdsToDelete.add(id));

      if (userIdsToDelete.size > 0) {
        await userRepo
          .createQueryBuilder()
          .delete()
          .where("id IN (:...userIds)", {
            userIds: Array.from(userIdsToDelete),
          })
          .execute();
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
}
