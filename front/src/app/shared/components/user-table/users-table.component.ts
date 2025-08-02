// src/app/pages/users/users-table.component.ts
import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DocumentsService } from '../../../core/services/documents_generations.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RolesService } from '../../../core/services/role.service';
import { RoleLabelPipe } from '../../pipes/role-label.pipe';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { Listbox } from 'primeng/listbox';
import { Tooltip } from 'primeng/tooltip';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

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
    RoleLabelPipe,
    SelectModule,
    MultiSelectModule,
    Listbox,
    Tooltip,
  ],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('open', style({ height: '*', opacity: 1 })),
      state('closed', style({ height: '0px', opacity: 0 })),
      transition('open <=> closed', animate('300ms ease-in-out')),
    ]),
  ],
})
export class UsersTableComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private documentsService = inject(DocumentsService);
  private rolesService = inject(RolesService);
  @ViewChild('dt') dt!: Table;
  selectedDialogRole: string | null = null;

  users = signal<any[]>([]);
  selectedRole = signal<string | null>(null);
  selectedUser = signal<any | null>(null);

  showCertDialog = signal(false);
  showSubjectsDialog = signal(false);
  showFilterDialog = signal(false);

  subjetsOfTheTeacher = [{ a: 'a' }, { a: 'b' }];

  readonly roles = [
    { label: 'All', value: null },
    { label: 'Student', value: 'alumno' },
    { label: 'Teacher', value: 'docente' },
    { label: 'Preceptor', value: 'preceptor' },
    { label: 'Secretary', value: 'secretario' },
    { label: 'Admin', value: 'admin' },
  ];

  readonly roleOptions = [
    { label: 'Alumno', value: 'student' },
    { label: 'Docente', value: 'teacher' },
    { label: 'Preceptor', value: 'preceptor' },
    { label: 'Secretario', value: 'secretary' },
  ];

  ngOnInit() {
    this.api.getAll('users').subscribe((users) => {
      const mapped = users.map((u: any) => ({
        ...u,
        // aquí convertimos el número a string usando tu servicio
        role: this.rolesService.getRoleNameById(u.roleId) || 'unknown',
      }));
      this.users.set(mapped);
    });
    console.log(this.users());
  }

  clear(table: Table, filterInput: HTMLInputElement) {
    filterInput.value = '';
    this.selectedDialogRole = '';
    table.clear();
  }

  viewDetails(user: any) {
    this.router.navigate(['/users/user_detail', user.id]);
  }

  generateCertificate(user: any) {
    this.selectedUser.set(user);
    this.showCertDialog.set(true);
  }

  viewAcademicStatus(user: any) {
    this.router.navigate(['/users/student_academic_status', user.id], {
      relativeTo: this.route,
    }); // old
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
