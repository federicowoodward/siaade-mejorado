import AppDataSource from "../database/datasource";
import { QueryRunner } from "typeorm";
import { AcademicPeriod } from "@/entities/catalogs/academic-period.entity";
import { FinalExamStatus } from "@/entities/finals/final-exam-status.entity";
import { SubjectStatusType } from "@/entities/catalogs/subject-status-type.entity";
import { Commission } from "@/entities/catalogs/commission.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { Student } from "@/entities/users/student.entity";
import { StudentSubjectProgress } from "@/entities/subjects/student-subject-progress.entity";
import { Career } from "@/entities/registration/career.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { SubjectPrerequisiteByOrder } from "@/entities/subjects/subject-prerequisite-by-order.entity";
import { ExamTable } from "@/entities/finals/exam-table.entity";
import { FinalExam } from "@/entities/finals/final-exam.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";

async function main() {
  await AppDataSource.initialize();
  const qr: QueryRunner = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  const log = (...args: any[]) => console.log("[SMOKE]", ...args);
  const nowTag = Date.now();

  try {
    // 1) Insertar catálogos simples
    const apRepo = qr.manager.getRepository(AcademicPeriod);
    const fesRepo = qr.manager.getRepository(FinalExamStatus);
    const sstRepo = qr.manager.getRepository(SubjectStatusType);
    const comRepo = qr.manager.getRepository(Commission);

    const ap = apRepo.create({ periodName: `2025 - Período de Prueba ${nowTag}`, partialsScoreNeeded: 2 });
    await apRepo.save(ap);
    log("academic_period OK", ap.academicPeriodId);

    // Crear un status de final único para poder borrarlo sin afectar otros
    const fes = fesRepo.create({ name: `APROBADO (SMOKE) ${nowTag}` });
    await fesRepo.save(fes);
    log("final_exam_status OK", fes.id);

    const sst = sstRepo.create({ statusName: `CURSANDO (SMOKE) ${nowTag}` });
    await sstRepo.save(sst);
    log("subject_status_type OK", sst.id);

    const com = comRepo.create({ commissionLetter: `Z (SMOKE) ${nowTag}` });
    await comRepo.save(com);
    log("commission OK", com.id);

    // 2) Si hay un subject + teacher válido, intentar crear subject_commission
    const subject = await qr.manager
      .getRepository(Subject)
      .createQueryBuilder("s")
      .select(["s.id"])
      .orderBy("s.id", "ASC")
      .getOne();

    let sc: SubjectCommission | null = null;
    if (subject?.id) {
      const teacherRow = await qr.query(`select user_id from teachers limit 1`);
      const teacherId: string | undefined = teacherRow?.[0]?.user_id;
      if (teacherId) {
        const scRepo = qr.manager.getRepository(SubjectCommission);
        // Primero intentamos obtener existente para evitar violaciones de unicidad dentro de la transacción
        let existing = await scRepo.findOne({ where: { subjectId: subject.id, commissionId: com.id } });
        if (existing) {
          sc = existing;
          log("subject_commission existente reutilizado", sc.id);
        } else {
          sc = scRepo.create({
            subjectId: subject.id,
            commissionId: com.id,
            teacherId,
            active: true,
          });
          await scRepo.save(sc);
          log("subject_commission OK", sc.id);
        }
      } else {
        log("SKIP subject_commission: no hay teachers disponibles");
      }
    } else {
      log("SKIP subject_commission: no hay subjects en DB");
    }

    // 3) Si hay student y subject_commission, crear progreso
    const student = await qr.manager
      .getRepository(Student)
      .createQueryBuilder("st")
      .select(["st.userId"]) // columna PK/UUID
      .orderBy("st.userId", "ASC")
      .getOne();

    if (sc?.id && student?.userId) {
      const sspRepo = qr.manager.getRepository(StudentSubjectProgress);
      const ssp = sspRepo.create({
        subjectCommissionId: sc.id,
        studentId: student.userId,
        statusId: null, // opcional
        attendancePercentage: "0",
      });
      try {
        await sspRepo.save(ssp);
        log("student_subject_progress OK", ssp.id);
      } catch {
        log("student_subject_progress ya existente (índice único)");
      }
    } else {
      log("SKIP student_subject_progress: falta subject_commission o student");
    }

    // 4) Crear Career si hay un preceptor disponible
    const preceptor = await qr.query(`select user_id from preceptors limit 1`);
    let career: Career | null = null;
    if (preceptor?.length) {
      const careerRepo = qr.manager.getRepository(Career);
      career = careerRepo.create({
        careerName: `Tec. Pruebas (SMOKE) ${nowTag}`,
        academicPeriodId: ap.academicPeriodId,
        preceptorId: preceptor[0].user_id,
      });
      await careerRepo.save(career);
      log("career OK", career.id);
    } else {
      log("SKIP career: no hay preceptores disponibles");
    }

    // 5) CareerSubjects y SubjectPrerequisiteByOrder
    if (career?.id && subject?.id) {
      const csRepo = qr.manager.getRepository(CareerSubject);
      const cso1 = csRepo.create({ careerId: career.id, subjectId: subject.id, orderNo: 1, yearNo: 1, periodOrder: 1 });
      await csRepo.save(cso1);
      log("career_subjects OK", cso1.id);
      // Intento duplicado esperado (mismo careerId, orderNo) usando savepoint para no abortar la transacción
      const sp1 = `sp_cs_${nowTag}`;
      await qr.query(`SAVEPOINT ${sp1}`);
      try {
        const dup = csRepo.create({ careerId: career.id, subjectId: subject.id, orderNo: 1 });
        await csRepo.save(dup);
        log("WARN: career_subjects duplicate no lanzó error (revisar índice único)");
      } catch {
        log("career_subjects UNIQUE (careerId, orderNo) OK (fallo esperado)");
      } finally {
        await qr.query(`ROLLBACK TO SAVEPOINT ${sp1}`);
      }

      const spRepo = qr.manager.getRepository(SubjectPrerequisiteByOrder);
      const spro = spRepo.create({
        career_id: career.id,
        subject_order_no: 2,
        prereq_order_no: 1,
      });
      await spRepo.save(spro);
      log("subject_prerequisites_by_order OK", spro.id);
      const sp2 = `sp_spro_${nowTag}`;
      await qr.query(`SAVEPOINT ${sp2}`);
      try {
        const sproDup = spRepo.create({
          career_id: career.id,
          subject_order_no: 2,
          prereq_order_no: 1,
        });
        await spRepo.save(sproDup);
        log("WARN: subject_prerequisites_by_order duplicate no lanzó error");
      } catch {
        log("subject_prerequisites_by_order UNIQUE OK (fallo esperado)");
      } finally {
        await qr.query(`ROLLBACK TO SAVEPOINT ${sp2}`);
      }
    } else {
      log("SKIP career_subjects/prerequisites: faltan career o subject");
    }

    // 6) CareerStudent
    const studentForCareer = await qr.manager
      .getRepository(Student)
      .createQueryBuilder("st")
      .select(["st.userId"]) // PK
      .orderBy("st.userId", "ASC")
      .getOne();
    if (career?.id && studentForCareer?.userId) {
      const cstRepo = qr.manager.getRepository(CareerStudent);
      const cst = cstRepo.create({ careerId: career.id, studentId: studentForCareer.userId, enrolledAt: new Date() });
      await cstRepo.save(cst);
      log("career_students OK", cst.id);
    } else {
      log("SKIP career_students: faltan datos");
    }

    // 7) ExamTable + FinalExam + FinalExamsStudent + cascadas y SET NULL
    if (subject?.id && student?.userId) {
      const etRepo = qr.manager.getRepository(ExamTable);
      const et = etRepo.create({ name: "Mesa SMOKE", startDate: new Date(), endDate: new Date() });
      await etRepo.save(et);
      log("exam_table OK", et.id);

      const feRepo = qr.manager.getRepository(FinalExam);
      const fe = feRepo.create({
        subjectId: subject.id,
        examTableId: et.id,
        examDate: new Date(),
        aula: "A1",
      });
      await feRepo.save(fe);
      log("final_exams OK", fe.id);

      const fesRepo2 = qr.manager.getRepository(FinalExamsStudent);
      const fesRow = fesRepo2.create({
        finalExamId: fe.id,
        studentId: student.userId,
        enrolledAt: new Date(),
        statusId: fes.id, // apuntamos al status creado arriba
      });
      await fesRepo2.save(fesRow);
      log("final_exams_students OK", fesRow.id);

      // Probar ON DELETE SET NULL en status
      await qr.manager.getRepository(FinalExamStatus).delete({ id: fes.id });
      const afterStatus = await qr.query(`select status_id from final_exams_students where id = $1`, [fesRow.id]);
      log("final_exams_students.status_id tras borrar status:", afterStatus?.[0]?.status_id);

      // Probar CASCADE: borrar exam_table -> borra finals
      await etRepo.delete({ id: et.id });
      const feCount = await feRepo.count({ where: { id: fe.id } });
      log("final_exams count tras borrar exam_table (esperado 0):", feCount);
    } else {
      log("SKIP finals: faltan subject o student");
    }

    // 8) Validar tipos de columnas migradas (timestamptz)
    const examDateType = await qr.query(
      `SELECT data_type FROM information_schema.columns WHERE table_name='final_exams' AND column_name='exam_date'`,
    );
    log("final_exams.exam_date data_type:", examDateType?.[0]?.data_type);

    const enrolledAtType = await qr.query(
      `SELECT data_type FROM information_schema.columns WHERE table_name='final_exams_students' AND column_name='enrolled_at'`,
    );
    log("final_exams_students.enrolled_at data_type:", enrolledAtType?.[0]?.data_type);

    // Rollback para no dejar datos de prueba
    await qr.rollbackTransaction();
    log("Transacción revertida (DB limpia)");
  } catch (err) {
    await qr.rollbackTransaction();
    console.error("[SMOKE] Error:", err);
    process.exitCode = 1;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main();

