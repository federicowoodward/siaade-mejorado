import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectTableComponent } from '../../../shared/components/subjects-table/subjects-table';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';

@Component({
  selector: 'app-subjects-page',
  standalone: true,
  imports: [CommonModule, AppBreadcrumbComponent, SubjectTableComponent, Button],
  templateUrl: './subjects-page.html',
  styleUrl: './subjects-page.scss',
})
export class SubjectsPage {
  private router = inject(Router);

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Gestión de materias', routerLink: '/subjects' },
    { label: 'Listado de materias' },
  ];

  goToNewSubject() {
    this.router.navigate(['subjects/new']);
  }
  goToCareerInfo() {
    this.router.navigate(['subjects/career-data']);
  }
}
