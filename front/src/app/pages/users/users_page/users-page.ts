import { Component } from '@angular/core';
import { UsersTableComponent } from '../../../shared/components/users-table/users-table.component';

@Component({
  selector: 'app-users-page',
  imports: [UsersTableComponent],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss'
})
export class UsersPage {

}
