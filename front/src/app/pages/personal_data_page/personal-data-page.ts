import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PersonalDataComponent } from '../../shared/components/personal_data/personal-data-component';
import { ChangePasswordCard } from '../../shared/components/change_password/change-password-card';

@Component({
  selector: 'app-personal-data-page',
  standalone: true,
  imports: [CommonModule, PersonalDataComponent, ChangePasswordCard],
  templateUrl: './personal-data-page.html',
  styleUrls: ['./personal-data-page.scss'],
})
export class PersonalDataPage {
  private auth = inject(AuthService);
  userId: string | null = null;

  constructor() {
    this.auth.getUser().subscribe((user) => {
      if (user) {
        this.userId = user.id;
      }
    });
  }
}
