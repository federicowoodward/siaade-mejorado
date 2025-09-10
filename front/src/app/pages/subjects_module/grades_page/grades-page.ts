import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG (modo clásico con módulos)
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';


import { ActivatedRoute } from '@angular/router';
import { GoBackService } from '../../../core/services/go_back.service';
import { ApiService } from '../../../core/services/api.service';

type User = { id: string; name: string; lastName: string; email: string };
type Subject = { id: number; subjectName: string };
type SubjectStudent = { id: number; subjectId: number; studentId: string };
type Student = { userId: string; legajo: string };
type Exam = {
  id: number;
  subjectId: number;
  title: string;
  date: string;
  isValid?: boolean;
  type?: string;
  gradesCount?: number;
};
type ExamResult = {
  id: number;
  examId: number;
  studentId: string;
  score: number[];
};

@Component({
  selector: 'app-grades-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TooltipModule,
    AutoCompleteModule,
    SelectButtonModule,
    SelectModule,
  ],
  templateUrl: './grades-page.html',
  styleUrl: './grades-page.scss', 
})
export class GradesPage implements OnInit {

isGradeApproved(score: number | null): boolean {
  // Ahora, aprobado es solo entre 4 y 6
  return score !== null && score >= 4 && score < 7;
}
isGradePromoted(score: number | null): boolean {
  return score !== null && score >= 7;
}


isGradeDisapproved(score: number | null): boolean {
  return score !== null && score < 4;
}

  getTooltipText(score: number | null): string {
  if (score === null) {
    return '';
  }
  if (this.isGradePromoted(score)) {
    return 'Promocionado';
  }
  if (this.isGradeApproved(score)) {
    return 'Aprobado';
  }
  return 'Desaprobado';
}

  getAverageTooltipText(average: number | null): string {
  if (average === null) {
    return '';
  }
  if (this.isGradePromoted(average)) {
    return 'Promocionado';
  }
  if (this.isGradeApproved(average)) {
    return 'Aprobado';
  }
  return 'Desaprobado';
}

  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private goBackSvc = inject(GoBackService);

  // Nuevo: Mapeo de tipos de examen a clases CSS
  examTypeColors: Record<string, string> = {
    comun: 'exam-common',
    recuperatorio: 'exam-recovery',
    practico: 'exam-practical',
  };

  hasPracticalExam = computed(() =>
  this.exams().some((ex) => ex.type === 'practico')
);

  back() {
    this.goBackSvc.back();
  }

  // Ruta
  subjectId = Number(this.route.snapshot.paramMap.get('subjectId') ?? 0);

  // Datos base
  subjectName = signal<string>('');
  studentsInSubject = signal<
    { userId: string; name: string; legajo: string }[]
  >([]);
  exams = signal<Exam[]>([]);


  // Notas en memoria: clave `${examId}:${studentId}` -> number|null
  private scores = new Map<string, (number | null)[]>();
  private key = (examId: number, studentId: string) => `${examId}:${studentId}`;

  // UI - diálogo "nuevo examen"
  showAddExam = signal(false);
  newExamTitle = '';
  newExamDate = ''; // yyyy-MM-dd
  private tempId = -1; // ids temporales negativos

    newExamType = 'comun';
  examTypes = [
    { label: 'Examen común', value: 'comun' },
    { label: 'Recuperatorio', value: 'recuperatorio' },
    { label: 'Práctico/Otro', value: 'practico' },
  ];
  numberOfPracticalGrades = 1; // Para el caso de "Prácticos"
  practicalGradesOptions = [
    { label: '1 nota', value: 1 },
    { label: '2 notas', value: 2 },
    { label: '3 notas', value: 3 },
  ];


