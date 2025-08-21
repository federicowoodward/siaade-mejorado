import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { GoBackService } from '../../../core/services/go_back.service';

type Subject = { id: number; subjectName: string; courseYear: string };
type SubjectStudent = { id: number; subjectId: number; studentId: string };
type User = { id: string; name: string; lastName: string };
type Student = { userId: string; legajo: string };
type SubjectAbsences = {
  id: number;
  subjectId: number;
  studentId: string;
  dates: string[];
};

@Component({
  selector: 'app-attendance-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    AutoCompleteModule,
    CheckboxModule,
    Button,
    TooltipModule,
  ],
  templateUrl: './attendance-page.html',
  styleUrl: './attendance-page.scss',
})
export class AttendancePage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private goBackSvc = inject(GoBackService);

  back() {
    this.goBackSvc.back();
  }

  // Ruta
  subjectId = Number(this.route.snapshot.paramMap.get('subjectId') ?? 0);

  // Encabezado
  subjectName = signal<string>('Materia');
  year = signal<number>(new Date().getFullYear());
  month = signal<number>(new Date().getMonth() + 1); // 1..12

  // Autocomplete de mes
  monthLabel = '';
  monthSuggestions: string[] = [];
  private monthsAll = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  private filterContains(src: string[], q: string) {
    const s = (q || '').toLowerCase().trim();
    return !s ? [...src] : src.filter((v) => v.toLowerCase().includes(s));
  }
  searchMonths(e: any) {
    this.monthSuggestions = this.filterContains(this.monthsAll, e?.query);
  }
  onMonthChange(value: string) {
    this.monthLabel = value || '';
    const idx = this.monthsAll.findIndex(
      (m) => m.toLowerCase() === (value || '').toLowerCase()
    );
    if (idx >= 0) this.month.set(idx + 1); // 1..12
  }

  // Alumnos
  students = signal<{ userId: string; name: string; legajo: string }[]>([]);

  // Faltas (ausencias): "studentId:YYYY-MM-DD"
  private absences = new Set<string>();
  private key = (studentId: string, isoDate: string) =>
    `${studentId}:${isoDate}`;

  // Días del mes seleccionado
  days = computed(() => {
    const y = this.year();
    const m = this.month();
    const count = new Date(y, m, 0).getDate();
    const list: { d: number; iso: string; dow: number }[] = [];

    for (let day = 1; day <= count; day++) {
      const dow = new Date(y, m - 1, day).getDay(); // 0=Dom..6=Sab
      if (dow === 0 || dow === 6) continue; // 👈 excluir sábados y domingos
      const iso = this.toISO(y, m, day);
      list.push({ d: day, iso, dow });
    }
    return list;
  });

  ngOnInit() {
    // Materia → nombre y año
    this.api.getAll<Subject>('subjects').subscribe((subs) => {
      const s = subs.find((x) => x.id === this.subjectId);
      if (s) {
        this.subjectName.set(s.subjectName);
        const parsed = parseInt(String(s.courseYear), 10);
        if (!isNaN(parsed)) this.year.set(parsed);
      }
      // label de mes inicial
      this.monthLabel = this.monthsAll[(this.month() - 1 + 12) % 12];
    });

    // Alumnos de la materia
    this.api.getAll<SubjectStudent>('subject_students').subscribe((rows) => {
      const ofSubj = rows.filter((r) => r.subjectId === this.subjectId);
      this.api.getAll<User>('users').subscribe((users) => {
        this.api.getAll<Student>('students').subscribe((studs) => {
          const list = ofSubj.map((r) => {
            const u = users.find((x) => x.id === r.studentId);
            const st = studs.find((x) => x.userId === r.studentId);
            return {
              userId: r.studentId,
              name: u ? `${u.name} ${u.lastName}` : r.studentId,
              legajo: st?.legajo ?? '—',
            };
          });
          this.students.set(list);
        });
      });
    });

    // Faltas existentes
    this.api.getAll<SubjectAbsences>('subject_absences').subscribe((rows) => {
      rows
        .filter((r) => r.subjectId === this.subjectId)
        .forEach((r) =>
          (r.dates || []).forEach((iso) =>
            this.absences.add(this.key(r.studentId, iso))
          )
        );
    });
  }

  // Fecha helpers
  private toISO(y: number, m: number, d: number) {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  // Presencia
  isPresent(studentId: string, iso: string): boolean {
    return !this.absences.has(this.key(studentId, iso));
  }
  setPresent(studentId: string, iso: string, present: boolean) {
    const k = this.key(studentId, iso);
    if (present) this.absences.delete(k);
    else this.absences.add(k);
  }

  // Marcado masivo
  marcarTodos(present: boolean) {
    for (const st of this.students()) {
      for (const d of this.days()) this.setPresent(st.userId, d.iso, present);
    }
  }
}
