import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputGroup } from 'primeng/inputgroup';
import { Button } from 'primeng/button';
import { cloneDeep, isEqual } from 'lodash-es';
import { Dialog } from 'primeng/dialog';
import { ApiService } from '../../../core/services/api.service';
import { FieldLabelPipe } from '../../pipes/field-label.pipe';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    IftaLabelModule,
    Menu,
    InputGroupAddonModule,
    InputGroup,
    Button,
    Dialog,
    FieldLabelPipe,
    ToggleButtonModule,
  ],
  templateUrl: './personal-data-component.html',
  styleUrls: ['./personal-data-component.scss'],
})
export class PersonalDataComponent implements OnInit {
  private api = inject(ApiService);

  /** Si no viene, usa el usuario logueado */
  @Input() userId!: string;

  docTypes: MenuItem[] | undefined;

  // Modelo editable
  userData = signal<any>({});
  userInfo = signal<any>({});
  commonData = signal<any>({});
  addressData = signal<any>({});
  activateInputs = signal(false);

  // cambios
  original = signal<any>({});
  showConfirmDialog = signal(false);
  modifiedFields = signal<string[]>([]);

  async ngOnInit(): Promise<void> {
    this.docTypes = [
      { label: 'DNI', command: () => this.selectDocType('DNI') },
      { label: 'Pasaporte', command: () => this.selectDocType('Pasaporte') },
      { label: 'CUIT', command: () => this.selectDocType('CUIT') },
      {
        label: 'Libreta Cívica',
        command: () => this.selectDocType('Libreta Cívica'),
      },
      {
        label: 'Libreta de Enrolamiento',
        command: () => this.selectDocType('Libreta de Enrolamiento'),
      },
    ];

    // 1) Determinar el ID a usar
    let id = this.userId;
    if (!id) {
      console.warn('[PersonalData] No hay userId ni usuario logueado.');
      return;
    }

    // 3) Si no hay cache, pedir al backend el perfil completo
    await this.loadProfileFromApi(id);
    this.snapshotOriginal();
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

    this.userData.set(uData);
    this.userInfo.set(uInfo);
    this.commonData.set(cData);
    this.addressData.set(aData);
  }

  private snapshotOriginal() {
    this.original.set({
      userData: cloneDeep(this.userData()),
      userInfo: cloneDeep(this.userInfo()),
      commonData: cloneDeep(this.commonData()),
      addressData: cloneDeep(this.addressData()),
    });
  }

  // ---- UI actions -----------------------------------------------------------

  selectDocType(tipo: string) {
    this.userInfo.update((prev) => ({ ...prev, documentType: tipo }));
  }

  checkForChanges() {
    const changes: string[] = [];
    const compare = (section: any, original: any, pathPrefix = '') => {
      const keys = new Set<string>([
        ...Object.keys(section || {}),
        ...Object.keys(original || {}),
      ]);
      for (const key of keys) {
        if (!isEqual(section?.[key], original?.[key])) {
          changes.push(`${pathPrefix}${key}`);
        }
      }
    };

    compare(this.userData(), this.original().userData, '');
    compare(this.userInfo(), this.original().userInfo, '');
    compare(this.commonData(), this.original().commonData, '');
    compare(this.addressData(), this.original().addressData, 'Domicilio: ');

    this.modifiedFields.set(changes);
    this.showConfirmDialog.set(true);
  }

  restoreOriginal() {
    const original = this.original();
    this.userData.set(cloneDeep(original.userData));
    this.userInfo.set(cloneDeep(original.userInfo));
    this.commonData.set(cloneDeep(original.commonData));
    this.addressData.set(cloneDeep(original.addressData));
  }

  submitChanges() {
    this.showConfirmDialog.set(false);
    // Para guardar, armás el payload que te pida tu endpoint de update
    const payload = {
      user: this.userData(),
      userInfo: this.userInfo(),
      commonData: {
        ...this.commonData(),
        address: this.addressData(),
      },
    };
    console.log('[PersonalData] Guardar con payload:', payload);
    // TODO: this.api.request('PUT', 'users/:id', payload) cuando esté listo el endpoint
  }
}
