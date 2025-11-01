import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TableModule, Table } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { ToastModule } from "primeng/toast";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { MessageService } from "primeng/api";
import { Subscription } from "rxjs";

import { GoBackService } from "../../../core/services/go_back.service";
import { SubjectsService } from "../../../core/services/subjects.service";
import {
  AcademicSituationApiResponse,
  AcademicSituationRow,
} from "./subject-academic-situation.types";
import { GradeRow } from "./grades.types";

@Component({
  selector: "app-subject-academic-situation-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  templateUrl: "./subject-academic-situation.page.html",
  styleUrl: "./subject-academic-situation.page.scss",
  providers: [MessageService],
})
export class SubjectAcademicSituationPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly goBackSvc = inject(GoBackService);
  private readonly subjectsSvc = inject(SubjectsService);
  private readonly messages = inject(MessageService);

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<AcademicSituationApiResponse | null>(null);

  readonly searchTerm = signal("");
  readonly selectedCommission = signal<number>(0);

  private filtersInitialized = false;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private currentFetch: Subscription | null = null;
  private currentPatch: Subscription | null = null;

  subjectId = Number(this.route.snapshot.paramMap.get("subjectId") ?? 0);
  subjectName = computed(() => this.data()?.subject.name ?? "Materia");
  partials = computed(() => this.data()?.subject.partials ?? 2);
  rows = computed(() => this.data()?.rows ?? []);

  commissionOptions = computed(() => {
    const base = this.data()?.commissions ?? [];
    return [
      { id: 0, letter: "Todas" as string | null },
      ...base.map((entry) => ({
        id: entry.id,
        letter: entry.letter ?? null,
      })),
    ];
  });

  commissionSelectItems = computed(() =>
    this.commissionOptions().map((option) => ({
      label: option.letter ?? `Comision ${option.id}`,
      value: option.id,
    }))
  );

  private readonly filtersEffect = effect(() => {
    const q = this.searchTerm();
    const commissionId = this.selectedCommission();
    if (!this.filtersInitialized) {
      this.filtersInitialized = true;
      return;
    }
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
    }
    this.debounceHandle = setTimeout(() => {
      this.fetchAcademicSituation({
        q: q.trim() ? q.trim() : undefined,
        commissionId: commissionId > 0 ? commissionId : undefined,
      });
    }, 300);
  });

  ngOnInit(): void {
    this.fetchAcademicSituation();
  }

  ngOnDestroy(): void {
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = null;
    }
    this.currentFetch?.unsubscribe();
    this.currentPatch?.unsubscribe();
    this.filtersEffect.destroy();
  }

  back(): void {
    this.goBackSvc.back();
  }

  rowsTrackBy(_: number, item: AcademicSituationRow): string {
    return item.studentId;
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value ?? "");
  }

  onCommissionChange(value: number | null | undefined): void {
    this.selectedCommission.set(value ?? 0);
  }

  clearFilters(table?: Table): void {
    table?.reset();
    this.searchTerm.set("");
    this.selectedCommission.set(0);
  }

  onCellEditComplete(event: GradeCellEditEvent): void {
    const field = event.field as keyof AcademicSituationRow | undefined;
    const row = event.data;
    if (!field || !row || !row.studentId) {
      return;
    }

    if (!this.isEditableField(field)) {
      return;
    }

    const previousValue = event.oldValue as number | null | undefined;
    const parsed = this.parseGradeValue(event.newValue);

    if (parsed === undefined) {
      row[field] = previousValue ?? null;
      this.showError(
        "Valores inválidos",
        "Las notas deben ser numéricas entre 0 y 10."
      );
      this.syncRowFromRow(row);
      return;
    }

    row[field] = parsed;

    this.currentPatch?.unsubscribe();
    this.currentPatch = this.subjectsSvc
      .patchGrade(this.subjectId, row.studentId, { [field]: parsed })
      .subscribe({
        next: (updated) => {
          this.currentPatch = null;
          this.syncRow(updated);
          this.messages.add({
            severity: "success",
            summary: "Nota guardada",
            detail: "La nota se actualizó correctamente.",
          });
        },
        error: () => {
          this.currentPatch = null;
          row[field] = previousValue ?? null;
          this.syncRowFromRow(row);
          this.showError(
            "Error al guardar",
            "No se pudo actualizar la nota. Intente nuevamente."
          );
        },
      });
  }

  finalClass(score: number | null): string {
    if (score === null || score === undefined) return "";
    if (this.isGradePromoted(score)) return "nota-promocionada";
    if (this.isGradeApproved(score)) return "nota-aprobada";
    if (this.isGradeDisapproved(score)) return "nota-desaprobada";
    return "";
  }

  private fetchAcademicSituation(params?: {
    q?: string;
    commissionId?: number;
  }): void {
    this.loading.set(true);
    this.error.set(null);
    this.currentFetch?.unsubscribe();
    this.currentFetch = this.subjectsSvc
      .getSubjectAcademicSituation(this.subjectId, params)
      .subscribe({
        next: (payload) => {
          this.currentFetch = null;
          this.data.set(payload);
          this.loading.set(false);
        },
        error: () => {
          this.currentFetch = null;
          this.error.set("No se pudo cargar la situacion academica.");
          this.loading.set(false);
        },
      });
  }

  private syncRow(updated: GradeRow): void {
    this.data.update((snapshot) => {
      if (!snapshot) {
        return snapshot;
      }
      return {
        ...snapshot,
        rows: snapshot.rows.map((row) =>
          row.studentId === updated.studentId
            ? {
                ...row,
                fullName: updated.fullName,
                legajo: updated.legajo,
                note1: updated.note1,
                note2: updated.note2,
                note3: updated.note3,
                note4: updated.note4,
                final: updated.final,
                attendancePercentage: updated.attendancePercentage,
                condition: updated.condition,
              }
            : row
        ),
      };
    });
  }

  private syncRowFromRow(updated: AcademicSituationRow): void {
    this.data.update((snapshot) => {
      if (!snapshot) {
        return snapshot;
      }
      return {
        ...snapshot,
        rows: snapshot.rows.map((row) =>
          row.studentId === updated.studentId ? { ...row, ...updated } : row
        ),
      };
    });
  }

  private parseGradeValue(value: unknown): number | null | undefined {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > 10) {
      return undefined;
    }
    return numeric;
  }

  private isEditableField(
    field: keyof AcademicSituationRow
  ): field is EditableField {
    return editableFields.has(field as EditableField);
  }

  private isGradeApproved(score: number | null): boolean {
    return score !== null && score >= 4 && score < 7;
  }

  private isGradePromoted(score: number | null): boolean {
    return score !== null && score >= 7;
  }

  private isGradeDisapproved(score: number | null): boolean {
    return score !== null && score < 4;
  }

  private showError(summary: string, detail: string): void {
    this.messages.add({
      severity: "error",
      summary,
      detail,
    });
  }
}

type EditableField = "note1" | "note2" | "note3" | "note4" | "final";
const editableFields = new Set<EditableField>([
  "note1",
  "note2",
  "note3",
  "note4",
  "final",
]);

type GradeCellEditEvent = {
  data?: AcademicSituationRow;
  field?: string;
  newValue?: unknown;
  oldValue?: unknown;
};

