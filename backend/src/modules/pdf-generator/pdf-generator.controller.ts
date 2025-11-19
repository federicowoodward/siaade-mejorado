import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { PdfGeneratorService } from "@/modules/pdf-generator/pdf-generator.service";
import { ApiOkResponse, ApiProduces, ApiParam, ApiTags } from "@nestjs/swagger";

@ApiTags("PDF Generator")
@Controller("generatePdf")
export class PdfGeneratorController {
  constructor(private readonly pdfGeneratorService: PdfGeneratorService) {}

  @ApiProduces("application/pdf")
  @ApiOkResponse({
    description: "Student certificate PDF",
    content: {
      "application/pdf": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiParam({ name: "studentId", type: String })
  @Get("student-certificate/:studentId")
  async getStudentCertificate(
    @Param("studentId") studentId: string,
    @Res() res: Response,
  ) {
    const pdf =
      await this.pdfGeneratorService.getStudentCertificatePdf(studentId);
    return this.sendPdf(res, pdf, `student-certificate-${studentId}.pdf`);
  }

  @ApiProduces("application/pdf")
  @ApiOkResponse({
    description: "Exam registration receipt PDF",
    content: {
      "application/pdf": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiParam({ name: "studentId", type: String })
  @Get("exam-registration-receipt/:studentId")
  async getExamRegistrationReceipt(
    @Param("studentId") studentId: string,
    @Res() res: Response,
  ) {
    const pdf =
      await this.pdfGeneratorService.getExamRegistrationReceiptPdf(studentId);
    return this.sendPdf(
      res,
      pdf,
      `exam-registration-receipt-${studentId}.pdf`,
    );
  }

  @ApiProduces("application/pdf")
  @ApiOkResponse({
    description: "Academic performance PDF",
    content: {
      "application/pdf": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiParam({ name: "studentId", type: String })
  @Get("academic-performance/:studentId")
  async getAcademicPerformance(
    @Param("studentId") studentId: string,
    @Res() res: Response,
  ) {
    const pdf =
      await this.pdfGeneratorService.getAcademicPerformancePdf(studentId);
    return this.sendPdf(
      res,
      pdf,
      `academic-performance-${studentId}.pdf`,
    );
  }

  private sendPdf(res: Response, buffer: Buffer, filename: string) {
    res.setHeader("Content-Type", "application/pdf");
    // probá con attachment para que Swagger lo trate como archivo descargable
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  }
}
