import { Component, inject } from '@angular/core';
import { UsersTableComponent } from '../../../shared/components/users-table/users-table.component';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-page',
  imports: [UsersTableComponent, Button],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage {
  private router = inject(Router);
  goToNewUser() {
    this.router.navigate(['users/create']);
  }
}
