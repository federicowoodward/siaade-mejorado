import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AcademicPeriod } from "@/entities/catalogs/academic-period.entity";
import { Career } from "@/entities/registration/career.entity";
import { Commission } from "@/entities/catalogs/commission.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { Student } from "@/entities/users/student.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { FinalExamStatus } from "@/entities/finals/final-exam-status.entity";
import { SubjectStatusType } from "@/entities/catalogs/subject-status-type.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { SubjectGradesView } from "@/subjects/views/subject-grades.view";

export type SubjectCommissionTeachersDto = {
  subject: { id: number; name: string };
  commissions: Array<{
    commission: { id: number; letter: string | null };
    teachers: Array<{
      teacherId: string;
      name: string;
      email: string;
      cuil: string | null;
    }>;
  }>;
};

@Injectable()
export class CatalogsService {
  constructor(
    @InjectRepository(AcademicPeriod)
    private readonly academicPeriodRepo: Repository<AcademicPeriod>,
    @InjectRepository(Career)
    private readonly careerRepo: Repository<Career>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(CareerSubject)
    private readonly careerSubjectRepo: Repository<CareerSubject>,
    @InjectRepository(SubjectCommission)
    private readonly subjectCommissionRepo: Repository<SubjectCommission>,
    @InjectRepository(CareerStudent)
    private readonly careerStudentRepo: Repository<CareerStudent>,
  @InjectRepository(Student)
  private readonly studentRepo: Repository<Student>,
    @InjectRepository(FinalExamStatus)
    private readonly finalExamStatusRepo: Repository<FinalExamStatus>,
    @InjectRepository(SubjectStatusType)
    private readonly subjectStatusTypeRepo: Repository<SubjectStatusType>,
    @InjectRepository(SubjectGradesView)
    private readonly subjectGradesViewRepo: Repository<SubjectGradesView>
  ) {}

  findAcademicPeriods(opts?: { skip?: number; take?: number }) {
    return this.academicPeriodRepo.findAndCount({
      order: { academicPeriodId: "ASC" },
      skip: opts?.skip,
      take: opts?.take,
    });
  }

  findCareers(opts?: { skip?: number; take?: number }) {
    return this.careerRepo.findAndCount({
      order: { id: "ASC" },
      skip: opts?.skip,
      take: opts?.take,
    });
  }

  findCommissions(opts?: { skip?: number; take?: number }) {
    return this.commissionRepo.findAndCount({
      order: { id: "ASC" },
      skip: opts?.skip,
      take: opts?.take,
    });
  }