  ngOnInit() {
    // Traer materia (nombre)
    this.api.getAll<Subject>('subjects').subscribe((subjects) => {
      const subj = subjects.find((s) => s.id === this.subjectId);
      this.subjectName.set(subj?.subjectName ?? 'Materia');
    });
    console.log(this.subjectName());
    // Traer alumnos de la materia -> nombres -> legajos
    this.api.getAll<SubjectStudent>('subject_students').subscribe((ss) => {
      const rows = ss.filter((s) => s.subjectId === this.subjectId);
      const studentIds = rows.map((r) => r.studentId);

      this.api.getAll<User>('users').subscribe((users) => {
        this.api.getAll<Student>('students').subscribe((students) => {
          const list = rows.map((r) => {
            const u = users.find((x) => x.id === r.studentId);
            const st = students.find((x) => x.userId === r.studentId);
            return {
              userId: r.studentId,
              name: u ? `${u.name} ${u.lastName}` : r.studentId,
              legajo: st?.legajo ?? '—',
            };
          });
          this.studentsInSubject.set(list);
        });
      });
    });

    // Traer exámenes (columnas) + resultados (notas)
  this.api.getAll<Exam>('exams').subscribe((exams) => {
  // Procesa cada examen para asegurarte de que tenga la propiedad 'type'
  const processedExams = exams.map(exam => {
    // Si la propiedad 'type' no existe, le asignamos 'comun' por defecto.
    // Esto asegura que la tabla siempre tenga un tipo para mostrar.
    const type = exam.type ?? 'comun';
    return { ...exam, type };
  });

  const cols = processedExams
    .filter((e) => e.subjectId === this.subjectId)
    .sort((a, b) => a.date.localeCompare(b.date));

  this.exams.set(cols);

      this.api.getAll<ExamResult>('exam_results').subscribe((results) => {
        results
          .filter((r) => cols.some((c) => c.id === r.examId))
          .forEach((r) =>
          this.scores.set(this.key(r.examId, r.studentId), r.score)
          );
      });
    });
  }

  // Helpers de nota
getScore(examId: number, studentId: string, index: number): number | null {
  const allScores = this.scores.get(this.key(examId, studentId));
  if (!allScores || index >= allScores.length) {
    return null;
  }
  return allScores[index];
}

setScore(examId: number, studentId: string, index: number, value: number | null) {
  const key = this.key(examId, studentId);
  let scoresToUpdate = this.scores.get(key);
  if (!scoresToUpdate) {
    scoresToUpdate = [];
    this.scores.set(key, scoresToUpdate);
  }
  while (scoresToUpdate.length <= index) {
    scoresToUpdate.push(null);
  }
  scoresToUpdate[index] = value;
}
// funcion que toma array de notas y devuelve el promedio
getAverage(examId: number, studentId: string): number | null {
  const allScores = this.scores.get(this.key(examId, studentId));
  if (!allScores || allScores.length === 0) {
    return null;
  }
  const validScores = allScores.filter((score): score is number => typeof score === 'number' && score !== null && !isNaN(score));
  if (validScores.length === 0) {
    return null;
  }
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return sum / validScores.length;
}

  // Agregar examen (local, sin persistir)
  openAddExam() {
    this.newExamTitle = '';
    this.newExamDate = '';
    this.showAddExam.set(true);
  }
  addExamConfirm() {
    if (!this.newExamTitle || !this.newExamDate) {
    this.showAddExam.set(false);
    return;
  }
  const ex: Exam = {
    id: this.tempId--,
    subjectId: this.subjectId,
    title: this.newExamTitle,
    date: this.newExamDate,
    isValid: true,
    type: this.newExamType,

    gradesCount: this.newExamType === 'practico' ? this.numberOfPracticalGrades : 1,
  };
  const next = [...this.exams(), ex].sort((a, b) => a.date.localeCompare(b.date)
  );
  this.exams.set(next);
  this.showAddExam.set(false);
  

}
getFinalAverage(studentId: string): number | null {
  const exams = this.exams();
  if (!exams || exams.length === 0) return null;

  const finalScores: number[] = [];

  for (const ex of exams) {
    const scores = this.scores.get(this.key(ex.id, studentId));

    if (!scores || scores.length === 0) continue;

    if (ex.type === 'practico') {
      // promedio interno de las notas prácticas
      const valid = scores.filter((s): s is number => s !== null && !isNaN(s));
      if (valid.length > 0) {
        const practAvg = valid.reduce((a, b) => a + b, 0) / valid.length;
        finalScores.push(practAvg);
      }
    } else {
      // examen común o recuperatorio: solo una nota
      const valid = scores.filter((s): s is number => s !== null && !isNaN(s));
      if (valid.length > 0) {
        // siempre 1 nota en estos casos
        finalScores.push(valid[0]);
      }
    }
  }

  if (finalScores.length === 0) return null;

  const sum = finalScores.reduce((a, b) => a + b, 0);
  return sum / finalScores.length;
}
}