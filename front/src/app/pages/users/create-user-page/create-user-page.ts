import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';

import { GoBackService } from '../../../core/services/go_back.service';

@Component({
  selector: 'app-create-user-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StepperModule,
    ButtonModule,
    InputTextModule,
    AutoCompleteModule,
    TooltipModule,
  ],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.scss',
})
export class CreateUserPage {
  private goBackSvc = inject(GoBackService);
  back(): void { this.goBackSvc.back(); }

  // Paso 1 — Usuario básico
  role: string | null = null;
  name = '';
  lastName = '';
  email = '';
  cuil = '';

  // Vista previa de password (CUIL)
  get passwordPreview() { return this.cuil || '—'; }

  // Paso 2 — Datos extra por rol
  // student
  legajo = '';
  // secretary
  isDirective = false;
  // user_info
  documentType = '';
  documentValue = '';
  phone = '';
  emergencyName = '';
  emergencyPhone = '';
  // common_data
  sex = '';
  birthDate = ''; // input[type=date] (string yyyy-MM-dd)
  birthPlace = '';
  nationality = '';

  // Autocomplete fuentes (solo strings)
  private rolesAll = ['student', 'teacher', 'preceptor', 'secretary'];
  roleSuggestions: string[] = [];
  private docTypesAll = ['DNI', 'Pasaporte', 'LE', 'LC'];
  docTypeSuggestions: string[] = [];
  private sexesAll = ['F', 'M', 'X'];
  sexSuggestions: string[] = [];

  // Métodos de sugerencias
  private filterContains(src: string[], q: string) {
    const qq = (q || '').toLowerCase().trim();
    return !qq ? [...src] : src.filter(v => v.toLowerCase().includes(qq));
  }
  searchRoles(e: any) { this.roleSuggestions   = this.filterContains(this.rolesAll, e?.query); }
  searchDocTypes(e: any) { this.docTypeSuggestions = this.filterContains(this.docTypesAll, e?.query); }
  searchSex(e: any) { this.sexSuggestions     = this.filterContains(this.sexesAll, e?.query); }

  // Paso 3 — Preview simple (solo para mostrar captura)
  getPreview() {
    return {
      user: {
        role: this.role,
        name: this.name,
        lastName: this.lastName,
        email: this.email,
        cuil: this.cuil,
        password: this.passwordPreview,
      },
      roleExtras: {
        ...(this.role === 'student' ? { legajo: this.legajo } : {}),
        ...(this.role === 'secretary' ? { isDirective: this.isDirective } : {}),
      },
      user_info: {
        documentType: this.documentType || undefined,
        documentValue: this.documentValue || undefined,
        phone: this.phone || undefined,
        emergencyName: this.emergencyName || undefined,
        emergencyPhone: this.emergencyPhone || undefined,
      },
      common_data: {
        sex: this.sex || undefined,
        birthDate: this.birthDate || undefined,
        birthPlace: this.birthPlace || undefined,
        nationality: this.nationality || undefined,
      },
    };
  }
}
