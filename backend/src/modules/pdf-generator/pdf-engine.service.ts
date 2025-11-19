import { Injectable, Logger } from "@nestjs/common";
import { existsSync, readFileSync } from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";
import puppeteer, { PDFOptions } from "puppeteer";

@Injectable()
export class PdfEngineService {
  private readonly logger = new Logger(PdfEngineService.name);
  private readonly templateCache = new Map<string, HandlebarsTemplateDelegate>();
  private readonly isProduction = process.env.NODE_ENV === "production";

  /**
   * Resolves template path depending on environment:
   * - dev: points to /src to always read fresh templates.
   * - prod: points to /dist where assets are copied, suitable for caching.
   */
  private resolveTemplatePath(templateName: string): string {
    const baseDir = this.isProduction
      ? path.join(
          process.cwd(),
          "dist",
          "modules",
          "pdf-generator",
          "templates",
        )
      : path.join(
          process.cwd(),
          "src",
          "modules",
          "pdf-generator",
          "templates",
        );
    const candidate = path.join(baseDir, `${templateName}.hbs`);
    if (!existsSync(candidate)) {
      this.logger.warn(`Template ${templateName} not found at ${candidate}`);
    }
    return candidate;
  }

  private compileTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (!this.isProduction) {
      // Dev mode: clear partials cache (mutable map) so edits reload immediately.
      Object.keys(Handlebars.partials).forEach(
        (key) => delete Handlebars.partials[key],
      );
    }
    const templatePath = this.resolveTemplatePath(templateName);
    const templateSource = readFileSync(templatePath, "utf8");
    return Handlebars.compile(templateSource);
  }

  private getCompiledTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (!this.isProduction) {
      return this.compileTemplate(templateName);
    }

    if (!this.templateCache.has(templateName)) {
      const compiled = this.compileTemplate(templateName);
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
