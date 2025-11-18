import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { CareerCatalogService } from '../../../../core/services/career-catalog.service';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

type SubjectView = {
  id: number;
  subjectName: string;
  orderNo: number;
  prerequisites: number[];
};

@Component({
  selector: 'app-career-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ProgressSpinnerModule,
    ButtonModule,
    RouterLink,
    DividerModule,
    DialogModule,
    MultiSelectModule,
    ToastModule,
  ],
  templateUrl: './career-page.html',
  styleUrls: ['./career-page.scss'],
  providers: [MessageService],
})
export class CareerPage implements OnInit {
  private catalog = inject(CareerCatalogService);
  private router = inject(Router);
  private messages = inject(MessageService);

  private readonly careerId = 1;
  loading = signal(true);
  error = signal<string | null>(null);
  dialogVisible = signal(false);
  dialogSaving = signal(false);
  selectedSubject = signal<SubjectView | null>(null);
  dialogPrereqs = signal<number[]>([]);

  data = computed(() => ({
    career: this.catalog.career(),
    preceptor: this.catalog.preceptor(),
    academicPeriods: this.catalog.periods(),
  }));

  private subjectsFlat = computed<SubjectView[]>(() => {
    const periods = this.data().academicPeriods ?? [];
    return periods.flatMap((period: any) =>
      (period?.subjects ?? []).map((subject: any) => ({
        id: subject.id,
        subjectName: subject.subjectName,
        orderNo: subject.careerOrdering?.orderNo ?? 0,
        prerequisites: subject.prerequisites ?? [],
      })),
    );
  });

  prereqOptions = computed(() => {
    const subject = this.selectedSubject();
    if (!subject) return [];
    return this.subjectsFlat()
      .filter((s) => s.orderNo < subject.orderNo)
      .map((s) => ({
        label: `${s.orderNo} · ${s.subjectName}`,
        value: s.orderNo,
      }));
  });

  ngOnInit(): void {
    this.fetchCareer();
  }

  goBack() {
    this.router.navigate(['/subjects']);
  }

  openPrereqDialog(subject: any) {
    if (!subject) return;
    const draft: SubjectView = {
      id: subject.id,
      subjectName: subject.subjectName,
      orderNo: subject.careerOrdering?.orderNo ?? 0,
      prerequisites: [...(subject.prerequisites ?? [])],
    };
    this.selectedSubject.set(draft);
    this.dialogPrereqs.set([...draft.prerequisites]);
    this.dialogVisible.set(true);
  }

  closeDialog() {
    this.dialogVisible.set(false);
    this.dialogSaving.set(false);
    this.selectedSubject.set(null);
    this.dialogPrereqs.set([]);
  }

  onDialogVisibleChange(state: boolean) {
    if (state) {
      this.dialogVisible.set(true);
      return;
    }
    this.closeDialog();
  }

  get dialogPrereqsModel(): number[] {
    return this.dialogPrereqs();
  }

  set dialogPrereqsModel(value: number[]) {
    this.dialogPrereqs.set(value ?? []);
  }

  savePrereqs() {
    const subject = this.selectedSubject();
    if (!subject || this.dialogSaving()) return;
    this.dialogSaving.set(true);
    const payload = [...this.dialogPrereqs()].map((n) => Number(n));
    this.catalog
      .updateSubjectPrereqs(this.careerId, subject.orderNo, payload)
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Correlativas actualizadas',
            detail: subject.subjectName,
          });
          this.dialogSaving.set(false);
          this.closeDialog();
          this.fetchCareer({ force: true });
        },
        error: (err) => {
          console.error('Error guardando correlativas', err);
          const detail =
            err?.error?.message ??
            'No se pudieron guardar las correlativas. Intente nuevamente.';
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: Array.isArray(detail) ? detail.join(' | ') : detail,
          });
          this.dialogSaving.set(false);
        },
      });
  }

  private fetchCareer(options?: { force?: boolean }) {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.loadCareer(this.careerId, options).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        console.error(err);
        this.error.set('No se pudo cargar la carrera.');
        this.loading.set(false);
      },
    });
  }
}
