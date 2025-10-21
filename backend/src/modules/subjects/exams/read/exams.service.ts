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

  async getExamInfo(id: number): Promise<Exam | null> {
    return this.examsRepository.findOne({
      where: { id }
    });  // Buscar un examen por su ID
  }

  async getAllExams(): Promise<Exam[]> {
    return this.examsRepository.find();  // Listar todos los exámenes
  }
}


