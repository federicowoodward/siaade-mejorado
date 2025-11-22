import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Student } from "@/entities/users/student.entity";
import { PdfEngineService } from "@/modules/pdf-generator/pdf-engine.service";
import { CatalogsService } from "@/modules/catalogs/catalogs.service";

const CAREER_NAME = "TECNICATURA SUPERIOR EN DESARROLLO DE SOFTWARE";
const SCHOOL_NAME = "Instituto Superior en Actividades Deportivas";

@Injectable()
export class PdfGeneratorService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly pdfEngineService: PdfEngineService,
    private readonly catalogsService: CatalogsService
  ) {}

  private formatDate(date?: Date | string | null): string {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = String(d.getUTCFullYear());
    return `${day}/${month}/${year}`;
  }

  private async loadStudent(studentId: string | number): Promise<Student> {
    const normalizedId = String(studentId);
    const student = await this.studentRepo.findOne({
      where: { userId: normalizedId },
      relations: [
        "user",
        "user.commonData",
        "user.userInfo",
        "finals",
        "finals.finalExam",
      ],
    });
    if (!student) {
      throw new NotFoundException("Estudiante no encontrado");
    }
    return student;
  }

  async getStudentCertificatePdf(studentId: string | number): Promise<Buffer> {
    const payload = await this.buildStudentCertificatePayload(studentId);
    const templateName = "student-certificate";
    const requiredFields = [
      "name",
      "lastname",
      "dni",
      "careerName",
      "day",
      "month",
      "year",
    ];
    const payloadRecord = payload as Record<string, unknown>;
    for (const field of requiredFields) {
      const value = payloadRecord[field];
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        throw new Error(
          `Missing required field '${field}' for template '${templateName}'`
        );
      }
    }

    return this.pdfEngineService.generatePdfFromTemplate(templateName, payload);
  }

  async getStudentCertificateHtml(studentId: string | number): Promise<string> {
    const payload = await this.buildStudentCertificatePayload(studentId);
    return this.pdfEngineService.renderTemplateToHtml(
      "student-certificate",
      payload
    );
  }

  async getExamRegistrationReceiptPdf(
    studentId: string | number
  ): Promise<Buffer> {
    const payload = await this.buildExamRegistrationReceiptPayload(studentId);
    return this.pdfEngineService.generatePdfFromTemplate(
      "exam-registration-receipt",
      payload
    );
  }

  async getExamRegistrationReceiptHtml(
    studentId: string | number
  ): Promise<string> {
    const payload = await this.buildExamRegistrationReceiptPayload(studentId);
    return this.pdfEngineService.renderTemplateToHtml(
      "exam-registration-receipt",
      payload
    );
  }

  async getAcademicPerformancePdf(studentId: string | number): Promise<Buffer> {
    const viewModel = await this.buildAcademicSummaryPayload(studentId);
    return this.pdfEngineService.generatePdfFromTemplate(
      "academic-performance",
      viewModel as unknown as Record<string, unknown>
    );
  }

  async getAcademicPerformanceHtml(
    studentId: string | number
  ): Promise<string> {
    const viewModel = await this.buildAcademicSummaryPayload(studentId);
    return this.pdfEngineService.renderTemplateToHtml(
      "academic-performance",
      viewModel as unknown as Record<string, unknown>
    );
  }

  async generateAcademicSummary(studentId: string): Promise<Buffer> {
    const viewModel = await this.buildAcademicSummaryPayload(studentId);
    return this.pdfEngineService.generatePdfFromTemplate(
      "academic-performance",
      viewModel as unknown as Record<string, unknown>
    );
  }

  private async buildAcademicSummaryPayload(
    studentId: string | number
  ): Promise<AcademicSummaryViewModel> {
    const student = await this.loadStudent(studentId);
    const user = student.user;
    const commonData = user.commonData;
    const userInfo = user.userInfo;

    const bornYear = commonData?.birthDate ? String(commonData.birthDate) : "";

    const studentViewModel: AcademicSummaryStudentView = {
      lastname: user.lastName,
      name: user.name,
      sex: commonData?.sex ?? "",
      bornYear,
      bornPlace: commonData?.birthPlace ?? "",
      legajoId: student.legajo,
      libroMatriz: "",
      folio: "",
      documentType: "D.N.I",
      documentNumber: user.cuil,
      cuil: user.cuil,
      email: user.email,
      telephone: userInfo?.phone ?? "",
      planName: CAREER_NAME,
    };

    const finalsBySubjectId = new Map<
      number,
      {
        examDate: Date;
        score: number | null;
      }
    >();

    for (const fes of student.finals ?? []) {
      const finalExam = fes.finalExam;
      if (!finalExam) continue;
      const subjectId = finalExam.subjectId;
      const examDate = finalExam.examDate;
      if (!subjectId || !examDate) continue;

      const score =
        typeof fes.score === "string" && fes.score.trim() !== ""
          ? Number(fes.score)
          : null;

      const existing = finalsBySubjectId.get(subjectId);
      if (!existing || examDate > existing.examDate) {
        finalsBySubjectId.set(subjectId, { examDate, score });
      }
    }

    const academicStatus = await this.catalogsService.getStudentAcademicStatus(
      student.userId
    );

    const years: AcademicSummaryYearView[] = [];

    const yearEntries = Object.entries(academicStatus.byYear);
    yearEntries.sort((a, b) => {
      const subjectsA = a[1];
      const subjectsB = b[1];
      const yearA =
        subjectsA.length > 0 && subjectsA[0].year != null
          ? subjectsA[0].year
          : Number.MAX_SAFE_INTEGER;
      const yearB =
        subjectsB.length > 0 && subjectsB[0].year != null
          ? subjectsB[0].year
          : Number.MAX_SAFE_INTEGER;
      if (yearA !== yearB) return yearA - yearB;
      return a[0].localeCompare(b[0]);
    });

    for (const [yearLabelRaw, subjectRows] of yearEntries) {
      if (subjectRows.length === 0) continue;

      const subjects: AcademicSummarySubjectView[] = subjectRows.map((row) => {
        const finalsInfo = finalsBySubjectId.get(row.subjectId);
        const finalScoreRaw =
          finalsInfo?.score != null
            ? finalsInfo.score
            : row.final != null
              ? row.final
              : null;

        const finalScore =
          typeof finalScoreRaw === "number" && !Number.isNaN(finalScoreRaw)
            ? finalScoreRaw
            : null;

        const status = (row.condition ?? "Inscripto").trim() || "Inscripto";

        const conditionLower = status.toLowerCase();
        const hasApprovedScore =
          typeof finalScore === "number" && finalScore >= 4;

        let generalStatusCode: string;
        if (
          hasApprovedScore ||
          conditionLower.includes("promo") ||
          conditionLower.includes("aprob")
        ) {
          generalStatusCode = "APR";
        } else if (
          conditionLower.includes("libre") ||
          conditionLower.includes("no apr") ||
          conditionLower.includes("desaprob")
        ) {
          generalStatusCode = "LIB";
        } else if (conditionLower.includes("regular")) {
          generalStatusCode = "REG";
        } else {
          generalStatusCode = "INS";
        }

        const examDate = finalsInfo?.examDate ?? null;

        let courseYearLabel: string;
        if (row.year != null && Number.isFinite(row.year)) {
          const calendarYear = student.studentStartYear + row.year - 1;
          courseYearLabel = String(calendarYear);
        } else if (examDate) {
          courseYearLabel = String(examDate.getUTCFullYear());
        } else {
          courseYearLabel = "-";
        }

        const courseTypeLabel = "-";
        const shiftLabel = "-";
        // TODO: completar tipo de cursado (anual/cuatrimestral) y turno real cuando haya datos en el DTO.

        let finalConditionLabel = "";
        if (conditionLower.includes("promo")) {
          finalConditionLabel = "Promoc.";
        } else if (conditionLower.includes("aprob")) {
          finalConditionLabel = "Aprob.";
        } else if (conditionLower.includes("libre")) {
          finalConditionLabel = "Libre";
        } else if (conditionLower.includes("regular")) {
          finalConditionLabel = "Reg.";
        }

        const finalScoreText =
          typeof finalScore === "number" && finalScore >= 1
            ? finalScore.toFixed(2)
            : "-";

        const finalDateText =
          examDate != null ? this.formatDateForSummary(examDate) : "-";

        const finalBookFolio = "";
        // TODO: completar libro/folio (acta) cuando exista esa información en la base de datos o el DTO.

        return {
          name: row.subjectName,
          generalStatusCode,
          courseYearLabel,
          courseTypeLabel,
          shiftLabel,
          finalConditionLabel,
          finalScoreText,
          finalDateText,
          finalBookFolio,
          status,
          finalScore,
        };
      });

      const yearAverage = this.computeYearAverage(
        subjects.map((s) => s.finalScore)
      );
      const yearStatus = this.computeYearStatus(subjects);

      const firstRow = subjectRows[0];
      const yearNo = firstRow.year;
      const label =
        yearNo != null && Number.isFinite(yearNo)
          ? `${yearNo}º Año`
          : yearLabelRaw;

      years.push({
        label,
        subjects,
        yearStatus,
        yearAverage,
      });
    }

    return {
      instituteName: SCHOOL_NAME,
      subtitle: "Resumen Situación Académica (sin aplazos)",
      student: studentViewModel,
      years,
    };
  }

  private formatDateForSummary(date: Date): string {
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = String(date.getUTCFullYear());
    return `${day}/${month}/${year}`;
  }

  private buildSubjectDescriptor(
    info: { year: number | null; condition: string | null },
    examDate: Date | null,
    studentStartYear: number
  ): string {
    let month: string | null = null;
    let yearText: string | null = null;

    if (examDate) {
      month = String(examDate.getUTCMonth() + 1).padStart(2, "0");
      yearText = String(examDate.getUTCFullYear());
    } else if (info.year != null) {
      const calendarYear = studentStartYear + info.year - 1;
      month = "12";
      yearText = String(calendarYear);
    }

    if (!month || !yearText) {
      return "-";
    }

    const baseCondition = (info.condition ?? "").trim();
    let typeLabel = "Inscripto";
    const lower = baseCondition.toLowerCase();
    if (lower.includes("promo")) {
      typeLabel = "Promocionado";
    } else if (lower.includes("regular")) {
      typeLabel = "Regular";
    } else if (lower.includes("libre")) {
      typeLabel = "Libre";
    } else if (lower.includes("aprob")) {
      typeLabel = "Aprobado";
    }

    return `${typeLabel} - ${yearText} - ${typeLabel}`;
  }

  private computeYearAverage(scores: Array<number | null>): string {
    const valid = scores.filter(
      (n): n is number => typeof n === "number" && !Number.isNaN(n) && n >= 4
    );
    if (valid.length === 0) return "-";
    const sum = valid.reduce((acc, n) => acc + n, 0);
    const avg = sum / valid.length;
    return avg.toFixed(2);
  }

  private computeYearStatus(subjects: AcademicSummarySubjectView[]): string {
    if (subjects.length === 0) return "";

    let hasApproved = false;
    let hasInProgress = false;
    let hasFailed = false;

    for (const subject of subjects) {
      const status = (subject.status ?? "").toLowerCase();
      const finalScore = subject.finalScore;

      const isApproved =
        (typeof finalScore === "number" && finalScore >= 4) ||
        status.includes("aprob") ||
        status.includes("promo");

      if (isApproved) {
        hasApproved = true;
        continue;
      }

      if (
        status.includes("inscrip") ||
        status.includes("curs") ||
        status.includes("regular")
      ) {
        hasInProgress = true;
      } else if (status.includes("libre") || status.includes("no inscrip")) {
        hasFailed = true;
      }
    }

    if (!hasInProgress && !hasFailed && hasApproved) {
      return "Completo";
    }

    if (hasInProgress) {
      return "Cursando";
    }

    if (hasFailed) {
      return "Incompleto";
    }

    return "En curso";
  }

  private async buildStudentCertificatePayload(
    studentId: string | number
  ): Promise<StudentCertificatePayload> {
    const student = await this.loadStudent(studentId);
    const commonData = student.user.commonData;
    const issuanceDate = new Date();
    const day = String(issuanceDate).padStart(2, "0");
    const month = issuanceDate.toLocaleString("es-AR", { month: "long" });
    const year = String(issuanceDate);
    const bornYear = commonData?.birthDate ? String(commonData.birthDate) : "";
    return {
      lastname: student.user.lastName,
      name: student.user.name,
      dni: student.user.cuil,
      careerName: CAREER_NAME,
      schoolName: SCHOOL_NAME,
      day,
      month,
      year,
      born_year: bornYear,
    };
  }

  private async buildExamRegistrationReceiptPayload(
    studentId: string | number
  ): Promise<ExamRegistrationReceiptPayload> {
    const student = await this.loadStudent(studentId);
    const commonData = student.user.commonData;
    return {
      lastname: student.user.lastName,
      name: student.user.name,
      dni: student.user.cuil,
      sex: commonData?.sex ?? "",
      birth_date: this.formatDate(commonData?.birthDate),
    };
  }
}

