import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../../entities/student.entity';  // Asegúrate de tener la entidad Student

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async enroll(studentData: Student): Promise<Student> {
    const student = this.studentsRepository.create(studentData);
    return this.studentsRepository.save(student);  // Inscribir al estudiante
  }

  async update(id: string, studentData: Student): Promise<Student> {
    await this.studentsRepository.update(id, studentData);
    return this.studentsRepository.findOne(id);  // Actualizar el estudiante
  }

  async unenroll(id: string): Promise<void> {
    await this.studentsRepository.delete(id);  // Eliminar la inscripción del estudiante
  }
}