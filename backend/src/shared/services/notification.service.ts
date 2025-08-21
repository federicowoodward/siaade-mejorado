import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  sendEmail(to: string, subject: string, message: string): void {
    console.log(`Enviando correo a ${to} con el asunto: ${subject}`);
    // Aquí iría la lógica real para enviar el correo
  }

  sendSMS(to: string, message: string): void {
    console.log(`Enviando SMS a ${to} con el mensaje: ${message}`);
    // Aquí iría la lógica real para enviar el SMS
  }
}
