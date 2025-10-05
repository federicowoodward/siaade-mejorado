import axios from 'axios';
import { logger } from '../../lib/logger.js';

interface MailGunSendInput {
  to: string;
  subject: string;
  html: string;
}

// Envío simple vía Mailgun API (dominio sandbox o productivo)
export async function sendMailGun(input: MailGunSendInput) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAIL_FROM || `no-reply@${domain}`;
  if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY o MAILGUN_DOMAIN faltante');

  const auth = Buffer.from(`api:${apiKey}`).toString('base64');
  const params = new URLSearchParams();
  params.append('from', from);
  params.append('to', input.to);
  params.append('subject', input.subject);
  params.append('html', input.html);

  try {
    const res = await axios.post(`https://api.mailgun.net/v3/${domain}/messages`, params, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    logger.debug({ id: res.data?.id, to: input.to }, 'Mailgun enviado');
  } catch (err: any) {
    logger.warn({ to: input.to, err: err.response?.data || err.message }, 'Falló envío Mailgun');
    throw err;
  }
}
