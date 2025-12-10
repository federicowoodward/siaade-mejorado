import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { Button } from 'primeng/button';
import { cloneDeep } from 'lodash-es';
import { ApiService } from '../../../core/services/api.service';
import { FieldLabelPipe } from '../../pipes/field-label.pipe';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ArgentinaGeoService } from '../../services/argentina-geo.service';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    InputTextModule,
    IftaLabelModule,
    SelectModule,
    TagModule,
    Button,
  ],
  templateUrl: './personal-data-component.html',
  styleUrls: ['./personal-data-component.scss'],
})
export class PersonalDataComponent implements OnInit {
  private api = inject(ApiService);
  private geo = inject(ArgentinaGeoService);
  private readonly messages = inject(MessageService);
  private readonly permissions = inject(PermissionService);
  private readonly auth = inject(AuthService);

  /** Si no viene, usa el usuario logueado */
  @Input() userId!: string;
  /** Modo solo lectura (ej. vista docente sobre alumnos) */
  @Input() readOnly = false;

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

  // Modelo editable
  userData = signal<any>({});
  userInfo = signal<any>({});
  commonData = signal<any>({});
  addressData = signal<any>({});
  studentData = signal<any>({});
  activateInputs = signal(false);
  saving = signal(false);
  provinceOptions = signal<{ label: string; value: string }[]>([]);
  departmentOptions = signal<{ label: string; value: string }[]>([]);
  localityOptions = signal<{ label: string; value: string }[]>([]);
  private readonly roleLabels: Record<string, string> = {
    student: 'Alumno',
    teacher: 'Docente',
    preceptor: 'Preceptor',
    secretary: 'Secretario',
    executive_secretary: 'Secretario directivo',
  };

  // cambios
  original = signal<any>({});

  hasChanges(): boolean {
    const payload = this.buildChangesPayload();
    return Object.keys(payload).length > 0;
  }

  async ngOnInit(): Promise<void> {
    // 1) Determinar el ID a usar
    let id = this.userId;
    if (!id) {
      console.warn('[PersonalData] No hay userId ni usuario logueado.');
      return;
    }

    // 3) Si no hay cache, pedir al backend el perfil completo
    await this.loadProfileFromApi(id);
    this.snapshotOriginal();
    await this.initializeGeoSelectors();
  }

  // ---- Helpers de carga -----------------------------------------------------

