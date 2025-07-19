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

  async create(subjectData: Subject): Promise<Subject> {
    const subject = this.subjectsRepository.create(subjectData);
    return this.subjectsRepository.save(subject);  // Guardar la nueva materia en la base de datos
  }

  async update(id: string, subjectData: Subject): Promise<Subject> {
    await this.subjectsRepository.update(id, subjectData);
    return this.subjectsRepository.findOne(id);  // Devolver la materia actualizada
  }

  async delete(id: string): Promise<void> {
    await this.subjectsRepository.delete(id);  // Eliminar la materia
  }
}