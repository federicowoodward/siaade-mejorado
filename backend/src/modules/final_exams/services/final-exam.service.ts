// src/modules/final_exams/services/final-exam.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { FinalExam } from "@/entities/finals/final-exam.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { ExamTable } from "@/entities/finals/exam-table.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";

import { CreateFinalExamDto, FinalExamDto } from "@/modules/final_exams/dto/final-exam.dto";
import { isoToDate, dateInRange } from "@/modules/final_exams/utils/date-utils";
import { RecordFinalDto, ApproveFinalDto } from "@/modules/final_exams/dto/final-exam-admin.dto";
import { FinalExamStatus } from "@/entities/finals/final-exam-status.entity";
import { Teacher } from "@/entities/users/teacher.entity";
import { Secretary } from "@/entities/users/secretary.entity";
import { ToggleEnrollmentResponseDto } from "@/modules/shared/dto/toggle-enrollment.dto";
import { EnrollmentAction, EnrollmentActor } from "@/modules/shared/dto/toggle-enrollment.dto";

@Injectable()
export class FinalExamService {
  constructor(
    @InjectRepository(FinalExam) private finalRepo: Repository<FinalExam>,
    @InjectRepository(FinalExamsStudent)
    private linkRepo: Repository<FinalExamsStudent>,
    @InjectRepository(ExamTable)
    private tableRepo: Repository<ExamTable>,
    @InjectRepository(Subject) private subjRepo: Repository<Subject>,
    @InjectRepository(SubjectStudent)
    private subjStudRepo: Repository<SubjectStudent>,
    @InjectRepository(FinalExamStatus) private statusRepo: Repository<FinalExamStatus>,
    @InjectRepository(Teacher) private teacherRepo: Repository<Teacher>,
    @InjectRepository(Secretary) private secretaryRepo: Repository<Secretary>,
  ) {}

  async listAllByTable(examTableId: number, opts?: { skip?: number; take?: number }) {
    const qb = this.finalRepo
      .createQueryBuilder("f")
      .leftJoin("f.subject", "s")
      .select([
        "f.id AS id",
        "to_char(f.exam_date, 'YYYY-MM-DD') AS exam_date",
        "to_char(f.exam_date, 'HH24:MI') AS exam_time",
        "f.aula AS aula",
        "s.id AS subject_id",
        "s.subject_name AS subject_name",
      ])
      .where("f.exam_table_id = :id", { id: examTableId })
      .orderBy("f.exam_date", "ASC")
      .addOrderBy("f.id", "ASC");

    if (opts?.skip !== undefined) qb.skip(opts.skip);
    if (opts?.take !== undefined) qb.take(opts.take);

    const [rows, total] = await qb.getRawMany().then(async (r) => {
      const count = await this.finalRepo
        .createQueryBuilder('f')
        .where('f.exam_table_id = :id', { id: examTableId })
        .getCount();
      return [r, count] as [any[], number];
    });

    return [rows, total] as const;
  }

  async getOne(finalExamId: number): Promise<FinalExamDto> {
    const header = await this.finalRepo
      .createQueryBuilder("fe")
      .leftJoin("fe.subject", "s")
      .leftJoin("fe.examTable", "t")
      .select([
        "fe.id AS id",
        "to_char(fe.examDate, 'YYYY-MM-DD') AS exam_date",
        "to_char(fe.examDate, 'HH24:MI') AS exam_time",
        "fe.aula AS aula",
        "s.id AS subject_id",
        "s.subjectName AS subject_name",
        "t.id AS table_id",
        "t.name AS table_name",
        "to_char(t.startDate, 'YYYY-MM-DD') AS table_start_date",
        "to_char(t.endDate, 'YYYY-MM-DD') AS table_end_date",
      ])
      .where("fe.id = :id", { id: finalExamId })
      .getRawOne();

    if (!header) throw new NotFoundException("Final exam not found");

    const students = await this.linkRepo
      .createQueryBuilder("fes")
      .leftJoin("fes.student", "st")
      .leftJoin("st.user", "u")
      .select([
        "fes.id AS id",
        "fes.studentId AS student_id",
        "concat(u.name, ' ', coalesce(u.last_name, '')) AS name",
        "to_char(fes.enrolledAt, 'YYYY-MM-DD') AS enrolled_at",
        "fes.score::float AS score",
        "fes.notes AS notes",
      ])
      .where("fes.finalExamId = :id", { id: finalExamId })
      .orderBy("u.last_name", "ASC")
      .addOrderBy("u.name", "ASC")
      .getRawMany();

    return {
      ...header,
      students,
    } as FinalExamDto;
  }

