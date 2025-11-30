import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, {
  Transporter,
  SendMailOptions,
  TestAccount,
} from "nodemailer";

export type MailRequest = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  bcc?: string | string[];
};

/**
 * Servicio de envío de correos con provider genérico (Ethereal por defecto).
 * Si no se configuran credenciales SMTP, se crea una cuenta Ethereal temporal.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporterPromise: Promise<Transporter> | null = null;
  private fromDefault: string | null = null;
  private usingTestAccount = false;

  constructor(private readonly config: ConfigService) {}

  async sendMail(req: MailRequest): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const from = req.from ?? this.fromDefault ?? "no-reply@example.com";
      const options: SendMailOptions = {
        from,
        to: req.to,
        bcc: req.bcc,
        subject: req.subject,
        text: req.text,
        html: req.html ?? req.text,
      };
      const info = await transporter.sendMail(options);
      if (this.usingTestAccount) {
        // Mostrar URL de previsualizaci�n Ethereal para debugging (no expone contenido en respuesta)
        const url = nodemailer.getTestMessageUrl(info);
        if (url) {
          this.logger.log(`Preview email (Ethereal): ${url}`);
        }
      }
    } catch (error) {
      // Loguear pero no reventar para que la app siga funcionando
      this.logger.error("Mailer sendMail failed", error as any);
    }
  }

  private async getTransporter(): Promise<Transporter> {
    if (this.transporterPromise) return this.transporterPromise;

    this.transporterPromise = (async () => {
      const host = this.config.get<string>("SMTP_HOST");
      const user = this.config.get<string>("SMTP_USER");
      const pass = this.config.get<string>("SMTP_PASS");
      const port = Number(this.config.get<number>("SMTP_PORT") ?? 587);
      const secure =
        String(this.config.get<string>("SMTP_SECURE") ?? "false").toLowerCase() ===
        "true";

      if (host && user && pass) {
        this.fromDefault =
          this.config.get<string>("SMTP_FROM") ?? `no-reply@${host}`;
        this.usingTestAccount = false;
        return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
      }

      // Fallback: Ethereal auto generado
      const testAccount: TestAccount = await nodemailer.createTestAccount();
      this.fromDefault = `no-reply@${testAccount.user}`;
      this.usingTestAccount = true;
      this.logger.log(
        `Mailer using Ethereal account (only for dev): ${testAccount.user}`,
      );
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();

    return this.transporterPromise;
  }
}
