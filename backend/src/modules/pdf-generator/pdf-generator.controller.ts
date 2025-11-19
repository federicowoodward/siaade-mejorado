import { Controller, Get, Param, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { PdfGeneratorService } from "@/modules/pdf-generator/pdf-generator.service";
import {
  ApiTags,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("PDF Generator")
@Controller("generatePdf")
export class PdfGeneratorController {
  constructor(private readonly pdfGeneratorService: PdfGeneratorService) {}

  // ---------------------------------------------------------
  // STUDENT CERTIFICATE
  // ---------------------------------------------------------
  @Get("student-certificate/:studentId")
  @ApiOperation({
    summary: "Generate Student Certificate PDF",
    description:
      "Creates a Student Certificate with basic personal information and academic identification. Returns a downloadable PDF.",
  })
  @ApiParam({
    name: "studentId",
    type: String,
    description: "ID of the student",
    example: "123",
  })
  @ApiProduces("application/pdf")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "PDF generated successfully",
    content: {
      "application/pdf": {
        schema: { type: "string", format: "binary" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Student not found",
  })
  async getStudentCertificate(
    @Param("studentId") studentId: string,
    @Res() res: Response
  ) {
    const pdf =
      await this.pdfGeneratorService.getStudentCertificatePdf(studentId);
    return this.sendPdf(res, pdf, `student-certificate-${studentId}.pdf`);
  }

  // ---------------------------------------------------------
  // EXAM REGISTRATION RECEIPT
  // ---------------------------------------------------------
  @Get("exam-registration-receipt/:studentId")
  @ApiOperation({
    summary: "Generate Exam Registration Receipt PDF",
    description:
      "Creates an exam registration receipt for a student, including DNI, gender, and birth date. Returns a downloadable PDF.",
  })
  @ApiParam({
    name: "studentId",
    type: String,
    description: "ID of the student",
    example: "123",
  })
  @ApiProduces("application/pdf")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "PDF generated successfully",
    content: {
      "application/pdf": {
        schema: { type: "string", format: "binary" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Student not found",
  })
  async getExamRegistrationReceipt(
    @Param("studentId") studentId: string,
    @Res() res: Response
  ) {
    const pdf =
      await this.pdfGeneratorService.getExamRegistrationReceiptPdf(studentId);
    return this.sendPdf(res, pdf, `exam-registration-receipt-${studentId}.pdf`);
  }

  // ---------------------------------------------------------
  // ACADEMIC PERFORMANCE
  // ---------------------------------------------------------
  @Get("academic-performance/:studentId")
  @ApiOperation({
    summary: "Generate Academic Performance PDF",
    description:
      "Creates a PDF report containing academic performance and personal identification: DNI, gender, birth year, birthplace, and record number.",
  })
  @ApiParam({
    name: "studentId",
    type: String,
    description: "ID of the student",
    example: "123",
  })
  @ApiProduces("application/pdf")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "PDF generated successfully",
    content: {
      "application/pdf": {
        schema: { type: "string", format: "binary" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Student not found",
  })
  async getAcademicPerformance(
    @Param("studentId") studentId: string,
    @Res() res: Response
  ) {
    const pdf =
      await this.pdfGeneratorService.getAcademicPerformancePdf(studentId);
    return this.sendPdf(res, pdf, `academic-performance-${studentId}.pdf`);
  }

  // ---------------------------------------------------------
  // SEND PDF HELPER
  // ---------------------------------------------------------
  private sendPdf(res: Response, buffer: Buffer, filename: string) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  }
}
