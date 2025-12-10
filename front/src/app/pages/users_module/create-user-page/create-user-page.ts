import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { GoBackService } from '../../../core/services/go_back.service';
import { ApiService } from '../../../core/services/api.service';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { FieldLabelPipe } from '../../../shared/pipes/field-label.pipe';
import { RoleLabelPipe } from '../../../shared/pipes/role-label.pipe';
import { buildPreviewRows } from '../../../shared/utils/create-user/user-preview-table';
import { BlockedActionDirective } from '../../../shared/directives/blocked-action.directive';

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
  hasMinAge,
  isValidStudentStartYear,
  MAX_START_YEAR,
  MIN_AGE_YEARS,
  MIN_START_YEAR,
  parseDateOnly,
} from '../../../shared/utils/create-user/user-validators.util';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ArgentinaGeoService } from '../../../shared/services/argentina-geo.service';
import { firstValueFrom } from 'rxjs';
import { UiAlertAuditService } from '../../../core/services/ui-alert-audit.service';

type PreviewRow = { field: string; value: string };
type RoleOption = { label: string; value: UserRole };
@Component({
  selector: 'app-create-user-page',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    FormsModule,
    StepperModule,
    ButtonModule,
    InputTextModule,
    AutoCompleteModule,
    TooltipModule,
    SelectModule,
    ToastModule,
    TableModule,
    FieldLabelPipe,
    RoleLabelPipe,
    BlockedActionDirective,
    IftaLabelModule,
  ],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.scss',
})
export class CreateUserPage implements OnInit {
  private goBackSvc = inject(GoBackService);
  private api = inject(ApiService);
  private router = inject(Router);
  private geo = inject(ArgentinaGeoService);
  private messages = inject(MessageService);
  private uiAlertAudit = inject(UiAlertAuditService);
  readonly minAgeYears = MIN_AGE_YEARS;

