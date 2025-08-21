import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule, AutoComplete } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';

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
    Button,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TooltipModule,
    AutoCompleteModule,
    SelectButtonModule,
],
  templateUrl: './grades-page.html',
  styleUrl: './grades-page.scss',
})
export class GradesPage implements OnInit {
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
  return allScores ? allScores[index] ?? null : null;
}
setScore(examId: number, studentId: string, index: number, value: number | null) {
  const key = this.key(examId, studentId);
  
  // 1. Obtiene el array de notas, o crea uno si no existe.
  let allScores = this.scores.get(key);
  if (!allScores) {
    allScores = [];
    this.scores.set(key, allScores);
  }
  
  // 2. Asegura que el array tenga el tamaño suficiente.
  //    Rellena con 'null' hasta el índice deseado.
  while (allScores.length <= index) {
    allScores.push(null);
  }

  // 3. Asigna el valor en el índice correcto.
  allScores[index] = value;
}
// funcion que toma array de notas y devuelve el promedio
getAverage(examId: number, studentId: string): number | null {
  const allScores = this.scores.get(this.key(examId, studentId));
  if (!allScores || allScores.length === 0) {
    return null;
  }
  const validScores = allScores.filter(score => score !== null);
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
}