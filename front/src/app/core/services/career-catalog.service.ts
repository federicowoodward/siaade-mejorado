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
      prerequisites: number[];
      metadata: {
        subjectFormat: 'Anual' | 'Cuatrimestral';
        teacherFormation: string;
        annualWorkload: string;
        weeklyWorkload: string;
        teacherId: string | null;
      };
    }>;
  }>;
};

export type SubjectCommissionTeachersDto = {
  subject: { id: number; name: string };
  commissions: Array<{
    commission: { id: number; letter: string | null };
    teachers: Array<{
      teacherId: string;
      name: string;
      email: string;
      cuil: string | null;
    }>;
  }>;
};

@Injectable({ providedIn: 'root' })
export class CareerCatalogService {
  private api = inject(ApiService);

  private _careerId = signal<number | null>(null);
  private _raw = signal<ApiResponse | null>(null);
  private _basicSubjects = signal<
    { id: number; name: string; teacherId: string | null }[]
  >([]);

  career = () => this._raw()?.career ?? null;
  preceptor = () => this._raw()?.preceptor ?? null;
  periods = () => this._raw()?.academicPeriods ?? [];
  basicSubjects = () => this._basicSubjects();

  loadCareer(careerId: number): Observable<void> {
    if (this._raw() && this._careerId() === careerId) return of(void 0);

    return this.api
      .request<ApiResponse>('GET', `catalogs/career-full-data/${careerId}`)
      .pipe(
        tap((res) => {
          this._careerId.set(careerId);
          this._raw.set(res);

          // ✅ Guardamos también el teacherId
          const subjectsMap = new Map<
            number,
            { name: string; teacherId: string | null }
          >();

          for (const period of res.academicPeriods) {
            for (const subject of period.subjects) {
              subjectsMap.set(subject.id, {
                name: subject.subjectName,
                teacherId: subject.metadata.teacherId ?? null,
              });
            }
          }

          const subjects = Array.from(subjectsMap.entries()).map(([id, s]) => ({
            id,
            name: s.name,
            teacherId: s.teacherId,
          }));

          this._basicSubjects.set(subjects);
        }),
        map(() => void 0),
      );
  }

  // Devuelve teacherId de una materia específica
  getTeacherId(subjectId: number): string | null {
    const subj = this._basicSubjects().find((s) => s.id === subjectId);
    return subj?.teacherId ?? null;
  }

  getTeacherName(subjectId: number): string {
    // Si más adelante tenés un endpoint o lista de docentes, podés reemplazar esto
    const teacherId = this.getTeacherId(subjectId);
    return teacherId ? `Profesor ID: ${teacherId}` : 'Sin asignar';
  }

  getSubjectCommissionTeachers(subjectId: number) {
    return this.api.request<SubjectCommissionTeachersDto>(
      'GET',
      `catalogs/subject/${subjectId}/commission-teachers`,
    );
  }
}
