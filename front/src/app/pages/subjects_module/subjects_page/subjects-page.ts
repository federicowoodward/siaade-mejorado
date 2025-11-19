import { Component, inject } from '@angular/core';
import { SubjectTableComponent } from '../../../shared/components/subjects-table/subjects-table';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subjects-page',
  imports: [SubjectTableComponent, Button],
  templateUrl: './subjects-page.html',
  styleUrl: './subjects-page.scss',
})
export class SubjectsPage {
  private router = inject(Router);
  goToNewSubject() {
    this.router.navigate(['subjects/new']);
  }
  goToCareerInfo() {
    this.router.navigate(['subjects/career-data']);
  }
}
