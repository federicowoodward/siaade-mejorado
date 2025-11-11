import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PersonalDataComponent } from '../../shared/components/personal_data/personal-data-component';

@Component({
  selector: 'app-personal-data-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PersonalDataComponent],
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