  async findCareerFullData(careerId: number) {
    const career = await this.careerRepo
      .createQueryBuilder("career")
      .leftJoinAndSelect("career.academicPeriod", "careerPeriod")
      .leftJoinAndSelect("career.preceptor", "preceptor")
      .leftJoinAndSelect("preceptor.user", "preceptorUser")
      .where("career.id = :careerId", { careerId })
      .getOne();

    if (!career) {
      throw new NotFoundException(
        `Career with id ${careerId} was not found`
      );
    }

    const careerSubjects = await this.careerSubjectRepo
      .createQueryBuilder("cs")
      .leftJoinAndSelect("cs.subject", "subject")
      .leftJoinAndSelect("subject.academicPeriod", "subjectPeriod")
      .where("cs.careerId = :careerId", { careerId })
      .orderBy("cs.yearNo", "ASC", "NULLS LAST")
      .addOrderBy("cs.periodOrder", "ASC", "NULLS LAST")
      .addOrderBy("cs.orderNo", "ASC")
      .getMany();

    const subjectIds = new Set<number>();
    for (const cs of careerSubjects) {
      if (cs.subject) {
        subjectIds.add(cs.subject.id);
      }
    }

    const subjectTeacherMap = new Map<number, string>();
    if (subjectIds.size > 0) {
      const commissions = await this.subjectCommissionRepo.find({
        where: {
          subjectId: In(Array.from(subjectIds)),
          active: true,
        },
        order: { subjectId: "ASC", id: "ASC" },
        select: ["id", "subjectId", "teacherId"],
      });
      for (const commission of commissions) {
        if (
          commission.teacherId &&
          !subjectTeacherMap.has(commission.subjectId)
        ) {
          subjectTeacherMap.set(commission.subjectId, commission.teacherId);
        }
      }
    }

    type PeriodKey = number | "no_period";
    const periods = new Map<
      PeriodKey,
      {
        academicPeriod: AcademicPeriod | null;
        subjects: Array<{
          id: number;
          subjectName: string;
          academicPeriodId: number | null;
          orderNo: number | null;
          careerOrdering: {
            yearNo: number | null;
            periodOrder: number | null;
            orderNo: number;
          };
          metadata: {
            correlative: string | null;
            subjectFormat: string | null;
            teacherFormation: string | null;
            annualWorkload: string | null;
            weeklyWorkload: string | null;
            teacherId: string | null;
          };
        }>;
      }
    >();

    for (const cs of careerSubjects) {
      if (!cs.subject) continue;
      const period = cs.subject.academicPeriod ?? null;
      const periodKey: PeriodKey =
        period?.academicPeriodId ?? "no_period";
      if (!periods.has(periodKey)) {
        periods.set(periodKey, {
          academicPeriod: period,
          subjects: [],
        });
      }

      periods.get(periodKey)!.subjects.push({
        id: cs.subject.id,
        subjectName: cs.subject.subjectName,
        academicPeriodId: cs.subject.academicPeriodId ?? null,
        orderNo: cs.subject.orderNo ?? null,
        careerOrdering: {
          yearNo: cs.yearNo ?? null,
          periodOrder: cs.periodOrder ?? null,
          orderNo: cs.orderNo,
        },
        metadata: {
          correlative: cs.subject.correlative ?? null,
          subjectFormat: cs.subject.subjectFormat ?? null,
          teacherFormation: cs.subject.teacherFormation ?? null,
          annualWorkload: cs.subject.annualWorkload ?? null,
          weeklyWorkload: cs.subject.weeklyWorkload ?? null,
          teacherId: subjectTeacherMap.get(cs.subject.id) ?? null,
        },
      });
    }

    const academicPeriods = Array.from(periods.entries())
      .map(([key, value]) => {
        value.subjects.sort((a, b) => {
          const yearA = a.careerOrdering.yearNo ?? Number.MAX_SAFE_INTEGER;
          const yearB = b.careerOrdering.yearNo ?? Number.MAX_SAFE_INTEGER;
          if (yearA !== yearB) return yearA - yearB;
          const periodA =
            a.careerOrdering.periodOrder ?? Number.MAX_SAFE_INTEGER;
          const periodB =
            b.careerOrdering.periodOrder ?? Number.MAX_SAFE_INTEGER;
          if (periodA !== periodB) return periodA - periodB;
          return a.careerOrdering.orderNo - b.careerOrdering.orderNo;
        });

        return {
          academicPeriod: value.academicPeriod
            ? {
                id: value.academicPeriod.academicPeriodId,
                name: value.academicPeriod.periodName,
                partialsScoreNeeded:
                  value.academicPeriod.partialsScoreNeeded,
              }
            : null,
          subjects: value.subjects,
          sortKey:
            value.academicPeriod?.academicPeriodId ?? Number.MAX_SAFE_INTEGER,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, ...rest }) => rest);

    return {
      career: {
        id: career.id,
        name: career.careerName,
        createdAt: career.createdAt,
        academicPeriod: career.academicPeriod
          ? {
              id: career.academicPeriod.academicPeriodId,
              name: career.academicPeriod.periodName,
              partialsScoreNeeded:
                career.academicPeriod.partialsScoreNeeded,
            }
          : null,
      },
      preceptor: career.preceptor
        ? {
            userId: career.preceptor.userId,
            name: career.preceptor.user?.name ?? null,
            lastName: career.preceptor.user?.lastName ?? null,
            email: career.preceptor.user?.email ?? null,
          }
        : null,
      academicPeriods,
    };
  }

