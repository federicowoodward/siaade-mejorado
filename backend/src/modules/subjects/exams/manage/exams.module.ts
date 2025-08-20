import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';  // Controlador de exámenes
import { ExamsService } from './exams.service';  // Servicio de exámenes
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from '../../../../entities/exam.entity';  // Asegúrate de tener la entidad Exam

@Module({
  imports: [TypeOrmModule.forFeature([Exam])],  // Importa la entidad Exam
  controllers: [ExamsController],  // Controlador de gestión de exámenes
  providers: [ExamsService],  // Servicio de gestión de exámenes
})
export class ExamsModule {}