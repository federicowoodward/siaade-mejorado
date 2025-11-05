import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string | null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST");
    const port = Number(this.config.get<string>("SMTP_PORT"));
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");
    const secure = (this.config.get<string>("SMTP_SECURE") || "false") === "true";
    this.from = this.config.get<string>("MAIL_FROM") || null;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
      this.logger.log(`SMTP configurado ${host}:${port} secure=${secure}`);
    } else {
      const etherealEnabled = (this.config.get<string>("ETHEREAL_ENABLED") || "false") === "true";
      const isProd = (this.config.get<string>("NODE_ENV") || "").toLowerCase() === "production";
      if (etherealEnabled && !isProd) {
        nodemailer.createTestAccount().then((acc) => {
          this.transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: acc.user, pass: acc.pass },
          });
          this.logger.log(`Ethereal activo para pruebas. Inbox=${acc.user}`);
        }).catch((err) => {
          this.logger.warn(`No se pudo iniciar Ethereal: ${err?.message || err}`);
        });
      } else {
        this.logger.warn("SMTP no configurado. No se enviarán correos.");
      }
    }
  }

  isEnabled(): boolean {
    return !!this.transporter;
  }

  async sendResetCodeEmail(to: string, code: string): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      const from = this.from || `Director <no-reply@local>`;
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: "Código para restablecer tu contraseña",
        text: `Tu código es: ${code}. Vence en unos minutos.`,
        html: `
          <div style="font-family:Arial, Helvetica, sans-serif;">
            <p>Se solicitó restablecer tu contraseña.</p>
            <p>Ingresá este código en la página para continuar:</p>
            <p style="font-size:22px;font-weight:bold;letter-spacing:4px">${code}</p>
            <p style="color:#6b7280">Este código vence en unos minutos.</p>
          </div>
        `,
      });
      const preview = (nodemailer as any).getTestMessageUrl?.(info);
      if (preview) this.logger.log(`Vista previa (Ethereal): ${preview}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Fallo enviando código a ${to}: ${err.message}`);
      return false;
    }
  }
}