  async findCareerStudentsByCommission(
    careerId: number,
    opts?: { studentStartYear?: number }
  ) {
    const career = await this.careerRepo.findOne({
      where: { id: careerId },
    });

    if (!career) {
      throw new NotFoundException(
        `Career with id ${careerId} was not found`
      );
    }

    const qb = this.careerStudentRepo
      .createQueryBuilder("cs")
      .innerJoinAndSelect("cs.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("student.commission", "commission")
      .where("cs.careerId = :careerId", { careerId });

    if (opts?.studentStartYear !== undefined) {
      qb.andWhere("student.studentStartYear = :studentStartYear", {
        studentStartYear: opts.studentStartYear,
      });
    }

    qb.orderBy("commission.id", "ASC", "NULLS LAST")
      .addOrderBy("student.legajo", "ASC")
      .addOrderBy("student.userId", "ASC");

    const assignments = await qb.getMany();

    type GroupKey = number | "no_commission";
    const grouped = new Map<
      GroupKey,
      {
        commissionId: number | null;
        commissionLetter: string | null;
        students: Array<{
          userId: string;
          legajo: string;
          studentStartYear: number;
          isActive: boolean | null;
          canLogin: boolean | null;
          commissionId: number | null;
          user: {
            name: string;
            lastName: string;
            email: string;
          };
        }>;
      }
    >();

    for (const cs of assignments) {
      const student = cs.student;
      if (!student) continue;

      const key: GroupKey =
        student.commission?.id ?? student.commissionId ?? "no_commission";

      if (!grouped.has(key)) {
        grouped.set(key, {
          commissionId: student.commission?.id ?? student.commissionId ?? null,
          commissionLetter: student.commission?.commissionLetter ?? null,
          students: [],
        });
      }

      grouped.get(key)!.students.push({
        userId: student.userId,
        legajo: student.legajo,
        studentStartYear: student.studentStartYear,
        isActive: student.isActive,
        canLogin: student.canLogin,
        commissionId: student.commission?.id ?? student.commissionId ?? null,
        user: {
          name: student.user?.name ?? "",
          lastName: student.user?.lastName ?? "",
          email: student.user?.email ?? "",
        },
      });
    }

    const commissions = Array.from(grouped.values()).map((entry) => {
      entry.students.sort((a, b) => a.legajo.localeCompare(b.legajo));
      return entry;
    });

    commissions.sort((a, b) => {
      const idA = a.commissionId ?? Number.MAX_SAFE_INTEGER;
      const idB = b.commissionId ?? Number.MAX_SAFE_INTEGER;
      return idA - idB;
    });

    return {
      career: {
        id: career.id,
        name: career.careerName,
      },
      filters: {
        studentStartYear: opts?.studentStartYear ?? null,
      },
      commissions,
    };
  }

  async getSubjectCommissionTeachers(
    subjectId: number
  ): Promise<SubjectCommissionTeachersDto> {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(
        `Subject with id ${subjectId} was not found`
      );
    }

    const assignments = await this.subjectCommissionRepo
      .createQueryBuilder("sc")
      .leftJoinAndSelect("sc.commission", "commission")
      .leftJoinAndSelect("sc.teacher", "teacher")
      .leftJoinAndSelect("teacher.user", "user")
      .where("sc.subjectId = :subjectId", { subjectId })
      .orderBy("commission.commissionLetter", "ASC", "NULLS LAST")
      .addOrderBy("commission.id", "ASC")
      .getMany();

    const commissionMap = new Map<
      number,
      SubjectCommissionTeachersDto["commissions"][number]
    >();

    for (const assignment of assignments) {
      const commission = assignment.commission;
      if (!commission) {
        continue;
      }

      if (!commissionMap.has(commission.id)) {
        commissionMap.set(commission.id, {
          commission: {
            id: commission.id,
            letter: commission.commissionLetter ?? null,
          },
          teachers: [],
        });
      }

      const entry = commissionMap.get(commission.id)!;
      // TODO: soportar múltiples docentes por comisión cuando se agregue una tabla pivote específica.
      const teacher = assignment.teacher;
      if (teacher) {
        const user = teacher.user;
        const teacherId = teacher.userId;
        if (!entry.teachers.some((t) => t.teacherId === teacherId)) {
          const nameParts = [user?.name, user?.lastName].filter(
            (part): part is string => Boolean(part)
          );
          entry.teachers.push({
            teacherId,
            name: nameParts.length > 0 ? nameParts.join(" ") : teacherId,
            email: user?.email ?? "",
            cuil: user?.cuil ?? null,
          });
        }
      }
    }

    const commissions = Array.from(commissionMap.values()).map((entry) => {
      entry.teachers.sort((a, b) => a.name.localeCompare(b.name));
      return entry;
    });

    commissions.sort((a, b) => {
      const letterA = a.commission.letter ?? "";
      const letterB = b.commission.letter ?? "";
      if (letterA && letterB) {
        const cmp = letterA.localeCompare(letterB, undefined, {
          sensitivity: "base",
        });
        if (cmp !== 0) {
          return cmp;
        }
      } else if (letterA) {
        return -1;
      } else if (letterB) {
        return 1;
      }

      return a.commission.id - b.commission.id;
    });

    return {
      subject: { id: subject.id, name: subject.subjectName },
      commissions,
    };
  }

