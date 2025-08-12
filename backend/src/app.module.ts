import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';  // Importa el módulo de configuración
import { UsersModule } from './modules/users/users.module';  // Importa el módulo de usuarios
import { SubjectsModule } from './modules/subjects/subjects.module';  // Importa el módulo de materias
import { ExamsModule } from './modules/exams/exams.module';  // Importa el módulo de exámenes
import { RolesModule } from './modules/roles/roles.module';  // Si decides agregar roles
import { AuthModule } from './modules/users/auth/auth.module';  // Importa el módulo de autenticación
import { FiltersModule } from './shared/filters/filters.module';  // Importa el módulo de filters
import { InterceptorsModule } from './shared/interceptors/interceptors.module';  // Importa el módulo de interceptors
import { ServicesModule } from './shared/services/services.module';  // Importa el módulo de services

@Module({
  imports: [
    ConfigModule,  // Aquí estamos configurando la conexión a la base de datos (asegúrate de tener TypeORM configurado en este módulo)
    AuthModule,    // Es importante que el módulo de autenticación se importe antes de UsersModule, ya que podría depender de él
    UsersModule,   // Módulo de usuarios que debe depender de AuthModule
    SubjectsModule,  // Módulo de materias
    ExamsModule,    // Módulo de exámenes
    RolesModule,    // Si estás usando roles, asegúrate de que este módulo esté configurado correctamente
    FiltersModule,           // Agrega el módulo de filtros
    InterceptorsModule,      // Agrega el módulo de interceptores
    ServicesModule,          // Agrega el módulo de servicios
  ],
})
export class AppModule {}
