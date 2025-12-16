import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Stepper, StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TagModule } from 'primeng/tag';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';
import { GoBackService } from '../../../core/services/go_back.service';
import { ApiService } from '../../../core/services/api.service';
import { FieldLabelPipe } from '../../../shared/pipes/field-label.pipe';
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
import { ArgentinaGeoService } from '../../../shared/services/argentina-geo.service';
import { UiAlertAuditService } from '../../../core/services/ui-alert-audit.service';

type PreviewRow = { field: string; value: string };
type RoleOption = { label: string; value: UserRole };
type CreateUserFormModel = {
  role: UserRole | null;
  name: string;
  lastName: string;
  email: string;
  cuil: string;
  sex: string;
  birthDate: string;
  phone: string;
  emergencyName: string;
  emergencyPhone: string;
  addressStreet: string;
  addressNumber: string;
  addressProvince: string;
  addressNeighborhood: string;
  addressLocality: string;
  addressPostalCode: string;
  studentLegajo: string;
  studentStartYear: number | null;
  careerId: number | null;
  commissionId: number | null;
  teacherCommissionIds: number[];
  teacherSubjectIds: number[];
};

@Component({
  selector: 'app-create-user-page',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    ReactiveFormsModule,
    StepperModule,
    ButtonModule,
    InputTextModule,
    AutoCompleteModule,
    TooltipModule,
    SelectModule,
    MultiSelectModule,
    ToastModule,
    FieldLabelPipe,
    BlockedActionDirective,
    IftaLabelModule,
    TagModule,
  ],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.scss',
})
export class CreateUserPage implements OnInit {
  @ViewChild('stepper') stepper?: Stepper;

  private goBackSvc = inject(GoBackService);
  private api = inject(ApiService);
  private router = inject(Router);
  private geo = inject(ArgentinaGeoService);
  private messages = inject(MessageService);
  private uiAlertAudit = inject(UiAlertAuditService);
  private fb: FormBuilder = inject(FormBuilder);
  private permissions = inject(PermissionService);

  readonly minAgeYears = MIN_AGE_YEARS;

  isCreating = false;
  activeStep = 1;

  private readonly fieldLabels: Record<keyof CreateUserFormModel, string> = {
    role: 'Rol',
    name: 'Nombre',
    lastName: 'Apellido',
    email: 'Email',
    cuil: 'CUIL',
    sex: 'Sexo',
    birthDate: 'Fecha de nacimiento',
    phone: 'Teléfono',
    emergencyName: 'Nombre de emergencia',
    emergencyPhone: 'Teléfono de emergencia',
    addressStreet: 'Calle',
    addressNumber: 'Número',
    addressProvince: 'Provincia',
    addressNeighborhood: 'Departamento',
    addressLocality: 'Localidad',
    addressPostalCode: 'Código postal',
    studentLegajo: 'Legajo',
    studentStartYear: 'Año de inicio',
    careerId: 'Carrera',
    commissionId: 'Comision',
    teacherCommissionIds: 'Comisiones',
    teacherSubjectIds: 'Materias',
  };

