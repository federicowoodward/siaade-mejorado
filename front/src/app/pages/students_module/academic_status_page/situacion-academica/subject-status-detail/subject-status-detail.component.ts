import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, filter, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  StudentStatusService,
  StudentSubjectCard,
  StudentSubjectNote,
} from '../../../../../core/services/student-status.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-subject-status-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, ProgressSpinnerModule],
  templateUrl: './subject-status-detail.component.html',
  styleUrl: './subject-status-detail.component.scss',
})
export class SubjectStatusDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly statusService = inject(StudentStatusService);
  private readonly auth = inject(AuthService);

  readonly subject = signal<StudentSubjectCard | null>(null);
  readonly studentName = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private readonly summary$ = toObservable(this.statusService.summary);

  ngOnInit(): void {
    this.loadStudentName();
    this.ensureStatusLoaded();
    combineLatest([
      this.route.paramMap.pipe(
        map((params) => Number(params.get('subjectId')) || null),
        filter(
          (subjectId): subjectId is number =>
            subjectId !== null && Number.isFinite(subjectId) && subjectId > 0,
        ),
      ),
      this.summary$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([subjectId, summary]) => {
        if (!summary?.years?.length) {
          if (this.statusService.loading()) {
            this.loading.set(true);
            return;
          }
          this.subject.set(null);
          this.error.set('No encontramos materias disponibles en tu resumen.');
          this.loading.set(false);
          return;
        }
        
        // Buscar la materia en todos los años del summary
        let match = null;
        for (const year of summary.years) {
          if (!year.subjects) continue;
          const found = year.subjects.find((s: any) => s.id === subjectId);
          if (found) {
            match = found;
            break;
          }
        }
        
        if (!match) {
          this.subject.set(null);
          this.error.set('No encontramos la materia solicitada.');
          this.loading.set(false);
          return;
        }
        
        // Convertir el formato del summary al formato de StudentSubjectCard
        const card: StudentSubjectCard = {
          subjectId: match.id,
          subjectName: match.name || 'Sin nombre',
          yearLabel: match.calendarYear ? `${match.calendarYear}° año` : 'Sin año',
          yearNumber: match.calendarYear,
          commissionLabel: match.division || null,
          condition: match.finalCondition || null,
          accreditation: null,
          finalScore: null,
          finalExplanation: match.lastExamSummary || null,
          notes: this.extractNotesFromSummary(match),
        };
        
        this.subject.set(card);
        this.error.set(null);
        this.loading.set(false);
      });
  }
  
  private extractNotesFromSummary(subject: any): StudentSubjectNote[] {
    // Intentar extraer las notas del lastExamSummary
    const summary = subject.lastExamSummary || '';
    const notes: StudentSubjectNote[] = [];
    
    // Buscar patrón "Parciales: 4, 6, 8, 4"
    const parcialesMatch = summary.match(/Parciales:\s*([\d,\s]+)/);
    if (parcialesMatch) {
      const values = parcialesMatch[1].split(',').map(v => v.trim()).filter(v => v);
      values.forEach((value, index) => {
        notes.push({
          label: `Parcial ${index + 1}`,
          value: parseFloat(value),
        });
      });
    }
    
    // Buscar patrón "Final: X"
    const finalMatch = summary.match(/Final:\s*(\d+(?:\.\d+)?)/);
    if (finalMatch) {
      notes.push({
        label: 'Final',
        value: parseFloat(finalMatch[1]),
      });
    }
    
    return notes;
  }

  private ensureStatusLoaded(): void {
    if (this.statusService.status().length) return;
    this.statusService
      .loadStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private loadStudentName(): void {
    this.auth
      .getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user: any) => {
        if (!user) {
          this.studentName.set(null);
          return;
        }
        const segments = [
          typeof user['name'] === 'string' ? user['name'].trim() : '',
          typeof user['lastName'] === 'string' ? user['lastName'].trim() : '',
        ].filter((value) => value.length);
        if (segments.length) {
          this.studentName.set(segments.join(' '));
          return;
        }
        const fallback =
          typeof user['username'] === 'string' ? user['username'] : null;
        this.studentName.set(fallback);
      });
  }

  goBack(): void {
    void this.router.navigate(['/alumno/situacion-academica']);
  }

  stateSeverity(
    condition: string | null,
  ): 'success' | 'info' | 'danger' | 'warning' {
    if (!condition) return 'warning';
    const value = condition.toLowerCase();
    if (value.includes('promo') || value.includes('apro')) return 'success';
    if (value.includes('regular')) return 'info';
    if (value.includes('libre')) return 'danger';
    return 'warning';
  }

  trackNote(_: number, note: StudentSubjectNote): string {
    return note.label;
  }
}
