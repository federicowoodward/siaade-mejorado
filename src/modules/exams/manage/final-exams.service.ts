import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalExam } from '../../../entities/final-exam.entity';

@Injectable()
export class FinalExamsService {
  constructor(
    @InjectRepository(FinalExam)
    private finalExamsRepository: Repository<FinalExam>,
  ) {}

  async create(examData: FinalExam): Promise<FinalExam> {
    const exam = this.finalExamsRepository.create(examData);  // Crear el examen
    return this.finalExamsRepository.save(exam);  // Guardar el examen en la base de datos
  }

  async update(id: string, examData: FinalExam): Promise<FinalExam> {
    await this.finalExamsRepository.update(id, examData);  // Actualizar el examen en la base de datos
    return this.finalExamsRepository.findOne(id);  // Devolver el examen actualizado
  }

  async delete(id: string): Promise<void> {
    await this.finalExamsRepository.delete(id);  // Eliminar el examen
  }
}