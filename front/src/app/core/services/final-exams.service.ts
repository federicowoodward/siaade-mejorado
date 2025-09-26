import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { FinalExam } from '../models/final_exam.model';

@Injectable({ providedIn: 'root' })
export class FinalExamsService {
  private base = 'finals/exam';

  constructor(private api: ApiService) {}

  private normalizeDate(d: string | Date | null | undefined): string {
    if (!d) return '';
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return d.includes('T') ? d.slice(0, 10) : d;
  }

  private toFinal = (raw: any): FinalExam => ({
    id: raw.id,
    subject_id: raw.subject_id ?? raw.subjectId ?? raw.subject?.id,
    subject_name: raw.subject_name ?? raw.subject?.subject_name ?? '',
    exam_date: this.normalizeDate(raw.exam_date ?? raw.examDate),
    exam_time: raw.exam_time ?? raw.examTime ?? '',
    aula: raw.aula ?? undefined,
  });

  listByTable(tableId: number): Observable<FinalExam[]> {
    return this.api
      .request<any[]>('GET', `${this.base}/list-all/${tableId}`)
      .pipe(map((arr) => (Array.isArray(arr) ? arr.map(this.toFinal) : [])));
  }

  getOne(id: number): Observable<FinalExam> {
    return this.api
      .request<any>('GET', `${this.base}/list/${id}`)
      .pipe(map(this.toFinal));
  }

  create(dto: {
    final_exam_table_id: number;
    subject_id: number;
    exam_date: string;
    exam_time?: string;
    aula?: string;
  }): Observable<FinalExam> {
    return this.api
      .request<any>('POST', `${this.base}/create`, dto)
      .pipe(map(this.toFinal));
  }

  edit(
    id: number,
    dto: Partial<{ subject_id: number; exam_date: string; aula?: string }>
  ): Observable<FinalExam> {
    const payload: any = {};
    if (dto.subject_id !== undefined) payload.subject_id = dto.subject_id;
    if (dto.exam_date !== undefined)
      payload.exam_date = this.normalizeDate(dto.exam_date);
    if (dto.aula !== undefined) payload.aula = dto.aula;
    return this.api
      .request<any>('PUT', `${this.base}/edit/${id}`, payload)
      .pipe(map(this.toFinal));
  }

  delete(id: number): Observable<void> {
    return this.api.request<void>('DELETE', `${this.base}/delete/${id}`);
  }
}
