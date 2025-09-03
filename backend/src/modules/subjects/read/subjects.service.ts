import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../../../entities/subjects.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
  ) {}

  async getSubjectInfo(id: number): Promise<Subject | null> {
    return this.subjectsRepository.findOne({
      where: { id }
    });  // Buscar una materia por su ID
  }

  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsRepository.find();  // Obtener todas las materias
  }
}