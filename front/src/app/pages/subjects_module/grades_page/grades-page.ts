import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import {
  Accordion,
  AccordionPanel,
  AccordionHeader,
  AccordionContent,
} from 'primeng/accordion';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ActivatedRoute } from '@angular/router';
import { GoBackService } from '../../../core/services/go_back.service';
import { ApiService } from '../../../core/services/api.service';
import { GradesApiResponse } from './grades.types';

@Component({
  selector: 'app-grades-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    CardModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    ProgressSpinnerModule,
  ],
  templateUrl: './grades-page.html',
  styleUrls: ['./grades-page.scss'],
})
export class GradesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private goBackSvc = inject(GoBackService);

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<GradesApiResponse | null>(null);

  subjectId = Number(this.route.snapshot.paramMap.get('subjectId') ?? 0);
  subjectName = computed(() => this.data()?.subject.name ?? 'Materia');

  ngOnInit(): void {
    this.api
      .request<GradesApiResponse>('GET', `subjects/${this.subjectId}/grades`)
      .subscribe({
        next: (payload) => {
          console.log(payload)
          this.data.set(payload);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('No se pudo cargar las notas de la materia.');
          this.loading.set(false);
        },
      });
  }

  back(): void {
    this.goBackSvc.back();
  }

  isGradeApproved(score: number | null): boolean {
    return score !== null && score >= 4 && score < 7;
  }

  isGradePromoted(score: number | null): boolean {
    return score !== null && score >= 7;
  }

  isGradeDisapproved(score: number | null): boolean {
    return score !== null && score < 4;
  }

  finalClass(score: number | null): string {
    if (score === null || score === undefined) return '';
    if (this.isGradePromoted(score)) return 'nota-promocionada';
    if (this.isGradeApproved(score)) return 'nota-aprobada';
    if (this.isGradeDisapproved(score)) return 'nota-desaprobada';
    return '';
  }
}
