import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Request } from "express";

import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";

import { FinalExam } from "@/entities/finals/final-exam.entity";
import { ExamTable } from "@/entities/finals/exam-table.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { PrerequisitesService } from "@/modules/prerequisites/prerequisites.service";
import { StudentInscriptionAudit } from "@/entities/inscriptions/student-inscription-audit.entity";

type WindowState = "open" | "upcoming" | "closed" | "past";

@ApiTags("Student Inscriptions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(
  ROLE.EXECUTIVE_SECRETARY,
  ROLE.SECRETARY,
  ROLE.PRECEPTOR,
  ROLE.STUDENT,
)
@Controller("students/inscriptions")
export class StudentInscriptionsController {
  constructor(
    @InjectRepository(FinalExam)
    private readonly finalRepo: Repository<FinalExam>,
    @InjectRepository(ExamTable)
    private readonly tableRepo: Repository<ExamTable>,
    @InjectRepository(FinalExamsStudent)
    private readonly linkRepo: Repository<FinalExamsStudent>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(CareerStudent)
    private readonly careerStudentRepo: Repository<CareerStudent>,
    @InjectRepository(CareerSubject)
    private readonly careerSubjectRepo: Repository<CareerSubject>,
    private readonly prereqSvc: PrerequisitesService,
    @InjectRepository(StudentInscriptionAudit)
    private readonly auditRepo: Repository<StudentInscriptionAudit>,
  ) {}