interface StudentCertificatePayload extends Record<string, string> {
  lastname: string;
  name: string;
  dni: string;
  careerName: string;
  schoolName: string;
  day: string;
  month: string;
  year: string;
  born_year: string;
}

interface ExamRegistrationReceiptPayload extends Record<string, string> {
  lastname: string;
  name: string;
  dni: string;
  sex: string;
  birth_date: string;
}

interface AcademicSummaryStudentView {
  lastname: string;
  name: string;
  sex: string;
  bornYear: string;
  bornPlace: string;
  legajoId: string;
  libroMatriz: string;
  folio: string;
  documentType: string;
  documentNumber: string;
  cuil: string;
  email: string;
  telephone: string;
  planName: string;
}

interface AcademicSummarySubjectView {
  name: string;
  // Bloque 1: estado general de cursado
  generalStatusCode: "INS" | "REG" | "LIB" | "APR" | string;
  courseYearLabel: string;
  courseTypeLabel: string;
  shiftLabel: string;

  // Bloque 2: examen final
  finalConditionLabel: string;
  finalScoreText: string;
  finalDateText: string;
  finalBookFolio: string;

  // Datos crudos que ya existían
  status: string;
  finalScore: number | null;
}

interface AcademicSummaryYearView {
  label: string;
  subjects: AcademicSummarySubjectView[];
  yearStatus: string;
  yearAverage: string;
}

interface AcademicSummaryViewModel {
  instituteName: string;
  subtitle: string;
  student: AcademicSummaryStudentView;
  years: AcademicSummaryYearView[];
}
