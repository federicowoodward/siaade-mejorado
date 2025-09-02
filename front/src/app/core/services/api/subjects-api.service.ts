import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface Subject {
  id: string;
  name: string;
  description?: string;
  code: string;
  credits: number;
  year: number;
  semester: number;
  teacherId?: string;
  teacher?: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
  students?: SubjectStudent[];
  exams?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubjectStudent {
  id: string;
  studentId: string;
  subjectId: string;
  enrolledAt: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'FAILED';
  student: {
    id: string;
    name: string;
    lastName: string;
    email: string;
    cuil: string;
  };
}

export interface CreateSubjectRequest {
  name: string;
  description?: string;
  code: string;
  credits: number;
  year: number;
  semester: number;
  teacherId?: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  description?: string;
  code?: string;
  credits?: number;
  year?: number;
  semester?: number;
  teacherId?: string;
}

export interface EnrollStudentRequest {
  studentId: string;
  subjectId: string;
}

@Injectable({ providedIn: 'root' })
export class SubjectsApiService extends BaseApiService {

  // Métodos de lectura
  
  /**
   * Obtiene todas las materias
   */
  getSubjects(): Observable<Subject[]> {
    return this.get<Subject[]>('subjects/read');
  }

  /**
   * Obtiene materias con paginación
   */
  getSubjectsPaginated(page: number = 1, limit: number = 10): Observable<Subject[]> {
    return this.get<Subject[]>('subjects/read', { page, limit });
  }

  /**
   * Obtiene una materia por ID
   */
  getSubjectById(id: string): Observable<Subject> {
    return this.get<Subject>(`subjects/read/${id}`);
  }

  /**
   * Obtiene materias por año
   */
  getSubjectsByYear(year: number): Observable<Subject[]> {
    return this.get<Subject[]>('subjects/read', { year });
  }

  /**
   * Obtiene materias por semestre
   */
  getSubjectsBySemester(semester: number): Observable<Subject[]> {
    return this.get<Subject[]>('subjects/read', { semester });
  }

  /**
   * Obtiene materias por profesor
   */
  getSubjectsByTeacher(teacherId: string): Observable<Subject[]> {
    return this.get<Subject[]>('subjects/read', { teacherId });
  }

  /**
   * Busca materias por término
   */
  searchSubjects(searchTerm: string): Observable<Subject[]> {
    return this.get<Subject[]>('subjects/read', { search: searchTerm });
  }

  // Métodos de gestión (management)

  /**
   * Crea una nueva materia
   */
  createSubject(subjectData: CreateSubjectRequest): Observable<Subject> {
    return this.post<Subject>('subjects/manage/create', subjectData);
  }

  /**
   * Actualiza una materia
   */
  updateSubject(id: string, subjectData: UpdateSubjectRequest): Observable<Subject> {
    return this.put<Subject>(`subjects/manage/update/${id}`, subjectData);
  }

  /**
   * Elimina una materia
   */
  deleteSubject(id: string): Observable<{ deleted: boolean; message: string }> {
    return this.delete<{ deleted: boolean; message: string }>(`subjects/manage/delete/${id}`);
  }

  // Métodos de gestión de estudiantes

  /**
   * Obtiene estudiantes de una materia
   */
  getSubjectStudents(subjectId: string): Observable<SubjectStudent[]> {
    return this.get<SubjectStudent[]>(`subjects/${subjectId}/students/read`);
  }

  /**
   * Inscribe un estudiante en una materia
   */
  enrollStudent(enrollmentData: EnrollStudentRequest): Observable<SubjectStudent> {
    return this.post<SubjectStudent>('subjects/students/manage/enroll', enrollmentData);
  }

  /**
   * Desinscribe un estudiante de una materia
   */
  unenrollStudent(subjectId: string, studentId: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`subjects/${subjectId}/students/manage/unenroll/${studentId}`);
  }

  /**
   * Actualiza el estado de inscripción de un estudiante
   */
  updateStudentStatus(
    subjectId: string, 
    studentId: string, 
    status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'FAILED'
  ): Observable<SubjectStudent> {
    return this.patch<SubjectStudent>(
      `subjects/${subjectId}/students/manage/${studentId}/status`, 
      { status }
    );
  }

  /**
   * Obtiene materias de un estudiante específico
   */
  getStudentSubjects(studentId: string): Observable<Subject[]> {
    return this.get<Subject[]>(`subjects/students/read/${studentId}`);
  }

  // Métodos de estadísticas

  /**
   * Obtiene estadísticas de una materia
   */
  getSubjectStats(subjectId: string): Observable<any> {
    return this.get<any>(`subjects/${subjectId}/stats`);
  }

  /**
   * Obtiene estadísticas generales de materias
   */
  getSubjectsOverview(): Observable<any> {
    return this.get<any>('subjects/overview');
  }

  // Métodos de validación

  /**
   * Verifica si un código de materia está disponible
   */
  checkSubjectCodeAvailability(code: string, excludeId?: string): Observable<{ available: boolean }> {
    const params: any = { code };
    if (excludeId) params.excludeId = excludeId;
    return this.get<{ available: boolean }>('subjects/check-code', params);
  }

  /**
   * Obtiene prerrequisitos de una materia
   */
  getSubjectPrerequisites(subjectId: string): Observable<Subject[]> {
    return this.get<Subject[]>(`subjects/${subjectId}/prerequisites`);
  }

  /**
   * Verifica si un estudiante puede inscribirse en una materia
   */
  canStudentEnroll(studentId: string, subjectId: string): Observable<{ canEnroll: boolean; reason?: string }> {
    return this.get<{ canEnroll: boolean; reason?: string }>(`subjects/${subjectId}/can-enroll/${studentId}`);
  }
}
