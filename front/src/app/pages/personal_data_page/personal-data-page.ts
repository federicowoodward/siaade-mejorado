import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-personal-data-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-data-page.html',
  styleUrls: ['./personal-data-page.scss'],
})
export class PersonalDataPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  // Modelo editable
  userData = signal<any>({});
  userInfo = signal<any>({});
  commonData = signal<any>({});
  addressData = signal<any>({});

  ngOnInit(): void {
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
            });
        }
      });
    });
  }
}
