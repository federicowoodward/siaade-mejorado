import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CareerCatalogService } from '../../../core/services/career-catalog.service';

@Component({
  selector: 'app-subjects-table',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule],
  templateUrl: './subjects-table.html',
  styleUrls: ['./subjects-table.scss'],
})
export class SubjectTableComponent implements OnInit {
  private catalog = inject(CareerCatalogService);
  loading = signal(true);

  basicSubjects = signal<{ id: number; name: string }[]>([]);
  private syncSubjects = effect(() => {
    this.basicSubjects.set(this.catalog.basicSubjects());
  });

  ngOnInit(): void {
    const careerId = 1;
    this.catalog.loadCareer(careerId).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  viewTeacher(id: number): void {
    const subject = this.basicSubjects().find((s) => s.id === id);
    const name = subject?.name ?? 'Materia';
    const teacher = this.catalog.getTeacherName(id);
    alert(`Profesor de "${name}": ${teacher} (id: ${id})`);
  }

  viewStatus(id: number): void {
    alert(`Situacion de la materia (id: ${id})`);
  }
}
