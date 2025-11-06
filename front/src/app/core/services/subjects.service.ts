import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "./api.service";
import {
  GradesApiResponse,
  GradeRow,
} from "../../pages/subjects_module/subject_academic_situation/grades.types";
import { AcademicSituationApiResponse } from "../../pages/subjects_module/subject_academic_situation/subject-academic-situation.types";

type GradeFieldPayload = Partial<
  Pick<
    GradeRow,
    "note1" | "note2" | "note3" | "note4" | "final"
  >
> & {
  partial1?: number | null;
  partial2?: number | null;
};

@Injectable({ providedIn: "root" })
export class SubjectsService {
  private readonly api = inject(ApiService);

  getSubjectGrades(subjectId: number): Observable<GradesApiResponse> {
    return this.api.request<GradesApiResponse>(
      "GET",
      `subjects/${subjectId}/grades`
    );
  }

  getSubjectAcademicSituation(
    subjectId: number,
    params?: { q?: string; commissionId?: number }
  ): Observable<AcademicSituationApiResponse> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.commissionId) {
      query.set("commissionId", String(params.commissionId));
    }
    const search = query.toString();
    const endpoint = search
      ? `subjects/${subjectId}/academic-situation?${search}`
      : `subjects/${subjectId}/academic-situation`;
    return this.api.request<AcademicSituationApiResponse>("GET", endpoint);
  }

  patchGrade(
    subjectId: number,
    studentId: string,
    payload: GradeFieldPayload
  ): Observable<GradeRow> {
    return this.api.request<GradeRow>(
      "PATCH",
      `subjects/${subjectId}/grades/${studentId}`,
      payload
    );
  }

  bulkUpsertCommissionGrades(
    subjectCommissionId: number,
    payload: {
      rows: Array<
        (
          {
            studentId: string;
          } & Partial<
            Pick<
              GradeRow,
              "note1" | "note2" | "note3" | "note4" | "final"
            >
          > & {
            percentage?: number; // asistencia 0-100
            attendance?: number; // alias opcional
          }
        )
      >;
    }
  ): Observable<{ updated: number }> {
    return this.api.request<{ updated: number }>(
      "PUT",
      `subject-commissions/${subjectCommissionId}/grades`,
      payload
    );
  }

  moveStudentCommission(subjectId: number, studentId: string, toCommissionId: number): Observable<GradeRow> {
    return this.api.request<GradeRow>(
      'PATCH',
      `subjects/${subjectId}/students/${studentId}/commission`,
      { toCommissionId }
    );
  }
}
