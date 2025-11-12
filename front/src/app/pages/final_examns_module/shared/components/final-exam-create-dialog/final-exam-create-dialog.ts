import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
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
export class FinalExamCreateDialogComponent {
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

  private fetchAllSubjectsOnce() {
    if (this.subjectsLoaded) return;
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
      },
      error: () => {
        this.allSubjects.set([]);
        this.loadingSubjects.set(false);
        this.subjectsLoaded = true;
      },
    });
  }

  onSubjectsComplete(e: AutoCompleteCompleteEvent) {
    // Cargar una sola vez
    if (!this.subjectsLoaded) this.fetchAllSubjectsOnce();

    const q = (e.query ?? '').trim().toLowerCase();
    const source = this.allSubjects();

    if (!q) {
      // si no hay query, no devolvemos todo salvo que lo pida el dropdown
      this.subjectOptions.set([]);
      return;
    }

    const filtered = source.filter((o) => o.label.toLowerCase().includes(q));
    this.subjectOptions.set(filtered);
  }

  showAllSubjects() {
    // Asegura datos y muestra todo al abrir el dropdown
    if (!this.subjectsLoaded) this.fetchAllSubjectsOnce();
    this.subjectOptions.set(this.allSubjects());
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
