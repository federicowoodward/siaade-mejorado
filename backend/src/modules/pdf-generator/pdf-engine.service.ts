import { Injectable, Logger } from "@nestjs/common";
import { existsSync, readFileSync } from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";
import puppeteer, { PDFOptions } from "puppeteer";

@Injectable()
export class PdfEngineService {
  private readonly logger = new Logger(PdfEngineService.name);
  private readonly templateCache = new Map<string, HandlebarsTemplateDelegate>();

  private resolveTemplatePath(templateName: string): string {
    const filename = `${templateName}.hbs`;
    const candidates = [
      path.join(__dirname, "templates", filename),
      path.join(
        process.cwd(),
        "src",
        "modules",
        "pdf-generator",
        "templates",
        filename,
      ),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
    return candidates[0];
  }

  private getCompiledTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (!this.templateCache.has(templateName)) {
      const templatePath = this.resolveTemplatePath(templateName);
      const templateSource = readFileSync(templatePath, "utf8");
      const compiled = Handlebars.compile(templateSource);
      this.templateCache.set(templateName, compiled);
      this.logger.debug(`Compiled template cached: ${templateName}`);
    }
    return this.templateCache.get(templateName)!;
  }

  async renderTemplateToHtml(
    templateName: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    this.logger.debug(
      `Rendering template "${templateName}" with data keys: ${Object.keys(
        data || {},
      ).join(", ")}`,
    );
    for (const [key, value] of Object.entries(data || {})) {
      if (value === undefined) {
        this.logger.warn(
          `Template "${templateName}" received undefined value for key "${key}"`,
        );
      }
    }

    const template = this.getCompiledTemplate(templateName);
    return template(data);
  }

  async generatePdfFromTemplate(
    templateName: string,
    data: Record<string, unknown>,
    options?: PDFOptions,
  ): Promise<Buffer> {
    const html = await this.renderTemplateToHtml(templateName, data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfArray = await page.pdf({
        format: "A4",
        printBackground: true,
        ...options,
      });
      const pdfBuffer = Buffer.from(pdfArray);
      await page.close();
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}

type HandlebarsTemplateDelegate = Handlebars.TemplateDelegate<
  Record<string, unknown>
>;
