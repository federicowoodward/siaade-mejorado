// src/app/shared/components/subjects-table/subject-table.component.ts
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CareerCatalogService } from '../../../core/services/career-catalog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subjects-table',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule],
  templateUrl: './subjects-table.html',
  styleUrls: ['./subjects-table.scss'],
})
export class SubjectTableComponent implements OnInit {
  private catalog = inject(CareerCatalogService);
  private router = inject(Router);
  loading = signal(true);

  basicSubjects = signal<
    { id: number; name: string; teacherId: string | null }[]
  >([]);
  private syncSubjects = effect(() => {
    this.basicSubjects.set(this.catalog.basicSubjects());
  });

  ngOnInit(): void {
    const careerId = 1;
    this.catalog.loadCareer(careerId).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  viewTeacher(id: number): void {
    const teacherId = this.catalog.getTeacherId(id);
    if (!teacherId) {
      alert('Sin docente asignado para esta materia.');
      return;
    }
    this.router.navigate(['/users', 'user_detail', teacherId]);
  }

  viewStatus(id: number): void {
    this.router.navigate(["/subjects", id, "academic-situation"]);
  }
}
