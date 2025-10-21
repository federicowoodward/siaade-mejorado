import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';  // Controlador de exámenes (lectura)
import { ExamsService } from './exams.service';  // Servicio de exámenes (lectura)
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from '@/entities/subjects/exam.entity';  // Asegúrate de tener la entidad Exam

@Module({
  imports: [TypeOrmModule.forFeature([Exam])],  // Importa la entidad Exam
  controllers: [ExamsController],  // Controlador de lectura de exámenes
  providers: [ExamsService],  // Servicio de lectura de exámenes
})
export class ExamsModule {}