  private async loadProfileFromApi(id: string): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.api.request<any>('GET', `users/${id}`),
      );
      const profile = this.unwrapData(resp);

      if (!profile) {
        console.warn('[PersonalData] Respuesta vacía para usuario', id, resp);
        return;
      }

      this.applyProfileToSignals(profile);
    } catch (e) {
      console.error('[PersonalData] Error cargando perfil', e);
    }
  }

  private unwrapData(resp: any): any {
    // Soporta: { data: {...} }, { data: { data: {...} } }, o payload plano
    if (!resp) return null;
    if (resp.data?.data) return resp.data.data;
    if (resp.data) return resp.data;
    return resp;
  }

  private applyProfileToSignals(profile: any) {
    // Perfil ejemplo que mostraste:
    // {
    //   id, name, lastName, email, cuil, role:{id,name},
    //   userInfo: {...} | null,
    //   commonData: { ... , address: {...} | null } | null
    // }
    const uData = {
      id: profile.id,
      name: profile.name ?? null,
      lastName: profile.lastName ?? null,
      email: profile.email ?? null,
      cuil: profile.cuil ?? null,
      role: profile.role?.name ?? null,
      roleId: profile.role?.id ?? null,
      isDirective: profile.isDirective ?? null, // por si vino (secretary)
    };

    const uInfo = profile.userInfo ?? {};
    const cData = profile.commonData ?? {};
    const aData = (profile.commonData?.address ?? {}) || {};
    const sData =
      profile.student ??
      profile.studentData ??
      profile.studentInfo ??
      (profile.students && profile.students[0]) ??
      {};

    this.userData.set(uData);
    this.userInfo.set(uInfo);
    this.commonData.set(cData);
    this.addressData.set(aData);
    this.studentData.set(sData);
  }

  private snapshotOriginal() {
    this.original.set({
      userData: cloneDeep(this.userData()),
      userInfo: cloneDeep(this.userInfo()),
      commonData: cloneDeep(this.commonData()),
      addressData: cloneDeep(this.addressData()),
      studentData: cloneDeep(this.studentData()),
    });
  }

  // ---- UI actions -----------------------------------------------------------

  restoreOriginal() {
    const original = this.original();
    this.userData.set(cloneDeep(original.userData));
    this.userInfo.set(cloneDeep(original.userInfo));
    this.commonData.set(cloneDeep(original.commonData));
    this.addressData.set(cloneDeep(original.addressData));
    this.activateInputs.set(false);
  }

  primaryActionLabel(): string {
    if (!this.activateInputs()) return 'Editar datos';
    return this.hasChanges() ? 'Guardar cambios' : 'Cancelar edición';
  }

  onPrimaryAction(): void {
    if (!this.activateInputs()) {
      this.activateInputs.set(true);
      return;
    }

    if (!this.hasChanges()) {
      this.restoreOriginal();
      return;
    }

    void this.submitChanges();
  }

  onRestoreClick(): void {
    if (!this.hasChanges()) return;
    this.restoreOriginal();
  }

  async submitChanges(): Promise<void> {
    const payload = this.buildChangesPayload();
    if (!Object.keys(payload).length) {
      this.messages.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'No encontramos modificaciones para guardar.',
        life: 4000,
      });
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.api.request<any>('PUT', `users/${this.userId}`, payload),
      );
      this.messages.add({
        severity: 'success',
        summary: 'Datos actualizados',
        detail: 'Guardamos tus datos personales correctamente.',
        life: 3500,
      });
      await this.loadProfileFromApi(this.userId);
      this.snapshotOriginal();
      await this.initializeGeoSelectors();
      this.activateInputs.set(false);
    } catch (error: any) {
      this.messages.add({
        severity: 'error',
        summary: 'No se pudo guardar',
        detail: this.resolveErrorMessage(error),
        sticky: false,
        life: 5000,
      });
    } finally {
      this.saving.set(false);
    }
  }

  initials(): string {
    const name = (this.userData().name || 'C').trim();
    const last = (this.userData().lastName || 'P').trim();
    return `${name.charAt(0) || 'C'}${last.charAt(0) || 'P'}`.toUpperCase();
  }

  displayCity(): string {
    return this.addressData().locality || 'Córdoba Capital';
  }

  displayRole(): string {
    const role = (this.userData().role || '').toLowerCase();
    return this.roleLabels[role] || (role ? role : 'Alumno');
  }

  async onProvinceChange(value: string | null): Promise<void> {
    this.addressData().province = value ?? '';
    this.addressData().neighborhood = '';
    this.addressData().locality = '';
    this.departmentOptions.set([]);
    this.localityOptions.set([]);
    if (value) {
      await this.loadDepartments(value);
    }
  }

  async onDepartmentChange(value: string | null): Promise<void> {
    this.addressData().neighborhood = value ?? '';
    this.addressData().locality = '';
    this.localityOptions.set([]);
    if (value || this.addressData().province) {
      await this.loadLocalities(
        this.addressData().province,
        value ?? undefined,
      );
    }
  }

  async onLocalityChange(value: string | null): Promise<void> {
    this.addressData().locality = value ?? '';
  }

  private async initializeGeoSelectors(): Promise<void> {
    await this.loadProvinces();
    const province = this.addressData().province;
    if (province) {
      await this.loadDepartments(province);
      const department = this.addressData().neighborhood;
      await this.loadLocalities(province, department || undefined);
    }
  }

  private async loadProvinces(): Promise<void> {
    try {
      const options = await firstValueFrom(this.geo.getProvinces());
      this.provinceOptions.set(options);
    } catch (error) {
      console.error('No se pudieron cargar provincias', error);
    }
  }

  private async loadDepartments(province: string): Promise<void> {
    try {
      const options = await firstValueFrom(this.geo.getDepartments(province));
      this.departmentOptions.set(options);
    } catch (error) {
      console.error('No se pudieron cargar departamentos', error);
      this.departmentOptions.set([]);
    }
  }

  private async loadLocalities(
    province: string,
    department?: string,
  ): Promise<void> {
    try {
      const options = await firstValueFrom(
        this.geo.getLocalities(province, department),
      );
      this.localityOptions.set(options);
    } catch (error) {
      console.error('No se pudieron cargar localidades', error);
      this.localityOptions.set([]);
    }
  }

  private buildChangesPayload(): Record<string, any> {
    const changes: Record<string, any> = {};
    const original = this.original();
    const assign = (key: string, current: any, previous: any): void => {
      const next = this.normalizeForPayload(current);
      const prev = this.normalizeForPayload(previous);
      if (next !== prev) {
        changes[key] = next;
      }
    };

    const user = this.userData();
    const origUser = original.userData ?? {};
    assign('name', user.name, origUser.name);
    assign('lastName', user.lastName, origUser.lastName);
    assign('email', user.email, origUser.email);
    assign('cuil', user.cuil, origUser.cuil);

    const info = this.userInfo();
    const origInfo = original.userInfo ?? {};
    assign('userInfo.documentType', info.documentType, origInfo.documentType);
    assign(
      'userInfo.documentValue',
      info.documentValue,
      origInfo.documentValue,
    );
    assign('userInfo.phone', info.phone, origInfo.phone);
    assign(
      'userInfo.emergencyName',
      info.emergencyName,
      origInfo.emergencyName,
    );
    assign(
      'userInfo.emergencyPhone',
      info.emergencyPhone,
      origInfo.emergencyPhone,
    );

    const common = this.commonData();
    const origCommon = original.commonData ?? {};
    assign('commonData.sex', common.sex, origCommon.sex);
    assign('commonData.birthDate', common.birthDate, origCommon.birthDate);

    const address = this.addressData();
    const origAddress = original.addressData ?? {};
    assign('commonData.address.street', address.street, origAddress.street);
    assign('commonData.address.number', address.number, origAddress.number);
    assign('commonData.address.floor', address.floor, origAddress.floor);
    assign(
      'commonData.address.apartment',
      address.apartment,
      origAddress.apartment,
    );
    assign(
      'commonData.address.neighborhood',
      address.neighborhood,
      origAddress.neighborhood,
    );
    assign(
      'commonData.address.locality',
      address.locality,
      origAddress.locality,
    );
    assign(
      'commonData.address.province',
      address.province,
      origAddress.province,
    );
    assign(
      'commonData.address.postalCode',
      address.postalCode,
      origAddress.postalCode,
    );

    const student = this.studentData();
    const origStudent = original.studentData ?? {};
    assign(
      'student.studentStartYear',
      student.studentStartYear,
      origStudent.studentStartYear,
    );

    return changes;
  }

  private normalizeForPayload(value: any): any {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    return value;
  }

  private resolveErrorMessage(error: any): string {
    const serverMessage = error?.error?.message ?? error?.message;
    if (Array.isArray(serverMessage)) {
      return serverMessage.join(' ');
    }
    if (typeof serverMessage === 'string' && serverMessage.trim().length) {
      return serverMessage;
    }
    return 'Intenta nuevamente en unos minutos.';
  }

  shouldShowAddress(): boolean {
    const isTeacher = this.permissions.hasAnyRole([ROLE.TEACHER]);
    if (!isTeacher) {
      return true;
    }

    const viewerId = this.auth.getUserId();
    const targetId = this.userId || null;
    const isSelf = !!viewerId && !!targetId && viewerId === targetId;
    if (isSelf) {
      return true;
    }

    const targetRole = String(this.userData().role || '').toLowerCase();
    const isStudent = targetRole === 'student';

    return !isStudent;
  }
}
