import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '@/entities/users/student.entity';  // Asegúrate de tener la entidad Student

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async getStudentInfo(id: string): Promise<Student | null> {
    return this.studentsRepository.findOne({
      where: { userId: id }
    });  // Buscar un estudiante por su ID
  }

  async getAllStudents(): Promise<Student[]> {
    return this.studentsRepository.find();  // Obtener todos los estudiantes
  }
}