  isCreating = false;
  activeStep = 1;
  duplicateErrors: Partial<
    Record<'email' | 'cuil' | 'documentValue', string>
  > = {};

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Inicio', routerLink: '/welcome' },
    { label: 'Usuarios', routerLink: '/users' },
    { label: 'Nuevo usuario' },
  ];

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

  // address (opcional)
  addressStreet = '';
  addressNumber = '';
  addressLocality = '';
  addressProvince = '';
  addressPostalCode = '';
  addressNeighborhood = '';

  // opciones de selects (alineadas con PersonalDataComponent)
  readonly docTypeOptions = [
    { label: 'DNI', value: 'DNI' },
    { label: 'Pasaporte', value: 'Pasaporte' },
    { label: 'CUIT', value: 'CUIT' },
    { label: 'Libreta Civica', value: 'Libreta Civica' },
    { label: 'Libreta de Enrolamiento', value: 'Libreta de Enrolamiento' },
  ];

  readonly sexOptions = [
    { label: 'Femenino', value: 'Femenino' },
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Prefiero no decirlo', value: 'Prefiero no decirlo' },
  ];

  provinceOptions: { label: string; value: string }[] = [];
  departmentOptions: { label: string; value: string }[] = [];
  localityOptions: { label: string; value: string }[] = [];

  // extras de alumno
  studentLegajo = '';
  studentStartYear: number | null = null; // opcional

  private addressObj() {
    return {
      street: this.addressStreet || undefined,
      number: this.addressNumber || undefined,
      locality: this.addressLocality || undefined,
      province: this.addressProvince || undefined,
      postalCode: this.addressPostalCode || undefined,
    };
  }

  hasAddress() {
    return hasAnyAddress(this.addressObj());
  }

  get req() {
    return this.role ? ROLE_REQUIREMENTS[this.role] : null;
  }

  private parsedBirthDate(): Date | null {
    return parseDateOnly(this.birthDate);
  }

  clearDuplicateErrorFor(field: 'email' | 'cuil' | 'documentValue'): void {
    if (this.duplicateErrors[field]) {
      const next = { ...this.duplicateErrors };
      delete next[field];
      this.duplicateErrors = next;
    }
  }

  private deriveDniFromCuil(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.substring(2, 10);
    }
    if (digits.length >= 8) {
      return digits.slice(-8);
    }
    return digits;
  }

  get emailError(): string | null {
    return this.duplicateErrors.email ?? null;
  }

  get cuilError(): string | null {
    return this.duplicateErrors.cuil ?? null;
  }

  get documentValueError(): string | null {
    return this.duplicateErrors.documentValue ?? null;
  }

  get birthDateError(): string | null {
    if (!this.birthDate) return null;
    if (!this.parsedBirthDate()) return 'Fecha de nacimiento inválida';
    if (!hasMinAge(this.birthDate, this.minAgeYears)) {
      return `Debe tener al menos ${this.minAgeYears} años.`;
    }
    return null;
  }

  get studentStartYearError(): string | null {
    if (this.role !== 'student') return null;
    if (
      this.studentStartYear === null ||
      this.studentStartYear === undefined ||
      (this.studentStartYear as any) === ''
    )
      return null;
    if (!this.birthDate) {
      return 'Completá la fecha de nacimiento para validar el año de inicio.';
    }
    if (!this.parsedBirthDate()) return 'Fecha de nacimiento inválida';

    const startYear = Number(this.studentStartYear);
    if (!Number.isInteger(startYear)) {
      return 'Ingresá un año de inicio válido.';
    }
    if (startYear < MIN_START_YEAR || startYear > MAX_START_YEAR) {
      return `El año de inicio debe estar entre ${MIN_START_YEAR} y ${MAX_START_YEAR}.`;
    }
    if (!isValidStudentStartYear(this.birthDate, startYear, this.minAgeYears)) {
      return `El año de inicio debe ser al menos ${this.minAgeYears} años posterior a la fecha de nacimiento.`;
    }
    return null;
  }

  get step1Errors(): string[] {
    return this.validateStep1();
  }

  get step2Errors(): string[] {
    return this.validateStep2();
  }

  private validateStep1(): string[] {
    const errors: string[] = [];
    if (!this.role) errors.push('Seleccioná un rol.');
    if (!this.name.trim()) errors.push('Nombre es obligatorio.');
    if (!this.lastName.trim()) errors.push('Apellido es obligatorio.');
    if (!this.email.trim()) {
      errors.push('Email es obligatorio.');
    } else if (this.emailError) {
      errors.push(`Email: ${this.emailError}`);
    }
    if (this.cuilError) errors.push(`CUIL: ${this.cuilError}`);
    if (!this.sex) errors.push('Sexo es obligatorio.');
    if (!this.birthDate) errors.push('Fecha de nacimiento es obligatoria.');
    if (this.birthDateError) errors.push(`Fecha de nacimiento: ${this.birthDateError}`);
    return errors;
  }

  private validateStep2(): string[] {
    const errors: string[] = [];
    const req = this.req;
    if (!this.role) {
      errors.push('Seleccioná un rol antes de continuar.');
      return errors;
    }
    if (req?.needsUserInfo) {
      if (!this.documentType) errors.push('Tipo de documento es obligatorio.');
      if (!this.documentValue.trim()) {
        errors.push('Número de documento es obligatorio.');
      } else if (this.documentValueError) {
        errors.push(`Número de documento: ${this.documentValueError}`);
      }
    }
    if (req?.needsCommonData) {
      if (this.birthDateError) errors.push(`Fecha de nacimiento: ${this.birthDateError}`);
      if (!this.sex) errors.push('Sexo es obligatorio.');
    }
    if (this.role === 'student') {
      if (!this.studentLegajo.trim() && !this.cuil && !this.documentValue) {
        errors.push('Legajo es obligatorio para alumnos.');
      }
      if (this.studentStartYearError) {
        errors.push(`Año de inicio: ${this.studentStartYearError}`);
      }
    }
    return errors;
  }

  private showValidationErrors(errors: string[], summary = 'Revisá los datos requeridos') {
    if (!errors.length) return;
    this.toastErr(`${summary}: ${errors.join(' | ')}`);
  }

  canCreate(): boolean {
    if (this.birthDateError || this.studentStartYearError) return false;
    if (this.step1Errors.length || this.step2Errors.length) return false;
    const baseOk = canCreateBase(this.role, this.email, this.cuil);
    if (!baseOk) return false;
    if (this.role === 'secretary') return true;

    return canCreateStep2({
      role: this.role,
      documentType: this.documentType,
      documentValue: this.documentValue,
      sex: this.sex,
      birthDate: this.birthDate,
      studentStartYear: this.role === 'student' ? this.studentStartYear : null,
      legajo:
        this.role === 'student'
          ? this.studentLegajo || this.cuil || this.documentValue
          : undefined,
      minAgeYears: this.minAgeYears,
    });
  }

  onCuilChange(value: string): void {
    this.cuil = value;
    this.clearDuplicateErrorFor('cuil');
    const derivedDni = this.deriveDniFromCuil(value);
    if (derivedDni) {
      this.documentValue = derivedDni;
      this.clearDuplicateErrorFor('documentValue');
    }
  }

  goToStep(step: number): void {
    this.activeStep = step;
  }

  async createUser(): Promise<void> {
    if (this.isCreating || !this.role) return;
    if (!this.canCreate()) {
      this.toastErr('Revisá los datos obligatorios antes de continuar.');
      return;
    }
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
            }
          : undefined,
        address:
          this.req?.allowsAddress && this.hasAddress()
            ? this.addressObj()
            : undefined,
        // extras para student
        studentLegajo:
          this.role === 'student'
            ? this.studentLegajo || this.cuil || this.documentValue
            : undefined,
        studentStartYear:
          this.role === 'student' && this.studentStartYear
            ? this.studentStartYear
            : undefined,
      });

      const created = await this.api.create(endpoint, payload).toPromise();
      console.log('Usuario creado:', created);
      this.toastOk('Usuario creado correctamente');
      setTimeout(() => this.router.navigate(['/users']), 700);
    } catch (err) {
      console.error('Error al crear usuario', err);
      const backendMsg = (err as any)?.error?.message;
      let detail = 'No se pudo crear el usuario. Verifique los datos.';
      this.duplicateErrors = {};
      if (backendMsg) {
        detail = Array.isArray(backendMsg)
          ? backendMsg.join(' | ')
          : backendMsg;
      } else if ((err as any)?.status === 409) {
        detail = 'Datos duplicados. Revise email, CUIL o legajo.';
      }
      const lowerDetail = String(detail || '').toLowerCase();
      if (/email.*registrad/i.test(lowerDetail)) {
        this.duplicateErrors.email = 'El email ya está registrado.';
      }
      if (/cuil.*registrad/i.test(lowerDetail)) {
        this.duplicateErrors.cuil = 'El CUIL ya está registrado.';
      }
      if (
        /(dni|documento).*registrad/i.test(lowerDetail) ||
        lowerDetail.includes('número de documento ya existe')
      ) {
        this.duplicateErrors.documentValue =
          'El número de documento ya está registrado.';
      }
      if (
        (err as any)?.status === 409 &&
        !this.duplicateErrors.email &&
        !this.duplicateErrors.cuil &&
        !this.duplicateErrors.documentValue
      ) {
        // Mensaje genérico: marcar campos principales para dar feedback visual
        this.duplicateErrors.email = 'Dato duplicado.';
        this.duplicateErrors.cuil = 'Dato duplicado.';
        this.duplicateErrors.documentValue = 'Dato duplicado.';
      }
      if (this.duplicateErrors.email || this.duplicateErrors.cuil) {
        this.goToStep(1);
      } else if (this.duplicateErrors.documentValue) {
        this.goToStep(2);
      }
      this.toastErr(detail);
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
  private readonly roleOptions: RoleOption[] = [
    { value: 'student', label: 'Alumno' },
    { value: 'teacher', label: 'Docente' },
    { value: 'preceptor', label: 'Preceptor' },
    { value: 'secretary', label: 'Secretaría' },
  ];
  roleSuggestions: RoleOption[] = [];

  private docTypesAll: string[] = [
    'DNI',
    'Pasaporte',
    'CUIT',
    'Libreta Civica',
    'Libreta de Enrolamiento',
  ];
  docTypeSuggestions: string[] = [];

  private sexesAll: string[] = ['Femenino', 'Masculino', 'Prefiero no decirlo'];
  sexSuggestions: string[] = [];

  // ---- HELPERS ----
  private filterContains<T extends string>(src: T[], q: string): T[] {
    const needle = (q ?? '').toLowerCase().trim();
    if (!needle) return [...src];
    return src.filter((v) => v.toLowerCase().includes(needle));
  }

  private toastOk(summary: string) {
    this.uiAlertAudit.add(this.messages, { severity: 'success', summary });
  }

  private toastErr(detail: string) {
    this.uiAlertAudit.add(this.messages, {
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }

  // ---- MÉTODOS PARA p-autoComplete ----
  searchRoles(e: { query: string }) {
    const q = (e?.query ?? '').toLowerCase().trim();

    if (!q) {
      this.roleSuggestions = [...this.roleOptions];
      return;
    }

    this.roleSuggestions = this.roleOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q),
    );
  }

  searchDocTypes(e: { query: string }) {
    this.docTypeSuggestions = this.filterContains(this.docTypesAll, e?.query);
  }

  searchSex(e: { query: string }) {
    this.sexSuggestions = this.filterContains(this.sexesAll, e?.query);
  }

  // ---- Ciclo de vida / geo-selectores ----
  async ngOnInit(): Promise<void> {
    await this.initializeGeoSelectors();
  }

  private async initializeGeoSelectors(): Promise<void> {
    await this.loadProvinces();
    const province = this.addressProvince;
    if (province) {
      await this.loadDepartments(province);
      const department = this.addressNeighborhood || undefined;
      await this.loadLocalities(province, department);
    }
  }

  private async loadProvinces(): Promise<void> {
    try {
      const options = await firstValueFrom(this.geo.getProvinces());
      this.provinceOptions = options;
    } catch (error) {
      console.error('No se pudieron cargar provincias', error);
    }
  }

  private async loadDepartments(province: string): Promise<void> {
    try {
      const options = await firstValueFrom(
        this.geo.getDepartments(province || ''),
      );
      this.departmentOptions = options;
    } catch (error) {
      console.error('No se pudieron cargar departamentos', error);
      this.departmentOptions = [];
    }
  }

  private async loadLocalities(
    province: string,
    department?: string,
  ): Promise<void> {
    try {
      const options = await firstValueFrom(
        this.geo.getLocalities(province || '', department),
      );
      this.localityOptions = options;
    } catch (error) {
      console.error('No se pudieron cargar localidades', error);
      this.localityOptions = [];
    }
  }

  async onProvinceChange(value: string | null): Promise<void> {
    this.addressProvince = value ?? '';
    this.addressNeighborhood = '';
    this.addressLocality = '';
    this.departmentOptions = [];
    this.localityOptions = [];
    if (value) {
      await this.loadDepartments(value);
    }
  }

  async onDepartmentChange(value: string | null): Promise<void> {
    this.addressNeighborhood = value ?? '';
    this.addressLocality = '';
    this.localityOptions = [];
    if (value || this.addressProvince) {
      await this.loadLocalities(this.addressProvince, value ?? undefined);
    }
  }

  async onLocalityChange(value: string | null): Promise<void> {
    this.addressLocality = value ?? '';
  }

  onNextFromStep1(): void {
    const errors = this.validateStep1();
    if (errors.length) {
      this.showValidationErrors(errors, 'Completa los datos del Paso I');
      return;
    }
    this.goToStep(2);
  }

  onNextFromStep2(): void {
    const errors = this.validateStep2();
    if (errors.length) {
      this.showValidationErrors(errors, 'Completa los datos del Paso II');
      return;
    }
    this.goToStep(3);
  }
}
