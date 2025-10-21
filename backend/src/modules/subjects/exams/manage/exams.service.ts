import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '@/entities/subjects/exam.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examsRepository: Repository<Exam>,
  ) {}

  async create(examData: Exam): Promise<Exam> {
    const exam = this.examsRepository.create(examData);  // Crear el examen
    return this.examsRepository.save(exam);  // Guardar el examen en la base de datos
  }

  async update(id: number, examData: Exam): Promise<Exam | null> {
    await this.examsRepository.update(id, examData);  // Actualizar el examen
    return this.examsRepository.findOne({
      where: { id }
    });  // Retornar el examen actualizado
  }

  async delete(id: string): Promise<void> {
    await this.examsRepository.delete(id);  // Eliminar el examen
  }

  // Métodos para el controlador de lectura
  async getExamInfo(id: number): Promise<Exam | null> {
    return this.examsRepository.findOne({
      where: { id },
      relations: ['subject']
    });
  }

  async getAllExams(): Promise<Exam[]> {
    return this.examsRepository.find({
      relations: ['subject']
    });
  }
}