  async findCommissionSubjects(commissionId: number) {
    const assignments = await this.subjectCommissionRepo
      .createQueryBuilder("sc")
      .leftJoinAndSelect("sc.subject", "subject")
      .leftJoinAndSelect("sc.commission", "commission")
      .leftJoinAndSelect("sc.teacher", "teacher")
      .where("sc.commissionId = :commissionId", { commissionId })
      .orderBy("subject.subjectName", "ASC")
      .addOrderBy("sc.id", "ASC")
      .getMany();

    if (assignments.length === 0) {
      const commission = await this.commissionRepo.findOne({
        where: { id: commissionId },
      });
      if (!commission) {
        throw new NotFoundException(
          `Commission with id ${commissionId} was not found`
        );
      }
      return { commission, subjects: [] };
    }

    const { commission } = assignments[0];
    return {
      commission,
      subjects: assignments.map((assignment) => ({
        subjectCommissionId: assignment.id,
        subject: assignment.subject,
        teacher: assignment.teacher,
        active: assignment.active,
      })),
    };
  }

  /**
   * Devuelve las materias y comisiones a cargo de un docente.
   * Agrupa por materia y lista las comisiones en las que el docente está asignado.
   */
  async getTeacherSubjectAssignments(teacherId: string): Promise<{
    teacher: { id: string; name: string; email: string; cuil: string | null } | null;
    subjects: Array<{
      subject: { id: number; name: string };
      commissions: Array<{ id: number; letter: string | null }>;
    }>;
  }> {
    // Traemos todas las asignaciones de comisiones del docente
    const assignments = await this.subjectCommissionRepo
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.subject', 'subject')
      .leftJoinAndSelect('sc.commission', 'commission')
      .leftJoinAndSelect('sc.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .where('sc.teacherId = :teacherId', { teacherId })
      .orderBy('subject.subjectName', 'ASC')
      .addOrderBy('commission.commissionLetter', 'ASC', 'NULLS LAST')
      .addOrderBy('commission.id', 'ASC')
      .getMany();

    // Info básica del docente (si existe)
    let teacher: { id: string; name: string; email: string; cuil: string | null } | null = null;
    if (assignments[0]?.teacher) {
      const t = assignments[0].teacher;
      teacher = {
        id: t.userId,
        name: [t.user?.name, t.user?.lastName].filter(Boolean).join(' ') || t.userId,
        email: t.user?.email ?? '',
        cuil: t.user?.cuil ?? null,
      };
    }

    // Agrupar por materia
    const subjectsMap = new Map<
      number,
      { subject: { id: number, name: string }, commissions: Array<{ id: number, letter: string | null }> }
    >();

    for (const a of assignments) {
      if (!a.subject || !a.commission) continue;
      const sId = a.subject.id;
      if (!subjectsMap.has(sId)) {
        subjectsMap.set(sId, {
          subject: { id: sId, name: a.subject.subjectName },
          commissions: [],
        });
      }
      const entry = subjectsMap.get(sId)!;
      entry.commissions.push({
        id: a.commission.id,
        letter: a.commission.commissionLetter ?? null,
      });
    }

    // Ordenar comisiones por letra/id y materias por nombre
    const subjects = Array.from(subjectsMap.values()).map((s) => {
      s.commissions.sort((a, b) => {
        const la = a.letter ?? '';
        const lb = b.letter ?? '';
        if (la && lb) {
          const cmp = la.localeCompare(lb, undefined, { sensitivity: 'base' });
          if (cmp !== 0) return cmp;
        } else if (la) {
          return -1;
        } else if (lb) {
          return 1;
        }
        return a.id - b.id;
      });
      return s;
    });

    subjects.sort((a, b) => a.subject.name.localeCompare(b.subject.name));

    return { teacher, subjects };
  }

  /**
   * Devuelve un resumen mínimo de materias por año para un estudiante,
   * basado en el plan de la carrera a la que está inscripto.
   * Nota: no calcula notas reales; se marca todo como "Inscripto" y examInfo "-".
   */
  async getStudentAcademicSubjectsMinimal(studentId: string): Promise<{
    byYear: Record<string, Array<{ subjectName: string; year: number | null; division: string | null; condition: string; examInfo: string }>>;
  }> {
    // Buscar la última inscripción del estudiante a una carrera
    const cs = await this.careerStudentRepo.findOne({ where: { studentId } });
    if (!cs) {
      return { byYear: {} };
    }

    // Traer datos de la carrera (ya arma materias por período y orden)
    const careerData = await this.findCareerFullData(cs.careerId);

    // Traer comisión del estudiante (para mostrar letra si existe)
    let commissionLetter: string | null = null;
    const student = await this.studentRepo.findOne({
      where: { userId: studentId },
      relations: { commission: true },
    });
    if (student?.commission) {
      commissionLetter = student.commission.commissionLetter ?? null;
    }

    const byYear: Record<string, Array<{ subjectName: string; year: number | null; division: string | null; condition: string; examInfo: string }>> = {};

    for (const period of careerData.academicPeriods) {
      for (const subject of period.subjects) {
        const yearNo = subject.careerOrdering.yearNo ?? null;
        const yearKey = yearNo ? `${yearNo}° Año` : `Sin año`;
        if (!byYear[yearKey]) byYear[yearKey] = [];
        byYear[yearKey].push({
          subjectName: subject.subjectName,
          year: yearNo,
          division: commissionLetter ? `${commissionLetter}` : null,
          condition: 'Inscripto',
          examInfo: '-',
        });
      }
    }

    // Ordenar materias dentro de cada año por nombre
    Object.values(byYear).forEach((arr) => arr.sort((a, b) => a.subjectName.localeCompare(b.subjectName)));

    return { byYear };
  }

  /**
   * Situación académica REAL por estudiante: usa la vista v_subject_grades para traer notas,
   * final, asistencia y condición por materia. Complementa con el año (yearNo) desde el plan
   * de carrera (career_subjects) del estudiante.
   */
  async getStudentAcademicStatus(studentId: string): Promise<{
    studentId: string;
    byYear: Record<string, Array<{
      subjectId: number;
      subjectName: string;
      year: number | null;
      commissionId: number;
      commissionLetter: string | null;
      partials: 2 | 4;
      note1: number | null;
      note2: number | null;
      note3: number | null;
      note4: number | null;
      final: number | null;
      attendancePercentage: number;
      condition: string | null;
    }>>;
  }> {
    // Validar que el usuario sea estudiante
    const student = await this.studentRepo.findOne({ 
      where: { userId: studentId },
      relations: ['user', 'user.role']
    });
    
    if (!student) {
      throw new NotFoundException(`El usuario ${studentId} no es un estudiante o no existe.`);
    }
    
    // Mapa subjectId -> yearNo según la carrera a la que está inscripto
    const cs = await this.careerStudentRepo.findOne({ where: { studentId } });
    const yearBySubject = new Map<number, number | null>();
    if (cs) {
      const rows = await this.careerSubjectRepo
        .createQueryBuilder('cs')
        .leftJoinAndSelect('cs.subject', 'subject')
        .where('cs.careerId = :careerId', { careerId: cs.careerId })
        .getMany();
      for (const row of rows) {
        if (row.subject) {
          yearBySubject.set(row.subject.id, row.yearNo ?? null);
        }
      }
    }

    // Traer todas las filas de la vista por el estudiante
    const viewRows = await this.subjectGradesViewRepo
      .createQueryBuilder('vg')
      .where('vg.student_id = :studentId', { studentId })
      .orderBy('vg.subject_id', 'ASC')
      .addOrderBy('vg.commission_id', 'ASC')
      .getMany();

    // Elegir una fila por materia (si hubiera más de una comisión, tomamos la primera por id)
    const bySubject = new Map<number, typeof viewRows[number]>();
    for (const row of viewRows) {
      if (!bySubject.has(row.subjectId)) bySubject.set(row.subjectId, row);
    }

    const byYear: Record<string, Array<{
      subjectId: number;
      subjectName: string;
      year: number | null;
      commissionId: number;
      commissionLetter: string | null;
      partials: 2 | 4;
      note1: number | null;
      note2: number | null;
      note3: number | null;
      note4: number | null;
      final: number | null;
      attendancePercentage: number;
      condition: string | null;
    }>> = {};

    const normalizePartials = (n: number | null | undefined): 2 | 4 =>
      n === 4 ? 4 : 2;

    for (const row of bySubject.values()) {
      const yearNo = yearBySubject.get(row.subjectId) ?? null;
      const key = yearNo ? `${yearNo}° Año` : 'Sin año';
      if (!byYear[key]) byYear[key] = [];
      byYear[key].push({
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        year: yearNo,
        commissionId: row.commissionId,
        commissionLetter: row.commissionLetter ?? null,
        partials: normalizePartials(row.partials),
        note1: row.note1 ?? null,
        note2: row.note2 ?? null,
        note3: row.note3 ?? null,
        note4: row.note4 ?? null,
        final: row.final ?? null,
        attendancePercentage: Number(row.attendancePercentage ?? 0) || 0,
        condition: row.condition ?? null,
      });
    }

    // Ordenar materias dentro de cada año por nombre
    Object.values(byYear).forEach((arr) =>
      arr.sort((a, b) => a.subjectName.localeCompare(b.subjectName))
    );

    return { studentId, byYear };
  }
}
