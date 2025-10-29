// src/app/features/exams/services/exam-tables.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ExamTable } from '../models/exam_table.model';

@Injectable({ providedIn: 'root' })
export class ExamTablesService {
  private base = 'finals/exam-table';

  constructor(private api: ApiService) {}

  // --- helpers ---
  private normalizeDate(d: string | Date | null | undefined): string {
    if (!d) return '';
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    // string
    return d.includes('T') ? d.slice(0, 10) : d;
  }

  private toExamTable = (raw: any): ExamTable => ({
    id: raw.id,
    name: raw.name,
    start_date: this.normalizeDate(raw.start_date ?? raw.startDate),
    end_date: this.normalizeDate(raw.end_date ?? raw.endDate),
    created_by: raw.created_by ?? raw.createdBy,
    created_by_user: raw.createdByUser
      ? {
          id: raw.createdByUser.id,
          name: raw.createdByUser.name,
          last_name: raw.createdByUser.last_name ?? raw.createdByUser.lastName,
          email: raw.createdByUser.email,
        }
      : undefined,
  });

  // --- API calls ---
  list(): Observable<ExamTable[]> {
    return this.api.request<any>('GET', `${this.base}/list`).pipe(
      map((resp) =>
        Array.isArray(resp) ? resp : resp?.data ?? resp?.items ?? []
      ),
      map((arr: any[]) => arr.map(this.toExamTable))
    );
  }

  getOne(id: number): Observable<ExamTable> {
    return this.api.request<any>('GET', `${this.base}/list/${id}`).pipe(
      map((resp) => ('data' in resp ? resp.data : resp)),
      map(this.toExamTable)
    );
  }

  create(
    dto: Pick<ExamTable, 'name' | 'start_date' | 'end_date' | 'created_by'>
  ): Observable<ExamTable> {
    const payload = {
      name: dto.name,
      start_date: this.normalizeDate(dto.start_date),
      end_date: this.normalizeDate(dto.end_date),
    };
    return this.api.request<any>('POST', `${this.base}/init`, payload).pipe(
      map((resp) => ('data' in resp ? resp.data : resp)),
      map(this.toExamTable)
    );
  }

  update(
    id: number,
    dto: Partial<Pick<ExamTable, 'name' | 'start_date' | 'end_date'>>
  ): Observable<ExamTable> {
    const payload: any = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.start_date !== undefined)
      payload.start_date = this.normalizeDate(dto.start_date);
    if (dto.end_date !== undefined)
      payload.end_date = this.normalizeDate(dto.end_date);

    return this.api
      .request<any>('PUT', `${this.base}/edit/${id}`, payload)
      .pipe(
        map((resp) => ('data' in resp ? resp.data : resp)),
        map(this.toExamTable)
      );
  }

  delete(id: number): Observable<void> {
    return this.api.request<void>('DELETE', `${this.base}/delete/${id}`);
  }
}
