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

  isCreating = false;

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
      legajo:
        this.role === 'student'
          ? this.studentLegajo || this.cuil || this.documentValue
          : undefined,
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
      if (backendMsg) {
        detail = Array.isArray(backendMsg)
          ? backendMsg.join(' | ')
          : backendMsg;
      } else if ((err as any)?.status === 409) {
        detail = 'Datos duplicados. Revise email, CUIL o legajo.';
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
}
