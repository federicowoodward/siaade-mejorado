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

  async getStudentInfo(id: string): Promise<Student> {
    return this.studentsRepository.findOne(id);  // Buscar un estudiante por su ID
  }

  async getAllStudents(): Promise<Student[]> {
    return this.studentsRepository.find();  // Obtener todos los estudiantes
  }
}