  async create(dto: CreateFinalExamDto) {
    const table = await this.tableRepo.findOne({ where: { id: dto.exam_table_id } });
    if (!table) throw new NotFoundException("Exam table not found");

    const subject = await this.subjRepo.findOne({ where: { id: dto.subject_id } });
    if (!subject) throw new NotFoundException("Subject not found");

    const examDate = isoToDate(dto.exam_date);
    if (!dateInRange(examDate, table.startDate, table.endDate)) {
      throw new BadRequestException("exam_date must be within exam table range");
    }

    const finalData: Partial<FinalExam> = {
      examTableId: table.id,
      subjectId: subject.id,
      examDate,
      aula: dto.aula ?? null,
    };

    const entity = this.finalRepo.create(finalData);
    const saved = await this.finalRepo.save(entity);

    const subjStudents = await this.subjStudRepo.find({ where: { subjectId: subject.id } });

    if (subjStudents.length) {
      const links = subjStudents.map((ss) =>
        this.linkRepo.create({
          finalExamId: saved.id,
          studentId: (ss as any).studentId,
          enrolledAt: null,
          score: null,
          notes: "",
        }),
      );
      await this.linkRepo.save(links);
    }

    return saved;
  }

  async remove(id: number) {
    const row = await this.finalRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Final exam not found");
    await this.finalRepo.remove(row);
    return { deleted: true };
  }

  async record(dto: RecordFinalDto) {
    const link = await this.linkRepo.findOne({ where: { id: dto.final_exams_student_id } });
    if (!link) throw new NotFoundException('Final exam student not found');
    const teacher = await this.teacherRepo.findOne({ where: { userId: dto.recorded_by } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    const status = await this.statusRepo.findOne({ where: { name: 'registrado' } });
    if (!status) throw new NotFoundException('FinalExamStatus "registrado" not found');
    link.score = (dto.score ?? null) as any;
    link.notes = dto.notes ?? link.notes;
    (link as any).statusId = status.id;
    (link as any).recordedById = teacher.userId;
    (link as any).recordedAt = new Date();
    await this.linkRepo.save(link);
    return { ok: true };
  }

  async approve(dto: ApproveFinalDto) {
    const link = await this.linkRepo.findOne({ where: { id: dto.final_exams_student_id } });
    if (!link) throw new NotFoundException('Final exam student not found');
    const sec = await this.secretaryRepo.findOne({ where: { userId: dto.approved_by } });
    if (!sec) throw new NotFoundException('Secretary not found');
    const status = await this.statusRepo.findOne({ where: { name: 'aprobado_admin' } });
    if (!status) throw new NotFoundException('FinalExamStatus "aprobado_admin" not found');
    (link as any).statusId = status.id;
    (link as any).approvedById = sec.userId;
    (link as any).approvedAt = new Date();
    await this.linkRepo.save(link);
    return { ok: true };
  }

  async toggleFinalExamEnrollmentRich(
    finalExamId: number,
    studentId: string,
    action: EnrollmentAction,
    actor: EnrollmentActor
  ): Promise<ToggleEnrollmentResponseDto> {
    if (!studentId) {
      throw new BadRequestException("studentId is required");
    }

    const exam = await this.finalRepo.findOne({ where: { id: finalExamId } });
    if (!exam) {
      throw new NotFoundException("Final exam not found");
    }

    let link = await this.linkRepo.findOne({ where: { finalExamId, studentId } });

    if (action === "enroll") {
      const now = new Date();
      if (!link) {
        link = this.linkRepo.create({
          finalExamId,
          studentId,
          score: null,
          notes: "",
        });
      }
      const storedActor: "student" | "preceptor" =
        actor === "student" ? "student" : "preceptor";
      link.enrolledAt = now;
      link.enrolledBy = storedActor;
      await this.linkRepo.save(link);
    } else if (action === "unenroll") {
      if (link) {
        link.enrolledAt = null;
        link.enrolledBy = null;
        link.score = null;
        link.notes = "";
        await this.linkRepo.save(link);
      }
    } else {
      throw new BadRequestException("Unsupported enrollment action");
    }

    const finalLink = await this.linkRepo.findOne({
      where: { finalExamId, studentId },
    });
    const enrolled = !!finalLink?.enrolledAt && action === "enroll";
    const enrolledAt = finalLink?.enrolledAt
      ? new Date(finalLink.enrolledAt).toISOString()
      : null;
    const enrolledBy = (finalLink as any)?.enrolledBy ?? null;

    return {
      entity: "final_exam",
      action,
      enrolled,
      enrolled_by: enrolledBy,
      enrolled_at: enrolledAt,
      student_id: studentId,
      final_exam_id: finalExamId,
    };
  }

  async toggleFinalExamEnrollment(
    finalExamId: number,
    studentId: string,
    action: EnrollmentAction,
    actor: EnrollmentActor
  ) {
    return this.toggleFinalExamEnrollmentRich(finalExamId, studentId, action, actor);
  }
}



