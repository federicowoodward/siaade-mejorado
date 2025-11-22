import { Component } from '@angular/core';
import { MesasListComponent } from './mesas/mesas-list.component';

@Component({
  selector: 'app-enrollments-page',
  standalone: true,
  imports: [MesasListComponent],
  templateUrl: './enrollments-page.html',
  styleUrl: './enrollments-page.scss',
})
export class EnrollmentsPage {}
