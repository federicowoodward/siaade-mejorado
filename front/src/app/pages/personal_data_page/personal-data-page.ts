import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputGroup } from 'primeng/inputgroup';
import { Button } from 'primeng/button';
import { cloneDeep, isEqual } from 'lodash';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-personal-data-page',
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
  ],
  templateUrl: './personal-data-page.html',
  styleUrls: ['./personal-data-page.scss'],
})
export class PersonalDataPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  value = 'value test';
  docTypes: MenuItem[] | undefined;

  // Modelo editable
  userData = signal<any>({});
  userInfo = signal<any>({});
  commonData = signal<any>({});
  addressData = signal<any>({});

  //cambios
  original = signal<any>({});
  showConfirmDialog = signal(false);
  modifiedFields = signal<string[]>([]);

  ngOnInit(): void {
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

    this.auth.getUser().subscribe((user) => {
      if (!user) return;

      this.userData.set(user);

      this.api.getById('user_info', user.id).subscribe((info) => {
        if (info) this.userInfo.set({ ...info });
      });

      this.api.getById('common_data', user.id).subscribe((common: any) => {
        if (common) {
          this.commonData.set({ ...common });

          this.api
            .getById('address_data', common.addressDataId)
            .subscribe((address) => {
              if (address) this.addressData.set({ ...address });

              // ✅ Guardar el estado original SOLO cuando todo fue cargado
              this.original.set({
                userData: cloneDeep(this.userData()),
                userInfo: cloneDeep(this.userInfo()),
                commonData: cloneDeep(this.commonData()),
                addressData: cloneDeep(this.addressData()),
              });
            });
        }
      });
    });
  }

  selectDocType(tipo: string) {
    this.userInfo.update((prev) => ({ ...prev, documentType: tipo }));
  }

  checkForChanges() {
    const changes: string[] = [];

    const compare = (section: any, original: any, pathPrefix = '') => {
      for (const key in section) {
        if (!isEqual(section[key], original[key])) {
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
    // TODO: enviar cambios con ApiService o mockear
    console.log('Guardado con:', {
      ...this.userData(),
      ...this.userInfo(),
      ...this.commonData(),
      ...this.addressData(),
    });
  }
}
