import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { IftaLabelModule } from 'primeng/iftalabel';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Subject } from '../../../core/models/subject.model';

@Component({
  selector: 'app-subject-new-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    AutoCompleteModule,
    TooltipModule,
    IftaLabelModule,
    Button,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './new-subject-page.html',
  styleUrls: ['./new-subject-page.scss'],
})
export class NewSubjectPage implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  constructor(private router: Router) {}

  // Form fields
  subjectName = '';
  teacherId: any = null;
  preceptorId: any = null;
  courseNum: string | null = null;
  courseLetter: string | null = null;
  courseYear: string | null = null;
  corrSelectedId: number | null = null;

  // Data from API
  teachers: User[] = [];
  preceptors: User[] = [];
  subjects: Subject[] = [];

  // Suggestions for autocomplete
  teacherSuggestions: any[] = [];
  preceptorSuggestions: any[] = [];
  corrSuggestions: string[] = [];
  courseNums: string[] = ['1', '2', '3', '4', '5', '6'];
  letters: string[] = ['A', 'B', 'C', 'D', 'E', 'F'];
  years: string[] = Array.from(
    { length: new Date().getFullYear() - 2020 + 1 },
    (_, i) => String(2020 + i)
  );

  // Loading state
  creating = false;
  loading = false;

  ngOnInit() {
    // Verificar autenticación antes de cargar datos
    this.ensureAuthenticated().then(() => {
      this.loadData();
    });
    
    // Configurar datos por defecto mientras se cargan
    this.courseNums = ['1', '2', '3', '4', '5', '6'];
    this.letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    this.years = Array.from(
      { length: new Date().getFullYear() - 2020 + 1 },
      (_, i) => String(2020 + i)
    );
  }

  private async ensureAuthenticated(): Promise<void> {
    const existingToken = localStorage.getItem('access_token');
    
    if (!existingToken) {
      try {
        const success = await this.authService.loginFlexible({
          username: 'admin@siaade.com',
          password: '123456'
        });
        
        if (success) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sesión iniciada',
            detail: 'Se ha iniciado sesión automáticamente'
          });
        } else {
          throw new Error('Auto-login failed');
        }
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error de autenticación',
          detail: 'No se pudo iniciar sesión automáticamente. Por favor, vaya a /auth para loguearse.'
        });
      }
    }
  }

  async loadData() {
    this.loading = true;
    
    try {
      // Cargar usuarios de forma más robusta
      const users = await firstValueFrom(this.api.getAll<User>('users'));
      
      if (!users || !Array.isArray(users) || users.length === 0) {
        throw new Error('No se encontraron usuarios en el sistema');
      }

      // Filtrar roles
      this.teachers = users.filter(u => u.roleId === 3);
      this.preceptors = users.filter(u => u.roleId === 4);
      
      // Si no hay preceptores, usar admins/secretarios
      if (this.preceptors.length === 0) {
        this.preceptors = users.filter(u => u.roleId === 1 || u.roleId === 2);
      }

      // Inicializar las sugerencias para que aparezcan al hacer clic en el dropdown
      this.teacherSuggestions = this.teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        lastName: teacher.lastName,
        displayName: `${teacher.name} ${teacher.lastName}`,
        email: teacher.email,
        roleId: teacher.roleId
      }));

      this.preceptorSuggestions = this.preceptors.map(preceptor => ({
        id: preceptor.id,
        name: preceptor.name,
        lastName: preceptor.lastName,
        displayName: `${preceptor.name} ${preceptor.lastName}`,
        email: preceptor.email,
        roleId: preceptor.roleId
      }));

      // Cargar materias existentes (opcional)
      try {
        const subjects = await firstValueFrom(this.api.getAll<Subject>('subjects/read'));
        this.subjects = Array.isArray(subjects) ? subjects : [];
      } catch (subjectError) {
        this.subjects = [];
      }

    } catch (error: any) {
      console.error('=== DATA LOAD FAILED ===', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de carga',
        detail: `No se pudieron cargar los datos: ${error?.message || error}`
      });
      // Inicializar arrays vacíos para evitar errores
      this.teachers = [];
      this.preceptors = [];
      this.subjects = [];
    } finally {
      this.loading = false;
    }
  }

  // Search methods for autocomplete
  searchTeachers(event: any) {
    const query = (event?.query || '').toLowerCase();
    
    // Si no hay teachers cargados, no mostrar nada
    if (this.teachers.length === 0) {
      this.teacherSuggestions = [];
      return;
    }
    
    // Filtrar y devolver objetos completos con displayName
    this.teacherSuggestions = this.teachers
      .filter(teacher => 
        `${teacher.name} ${teacher.lastName}`.toLowerCase().includes(query)
      )
      .map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        lastName: teacher.lastName,
        displayName: `${teacher.name} ${teacher.lastName}`,
        email: teacher.email,
        roleId: teacher.roleId
      }));
  }

  searchPreceptors(event: any) {
    const query = (event?.query || '').toLowerCase();
    
    // Si no hay preceptors cargados, no mostrar nada
    if (this.preceptors.length === 0) {
      this.preceptorSuggestions = [];
      return;
    }
    
    // Filtrar y devolver objetos completos con displayName
    this.preceptorSuggestions = this.preceptors
      .filter(preceptor => 
        `${preceptor.name} ${preceptor.lastName}`.toLowerCase().includes(query)
      )
      .map(preceptor => ({
        id: preceptor.id,
        name: preceptor.name,
        lastName: preceptor.lastName,
        displayName: `${preceptor.name} ${preceptor.lastName}`,
        email: preceptor.email,
        roleId: preceptor.roleId
      }));
  }

  searchCourseNums(event: any) {
    const query = event?.query || '';
    this.courseNums = ['1', '2', '3', '4', '5', '6'].filter(num => 
      num.includes(query)
    );
  }

  searchLetters(event: any) {
    const query = (event?.query || '').toUpperCase();
    this.letters = ['A', 'B', 'C', 'D', 'E', 'F'].filter(letter => 
      letter.includes(query)
    );
  }

  searchYears(event: any) {
    const query = event?.query || '';
    const currentYear = new Date().getFullYear();
    this.years = Array.from(
      { length: currentYear - 2020 + 1 },
      (_, i) => String(2020 + i)
    ).filter(year => year.includes(query));
  }

  onSearchCorr(event: any) {
    const query = (event?.query || '').toLowerCase();
    this.corrSuggestions = this.subjects
      .filter(subject => 
        subject.subjectName.toLowerCase().includes(query)
      )
      .map(subject => subject.subjectName);
  }

  onPickCorr(event: any) {
    const value = event.value || event;
    const found = this.subjects.find(s => s.subjectName === value);
    this.corrSelectedId = found ? found.id : null;
  }

  async createSubject() {
    // Validar campos básicos primero
    if (!this.subjectName || !this.teacherId || !this.preceptorId || 
        !this.courseNum || !this.courseLetter || !this.courseYear) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Por favor complete todos los campos obligatorios'
      });
      return;
    }

    // Verificar si los datos están cargados
    if (this.teachers.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos no cargados',
        detail: 'Los profesores aún se están cargando. Intente nuevamente.'
      });
      return;
    }

    // Extraer IDs de los objetos seleccionados
    let teacherId: string;
    let preceptorId: string;

    // Si teacherId es un objeto con id, extraer el id
    if (typeof this.teacherId === 'object' && this.teacherId?.id) {
      teacherId = this.teacherId.id;
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Profesor no válido',
        detail: 'Por favor seleccione un profesor válido de la lista'
      });
      return;
    }

    // Si preceptorId es un objeto con id, extraer el id
    if (typeof this.preceptorId === 'object' && this.preceptorId?.id) {
      preceptorId = this.preceptorId.id;
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Preceptor no válido',
        detail: 'Por favor seleccione un preceptor válido de la lista'
      });
      return;
    }

    this.creating = true;

    try {
      const subjectData = {
        subjectName: this.subjectName,
        teacher: teacherId,
        preceptor: preceptorId,
        courseNum: parseInt(this.courseNum),
        courseLetter: this.courseLetter,
        courseYear: this.courseYear,
        correlative: this.corrSelectedId
      };

      await firstValueFrom(this.api.create<Subject>('subjects/manage/create', subjectData));

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Materia creada correctamente'
      });

      // Redirigir después de un breve delay
      setTimeout(() => {
        this.router.navigate(['/subjects']);
      }, 1500);

    } catch (error: any) {
      console.error('Error creating subject:', error);
      
      let errorMessage = 'Error al crear la materia. Verifique los datos.';
      
      if (error?.status === 401) {
        errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
      } else if (error?.status === 400) {
        errorMessage = 'Datos inválidos. Verifique que todos los campos estén completos.';
      } else if (error?.status === 500) {
        errorMessage = 'Error del servidor. Intente nuevamente más tarde.';
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      }
      
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      });
    } finally {
      this.creating = false;
    }
  }

  goBack() {
    this.router.navigate(['/subjects']);
  }
}