  private birthDateValidator = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    if (!parseDateOnly(value))
      return { birthDate: 'Fecha de nacimiento inválida' };
    if (!hasMinAge(value, this.minAgeYears)) {
      return { birthDate: `Debe tener al menos ${this.minAgeYears} años.` };
    }
    return null;
  };

  private studentStartYearValidator = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const role = control.parent?.get('role')?.value as UserRole | null;
    if (role !== 'student') return null; // FIX: Only for students
    const raw = control.value;
    const birthDate = control.parent?.get('birthDate')?.value as string | null;

    if (raw === null || raw === undefined || raw === '') {
      return { startYear: 'Año de inicio es obligatorio.' };
    }
    // ... rest of validator logic ...
    const startYear = Number(raw);
    if (!birthDate) {
      return {
        startYear:
          'Completá la fecha de nacimiento para validar el año de inicio.',
      };
    }
    if (!parseDateOnly(birthDate))
      return { startYear: 'Fecha de nacimiento inválida' };
    if (!Number.isInteger(startYear)) {
      return { startYear: 'Ingresá un año de inicio válido.' };
    }
    if (startYear < MIN_START_YEAR || startYear > MAX_START_YEAR) {
      return {
        startYear: `El año de inicio debe estar entre ${MIN_START_YEAR} y ${MAX_START_YEAR}.`,
      };
    }
    if (!isValidStudentStartYear(birthDate, startYear, this.minAgeYears)) {
      return {
        startYear: `El año de inicio debe ser al menos ${this.minAgeYears} años posterior a la fecha de nacimiento.`,
      };
    }
    return null;
  };

  // ... (keep intervening code) ...

  async createUser(): Promise<void> {
    if (this.isCreating) return;

    // Check for invalid form
    if (this.form().invalid) {
      this.form().markAllAsTouched();

      // Robust Dynamic Navigation
      const firstInvalid = this.findFirstInvalidControl();
      if (firstInvalid) {
        const step = this.getStepForControl(firstInvalid);
        if (step) {
          this.goToStep(step);
          const label = this.fieldLabels[firstInvalid as keyof CreateUserFormModel] || firstInvalid;
          this.toastErr(`Verificá el campo: ${label}`);
          return;
        }
      }

      // Fallback if legacy getters catch something the loop didn't (unlikely) or if step not found
      if (this.isStep1Invalid) {
        this.goToStep(1);
        this.toastErr('Verificá los errores en el paso 1.');
        return;
      }
      if (this.isStep2Invalid) {
        this.goToStep(2);
        this.toastErr('Verificá los errores en el paso 2.');
        return;
      }
      if (this.hasAssignmentStep && this.isStep3Invalid) {
        this.goToStep(3);
        this.toastErr('Verificá los errores en el paso 3.');
        return;
      }

      this.toastErr('Revisa los datos obligatorios antes de continuar.');
      return;
    }

    const value = this.form().getRawValue();
    const role = value.role;
    const studentStartYear = this.normalizeStartYear(value.studentStartYear);
    if (!role) return;

    this.isCreating = true;
    // ...


    try {
      const { endpoint, payload } = buildPayload({
        base: {
          role,
          name: value.name ?? '',
          lastName: value.lastName ?? '',
          email: value.email ?? '',
          cuil: value.cuil ?? '',
        },
        userInfo: this.req?.needsUserInfo
          ? {
            phone: value.phone || undefined,
            emergencyName: value.emergencyName || undefined,
            emergencyPhone: value.emergencyPhone || undefined,
          }
          : undefined,
        commonData: this.req?.needsCommonData
          ? {
            sex: value.sex ?? '',
            birthDate: value.birthDate ?? '',
          }
          : undefined,
        address:
          this.req?.allowsAddress && this.hasAddress()
            ? this.addressObj()
            : undefined,
        studentLegajo:
          role === 'student'
            ? (value.studentLegajo || value.cuil || '').toString()
            : undefined,
        studentStartYear:
          role === 'student' && studentStartYear !== null
            ? studentStartYear
            : undefined,
        commissionId:
          role === 'student' && value.commissionId
            ? value.commissionId
            : undefined,
        careerId:
          role === 'student' && value.careerId ? value.careerId : undefined,
      });

      const created = await this.api.create(endpoint, payload).toPromise();
      console.log('Usuario creado:', created);

      if (role === 'teacher') {
        const teacherId: string | null =
          (created as any)?.teacher?.userId ??
          (created as any)?.user?.id ??
          null;
        const commissionIds = Array.isArray(value.teacherCommissionIds)
          ? value.teacherCommissionIds
          : [];
        const subjectIds = Array.isArray(value.teacherSubjectIds)
          ? value.teacherSubjectIds
          : [];

        if (teacherId && commissionIds.length && subjectIds.length) {
          try {
            await this.assignTeacherToSubjectsAndCommissions({
              teacherId,
              commissionIds,
              subjectIds,
            });
          } catch (assignErr) {
            console.error(
              'Docente creado, pero fall¢ la asignaci¢n de materias/comisiones',
              assignErr,
            );
            this.toastErr(
              'El docente fue creado, pero no se pudo asignar materias/comisiones.',
            );
          }
        }
      }

      this.toastOk('Usuario creado correctamente');
      setTimeout(() => this.router.navigate(['/users']), 700);
    } catch (err) {
      console.error('Error al crear usuario', err);
      const backendMsg = (err as any)?.error?.message;
      let detail = 'No se pudo crear el usuario. Verifique los datos.';
      if (backendMsg) {
        detail = Array.isArray(backendMsg)
          ? backendMsg.join(' | ')
          : backendMsg;
      } else if ((err as any)?.status === 409) {
        detail = 'Datos duplicados. Revise email, CUIL o legajo.';
      }
      this.setDuplicateErrorsFromDetail(detail, (err as any)?.status);
      if (this.control('email').hasError('duplicate')) {
        this.control('email').markAsTouched();
        this.goToStep(1);
      }
      if (this.control('cuil').hasError('duplicate')) {
        this.control('cuil').markAsTouched();
        this.goToStep(1);
      }
      if (this.control('studentLegajo').hasError('duplicate')) {
        this.control('studentLegajo').markAsTouched();
        this.goToStep(2);
      }

      this.toastErr(detail);
    } finally {
      this.isCreating = false;
    }
  }

  buildPreview() {
    const value = this.form().getRawValue();
    const role = value.role;
    const studentStartYear = this.normalizeStartYear(value.studentStartYear);
    return {
      user: {
        role,
        name: value.name ?? '',
        lastName: value.lastName ?? '',
        email: value.email ?? '',
        cuil: value.cuil ?? '',
        password: this.passwordPreview,
      },
      roleExtras:
        role === 'student'
          ? {
            legajo: (value.studentLegajo || value.cuil || '').toString(),
            studentStartYear: studentStartYear ?? undefined,
            career: this.selectedCareerLabel() || value.careerId || undefined,
            commission:
              this.selectedCommissionLabel(value.commissionId) ||
              value.commissionId ||
              undefined,
          }
          : role === 'teacher'
            ? {
              career:
                this.selectedCareerLabel() || value.careerId || undefined,
              commissions: this.selectedCommissionLabels(
                value.teacherCommissionIds,
              ),
              subjects: this.selectedTeacherSubjectLabels(
                value.teacherSubjectIds,
              ),
            }
            : role === 'secretary'
              ? { isDirective: true }
              : undefined,
      user_info: this.req?.needsUserInfo
        ? {
          phone: value.phone || undefined,
          emergencyName: value.emergencyName || undefined,
          emergencyPhone: value.emergencyPhone || undefined,
        }
        : undefined,
      common_data: this.req?.needsCommonData
        ? {
          sex: value.sex || undefined,
          birthDate: value.birthDate || undefined,
          address:
            this.req?.allowsAddress && this.hasAddress()
              ? this.addressObj()
              : undefined,
        }
        : undefined,
    };
  }

  displayPreviewValue(row: PreviewRow): string {
    if (!row) return '';
    if (row.field.endsWith('role')) {
      const match = this.roleOptions.find((o) => o.value === row.value);
      return match?.label ?? String(row.value ?? '');
    }
    if (
      row.field.includes('career') &&
      (this.roleValue === 'student' || this.roleValue === 'teacher')
    ) {
      return this.selectedCareerLabel() ?? String(row.value ?? '');
    }
    return String(row.value ?? '');
  }

  fieldKey(row: PreviewRow): string {
    if (!row?.field) return '';
    const parts = row.field.split('.');
    return parts.length ? parts[parts.length - 1] : row.field;
  }

  isPasswordField(row: PreviewRow): boolean {
    return this.fieldKey(row).toLowerCase().includes('password');
  }

  isCuilField(row: PreviewRow): boolean {
    return this.fieldKey(row).toLowerCase() === 'cuil';
  }

  maskCuil(value: string): string {
    if (!value) return '';
    const raw = String(value);
    if (raw.length <= 4) return '••••';
    const prefix = raw.slice(0, 4);
    const suffix = raw.slice(-2);
    const maskedLength = Math.max(
      3,
      raw.length - (prefix.length + suffix.length),
    );
    return `${prefix}${'•'.repeat(maskedLength)}${suffix}`;
  }

  rowsForSection(
    section: 'identity' | 'personal' | 'academic' | 'contact' | 'address',
  ): PreviewRow[] {
    const sectionMap: Record<
      'identity' | 'personal' | 'academic' | 'contact' | 'address',
      string[]
    > = {
      identity: ['role', 'email', 'cuil', 'password', 'isDirective'],
      personal: ['name', 'lastName', 'sex', 'birthDate'],
      academic: [
        'legajo',
        'studentStartYear',
        'career',
        'commission',
        'commissions',
        'subjects',
      ],
      contact: ['phone', 'emergencyName', 'emergencyPhone'],
      address: ['street', 'number', 'province', 'locality', 'postalCode'],
    };

    return this.previewRows.filter((row) => {
      const key = this.fieldKey(row);
      if (sectionMap[section].includes(key)) return true;

      if (section === 'address') {
        return row.field.includes('address.');
      }
      if (section === 'contact') {
        return row.field.startsWith('user_info.');
      }
      if (section === 'academic') {
        return row.field.startsWith('roleExtras.');
      }
      if (section === 'personal') {
        const isCommonData =
          row.field.startsWith('common_data.') &&
          !row.field.includes('address.');
        return isCommonData || ['name', 'lastName'].includes(key);
      }
      if (section === 'identity') {
        const isUserField = row.field.startsWith('user.');
        const isPersonalKey = sectionMap.personal.includes(key);
        return isUserField && !isPersonalKey;
      }
      return false;
    });
  }

  asList(value: string | null | undefined): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => !!v);
  }

  onProvinceChange(value: string | null): Promise<void> {
    this.form().patchValue(
      {
        addressProvince: value ?? '',
        addressNeighborhood: '',
        addressLocality: '',
      },
      { emitEvent: false },
    );
    this.departmentOptions = [];
    this.localityOptions = [];
    if (value) {
      return this.loadDepartments(value);
    }
    return Promise.resolve();
  }

  async onDepartmentChange(value: string | null): Promise<void> {
    this.form().patchValue(
      {
        addressNeighborhood: value ?? '',
        addressLocality: '',
      },
      { emitEvent: false },
    );
    this.localityOptions = [];
    if (value || this.control('addressProvince').value) {
      await this.loadLocalities(
        this.control('addressProvince').value ?? '',
        value ?? undefined,
      );
    }
  }

  onLocalityChange(value: string | null): void {
    this.control('addressLocality').setValue(value ?? '');
  }

  async ngOnInit(): Promise<void> {
    this.control('birthDate').valueChanges.subscribe(() =>
      this.control('studentStartYear').updateValueAndValidity({
        onlySelf: true,
      }),
    );
    this.control('role').valueChanges.subscribe((role) => {
      this.onRoleChange(role as UserRole | null);
    });

    this.control('careerId').valueChanges.subscribe((careerId) => {
      if (this.roleValue !== 'teacher') return;
      this.teacherSubjectOptions = [];
      this.teacherSubjectsLoadError = null;
      this.control('teacherSubjectIds').setValue([]);
      this.control('teacherSubjectIds').updateValueAndValidity({
        onlySelf: true,
      });
      const id = Number(careerId);
      if (Number.isFinite(id) && id > 0) {
        void this.loadTeacherSubjects(id);
      }
    });

    const provinceCtrl = this.control('addressProvince');
    const departmentCtrl = this.control('addressNeighborhood');
    const localityCtrl = this.control('addressLocality');

    departmentCtrl.disable({ emitEvent: false });
    localityCtrl.disable({ emitEvent: false });

    provinceCtrl.valueChanges.subscribe((province) => {
      const hasProvince = !!province;
      if (hasProvince) {
        departmentCtrl.enable({ emitEvent: false });
      } else {
        departmentCtrl.disable({ emitEvent: false });
        localityCtrl.disable({ emitEvent: false });
      }
    });

    departmentCtrl.valueChanges.subscribe((dept) => {
      const hasDept = !!dept;
      if (hasDept) {
        localityCtrl.enable({ emitEvent: false });
      } else {
        localityCtrl.disable({ emitEvent: false });
      }
    });

    if (provinceCtrl.value) {
      departmentCtrl.enable({ emitEvent: false });
    }
    if (departmentCtrl.value) {
      localityCtrl.enable({ emitEvent: false });
    }

    await this.initializeGeoSelectors();
  }

  private addressObj() {
    const value = this.form().getRawValue();
    return {
      street: value.addressStreet || undefined,
      number: value.addressNumber || undefined,
      locality: value.addressLocality || undefined,
      province: value.addressProvince || undefined,
      postalCode: value.addressPostalCode || undefined,
    };
  }

  get roleValue(): UserRole | null {
    return this.control('role').value;
  }

  private markControlsTouched(names: (keyof CreateUserFormModel)[]) {
    names.forEach((name) => {
      this.control(name).markAsTouched();
    });
  }

  private anyInvalid(names: (keyof CreateUserFormModel)[]): boolean {
    if (!names.length) return false;
    return names.some((n) => this.control(n).invalid);
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

  private setDuplicateErrorsFromDetail(detail: string, status?: number): void {
    const lower = (detail || '').toLowerCase();

    // Email
    if (
      lower.includes('email') ||
      lower.includes('correo') ||
      lower.includes('mail')
    ) {
      this.setServerError(
        this.control('email'),
        'El email ya está registrado.',
      );
    }

    // CUIL
    if (lower.includes('cuil') && (lower.includes('ya') || lower.includes('registrad') || lower.includes('duplicad'))) {
      this.setServerError(this.control('cuil'), 'El CUIL ya está registrado.');
    }

    // Legajo
    if (lower.includes('legajo') && (lower.includes('ya') || lower.includes('registrad') || lower.includes('duplicad'))) {
      this.setServerError(this.control('studentLegajo'), 'El legajo ya está registrado.');
    }

    // Generic 409 fallback
    if (status === 409 && !this.control('email').hasError('duplicate') && !this.control('cuil').hasError('duplicate') && !this.control('studentLegajo').hasError('duplicate')) {
      // Si es 409 y no pudimos parsear nada especifico, flagamos campos comunes
      if (lower.includes('email') || !lower) this.setServerError(this.control('email'), 'El email podría estar duplicado.');
      if (lower.includes('cuil') || !lower) this.setServerError(this.control('cuil'), 'El CUIL podría estar duplicado.');
      if (lower.includes('legajo')) this.setServerError(this.control('studentLegajo'), 'El legajo podría estar duplicado.');
    }
  }

  private setServerError(ctrl: AbstractControl, message: string) {
    const errors = { ...(ctrl.errors ?? {}) };
    errors['duplicate'] = message;
    ctrl.setErrors(errors);
  }

  private selectedCareerLabel(): string | null {
    const careerId = this.control('careerId').value;
    const match = this.careerOptions.find((opt) => opt.value === careerId);
    return match?.label ?? null;
  }

  private selectedCommissionLabel(commissionId: number | null): string | null {
    if (!commissionId) return null;
    const match = this.commissionOptions.find(
      (opt) => opt.value === commissionId,
    );
    return match?.label ?? null;
  }

  private selectedCommissionLabels(ids: unknown): string[] | undefined {
    const list = Array.isArray(ids) ? (ids as number[]) : [];
    const labels = list
      .map((id) => this.selectedCommissionLabel(id) ?? String(id))
      .filter((v) => !!v);
    return labels.length ? labels : undefined;
  }

  private selectedTeacherSubjectLabels(ids: unknown): string[] | undefined {
    const list = Array.isArray(ids) ? (ids as number[]) : [];
    const labels = list
      .map((id) => {
        const match = this.teacherSubjectOptions.find((o) => o.value === id);
        return match?.label ?? String(id);
      })
      .filter((v) => !!v);
    return labels.length ? labels : undefined;
  }

  private async initializeGeoSelectors(): Promise<void> {
    await this.loadProvinces();
    const province = this.control('addressProvince').value;
    if (province) {
      await this.loadDepartments(province);
      const department = this.control('addressNeighborhood').value || undefined;
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

  private async ensureCareerOptions(): Promise<void> {
    if (!this.hasAssignmentStep || this.careerOptions.length) return;
    this.careerLoading = true;
    this.careerLoadError = null;
    this.control('careerId').setErrors(null);
    try {
      const resp = await firstValueFrom(
        this.api.request<{ data: any[] }>(
          'GET',
          'catalogs/careers',
          undefined,
          { limit: 200 },
          undefined,
          false,
        ),
      );
      const rows = (resp as any)?.data ?? resp ?? [];
      this.careerOptions = (rows as any[]).map((c) => ({
        label: c.careerName || c.name || `Carrera ${c.id}`,
        value: c.id,
      }));
      this.control('careerId').setErrors(null);
      this.control('careerId').updateValueAndValidity({ onlySelf: true });
    } catch (error) {
      console.error('No se pudieron cargar carreras', error);
      this.careerLoadError =
        'No se pudieron cargar las carreras disponibles. Intenta nuevamente.';
      this.control('careerId').setErrors({
        ...(this.control('careerId').errors ?? {}),
        careerLoad: this.careerLoadError,
      });
    } finally {
      this.careerLoading = false;
    }
  }

  private async ensureCommissionOptions(): Promise<void> {
    if (!this.hasAssignmentStep || this.commissionOptions.length) return;
    this.commissionLoading = true;
    this.commissionLoadError = null;

    this.control('commissionId').setErrors(null);
    this.control('teacherCommissionIds').setErrors(null);

    try {
      const resp = await firstValueFrom(
        this.api.request<{ data: any[] }>(
          'GET',
          'catalogs/commissions',
          undefined,
          { limit: 200 },
          undefined,
          false,
        ),
      );

      const rows = (resp as any)?.data ?? resp ?? [];
      this.commissionOptions = (rows as any[]).map((c) => {
        const letter = (c?.commissionLetter ?? '').toString();
        const label = letter ? `Comision ${letter}` : `Comision ${c?.id}`;
        return { label, value: Number(c.id) };
      });

      this.control('commissionId').setErrors(null);
      this.control('teacherCommissionIds').setErrors(null);
      this.control('commissionId').updateValueAndValidity({ onlySelf: true });
      this.control('teacherCommissionIds').updateValueAndValidity({
        onlySelf: true,
      });
    } catch (error) {
      console.error('No se pudieron cargar comisiones', error);
      this.commissionLoadError =
        'No se pudieron cargar las comisiones disponibles. Intenta nuevamente.';

      for (const ctrl of [
        this.control('commissionId'),
        this.control('teacherCommissionIds'),
      ]) {
        ctrl.setErrors({
          ...(ctrl.errors ?? {}),
          commissionLoad: this.commissionLoadError,
        });
      }
    } finally {
      this.commissionLoading = false;
    }
  }

  private async loadTeacherSubjects(careerId: number): Promise<void> {
    if (!careerId || this.roleValue !== 'teacher') return;
    this.teacherSubjectsLoading = true;
    this.teacherSubjectsLoadError = null;
    this.control('teacherSubjectIds').setErrors(null);

    try {
      const resp = await firstValueFrom(
        this.api.request<any>(
          'GET',
          `catalogs/career-full-data/${careerId}`,
          undefined,
          undefined,
          undefined,
          true,
        ),
      );

      const periods = (resp as any)?.academicPeriods ?? [];
      const options: { label: string; value: number }[] = [];
      for (const p of periods) {
        const subjects = p?.subjects ?? [];
        for (const s of subjects) {
          const yearNo = s?.careerOrdering?.yearNo;
          const yearLabel =
            yearNo !== null && yearNo !== undefined ? `Año ${yearNo} - ` : '';
          const name = s?.subjectName ?? `Materia ${s?.id}`;
          options.push({ label: `${yearLabel}${name}`, value: Number(s.id) });
        }
      }

      const seen = new Set<number>();
      this.teacherSubjectOptions = options.filter((o) => {
        if (seen.has(o.value)) return false;
        seen.add(o.value);
        return true;
      });

      this.control('teacherSubjectIds').setErrors(null);
      this.control('teacherSubjectIds').updateValueAndValidity({
        onlySelf: true,
      });
    } catch (error) {
      console.error('No se pudieron cargar materias para la carrera', error);
      this.teacherSubjectsLoadError =
        'No se pudieron cargar las materias para la carrera seleccionada.';
      this.control('teacherSubjectIds').setErrors({
        ...(this.control('teacherSubjectIds').errors ?? {}),
        teacherSubjectsLoad: this.teacherSubjectsLoadError,
      });
    } finally {
      this.teacherSubjectsLoading = false;
    }
  }

  private async assignTeacherToSubjectsAndCommissions(args: {
    teacherId: string;
    commissionIds: number[];
    subjectIds: number[];
  }): Promise<void> {
    const { teacherId, commissionIds, subjectIds } = args;
    if (!teacherId || !commissionIds?.length || !subjectIds?.length) return;

    const commissionResponses = await Promise.all(
      commissionIds.map((commissionId) =>
        firstValueFrom(
          this.api.request<any>(
            'GET',
            `catalogs/subject-commissions/${commissionId}`,
            undefined,
            undefined,
            undefined,
            true,
          ),
        ),
      ),
    );

    const subjectCommissionIds: number[] = [];
    for (const resp of commissionResponses) {
      const subjects = (resp as any)?.subjects ?? [];
      const map = new Map<number, number>();
      for (const row of subjects) {
        const sid = Number(row?.subject?.id);
        const scid = Number(row?.subjectCommissionId);
        if (Number.isFinite(sid) && Number.isFinite(scid)) {
          map.set(sid, scid);
        }
      }
      for (const subjectId of subjectIds) {
        const scid = map.get(Number(subjectId));
        if (scid) subjectCommissionIds.push(scid);
      }
    }

    const unique = Array.from(new Set(subjectCommissionIds));
    if (!unique.length) return;

    const batchSize = 6;
    for (let i = 0; i < unique.length; i += batchSize) {
      const batch = unique.slice(i, i + batchSize);
      await Promise.all(
        batch.map((id) =>
          firstValueFrom(
            this.api.request('PATCH', `subject-commissions/${id}/teacher`, {
              teacherId,
            }),
          ),
        ),
      );
    }
  }

  private normalizeStartYear(raw: any): number | null {
    if (raw === null || raw === undefined || raw === '') return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private careerIdReset() {
    this.control('careerId').setValue(null);
  }

  private findFirstInvalidControl(): string | null {
    const controls = this.form().controls;
    for (const name in controls) {
      if (controls[name as keyof CreateUserFormModel].invalid) {
        return name;
      }
    }
    return null;
  }

  private getStepForControl(name: string): number | null {
    // Step 1: Basic Identity + Personal Data (Role, Name, Email, CUIL, Sex, BirthDate)
    const step1Fields = [
      'role',
      'name',
      'lastName',
      'email',
      'cuil',
      'sex',
      'birthDate',
    ];
    if (step1Fields.includes(name)) return 1;

    // Step 2: Contact, Address, Student Start Year/Legajo
    const step2Fields = [
      'phone',
      'emergencyName',
      'emergencyPhone',
      'addressStreet',
      'addressNumber',
      'addressProvince',
      'addressNeighborhood',
      'addressLocality',
      'addressPostalCode',
      'studentLegajo',
      'studentStartYear',
    ];
    if (step2Fields.includes(name)) return 2;

    // Step 3: Assignments
    const step3Fields = [
      'careerId',
      'commissionId',
      'teacherCommissionIds',
      'teacherSubjectIds',
    ];
    if (step3Fields.includes(name)) return 3;

    return null;
  }
}
