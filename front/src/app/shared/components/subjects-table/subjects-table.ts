// src/app/shared/components/subject-table/subject-table.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { expandCollapse } from '../../animations/expand-collapse.animation';

import { ApiService } from '../../../core/services/api.service';
import { Subject as RxSubject, forkJoin } from 'rxjs';

import {
  Subject,
  Subject as SubjectModel,
} from '../../../core/models/subject.model';
import { User } from '../../../core/models/user.model';
import { SubjectsFilterComponent } from '../subjets-filter/subjets-filter';

@Component({
  selector: 'app-subjects-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    InputTextModule,
    TooltipModule,
    AutoCompleteModule,
    SubjectsFilterComponent,
  ],
  templateUrl: './subjects-table.html',
  styleUrl: './subjects-table.scss',
  animations: [expandCollapse],
})
export class SubjectTableComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  expandedRowKeys: { [s: string]: boolean } = {};

  // Datos
  subjects = signal<SubjectModel[]>([]);
  teachers = signal<{ id: string; name: string; email: string }[]>([]);

  // Filtros
  courseData = signal<{ num: string; letter: string; year: string }>({
    num: '',
    letter: '',
    year: '',
  });

  // Trigger RxJS para limpiar filtros desde el padre
  clearFilters$ = new RxSubject<void>();

  // Derivado filtrado
  filtered = computed(() => {
    const { num, letter, year } = this.courseData();
    const n = (num ?? '').trim();
    const l = (letter ?? '').toLowerCase().trim();
    const y = (year ?? '').trim();

    return this.subjects().filter(
      (s) =>
        s.courseNum.toString().includes(n) &&
        s.courseLetter.toLowerCase().includes(l) &&
        s.courseYear.includes(y)
    );
  });

  // Estado de diálogos/selecciones
  selectedSubject = signal<SubjectModel | null>(null);
  showStudentsDialog = signal(false);
  showFilterDialog = signal(false);
  showCorrelativeDialog = signal(false);
  enrolledStudents = signal<string[]>([]);
  correlativeSubject = signal<SubjectModel | null>(null);

  ngOnInit() {
    // 1) Primero traemos las materias
    this.api.getAll<Subject>('subjects/read').subscribe((subjects) => {
      this.subjects.set(subjects);
    });

    // 2) Traemos todos los usuarios y filtramos solo los profesores
    this.api.getAll<User>('users').subscribe((users) => {
      // Filtramos usuarios que tienen roleId de Profesor (ID 3)
      const list = users
        .filter((u) => u.roleId === 3) // Asumiendo que Profesor tiene ID 3
        .map((u) => ({
          id: u.id,
          name: `${u.name} ${u.lastName}`,
          email: u.email,
        }));
      this.teachers.set(list);
    });
  }

  toggleFilters() {
    this.showFilterDialog.set(!this.showFilterDialog());
  }

  clearFilters() {
    this.clearFilters$.next();
  }

  viewStudents(subj: SubjectModel) {
    this.router.navigate(['/subjects', 'students', subj.id]);
  }

  viewCorrelative(correlativeId: number | null) {
    if (!correlativeId) {
      this.correlativeSubject.set(null);
      this.showCorrelativeDialog.set(true);
      return;
    }
    const corr = this.subjects().find((s) => s.id === correlativeId) ?? null;
    this.correlativeSubject.set(corr);
    this.showCorrelativeDialog.set(true);
  }

  getTeacherName(teacherId: string) {
    const teacher = this.teachers().find((t) => t.id === teacherId);
    return teacher ? teacher.name : 'Sin asignar';
  }

  goToGrades(subj: SubjectModel) {
    this.router.navigate(['/subjects', 'grades', subj.id]);
  }

  goToAttendance(subj: SubjectModel) {
    this.router.navigate(['/subjects', 'attendance', subj.id]);
  }
}
