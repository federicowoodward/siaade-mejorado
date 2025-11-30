import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { request as httpsRequest } from "https";
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
 * Servicio de envío de correos con provider genérico.
 * Prioriza Mailjet API (evita bloqueos SMTP en PaaS) y, si no hay API keys,
 * usa SMTP (o Ethereal en desarrollo).
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporterPromise: Promise<Transporter> | null = null;
  private fromDefault: string | null = null;
  private usingTestAccount = false;

  constructor(private readonly config: ConfigService) {
    // Priorizar remitente explícito configurado para evitar no-reply@example.com
    this.fromDefault =
      this.config.get<string>("MAILJET_FROM") ??
      this.config.get<string>("SMTP_FROM") ??
      null;
  }

  async sendMail(req: MailRequest): Promise<void> {
    try {
      // 1) Mailjet API si hay API keys configuradas
      const apiKey = this.config.get<string>("MAILJET_API_KEY");
      const apiSecret = this.config.get<string>("MAILJET_API_SECRET");
      if (apiKey && apiSecret) {
        await this.sendViaMailjetApi(req, apiKey, apiSecret);
        return;
      }

      // 2) SMTP (o Ethereal)
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
        const url = nodemailer.getTestMessageUrl(info);
        if (url) this.logger.log(`Preview email (Ethereal): ${url}`);
      }
    } catch (error) {
      this.logger.error("Mailer sendMail failed", error as any);
    }
  }

  private async sendViaMailjetApi(
    req: MailRequest,
    apiKey: string,
    apiSecret: string,
  ): Promise<void> {
    const fromRaw = req.from ?? this.fromDefault ?? "no-reply@example.com";
    const fromParsed = this.parseFrom(fromRaw);

    const toList = Array.isArray(req.to) ? req.to : [req.to];
    const bccList = req.bcc
      ? Array.isArray(req.bcc)
        ? req.bcc
        : [req.bcc]
      : undefined;

    const body = JSON.stringify({
      Messages: [
        {
          From: {
            Email: fromParsed.email,
            ...(fromParsed.name ? { Name: fromParsed.name } : {}),
          },
          To: toList.map((email) => ({ Email: email })),
          ...(bccList
            ? { Bcc: bccList.map((email) => ({ Email: email })) }
            : {}),
          Subject: req.subject,
          TextPart: req.text ?? req.html ?? "",
          HTMLPart: req.html ?? req.text ?? "",
        },
      ],
    });

    await new Promise<void>((resolve, reject) => {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
      const request = httpsRequest(
        {
          host: "api.mailjet.com",
          path: "/v3.1/send",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
            Authorization: `Basic ${auth}`,
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (
              res.statusCode &&
              res.statusCode >= 200 &&
              res.statusCode < 300
            ) {
              this.logger.log("[MailerService] Mailjet API send OK");
              resolve();
            } else {
              this.logger.error(
                `[MailerService] Mailjet API failed (${res.statusCode}): ${data}`,
              );
              reject(
                new Error(
                  `Mailjet API error ${res.statusCode ?? ""} ${
                    data?.slice?.(0, 200) ?? ""
                  }`,
                ),
              );
            }
          });
        },
      );
      request.on("error", reject);
      request.write(body);
      request.end();
    });
  }

  private parseFrom(raw: string): { email: string; name?: string } {
    const match = raw.match(/^(.*)<(.+)>$/);
    if (match) {
      const name = match[1].trim().replace(/(^"|"$)/g, "");
      const email = match[2].trim();
      return { email, name };
    }
    return { email: raw.trim() };
  }

  private async getTransporter(): Promise<Transporter> {
    if (this.transporterPromise) return this.transporterPromise;

    this.transporterPromise = (async () => {
      const host = this.config.get<string>("SMTP_HOST");
      const user = this.config.get<string>("SMTP_USER");
      const pass = this.config.get<string>("SMTP_PASS");
      const port = Number(this.config.get<number>("SMTP_PORT") ?? 587);
      const secure =
        String(
          this.config.get<string>("SMTP_SECURE") ?? "false",
        ).toLowerCase() === "true";

      if (host && user && pass) {
        this.fromDefault =
          this.config.get<string>("SMTP_FROM") ?? `no-reply@${host}`;
        this.usingTestAccount = false;
        return nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
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
