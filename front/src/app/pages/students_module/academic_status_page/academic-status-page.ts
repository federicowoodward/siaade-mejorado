import { Component } from '@angular/core';
import { AcademicStatusComponent } from './situacion-academica/academic-status.component';

@Component({
  standalone: true,
  imports: [AcademicStatusComponent],
  templateUrl: './academic-status-page.html',
  styleUrl: './academic-status-page.scss',
})
export class AcademicStatusPage {}
