// #ASUMIENDO CODIGO: src/app/shared/components/subject-table/subject-table.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ApiService } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs';
import { Subject } from '../../../core/models/subject.model';

@Component({
  selector: 'app-subject-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    InputTextModule,
  ],
  templateUrl: './subject-table.html',
  styleUrl: './subject-table.scss',
})
export class SubjectTableComponent implements OnInit {
  private api = inject(ApiService);

  // raw subjects
  subjects = signal<Subject[]>([]);

  // filters
  filterName = signal('');
  filterCourse = signal('');
  filterYear = signal('');

  // computed filtered list
  filtered = computed(() => {
    const name = this.filterName().toLowerCase();
    const course = this.filterCourse().toLowerCase();
    const year = this.filterYear().toLowerCase();
    return this.subjects().filter(
      (s) =>
        s.subjectName.toLowerCase().includes(name) &&
        `${s.courseNum}-${s.courseLetter}`.toLowerCase().includes(course) &&
        s.courseYear.toLowerCase().includes(year)
    );
  });

  // dialogs
  selectedSubject = signal<Subject | null>(null);
  showStudentsDialog = signal(false);
  enrolledStudents = signal<string[]>([]);

  showCorrelativeDialog = signal(false);
  correlativeName = signal<string>('');

  ngOnInit() {
    // fetch all subjects
    this.api
      .getAll<Subject>('subjects')
      .subscribe((list) => this.subjects.set(list));
  }

  viewStudents(subj: Subject) {
    this.selectedSubject.set(subj);
    // fetch subject-students and students, map to names
    forkJoin({
      enrol: this.api.getAll<any>('subject_students'),
      students: this.api.getAll<any>('students'),
      users: this.api.getAll<any>('users'),
    }).subscribe(({ enrol, students, users }) => {
      const studentIds = enrol
        .filter((e) => e.subject_id === subj.id && e.enrolled)
        .map((e) => e.student_id);
      const names = studentIds.map((id) => {
        const stud = students.find((s) => s.user_id === id);
        if (!stud) return 'N/A';
        const u = users.find((u) => u.id === stud.user_id);
        return u ? `${u.name} ${u.lastName}` : 'N/A';
      });
      this.enrolledStudents.set(names);
      this.showStudentsDialog.set(true);
    });
  }

  viewCorrelative(subj: Subject) {
    const corr = this.subjects().find((s) => s.id === subj.correlative);
    this.correlativeName.set(corr ? corr.subjectName : 'Sin correlativa');
    this.showCorrelativeDialog.set(true);
  }
}
