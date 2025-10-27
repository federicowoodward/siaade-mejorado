import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

type ApiResponse = {
  career: { id: number; name: string; createdAt: string; academicPeriod: any };
  preceptor: { name: string; lastName: string; email: string };
  academicPeriods: Array<{
    academicPeriod: { id: number; name: string; partialsScoreNeeded: number };
    subjects: Array<{
      id: number;
      subjectName: string;
      careerOrdering: { yearNo: number; periodOrder: number; orderNo: number };
      metadata: {
        correlative: string | null;
        subjectFormat: 'Anual' | 'Cuatrimestral';
        teacherFormation: string;
        annualWorkload: string;
        weeklyWorkload: string;
      };
    }>;
  }>;
};

@Injectable({ providedIn: 'root' })
export class CareerCatalogService {
  private api = inject(ApiService);

  private _careerId = signal<number | null>(null);
  private _raw = signal<ApiResponse | null>(null);
  private _basicSubjects = signal<{ id: number; name: string }[]>([]);

  career = () => this._raw()?.career ?? null;
  preceptor = () => this._raw()?.preceptor ?? null;
  periods = () => this._raw()?.academicPeriods ?? [];
  basicSubjects = () => this._basicSubjects();

  loadCareer(careerId: number): Observable<void> {
    if (this._raw() && this._careerId() === careerId) {
      return of(void 0);
    }

    return this.api
      .request<ApiResponse>('GET', `catalogs/career-full-data/${careerId}`)
      .pipe(
        tap((res) => {
          this._careerId.set(careerId);
          this._raw.set(res);

          const subjectsMap = new Map<number, string>();
          for (const period of res.academicPeriods) {
            for (const subject of period.subjects) {
              subjectsMap.set(subject.id, subject.subjectName);
            }
          }
          const subjects: { id: number; name: string }[] = Array.from(
            subjectsMap.entries()
          ).map(([id, name]) => ({ id, name }));
          this._basicSubjects.set(subjects);
        }),
        map(() => void 0)
      );
  }

  getTeacherName(subjectId: number): string {
    return 'Sin asignar';
  }
}
