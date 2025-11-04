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
import { buildPreviewRows } from '../../../shared/utils/create-user/user-preview-table';

import {
  ROLE_REQUIREMENTS,
  UserRole,
} from '../../../shared/utils/create-user/role-config';
import {
  buildPayload,
  hasAnyAddress,
} from '../../../shared/utils/create-user/user-payload.util';
import {
  canCreateBase,
  canCreateStep2,
} from '../../../shared/utils/create-user/user-validators.util';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';

type PreviewRow = { field: string; value: string };
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
    RoleLabelPipe,
  ],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.scss',
})
export class CreateUserPage {
  private goBackSvc = inject(GoBackService);
  private api = inject(ApiService);
  private router = inject(Router);
  private permissions = inject(PermissionService);

  isCreating = false;

  back(): void {
    this.goBackSvc.back();
  }
  // Paso 1 — Usuario básico
  role: UserRole | null = null;
  name = '';
  lastName = '';
  email = '';
  cuil = '';

  // Password inicial = CUIL (vista previa)
  get passwordPreview() {
    return this.cuil || 'pass1234';
  }

  // Paso 2 — user_info / common_data (según rol)
  // user_info
  documentType = '';
  documentValue = '';
  phone = '';
  emergencyName = '';
  emergencyPhone = '';

  // common_data
  sex = '';
  birthDate = ''; // yyyy-MM-dd
  birthPlace = '';
  nationality = '';

  // address (opcional)
  addressStreet = '';
  addressNumber = '';
  addressLocality = '';
  addressProvince = '';
  addressCountry = '';
  addressPostalCode = '';

  // extras de alumno
  studentLegajo = '';
  studentStartYear: number | null = null; // opcional
  canLogin = true;
  isActive = true;

  // Permisos por rol para editar flags
  get canEditCanLogin(): boolean {
    // Preceptor y superiores (incluye secretario común y ejecutivo)
    return this.permissions.hasAnyRole([
      ROLE.PRECEPTOR,
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]);
  }

  get canEditIsActive(): boolean {
    // Solo Secretario Admin (Executive Secretary)
    return this.permissions.hasRole(ROLE.EXECUTIVE_SECRETARY);
  }

  // Si el alumno no está activo o el rol no lo permite, no puede loguearse: reflejar en UI
  get canLoginDisabled(): boolean {
    const inactive = this.role === 'student' && this.isActive === false;
    const noPerms = !this.canEditCanLogin;
    return inactive || noPerms;
  }

  onIsActiveChange(next: boolean): void {
    if (!this.canEditIsActive) return; // sin permisos, ignorar
    this.isActive = !!next;
    if (this.isActive === false) {
      this.canLogin = false; // override visual y de payload
    }
  }

  private addressObj() {
    return {
      street: this.addressStreet || undefined,
      number: this.addressNumber || undefined,
      locality: this.addressLocality || undefined,
      province: this.addressProvince || undefined,
      country: this.addressCountry || undefined,
      postalCode: this.addressPostalCode || undefined,
    };
  }

  hasAddress() {
    return hasAnyAddress(this.addressObj());
  }

  get req() {
    return this.role ? ROLE_REQUIREMENTS[this.role] : null;
  }

  canCreate(): boolean {
    const baseOk = canCreateBase(this.role, this.email, this.cuil);
    if (!baseOk) return false;
    if (this.role === 'secretary') return true;

    return canCreateStep2({
      role: this.role,
      documentType: this.documentType,
      documentValue: this.documentValue,
      sex: this.sex,
      birthDate: this.birthDate,
      birthPlace: this.birthPlace,
      nationality: this.nationality,
      legajo: this.role === 'student' ? (this.studentLegajo || this.cuil || this.documentValue) : undefined,
    });
  }

