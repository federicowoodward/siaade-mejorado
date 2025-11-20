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
  constructor(private readonly pdfGeneratorService: PdfGeneratorService) { }

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
    @Res() res: Response,
  ) {
    const pdf =
      await this.pdfGeneratorService.getStudentCertificatePdf(studentId);
    return this.sendPdf(res, pdf, `certificado-estudiante.pdf`);
  }

  @Get("preview/student-certificate/:studentId")
  @ApiOperation({
    summary: "Preview Student Certificate HTML",
    description:
      "Dev endpoint that renders the Student Certificate Handlebars template as HTML for live preview.",
  })
  @ApiParam({
    name: "studentId",
    type: String,
    description: "ID of the student",
    example: "123",
  })
  @ApiProduces("text/html")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "HTML preview rendered successfully",
    content: {
      "text/html": {
        schema: { type: "string" },
      },
    },
  })
  async previewStudentCertificateHtml(
    @Param("studentId") studentId: string,
    @Res() res: Response,
  ) {
    const html =
      await this.pdfGeneratorService.getStudentCertificateHtml(studentId);
    return this.sendHtml(res, html);
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
    @Res() res: Response,
  ) {
    const pdf =
      await this.pdfGeneratorService.getExamRegistrationReceiptPdf(studentId);
    return this.sendPdf(res, pdf, `exam-registration-receipt-${studentId}.pdf`);
  }

  @Get("preview/exam-registration-receipt/:studentId")
  @ApiOperation({
    summary: "Preview Exam Registration Receipt HTML",
    description:
      "Dev endpoint that renders the Exam Registration Receipt template as HTML.",
  })
  @ApiParam({
    name: "studentId",
    type: String,
    description: "ID of the student",
    example: "123",
  })
  @ApiProduces("text/html")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "HTML preview rendered successfully",
    content: {
      "text/html": {
        schema: { type: "string" },
      },
    },
  })
  async previewExamRegistrationReceiptHtml(
    @Param("studentId") studentId: string,
    @Res() res: Response,
  ) {
    const html =
      await this.pdfGeneratorService.getExamRegistrationReceiptHtml(studentId);
    return this.sendHtml(res, html);
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
    @Res() res: Response,
  ) {
    const pdf =
      await this.pdfGeneratorService.getAcademicPerformancePdf(studentId);
    return this.sendPdf(res, pdf, `academic-performance-${studentId}.pdf`);
  }

  @Get("preview/academic-performance/:studentId")
  @ApiOperation({
    summary: "Preview Academic Performance HTML",
    description:
      "Dev endpoint for rendering the Academic Performance template as HTML.",
  })
  @ApiParam({
    name: "studentId",
    type: String,
    description: "ID of the student",
    example: "123",
  })
  @ApiProduces("text/html")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "HTML preview rendered successfully",
    content: {
      "text/html": {
        schema: { type: "string" },
      },
    },
  })
  async previewAcademicPerformanceHtml(
    @Param("studentId") studentId: string,
    @Res() res: Response,
  ) {
    const html =
      await this.pdfGeneratorService.getAcademicPerformanceHtml(studentId);
    return this.sendHtml(res, html);
  }

  // ---------------------------------------------------------
  // SEND PDF HELPER
  // ---------------------------------------------------------
  private sendPdf(res: Response, buffer: Buffer, filename: string) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  private sendHtml(res: Response, html: string) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.send(html);
  }
}
