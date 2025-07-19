import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';  // Importa el módulo de configuración
import { UsersModule } from './modules/users/users.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { ExamsModule } from './modules/exams/exams.module';
import { RolesModule } from './modules/roles/roles.module';  // Si decides agregar roles
import { AuthModule } from './modules/users/auth/auth.module';  // Importa el módulo de autenticación

@Module({
  imports: [
    ConfigModule,  // Aquí estamos configurando la conexión a la base de datos
    UsersModule,
    SubjectsModule,
    ExamsModule,
    RolesModule,  // Si tienes el módulo de roles
    AuthModule,   // Importa el módulo de autenticación correctamente
  ],
})
export class AppModule {}