  async createUser(): Promise<void> {
    if (this.isCreating || !this.role) return;
    this.isCreating = true;

    try {
      const { endpoint, payload } = buildPayload({
        base: {
          role: this.role,
          name: this.name,
          lastName: this.lastName,
          email: this.email,
          cuil: this.cuil,
        },
        userInfo: this.req?.needsUserInfo
          ? {
              documentType: this.documentType,
              documentValue: this.documentValue,
              phone: this.phone || undefined,
              emergencyName: this.emergencyName || undefined,
              emergencyPhone: this.emergencyPhone || undefined,
            }
          : undefined,
        commonData: this.req?.needsCommonData
          ? {
              sex: this.sex,
              birthDate: this.birthDate,
              birthPlace: this.birthPlace,
              nationality: this.nationality,
            }
          : undefined,
        address:
          this.req?.allowsAddress && this.hasAddress()
            ? this.addressObj()
            : undefined,
        // extras para student
        studentLegajo: this.role === 'student' ? (this.studentLegajo || this.cuil || this.documentValue) : undefined,
        studentStartYear: this.role === 'student' && this.studentStartYear ? this.studentStartYear : undefined,
        canLogin: this.role === 'student' ? this.canLogin : undefined,
        isActive: this.role === 'student' ? this.isActive : undefined,
      });

      const created = await this.api.create(endpoint, payload).toPromise();
      console.log('Usuario creado:', created);
      this.router.navigate(['/users']);
    } catch (err) {
      console.error('Error al crear usuario', err);
    } finally {
      this.isCreating = false;
    }
  }

  /** Build y Getter consumido por la tabla  de preview*/

  buildPreview() {
    return {
      user: {
        role: this.role,
        name: this.name,
        lastName: this.lastName,
        email: this.email,
        cuil: this.cuil,
        password: this.passwordPreview,
      },
      roleExtras:
        this.role === 'student'
          ? {
              legajo: this.studentLegajo || this.cuil || this.documentValue,
              studentStartYear: this.studentStartYear || undefined,
              canLogin: this.canLogin,
              isActive: this.isActive,
            }
          : this.role === 'secretary'
          ? { isDirective: true }
          : undefined,
      user_info: this.req?.needsUserInfo
        ? {
            documentType: this.documentType || undefined,
            documentValue: this.documentValue || undefined,
            phone: this.phone || undefined,
            emergencyName: this.emergencyName || undefined,
            emergencyPhone: this.emergencyPhone || undefined,
          }
        : undefined,
      common_data: this.req?.needsCommonData
        ? {
            sex: this.sex || undefined,
            birthDate: this.birthDate || undefined,
            birthPlace: this.birthPlace || undefined,
            nationality: this.nationality || undefined,
            address:
              this.req?.allowsAddress && this.hasAddress()
                ? this.addressObj()
                : undefined,
          }
        : undefined,
    };
  }

  get previewRows(): PreviewRow[] {
    return buildPreviewRows(this.buildPreview());
  }

  // ---- SUGERENCIAS / LISTAS ----
  private rolesAll: UserRole[] = [
    'student',
    'teacher',
    'preceptor',
    'secretary',
  ];
  roleSuggestions: UserRole[] = [];

  private docTypesAll: string[] = ['DNI', 'Pasaporte', 'LE', 'LC'];
  docTypeSuggestions: string[] = [];

  private sexesAll: string[] = ['F', 'M', 'X'];
  sexSuggestions: string[] = [];

  // ---- HELPERS ----
  private filterContains<T extends string>(src: T[], q: string): T[] {
    const needle = (q ?? '').toLowerCase().trim();
    if (!needle) return [...src];
    return src.filter((v) => v.toLowerCase().includes(needle));
  }

  // ---- MÉTODOS PARA p-autoComplete ----
  searchRoles(e: { query: string }) {
    this.roleSuggestions = this.filterContains(this.rolesAll, e?.query);
  }

  searchDocTypes(e: { query: string }) {
    this.docTypeSuggestions = this.filterContains(this.docTypesAll, e?.query);
  }

  searchSex(e: { query: string }) {
    this.sexSuggestions = this.filterContains(this.sexesAll, e?.query);
  }
}
