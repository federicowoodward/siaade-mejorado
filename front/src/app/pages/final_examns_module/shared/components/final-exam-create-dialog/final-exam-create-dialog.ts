import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../../../core/services/api.service';
import { Subject } from '../../../../../core/models/subject.model';
import { toHM, toYMD } from '../../utils/datetime.util';

type SubjectOption = { label: string; value: number };

@Component({
  selector: 'app-final-exam-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    Button,
    TooltipModule,
    AutoCompleteModule,
    DatePicker,
  ],
  templateUrl: './final-exam-create-dialog.html',
  styleUrls: ['./final-exam-create-dialog.scss'],
  providers: [MessageService],
})
export class FinalExamCreateDialogComponent implements OnChanges {
  private api = inject(ApiService);
  private messages = inject(MessageService);

  // Control de visibilidad y límites de fecha que te pasa el padre
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;

  // Resultado al confirmar
  @Output() submit = new EventEmitter<{
    subject_id: number;
    exam_date: string;
    exam_time?: string;
    aula?: string;
  }>();

  // Modelo del form
  selectedSubject: SubjectOption | null = null;
  dateTime: Date | null = null;
  aula = '';

  // Opciones de materias
  allSubjects = signal<SubjectOption[]>([]);
  subjectOptions = signal<SubjectOption[]>([]);
  loadingSubjects = signal<boolean>(false);

  private subjectsLoaded = false;
  private dropdownOpen = false;
  private loadingInProgress = false;

  private fetchAllSubjectsOnce(updateOptions = false) {
    if (this.subjectsLoaded) {
      if (updateOptions) {
        const subjects = this.allSubjects();
        this.subjectOptions.set([...subjects]);
      }
      return;
    }
    if (this.loadingInProgress) {
      if (updateOptions) {
        this.dropdownOpen = true;
      }
      return;
    }
    this.loadingInProgress = true;
    this.loadingSubjects.set(true);
    this.api.getAll<Subject>('subjects/read').subscribe({
      next: (subjects) => {
        const opts = (subjects ?? [])
          .filter((s) => s?.id != null && !!s.subjectName)
          .map(
            (s) =>
              ({ label: s.subjectName, value: Number(s.id) }) as SubjectOption,
          );

        this.allSubjects.set(opts);
        this.subjectsLoaded = true;
        this.loadingSubjects.set(false);
        this.loadingInProgress = false;
        if (updateOptions || this.dropdownOpen) {
          this.subjectOptions.set([...opts]);
        }
      },
      error: (err) => {
        console.error('Error al cargar materias:', err);
        this.allSubjects.set([]);
        this.loadingSubjects.set(false);
        this.loadingInProgress = false;
        this.subjectsLoaded = true;
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'No se pudieron cargar las materias. Por favor, intenta nuevamente.',
        });
      },
    });
  }

  onSubjectsComplete(e: AutoCompleteCompleteEvent) {
    if (!this.subjectsLoaded && !this.loadingInProgress) {
      this.fetchAllSubjectsOnce();
    }

    const q = (e.query ?? '').trim().toLowerCase();
    const source = this.allSubjects();

    if (!q) {
      if (this.dropdownOpen && source.length > 0) {
        this.subjectOptions.set(source);
      } else {
        this.subjectOptions.set([]);
      }
      return;
    }

    const filtered = source.filter((o) => o.label.toLowerCase().includes(q));
    this.subjectOptions.set(filtered);
  }

  showAllSubjects() {
    this.dropdownOpen = true;
    if (this.subjectsLoaded) {
      this.loadingSubjects.set(false);
      this.loadingInProgress = false;
      const subjects = this.allSubjects();
      if (subjects.length > 0) {
        this.subjectOptions.set([...subjects]);
      }
    } else {
      if (!this.loadingInProgress) {
        this.fetchAllSubjectsOnce(true);
      }
    }
  }

  onDropdownClose() {
    this.dropdownOpen = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && changes['visible'].currentValue) {
      if (!this.subjectsLoaded && !this.loadingInProgress) {
        this.fetchAllSubjectsOnce();
      }
    }
    if (changes['visible'] && !changes['visible'].currentValue) {
      this.dropdownOpen = false;
      this.subjectOptions.set([]);
      this.selectedSubject = null;
      this.dateTime = null;
      this.aula = '';
    }
  }

  onCancel() {
    this.visibleChange.emit(false);
  }

  onConfirm() {
    const subj = this.selectedSubject?.value ?? null;
    const dt = this.dateTime;

    if (!subj || !dt) {
      this.messages.add({
        severity: 'warn',
        summary: 'Falta completar',
        detail: 'Elegí una materia y una fecha/hora.',
      });
      return;
    }

    this.submit.emit({
      subject_id: subj,
      exam_date: toYMD(dt),
      exam_time: toHM(dt),
      aula: this.aula || undefined,
    });
  }
}
