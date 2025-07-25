import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-academic-status',
  standalone: true,
  imports: [CommonModule, TableModule, Tag],
  templateUrl: './academic-status-component.html',
})
export class AcademicStatus implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  subjectsByYear = signal<Record<string, any[]>>({});
  loading = signal(true);
  user: { name: string; document: string } | null = null;

  ngOnInit(): void {
    this.auth.getUser().subscribe((user) => {
      if (!user) return;

      this.user = {
        name: `${user.name} ${user.lastName}`,
        document: user.cuil,
      };

      const studentId = user.id;

      // Cargar materias y resultados
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
          this.loading.set(false); // ✅ Ya terminó de cargar'
        });
      });
    });
  }

  getSeverity(condition: string): string {
    switch (condition) {
      case 'Aprobado':
        return 'success';
      case 'Libre':
        return 'warn';
      case 'Desaprobado':
        return 'danger';
      case 'Inscripto':
      default:
        return 'info';
    }
  }
}
