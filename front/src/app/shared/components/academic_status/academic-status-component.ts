import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

export interface StudentMinimal {
  id: string;
  name: string;
  lastName: string;
  cuil: string;
}

@Component({
  selector: 'app-academic-status',
  standalone: true,
  imports: [CommonModule, TableModule, Tag],
  templateUrl: './academic-status-component.html',
})
export class AcademicStatus implements OnInit {
  /** If provided, we load this student; otherwise we fall back to the logged-in user */
  @Input() student?: StudentMinimal;

  subjectsByYear = signal<Record<string, any[]>>({});
  loading = signal(true);
  user = signal<{ name: string; cuil: string } | undefined>(undefined);

  private api = inject(ApiService);
  private auth = inject(AuthService);

  ngOnInit() {
    if (this.student) {
      this.loadData(this.student);
    } else {
      // no student input → use the logged-in user
      this.auth.getUser().subscribe((u) => {
        if (!u) return;
        this.loadData(u);
      });
    }
  }

  private loadData(s: any) {
    this.user.set({
      name: `${s.name} ${s.lastName}`,
      cuil: s.cuil,
    });

    this.getAcademicStatus(s.id);
  }

  getAcademicStatus(studentId: string): void {
    this.api.getAll('subjects').subscribe((subjects) => {
      this.api.getAll('exam_results').subscribe((results) => {
        const byYear: Record<string, any[]> = {};

        subjects.forEach((subject) => {
          const res = results.find(
            (r) => r.studentId === studentId && subject.id === r.examId
          );

          const yearKey = `${subject.courseYear}° Año`;

          if (!byYear[yearKey]) byYear[yearKey] = [];

          byYear[yearKey].push({
            subjectName: subject.subjectName,
            year: subject.courseYear,
            division: `${subject.courseNum}-${subject.courseLetter}`,
            condition: res ? 'Aprobado' : 'Inscripto',
            examInfo: res ? `Nota: ${res.score}` : '-',
          });
        });

        this.subjectsByYear.set(byYear);
        this.loading.set(false);
      });
    });
  }

  getSeverity(condition: string): string {
    switch (condition) {
      case 'Aprobado':
        return 'success';
      case 'Desaprobado':
        return 'warn';
      case 'Libre':
        return 'danger';
      case 'Inscripto':
        return 'info';
      default:
        return 'secondary';
    }
  }
}
