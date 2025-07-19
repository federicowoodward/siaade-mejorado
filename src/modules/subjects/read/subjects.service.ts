import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../../../entities/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
  ) {}

  async getSubjectInfo(id: string): Promise<Subject> {
    return this.subjectsRepository.findOne(id);  // Buscar una materia por su ID
  }

  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsRepository.find();  // Obtener todas las materias
  }
}