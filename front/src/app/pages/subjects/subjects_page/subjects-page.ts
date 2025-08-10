import { Component } from '@angular/core';
import { SubjectTableComponent } from '../../../shared/components/subjects-table/subjects-table';

@Component({
  selector: 'app-subjects-page',
  imports: [SubjectTableComponent],
  templateUrl: './subjects-page.html',
  styleUrl: './subjects-page.scss',
})
export class SubjectsPage {}
