import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '@/entities/subjects/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
  ) {}

  async create(subjectData: Partial<Subject>): Promise<Subject> {
    const subject = this.subjectsRepository.create(subjectData);
    return this.subjectsRepository.save(subject);
  }

  async update(id: number, subjectData: Partial<Subject>): Promise<Subject | null> {
    await this.subjectsRepository.update(id, subjectData);
    return this.subjectsRepository.findOne({
      where: { id },
      relations: ['academicPeriod', 'commissions'],
    });
  }

  async delete(id: number): Promise<void> {
    await this.subjectsRepository.delete(id);
  }

  async getSubjectInfo(id: number): Promise<Subject | null> {
    return this.subjectsRepository.findOne({
      where: { id },
      relations: ['academicPeriod', 'commissions'],
    });
  }

  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsRepository.find({
      relations: ['academicPeriod', 'commissions'],
    });
  }
}


