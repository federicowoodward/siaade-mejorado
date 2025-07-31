// src/app/pages/users/users-table.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DocumentsService } from '../../../core/services/documents_generations.service';
import { SearchBar } from '../search-bar/search-bar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    AutoCompleteModule,
    DialogModule,
    FormsModule,
    RouterModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
  ],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss',
})
export class UsersTableComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private documentsService = inject(DocumentsService);

  users = signal<any[]>([]);
  selectedRole = signal<string | null>(null);
  selectedUser = signal<any | null>(null);
  showCertDialog = signal(false);
  showSubjectsDialog = signal(false);

  readonly roles = [
    { label: 'All', value: null },
    { label: 'Student', value: 'alumno' },
    { label: 'Teacher', value: 'docente' },
    { label: 'Preceptor', value: 'preceptor' },
    { label: 'Secretary', value: 'secretario' },
    { label: 'Admin', value: 'admin' },
  ];

  filteredUsers = computed(() =>
    this.selectedRole()
      ? this.users().filter((u) => u.role === this.selectedRole())
      : this.users()
  );

  ngOnInit() {
    this.api.getAll('users').subscribe((users) => {
      this.api.getAll('teachers').subscribe((teachers) => {
        const withSubjects = users.map((u) => {
          if (u.role === 'docente') {
            const teacher = teachers.find((t: any) => t.userId === u.id);
            return {
              ...u,
              subjects: teacher?.subjects || [],
            };
          }
          return u;
        });
        this.users.set(withSubjects);
      });
    });
  }

  clear(table: Table, filterInput: HTMLInputElement) {
    filterInput.value = '';
    table.clear();
  }

  viewDetails(user: any) {
    this.router.navigate(['user_detail', user.id], { relativeTo: this.route });
  }

  generateCertificate(user: any) {
    this.selectedUser.set(user);
    this.showCertDialog.set(true);
  }

  viewAcademicStatus(user: any) {
    this.router.navigate(['/student-status', user.id]);
  }

  viewSubjects(user: any) {
    this.selectedUser.set(user);
    this.showSubjectsDialog.set(true);
  }

  confirmSubjectRedirect(subjectId: number) {
    this.router.navigate(['/subject-detail', subjectId]);
  }

  downloadCertificate() {
    this.documentsService.downloadStudentCertificate();
  }
}
