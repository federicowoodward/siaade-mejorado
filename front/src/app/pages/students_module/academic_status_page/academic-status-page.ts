import { Component } from '@angular/core';
import { AcademicStatus } from '../../../shared/components/academic_status/academic-status-component';

@Component({
  imports: [AcademicStatus],
  templateUrl: './academic-status-page.html',
  styleUrl: './academic-status-page.scss',
})
export class AcademicStatusPage {}
