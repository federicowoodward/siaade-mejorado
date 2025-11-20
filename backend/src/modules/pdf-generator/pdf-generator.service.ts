import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Student } from "@/entities/users/student.entity";
import { PdfEngineService } from "@/modules/pdf-generator/pdf-engine.service";

const CAREER_NAME = "TECNICATURA SUPERIOR EN DESARROLLO DE SOFTWARE";
const SCHOOL_NAME = "Instituto Superior en Actividades Deportivas";

@Injectable()
export class PdfGeneratorService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly pdfEngineService: PdfEngineService,
  ) {}

  private formatDate(date?: Date | null): string {
    if (!date) return "";
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  private async loadStudent(studentId: string | number): Promise<Student> {
    const normalizedId = String(studentId);
    const student = await this.studentRepo.findOne({
      where: { userId: normalizedId },
      relations: ["user", "user.commonData"],
    });
    if (!student) {
      throw new NotFoundException("Estudiante no encontrado");
    }
    return student;
  }

  async getStudentCertificatePdf(studentId: string | number): Promise<Buffer> {
    const payload = await this.buildStudentCertificatePayload(studentId);
    const templateName = "student-certificate";
    // Validaciones específicas para los campos utilizados por la plantilla student-certificate.
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
          `Missing required field '${field}' for template '${templateName}'`,
        );
      }
    }

    return this.pdfEngineService.generatePdfFromTemplate(
      templateName,
      payload,
    );
  }

  async getStudentCertificateHtml(studentId: string | number): Promise<string> {
    const payload = await this.buildStudentCertificatePayload(studentId);
    return this.pdfEngineService.renderTemplateToHtml(
      "student-certificate",
      payload,
    );
  }

  async getExamRegistrationReceiptPdf(
    studentId: string | number,
  ): Promise<Buffer> {
    const payload = await this.buildExamRegistrationReceiptPayload(studentId);
    return this.pdfEngineService.generatePdfFromTemplate(
      "exam-registration-receipt",
      payload,
    );
  }

  async getExamRegistrationReceiptHtml(
    studentId: string | number,
  ): Promise<string> {
    const payload = await this.buildExamRegistrationReceiptPayload(studentId);
    return this.pdfEngineService.renderTemplateToHtml(
      "exam-registration-receipt",
      payload,
    );
  }

  async getAcademicPerformancePdf(studentId: string | number): Promise<Buffer> {
    const payload = await this.buildAcademicPerformancePayload(studentId);
    return this.pdfEngineService.generatePdfFromTemplate(
      "academic-performance",
      payload,
    );
  }

  async getAcademicPerformanceHtml(
    studentId: string | number,
  ): Promise<string> {
    const payload = await this.buildAcademicPerformancePayload(studentId);
    return this.pdfEngineService.renderTemplateToHtml(
      "academic-performance",
      payload,
    );
  }

  private async buildStudentCertificatePayload(
    studentId: string | number,
  ): Promise<StudentCertificatePayload> {
    const student = await this.loadStudent(studentId);
    const issuanceDate = new Date();
    const day = String(issuanceDate.getUTCDate()).padStart(2, "0");
    const month = issuanceDate.toLocaleString("es-AR", { month: "long" });
    const year = String(issuanceDate.getUTCFullYear());
    return {
      lastname: student.user.lastName,
      name: student.user.name,
      dni: student.user.cuil,
      careerName: CAREER_NAME,
      schoolName: SCHOOL_NAME,
      day,
      month,
      year,
    };
  }

  private async buildExamRegistrationReceiptPayload(
    studentId: string | number,
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

  private async buildAcademicPerformancePayload(
    studentId: string | number,
  ): Promise<AcademicPerformancePayload> {
    const student = await this.loadStudent(studentId);
    const commonData = student.user.commonData;
    // TODO(PDF-GENERATOR): revisar campo 'born_year' en la entidad Student o entidad relacionada.
    const bornYear = commonData?.birthDate
      ? String(commonData.birthDate.getUTCFullYear())
      : "";
    // TODO(PDF-GENERATOR): validar si existe un campo 'legajoId' especifico o si debe usarse 'legajo'.
    return {
      lastname: student.user.lastName,
      name: student.user.name,
      dni: student.user.cuil,
      sex: commonData?.sex ?? "",
      born_year: bornYear,
      born_place: commonData?.birthPlace ?? "",
      legajoId: student.legajo,
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
}

interface ExamRegistrationReceiptPayload extends Record<string, string> {
  lastname: string;
  name: string;
  dni: string;
  sex: string;
  birth_date: string;
}

interface AcademicPerformancePayload extends Record<string, string> {
  lastname: string;
  name: string;
  dni: string;
  sex: string;
  born_year: string;
  born_place: string;
  legajoId: string;
}
