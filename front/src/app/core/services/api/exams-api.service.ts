import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  type: 'PARTIAL' | 'FINAL' | 'RECUPERATORIO' | 'PROMOCIONAL';
  date: Date;
  duration: number; // en minutos
  maxScore: number;
  subjectId: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  questions?: ExamQuestion[];
  results?: ExamResult[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FinalExam {
  id: string;
  title: string;
  description?: string;
  date: Date;
  duration: number;
  maxScore: number;
  subjectId: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  registeredStudents?: FinalExamStudent[];
  results?: ExamResult[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  options?: string[];
  correctAnswer?: string;
  points: number;
  order: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  percentage: number;
  status: 'PASSED' | 'FAILED' | 'ABSENT';
  answers?: any[];
  submittedAt: Date;
  student?: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
}

export interface FinalExamStudent {
  id: string;
  finalExamId: string;
  studentId: string;
  registeredAt: Date;
  status: 'REGISTERED' | 'PRESENT' | 'ABSENT' | 'COMPLETED';
  student: {
    id: string;
    name: string;
    lastName: string;
    email: string;
    cuil: string;
  };
}

export interface CreateExamRequest {
  title: string;
  description?: string;
  type: 'PARTIAL' | 'FINAL' | 'RECUPERATORIO' | 'PROMOCIONAL';
  date: string;
  duration: number;
  maxScore: number;
  subjectId: string;
  questions?: Omit<ExamQuestion, 'id' | 'examId'>[];
}

export interface CreateFinalExamRequest {
  title: string;
  description?: string;
  date: string;
  duration: number;
  maxScore: number;
  subjectId: string;
}

export interface UpdateExamRequest {
  title?: string;
  description?: string;
  type?: 'PARTIAL' | 'FINAL' | 'RECUPERATORIO' | 'PROMOCIONAL';
  date?: string;
  duration?: number;
  maxScore?: number;
  subjectId?: string;
}

@Injectable({ providedIn: 'root' })
export class ExamsApiService extends BaseApiService {

  // ========== EXÁMENES REGULARES ==========

  // Métodos de lectura
  
  /**
   * Obtiene todos los exámenes
   */
  getExams(): Observable<Exam[]> {
    return this.get<Exam[]>('exams/read');
  }

  /**
   * Obtiene un examen por ID
   */
  getExamById(id: string): Observable<Exam> {
    return this.get<Exam>(`exams/read/${id}`);
  }

  /**
   * Obtiene exámenes por materia
   */
  getExamsBySubject(subjectId: string): Observable<Exam[]> {
    return this.get<Exam[]>('exams/read', { subjectId });
  }

  /**
   * Obtiene exámenes por tipo
   */
  getExamsByType(type: string): Observable<Exam[]> {
    return this.get<Exam[]>('exams/read', { type });
  }

  /**
   * Obtiene exámenes por fecha
   */
  getExamsByDate(startDate: string, endDate?: string): Observable<Exam[]> {
    const params: any = { startDate };
    if (endDate) params.endDate = endDate;
    return this.get<Exam[]>('exams/read', params);
  }

  // Métodos de gestión

  /**
   * Crea un nuevo examen
   */
  createExam(examData: CreateExamRequest): Observable<Exam> {
    return this.post<Exam>('exams/manage/create', examData);
  }

  /**
   * Actualiza un examen
   */
  updateExam(id: string, examData: UpdateExamRequest): Observable<Exam> {
    return this.put<Exam>(`exams/manage/update/${id}`, examData);
  }

  /**
   * Elimina un examen
   */
  deleteExam(id: string): Observable<{ deleted: boolean; message: string }> {
    return this.delete<{ deleted: boolean; message: string }>(`exams/manage/delete/${id}`);
  }

  // ========== EXÁMENES FINALES ==========

  // Métodos de lectura

  /**
   * Obtiene todos los exámenes finales
   */
  getFinalExams(): Observable<FinalExam[]> {
    return this.get<FinalExam[]>('exams/final/read');
  }

  /**
   * Obtiene un examen final por ID
   */
  getFinalExamById(id: string): Observable<FinalExam> {
    return this.get<FinalExam>(`exams/final/read/${id}`);
  }

  /**
   * Obtiene exámenes finales por materia
   */
  getFinalExamsBySubject(subjectId: string): Observable<FinalExam[]> {
    return this.get<FinalExam[]>('exams/final/read', { subjectId });
  }

  /**
   * Obtiene exámenes finales disponibles para inscripción
   */
  getAvailableFinalExams(): Observable<FinalExam[]> {
    return this.get<FinalExam[]>('exams/final/read/available');
  }

  /**
   * Obtiene estudiantes registrados en un examen final
   */
  getFinalExamStudents(finalExamId: string): Observable<FinalExamStudent[]> {
    return this.get<FinalExamStudent[]>(`exams/final/read/${finalExamId}/students`);
  }

  // Métodos de gestión

  /**
   * Crea un nuevo examen final
   */
  createFinalExam(examData: CreateFinalExamRequest): Observable<FinalExam> {
    return this.post<FinalExam>('exams/final/manage/create', examData);
  }

  /**
   * Actualiza un examen final
   */
  updateFinalExam(id: string, examData: UpdateExamRequest): Observable<FinalExam> {
    return this.put<FinalExam>(`exams/final/manage/update/${id}`, examData);
  }

  /**
   * Elimina un examen final
   */
  deleteFinalExam(id: string): Observable<{ deleted: boolean; message: string }> {
    return this.delete<{ deleted: boolean; message: string }>(`exams/final/manage/delete/${id}`);
  }

  /**
   * Registra un estudiante en un examen final
   */
  registerStudentForFinalExam(finalExamId: string, studentId: string): Observable<FinalExamStudent> {
    return this.post<FinalExamStudent>(`exams/final/manage/${finalExamId}/register`, { studentId });
  }

  /**
   * Desregistra un estudiante de un examen final
   */
  unregisterStudentFromFinalExam(finalExamId: string, studentId: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`exams/final/manage/${finalExamId}/unregister/${studentId}`);
  }

  /**
   * Marca asistencia de estudiante en examen final
   */
  markStudentAttendance(
    finalExamId: string, 
    studentId: string, 
    status: 'PRESENT' | 'ABSENT'
  ): Observable<FinalExamStudent> {
    return this.patch<FinalExamStudent>(
      `exams/final/manage/${finalExamId}/attendance/${studentId}`, 
      { status }
    );
  }

  // ========== RESULTADOS DE EXÁMENES ==========

  /**
   * Obtiene resultados de un examen
   */
  getExamResults(examId: string): Observable<ExamResult[]> {
    return this.get<ExamResult[]>(`exams/${examId}/results`);
  }

  /**
   * Obtiene resultado específico de un estudiante
   */
  getStudentExamResult(examId: string, studentId: string): Observable<ExamResult> {
    return this.get<ExamResult>(`exams/${examId}/results/${studentId}`);
  }

  /**
   * Registra resultado de examen
   */
  submitExamResult(examId: string, resultData: Partial<ExamResult>): Observable<ExamResult> {
    return this.post<ExamResult>(`exams/${examId}/results`, resultData);
  }

  /**
   * Actualiza resultado de examen
   */
  updateExamResult(examId: string, studentId: string, resultData: Partial<ExamResult>): Observable<ExamResult> {
    return this.put<ExamResult>(`exams/${examId}/results/${studentId}`, resultData);
  }

  // ========== ESTADÍSTICAS Y REPORTES ==========

  /**
   * Obtiene estadísticas de un examen
   */
  getExamStats(examId: string): Observable<any> {
    return this.get<any>(`exams/${examId}/stats`);
  }

  /**
   * Obtiene reporte de rendimiento de estudiante
   */
  getStudentPerformanceReport(studentId: string): Observable<any> {
    return this.get<any>(`exams/reports/student/${studentId}`);
  }

  /**
   * Obtiene reporte de exámenes por materia
   */
  getSubjectExamsReport(subjectId: string): Observable<any> {
    return this.get<any>(`exams/reports/subject/${subjectId}`);
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Verifica si un estudiante puede registrarse para un examen final
   */
  canStudentRegisterForFinalExam(studentId: string, finalExamId: string): Observable<{ canRegister: boolean; reason?: string }> {
    return this.get<{ canRegister: boolean; reason?: string }>(`exams/final/${finalExamId}/can-register/${studentId}`);
  }

  /**
   * Obtiene el próximo examen de un estudiante
   */
  getStudentNextExam(studentId: string): Observable<Exam | null> {
    return this.get<Exam | null>(`exams/student/${studentId}/next`);
  }

  /**
   * Obtiene historial de exámenes de un estudiante
   */
  getStudentExamHistory(studentId: string): Observable<ExamResult[]> {
    return this.get<ExamResult[]>(`exams/student/${studentId}/history`);
  }
}
