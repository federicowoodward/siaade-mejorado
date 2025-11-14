import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { StudentSubjectCard, StudentSubjectNote } from '../../../core/services/student-status.service';

@Component({
  selector: 'app-subject-status-detail',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    TagModule,
  ],
  templateUrl: './subject-status-detail.component.html',
  styleUrl: './subject-status-detail.component.scss',
})
export class SubjectStatusDetailComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @Input() subject: StudentSubjectCard | null = null;
  @Input() studentName: string | null = null;

  handleHide(): void {
    this.visibleChange.emit(false);
    this.closed.emit();
  }

  stateSeverity(
    condition: string | null,
  ): 'success' | 'info' | 'danger' | 'warning' {
    if (!condition) return 'warning';
    const value = condition.toLowerCase();
    if (value.includes('promo') || value.includes('apro')) return 'success';
    if (value.includes('regular')) return 'info';
    if (value.includes('libre')) return 'danger';
    return 'warning';
  }

  trackNote(_: number, note: StudentSubjectNote): string {
    return note.label;
  }
}
