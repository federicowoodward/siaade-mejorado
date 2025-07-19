import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../../../entities/exam.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examsRepository: Repository<Exam>,
  ) {}

  async getExamInfo(id: string): Promise<Exam> {
    return this.examsRepository.findOne(id);  // Buscar un examen por su ID
  }

  async getAllExams(): Promise<Exam[]> {
    return this.examsRepository.find();  // Listar todos los exámenes
  }
}