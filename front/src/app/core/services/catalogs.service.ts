import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// TIPOS mínimos: dejarlos acotados a lo que usamos en la UI.
export type CareerStudentAssignment = {
  userId: string;
  legajo: string;
  studentStartYear: number;
  isActive: boolean | null;
  canLogin: boolean | null;
  commissionId: number | null;
  user: {
    name: string;
    lastName: string;
    email: string;
    cuil?: string;
  };
};

export type CareerStudentsCommissionGroup = {
  commissionId: number | null;
  commissionLetter: string | null;
  students: CareerStudentAssignment[];
};

export type CareerStudentsByCommissionResponse = {
  career: { id: number; name?: string };
  filters: { studentStartYear: number | null };
  commissions: CareerStudentsCommissionGroup[];
};

export type CareerStudentItem = {
  studentId: string;
  commissionId: number | null;
  commissionLetter: string | null;
  legajo: string;
  studentStartYear: number;
  isActive: boolean | null;
  canLogin: boolean | null;
  user: {
    name: string;
    email: string;
  };
};

@Injectable({ providedIn: 'root' })
export class CatalogsService {
  private readonly api = inject(ApiService);

  getCareerStudentsByCommission(
    careerId: number,
    opts?: { studentStartYear?: number },
  ): Observable<CareerStudentsByCommissionResponse> {
    const params: Record<string, any> = {};
    if (opts?.studentStartYear) {
      params['studentStartYear'] = String(opts.studentStartYear);
    }
    return this.api.request<CareerStudentsByCommissionResponse>(
      'GET',
      `catalogs/career-students-by-commission/${careerId}`,
      undefined,
      params,
    );
  }

  getCareerYears(careerId: number): Observable<number[]> {
    return this.api.request<number[]>(
      'GET',
      `catalogs/career-years/${careerId}`,
    );
  }
}
