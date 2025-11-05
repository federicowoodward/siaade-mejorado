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
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(`SMTP configured for host ${host}:${port} secure=${secure}`);
    } else {
      // Fallback opcional: Ethereal (solo dev/QA)
      const etherealEnabled = (this.config.get<string>("ETHEREAL_ENABLED") || "false") === "true";
      const isProd = (this.config.get<string>("NODE_ENV") || "").toLowerCase() === "production";
      if (etherealEnabled && !isProd) {
        nodemailer
          .createTestAccount()
          .then((testAccount) => {
            this.transporter = nodemailer.createTransport({
              host: "smtp.ethereal.email",
              port: 587,
              secure: false,
              auth: { user: testAccount.user, pass: testAccount.pass },
            });
            this.logger.log(`Ethereal SMTP enabled. Inbox user=${testAccount.user}`);
          })
          .catch((err) => {
            this.logger.warn(`Failed to init Ethereal test account: ${err?.message || err}`);
          });
      } else {
        this.logger.warn("SMTP not fully configured. Emails will not be sent.");
      }
    }
  }

  isEnabled(): boolean {
    return !!this.transporter;
  }

  async sendResetPasswordEmail(to: string, link: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`sendResetPasswordEmail skipped (no transporter). to=${to} link=${link}`);
      return false;
    }
    try {
      const from = this.from || `no-reply@${new URL(link).hostname}`;
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: "Restablecer contraseña",
        text: `Para restablecer tu contraseña, hace clic en el enlace: ${link}\nEste enlace expira en unos minutos.`,
        html: `
          <div style="font-family:Arial, Helvetica, sans-serif;">
            <p>Para restablecer tu contraseña, hacé clic en el siguiente botón:</p>
            <p>
              <a href="${link}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Restablecer contraseña</a>
            </p>
            <p>Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
            <p><a href="${link}">${link}</a></p>
            <p style="color:#6b7280;">Este enlace expira en unos minutos.</p>
          </div>
        `,
      });
      const preview = (nodemailer as any).getTestMessageUrl?.(info);
      if (preview) {
        this.logger.log(`Reset email preview (Ethereal): ${preview}`);
      } else {
        this.logger.log(`Reset email sent to ${to}`);
      }
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send reset email to ${to}: ${err.message}`);
      return false;
    }
  }
}
