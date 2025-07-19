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

  async getExamInfo(id: string): Promise<FinalExam> {
    return this.finalExamsRepository.findOne(id);  // Buscar un examen por ID
  }

  async getAllExams(): Promise<FinalExam[]> {
    return this.finalExamsRepository.find();  // Obtener todos los exámenes
  }
}