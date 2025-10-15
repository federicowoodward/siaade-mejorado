// src/modules/final_exams/services/final-exam.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { FinalExam } from "@/entities/final_exam.entity";
import { FinalExamsStudent } from "@/entities/final_exams_student.entity";
import { FinalExamTable } from "@/entities/final_exam_table.entity";
import { Subject } from "@/entities/subjects.entity";
import { SubjectStudent } from "@/entities/subject_student.entity";

import { CreateFinalExamDto, FinalExamDto } from "@/modules/final_exams/dto/final-exam.dto";
import { isoToDate, dateInRange } from "@/modules/final_exams/utils/date-utils";
import { RecordFinalDto, ApproveFinalDto } from "@/modules/final_exams/dto/final-exam-admin.dto";
import { FinalExamStatus } from "@/entities/final_exam_status.entity";
import { Teacher } from "@/entities/teachers.entity";
import { Secretary } from "@/entities/secretaries.entity";

@Injectable()
export class FinalExamService {
  constructor(
    @InjectRepository(FinalExam) private finalRepo: Repository<FinalExam>,
    @InjectRepository(FinalExamsStudent)
    private linkRepo: Repository<FinalExamsStudent>,
    @InjectRepository(FinalExamTable)
    private tableRepo: Repository<FinalExamTable>,
    @InjectRepository(Subject) private subjRepo: Repository<Subject>,
    @InjectRepository(SubjectStudent)
    private subjStudRepo: Repository<SubjectStudent>,
    @InjectRepository(FinalExamStatus) private statusRepo: Repository<FinalExamStatus>,
    @InjectRepository(Teacher) private teacherRepo: Repository<Teacher>,
    @InjectRepository(Secretary) private secretaryRepo: Repository<Secretary>,
  ) {}

  async listAllByTable(finalExamTableId: number, opts?: { skip?: number; take?: number }) {
    const qb = this.finalRepo
      .createQueryBuilder("f")
      .leftJoin("f.subject", "s")
      .select([
        "f.id AS id",
        "to_char(f.exam_date, 'YYYY-MM-DD') AS exam_date",
        "to_char(f.exam_time, 'HH24:MI') AS exam_time",
        "f.aula AS aula",
        "s.id AS subject_id",
        "s.subject_name AS subject_name",
      ])
      .where("f.final_exam_table_id = :id", { id: finalExamTableId })
      .orderBy("f.exam_date", "ASC")
      .addOrderBy("f.exam_time", "ASC", "NULLS LAST")
      .addOrderBy("f.id", "ASC");

    // Paginación
    if (opts?.skip !== undefined) qb.skip(opts.skip);
    if (opts?.take !== undefined) qb.take(opts.take);

    const [rows, total] = await qb.getRawMany().then(async (r) => {
      // total con mismo filtro, sin paginación
      const count = await this.finalRepo
        .createQueryBuilder('f')
        .where('f.final_exam_table_id = :id', { id: finalExamTableId })
        .getCount();
      return [r, count] as [any[], number];
    });

    return [rows, total] as const; // ya viene con subject_name y exam_date en ISO corto
  }

  async getOne(finalExamId: number): Promise<FinalExamDto> {
    // Header: examen + materia + mesa
    const header = await this.finalRepo
      .createQueryBuilder("fe")
      .leftJoin("fe.subject", "s")
      .leftJoin("fe.finalExamTable", "t")
      .select([
        "fe.id AS id",
        "to_char(fe.examDate, 'YYYY-MM-DD') AS exam_date",
        "to_char(fe.examTime, 'HH24:MI') AS exam_time",
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

    // Estudiantes del examen (join -> students -> users para armar el nombre)
    const students = await this.linkRepo
      .createQueryBuilder("fes")
      .leftJoin("fes.student", "st") // students
      .leftJoin("st.user", "u") // users (nombre/apellido)
      .select([
        "fes.id AS id",
        "fes.studentId AS student_id",
        "concat(u.name, ' ', coalesce(u.last_name, '')) AS name",
        "to_char(fes.enrolledAt, 'YYYY-MM-DD') AS enrolled_at",
        // si score es numeric(4,2), lo devuelvo como number
        "fes.score::float AS score",
        "fes.notes AS notes",
      ])
  .where("fes.finalExamId = :id", { id: finalExamId })
      .orderBy("u.last_name", "ASC")
      .addOrderBy("u.name", "ASC")
      .getRawMany();

    // Ensamblar DTO final
    return {
      ...header,
      students,
    } as FinalExamDto;
  }

  /**
   * Crea final: valida mesa, materia y que la fecha esté dentro del rango.
   * Luego precarga final_exams_students con TODOS los alumnos de la materia (enrolled=false, score=null).
   * (La verificación "capacidad de rendir" queda como #MEJORARFUTURO)
   */
  // create()
  async create(dto: CreateFinalExamDto) {
    const table = await this.tableRepo.findOne({
      where: { id: dto.final_exam_table_id },
    });
    if (!table) throw new NotFoundException("Final exam table not found");

    const subject = await this.subjRepo.findOne({
      where: { id: dto.subject_id },
    });
    if (!subject) throw new NotFoundException("Subject not found");

    const examDate = isoToDate(dto.exam_date);
    if (!dateInRange(examDate, table.startDate, table.endDate)) {
      throw new BadRequestException(
        "exam_date must be within final exam table range"
      );
    }

    const finalData: Partial<FinalExam> = {
      finalExamTableId: table.id,
      subjectId: subject.id,
      examDate,
      examTime: dto.exam_time ?? null,
    };
    if (dto.aula !== undefined) finalData.aula = dto.aula;

    const entity = this.finalRepo.create(finalData);
    const saved = await this.finalRepo.save(entity);

    // Precargar inscripciones
    const subjStudents = await this.subjStudRepo.find({
      where: { subjectId: subject.id },
    });

    if (subjStudents.length) {
      const links = subjStudents.map((ss) =>
        this.linkRepo.create({
          finalExamId: saved.id,
          studentId: (ss as any).studentId,
          enrolledAt: null,
          score: null,
          notes: "",
        })
      );
      await this.linkRepo.save(links);
    }

    return saved;
  }

  async remove(id: number) {
    const row = await this.finalRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Final exam not found");
    await this.finalRepo.remove(row); // FK/ON DELETE CASCADE debe limpiar links si lo configuraste así
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
}
