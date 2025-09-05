import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalExam } from '../../../entities/final_exam.entity';

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

  async update(id: number, examData: FinalExam): Promise<FinalExam | null> {
    await this.finalExamsRepository.update(id, examData);  // Actualizar el examen en la base de datos
    return this.finalExamsRepository.findOne({
      where: { id }
    });  // Devolver el examen actualizado
  }

  async delete(id: number): Promise<void> {
    await this.finalExamsRepository.delete(id);  // Eliminar el examen
  }

  // Métodos para el controlador de lectura
  async getExamInfo(id: number): Promise<FinalExam | null> {
    return this.finalExamsRepository.findOne({
      where: { id },
      relations: ['subject']
    });
  }

  async getAllExams(): Promise<FinalExam[]> {
    return this.finalExamsRepository.find({
      relations: ['subject']
    });
  }
}