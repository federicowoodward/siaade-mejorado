import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Module({
  providers: [NotificationService],  // Proveemos el servicio de notificaciones
  exports: [NotificationService],    // Exportamos el servicio para poder usarlo en otros módulos
})
export class ServicesModule {}
