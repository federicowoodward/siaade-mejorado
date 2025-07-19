import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';  // Asegúrate de importar todas las entidades necesarias
import { Subject } from '../entities/subject.entity';
import { FinalExam } from '../entities/final-exam.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',  // O cualquier otro tipo de base de datos que estés utilizando
      host: 'localhost', // Configura tu host de base de datos
      port: 5432,        // Configura tu puerto de base de datos
      username: 'your-username', // Tu usuario de base de datos
      password: 'your-password', // Tu contraseña de base de datos
      database: 'your-database', // Nombre de tu base de datos
      entities: [User, Subject, FinalExam],  // Asegúrate de importar todas las entidades que utilizas
      synchronize: true, // Establecer a 'false' en producción y usar migraciones
    }),
  ],
})
export class ConfigModule {}