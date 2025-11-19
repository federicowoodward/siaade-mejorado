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
    const student = await this.loadStudent(studentId);
    const payload: StudentCertificatePayload = {
      lastname: student.user.lastName,
      name: student.user.name,
      dni: student.user.cuil,
      careerName: CAREER_NAME,
      schoolName: SCHOOL_NAME,
    };
    return this.pdfEngineService.generatePdfFromTemplate(
      "student-certificate",
      payload,
    );
  }

  async getExamRegistrationReceiptPdf(
    studentId: string | number,
  ): Promise<Buffer> {
    const student = await this.loadStudent(studentId);
    const commonData = student.user.commonData;
    const payload: ExamRegistrationReceiptPayload = {
      lastname: student.user.lastName,
      name: student.user.name,
      dni: student.user.cuil,
      sex: commonData?.sex ?? "",
      birth_date: this.formatDate(commonData?.birthDate),
    };
    return this.pdfEngineService.generatePdfFromTemplate(
      "exam-registration-receipt",
      payload,
    );
  }

  async getAcademicPerformancePdf(
    studentId: string | number,
  ): Promise<Buffer> {
    const student = await this.loadStudent(studentId);
    const commonData = student.user.commonData;
    // TODO(PDF-GENERATOR): revisar campo 'born_year' en la entidad Student o entidad relacionada.
    const bornYear = commonData?.birthDate
      ? String(commonData.birthDate.getUTCFullYear())
      : "";
    // TODO(PDF-GENERATOR): validar si existe un campo 'legajoId' especifico o si debe usarse 'legajo'.
    const payload: AcademicPerformancePayload = {
      lastname: student.user.lastName,
      name: student.user.name,
      dni: student.user.cuil,
      sex: commonData?.sex ?? "",
      born_year: bornYear,
      born_place: commonData?.birthPlace ?? "",
      legajoId: student.legajo,
    };
    return this.pdfEngineService.generatePdfFromTemplate(
      "academic-performance",
      payload,
    );
  }
}

interface StudentCertificatePayload extends Record<string, string> {
  lastname: string;
  name: string;
  dni: string;
  careerName: string;
  schoolName: string;
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
