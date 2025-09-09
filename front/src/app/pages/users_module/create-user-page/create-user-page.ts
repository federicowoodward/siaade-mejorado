import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';

import { GoBackService } from '../../../core/services/go_back.service';
import { ApiService } from '../../../core/services/api.service';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { FieldLabelPipe } from '../../../shared/pipes/field-label.pipe';
import { RoleLabelPipe } from '../../../shared/pipes/role-label.pipe';

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
    TableModule,
    FieldLabelPipe,
    RoleLabelPipe
  ],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.scss',
})
export class CreateUserPage {
  private goBackSvc = inject(GoBackService);
  private api = inject(ApiService);
  private router = inject(Router);
  
  isCreating = false;

  back(): void {
    this.goBackSvc.back();
  }

  async createUser(): Promise<void> {
    if (this.isCreating) return;
    if (!this.role) { console.warn('Debe seleccionar rol'); return; }
    this.isCreating = true;

    try {
      const base = {
        name: this.name || undefined,
        lastName: this.lastName || undefined,
        email: this.email,
        password: this.passwordPreview,
        cuil: this.cuil || undefined,
      };

      let endpoint = '';
      let payload: any = {};

      switch (this.role) {
        case 'secretary': {
          endpoint = 'users/secretary';
          payload = { ...base, isDirective: this.isDirective || false };
          break;
        }
        case 'preceptor': {
          endpoint = 'users/preceptor';
          payload = {
            userData: base,
            userInfo: {
              documentType: this.documentType,
              documentValue: this.documentValue,
              phone: this.phone || undefined,
              emergencyName: this.emergencyName || undefined,
              emergencyPhone: this.emergencyPhone || undefined,
            }
          };
          break;
        }
        case 'teacher': {
          endpoint = 'users/teacher';
          payload = {
            userData: base,
            userInfo: {
              documentType: this.documentType,
              documentValue: this.documentValue,
              phone: this.phone || undefined,
              emergencyName: this.emergencyName || undefined,
              emergencyPhone: this.emergencyPhone || undefined,
            },
            commonData: {
              sex: this.sex,
              birthDate: this.birthDate,
              birthPlace: this.birthPlace,
              nationality: this.nationality,
              address: this.hasAddress() ? {
                street: this.addressStreet || undefined,
                number: this.addressNumber || undefined,
                locality: this.addressLocality || undefined,
                province: this.addressProvince || undefined,
                country: this.addressCountry || undefined,
                postalCode: this.addressPostalCode || undefined,
              } : undefined
            }
          };
          break;
        }
        case 'student': {
          endpoint = 'users/student';
          payload = {
            userData: base,
            userInfo: {
              documentType: this.documentType,
              documentValue: this.documentValue,
              phone: this.phone || undefined,
              emergencyName: this.emergencyName || undefined,
              emergencyPhone: this.emergencyPhone || undefined,
            },
            commonData: {
              sex: this.sex,
              birthDate: this.birthDate,
              birthPlace: this.birthPlace,
              nationality: this.nationality,
              address: this.hasAddress() ? {
                street: this.addressStreet || undefined,
                number: this.addressNumber || undefined,
                locality: this.addressLocality || undefined,
                province: this.addressProvince || undefined,
                country: this.addressCountry || undefined,
                postalCode: this.addressPostalCode || undefined,
              } : undefined
            }
          };
          break;
        }
        default:
          console.error('Rol no soportado');
          return;
      }

      const created = await this.api.create(endpoint, payload).toPromise();
      console.log('Usuario creado:', created);
      this.router.navigate(['/users']);
    } catch (err) {
      console.error('Error al crear usuario', err);
    } finally {
      this.isCreating = false;
    }
  }

  private getRoleId(role: string | null): number {
    // Mapear roles a IDs (esto debería venir del backend idealmente)
    const roleMap: Record<string, number> = {
      'student': 1,
      'teacher': 2,
      'preceptor': 3,
      'secretary': 4
    };
    return roleMap[role || 'student'] || 1;
  }

  // Paso 1 — Usuario básico
  role: string | null = null;
  name = '';
  lastName = '';
  email = '';
  cuil = '';

  // Vista previa de password (CUIL)
  get passwordPreview() {
    return this.cuil || '—';
  }

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

  // Dirección (opcional dentro de commonData.address para teacher/student)
  addressStreet = '';
  addressNumber = '';
  addressLocality = '';
  addressProvince = '';
  addressCountry = '';
  addressPostalCode = '';

  hasAddress() {
    return [this.addressStreet, this.addressNumber, this.addressLocality, this.addressProvince, this.addressCountry, this.addressPostalCode]
      .some(v => !!v);
  }

  canCreate(): boolean {
    if (!this.role || !this.email || !this.passwordPreview) return false;
    if (this.role === 'secretary') return true; // solo base + isDirective opcional
    // Requieren userInfo
    if (!this.documentType || !this.documentValue) return false;
    if (this.role === 'preceptor') return true; // no commonData obligatoria
    // teacher / student requieren commonData
    if (!this.sex || !this.birthDate || !this.birthPlace || !this.nationality) return false;
    return true;
  }

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
    return !qq ? [...src] : src.filter((v) => v.toLowerCase().includes(qq));
  }
  searchRoles(e: any) {
    this.roleSuggestions = this.filterContains(this.rolesAll, e?.query);
  }
  searchDocTypes(e: any) {
    this.docTypeSuggestions = this.filterContains(this.docTypesAll, e?.query);
  }
  searchSex(e: any) {
    this.sexSuggestions = this.filterContains(this.sexesAll, e?.query);
  }

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
  get previewRows(): { section: string; field: string; value: string }[] {
    const data = this.getPreview(); // usa tu método existente
    const rows: { section: string; field: string; value: string }[] = [];
    const push = (section: string, obj: any) => {
      Object.entries(obj || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          rows.push({ section, field: k, value: String(v) });
        }
      });
    };
    push('user', data.user);
    push('roleExtras', data.roleExtras);
    push('user_info', data.user_info);
    push('common_data', data.common_data);
    return rows;
  }
}