  @Get("exam-tables")
  @ApiOperation({
    summary:
      "Listado de mesas publicadas para el alumno (con validaciones básicas)",
  })
  @ApiQuery({ name: "subjectId", required: false, type: Number })
  @ApiQuery({ name: "from", required: false, type: String })
  @ApiQuery({ name: "to", required: false, type: String })
  @ApiQuery({
    name: "windowState",
    required: false,
    type: String,
    enum: ["open", "upcoming", "closed", "past", "all"],
  })
  @ApiOkResponse({
    description: "Payload compatible con front StudentInscriptionsService",
  })
  async listExamTables(
    @Req() req: Request,
    @Query("subjectId") subjectId?: number,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("windowState") windowState: WindowState | "all" = "open",
  ) {
    const studentId = (req.user as any)?.id as string | undefined;
    const qb = this.finalRepo
      .createQueryBuilder("f")
      .leftJoin("f.examTable", "t")
      .leftJoin("f.subject", "s")
      .select([
        "f.id AS id",
        "to_char(f.exam_date, 'YYYY-MM-DD') AS exam_date",
        "f.aula AS aula",
        "t.id AS table_id",
        "t.name AS table_name",
        "to_char(t.start_date, 'YYYY-MM-DD') AS table_start",
        "to_char(t.end_date, 'YYYY-MM-DD') AS table_end",
        "s.id AS subject_id",
        "s.subject_name AS subject_name",
        "s.order_no AS subject_order_no",
      ])
      .orderBy("t.id", "ASC")
      .addOrderBy("s.id", "ASC")
      .addOrderBy("f.exam_date", "ASC");

    if (subjectId) qb.andWhere("s.id = :sid", { sid: Number(subjectId) });
    if (from) qb.andWhere("f.exam_date >= :from", { from });
    if (to) qb.andWhere("f.exam_date <= :to", { to });

    const rows = await qb.getRawMany();

    // Group by exam table + subject
    const groups = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.table_id}:${r.subject_id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          mesaId: Number(r.table_id),
          subjectId: Number(r.subject_id),
          subjectName: String(r.subject_name),
          subjectCode: null,
          commissionLabel: null,
          availableCalls: [],
          duplicateEnrollment: false,
          blockedReason: null,
          blockedMessage: null,
          academicRequirement: null as string | null,
          window: {
            opensAt: r.table_start,
            closesAt: r.table_end,
            label: r.table_name,
            id: Number(r.table_id),
          },
          subjectOrderNo: r.subject_order_no
            ? Number(r.subject_order_no)
            : null,
        });
      }
      const g = groups.get(key);
      g.availableCalls.push({
        id: Number(r.id),
        label: "Llamado",
        examDate: r.exam_date,
        aula: r.aula ?? null,
        quotaTotal: null,
        quotaUsed: null,
        enrollmentWindow: {
          id: g.window.id,
          label: g.window.label,
          opensAt: g.window.opensAt,
          closesAt: g.window.closesAt,
        },
        additional: false,
      });
    }

    const result = Array.from(groups.values());

    // Resolve duplicate enrollment per subject within the same table
    if (studentId) {
      const allFinalIds = result.flatMap((g) =>
        g.availableCalls.map((c: any) => c.id),
      );
      if (allFinalIds.length > 0) {
        const links = await this.linkRepo.find({
          where: { finalExamId: In(allFinalIds), studentId } as any,
        });
        const enrolledByFinal = new Set<number>(
          links.filter((l) => (l as any).enrolledAt).map((l) => l.finalExamId),
        );
        for (const g of result) {
          let any = false;
          g.availableCalls = g.availableCalls.map((c: any) => {
            const enrolled = enrolledByFinal.has(c.id);
            if (enrolled) any = true;
            return { ...c, enrolled };
          });
          g.duplicateEnrollment = any;
        }
      }
    }

    // Academic requirement message via prerequisites, when possible
    if (studentId) {
      const cs = await this.careerStudentRepo.findOne({ where: { studentId } });
      if (cs) {
        for (const g of result) {
          if (g.subjectOrderNo) {
            try {
              const validation = await this.prereqSvc.validateEnrollment(
                cs.careerId,
                studentId,
                g.subjectOrderNo,
              );
              if (
                !validation.canEnroll &&
                Array.isArray(validation.unmet) &&
                validation.unmet.length > 0
              ) {
                // Map unmet orderNos to subject names
                const unmet = await this.careerSubjectRepo.find({
                  where: {
                    careerId: cs.careerId,
                    orderNo: In(validation.unmet),
                  },
                  relations: ["subject"],
                });
                const lines = unmet
                  .map((row) => {
                    const name =
                      row.subject?.subjectName ??
                      `Materia orden ${row.orderNo}`;
                    return `${row.orderNo} - ${name} (Aprobada o Regularizada)`;
                  })
                  .sort();
                g.academicRequirement = lines.join("; ");
              }
            } catch {}
          }
        }
      }
    }

    // Filter by window state if requested
    const now = new Date();
    const inState = (opens?: string, closes?: string): WindowState => {
      if (!opens || !closes) return "closed";
      const start = Date.parse(opens);
      const end = Date.parse(closes);
      if (Number.isNaN(start) || Number.isNaN(end)) return "closed";
      if (now.getTime() < start) return "upcoming";
      if (now.getTime() > end) return "past";
      return "open";
    };
    const filtered =
      windowState && windowState !== "all"
        ? result.filter(
            (g) => inState(g.window.opensAt, g.window.closesAt) === windowState,
          )
        : result;

    // Shape response as { data: [...] } for front mapper compatibility
    return {
      data: filtered.map(({ window, subjectOrderNo, ...rest }) => rest),
    };
  }

  @Post("exam-tables/:mesaId/enroll")
  @ApiOperation({ summary: "Inscribir alumno en examen final (por callId)" })
  @ApiParam({ name: "mesaId", type: Number })
  @ApiOkResponse({ description: "Respuesta de inscripción normalizada" })
  async enroll(
    @Param("mesaId") _mesaId: string,
    @Body() body: { callId?: number; studentId?: string },
    @Req() req: Request,
  ) {
    const studentId = body?.studentId || (req.user as any)?.id;
    if (!body?.callId) {
      return {
        ok: false,
        blocked: true,
        reasonCode: "UNKNOWN",
        message: "callId es requerido",
      };
    }
    try {
      // Server-side correlatives enforcement
      const finalExam = await this.finalRepo.findOne({
        where: { id: Number(body.callId) },
        relations: ["subject", "examTable"],
      });
      if (!finalExam)
        return {
          ok: false,
          blocked: true,
          reasonCode: "UNKNOWN",
          message: "Final no encontrado",
        };

      const cs = await this.careerStudentRepo.findOne({ where: { studentId } });
      const subject = await this.subjectRepo.findOne({
        where: { id: finalExam.subjectId },
      });

      if (cs && subject?.orderNo) {
        try {
          const validation = await this.prereqSvc.validateEnrollment(
            cs.careerId,
            studentId!,
            subject.orderNo,
          );
          if (
            !validation.canEnroll &&
            Array.isArray(validation.unmet) &&
            validation.unmet.length > 0
          ) {
            const unmet = await this.careerSubjectRepo.find({
              where: { careerId: cs.careerId, orderNo: In(validation.unmet) },
              relations: ["subject"],
            });
            const lines = unmet
              .map(
                (row) =>
                  `${row.orderNo} - ${row.subject?.subjectName ?? "Materia"} (Aprobada o Regularizada)`,
              )
              .sort();
            // Audit blocked attempt
            await this.auditSafeSave({
              studentId: studentId!,
              context: "enroll-exam",
              mesaId: finalExam.examTableId,
              callId: finalExam.id,
              outcome: "blocked",
              reasonCode: "MISSING_REQUIREMENTS",
              subjectId: finalExam.subjectId,
              subjectOrderNo: subject.orderNo,
              subjectName: subject.subjectName,
              missingCorrelatives: lines,
              ip: req.ip || null,
              userAgent: req.headers["user-agent"]
                ? String(req.headers["user-agent"])
                : null,
            });
            return {
              ok: false,
              blocked: true,
              reasonCode: "MISSING_REQUIREMENTS",
              message: lines.join("; "),
            };
          }
        } catch {}
      }

      // Proceed with enrollment
      let link: FinalExamsStudent | null = await this.linkRepo.findOne({
        where: { finalExamId: finalExam.id, studentId },
      });
      if (!link) {
        link = this.linkRepo.create({
          finalExamId: finalExam.id,
          studentId,
          score: null,
          notes: "",
        });
      }
      (link as any).enrolledAt = new Date();
      // Detectar si es preceptor o estudiante
      const currentUser = req.user as any;
      const userRole = currentUser?.role;
      (link as any).enrolledBy = userRole === ROLE.PRECEPTOR ? "preceptor" : "student";
      await this.linkRepo.save(link as any);

      await this.auditSafeSave({
        studentId: studentId!,
        context: "enroll-exam",
        mesaId: finalExam.examTableId,
        callId: finalExam.id,
        outcome: "success",
        reasonCode: null,
        subjectId: finalExam.subjectId,
        subjectOrderNo: subject?.orderNo ?? null,
        subjectName: subject?.subjectName ?? null,
        missingCorrelatives: null,
        ip: req.ip || null,
        userAgent: req.headers["user-agent"]
          ? String(req.headers["user-agent"])
          : null,
      });

      return { ok: true, blocked: false, message: "Inscripción confirmada" };
    } catch (e: any) {
      await this.auditSafeSave({
        studentId: studentId!,
        context: "enroll-exam",
        mesaId: null,
        callId: body.callId ?? null,
        outcome: "error",
        reasonCode: "UNKNOWN",
        subjectId: null,
        subjectOrderNo: null,
        subjectName: null,
        missingCorrelatives: null,
        ip: req.ip || null,
        userAgent: req.headers["user-agent"]
          ? String(req.headers["user-agent"])
          : null,
      });
      return {
        ok: false,
        blocked: true,
        reasonCode: "UNKNOWN",
        message: String(e?.message || "No se pudo inscribir"),
      };
    }
  }

  @Post("audit-events")
  @ApiOperation({
    summary: "Auditoría de eventos de inscripción (no persistente)",
  })
  @ApiOkResponse({ description: "Aceptado" })
  async audit(@Body() payload: any, @Req() req: Request) {
    const studentId =
      (payload?.studentId as string) || (req.user as any)?.id || null;
    await this.auditSafeSave({
      studentId: studentId!,
      context: String(payload?.context || ""),
      mesaId: (payload?.mesaId as number) ?? null,
      callId: (payload?.callId as number) ?? null,
      outcome: (payload?.outcome as any) ?? "blocked",
      reasonCode: (payload?.reasonCode as string) ?? null,
      subjectId: (payload?.subjectId as number) ?? null,
      subjectOrderNo: (payload?.subjectOrderNo as number) ?? null,
      subjectName: (payload?.subjectName as string) ?? null,
      missingCorrelatives: Array.isArray(payload?.missingCorrelativesText)
        ? payload.missingCorrelativesText
        : typeof payload?.missingCorrelativesText === "string"
          ? [payload.missingCorrelativesText]
          : null,
      ip: req.ip || null,
      userAgent: req.headers["user-agent"]
        ? String(req.headers["user-agent"])
        : null,
    });
    return { ok: true };
  }

  private async auditSafeSave(data: Partial<StudentInscriptionAudit>) {
    try {
      const entity = this.auditRepo.create(data as any);
      await this.auditRepo.save(entity);
    } catch (e) {
      try {
        console.warn("[audit-events][save-failed]", e);
      } catch {}
    }
  }
}
