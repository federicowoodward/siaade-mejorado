import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
export interface FinalExamStudentDto {
  id: number;
  student_id: string;
  name: string;
  enrolled_at: string | null; // 'YYYY-MM-DD' | null
  score: number | null;
  notes: string;
}

export interface FinalExamDetailDto {
  id: number;
  exam_date: string;            // 'YYYY-MM-DD'
  exam_time: string;            // 'HH:mm'
  aula: string | null;
  subject_id: number;
  subject_name: string;
  table_id: number;
  table_name: string;
  table_start_date: string;     // 'YYYY-MM-DD'
  table_end_date: string;       // 'YYYY-MM-DD'
  students: FinalExamStudentDto[];
}

@Injectable({ providedIn: 'root' })
export class FinalExamStudentsService {
  private api = inject(ApiService); // ajusta el path si tu estructura difiere

  getExamDetail(finalExamId: number): Observable<FinalExamDetailDto> {
    return this.api.request<FinalExamDetailDto>('GET', `finals/exam/list/${finalExamId}`);
  }
}
