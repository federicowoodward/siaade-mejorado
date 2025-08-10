import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { IftaLabelModule } from 'primeng/iftalabel';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subject-new-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    AutoCompleteModule,
    TooltipModule,
    IftaLabelModule,
    Button,
  ],
  templateUrl: './new-subject-page.html',
  styleUrls: ['./new-subject-page.scss'],
})
export class NewSubjectPage {
  constructor(private router: Router) {}

  // Form (solo UI, todo como string)
  subjectName = '';
  teacherId: string | null = null; // guarda el NOMBRE seleccionado
  preceptorId: string | null = null; // guarda el NOMBRE seleccionado
  courseNum: string | null = null;
  courseLetter: string | null = null;
  courseYear: string | null = null;

  // Correlativa (autocomplete mock)
  corrQuery = '';
  corrSelectedId: number | null = null;
  corrSuggestions: string[] = [];

  // ------- Opciones base (mock en strings) -------
  private teacherOptionsAll: string[] = ['Juan Pérez', 'Ana Rodríguez'];
  private preceptorOptionsAll: string[] = ['María Gómez', 'Luis Romero'];
  private courseNumsAll: string[] = ['1', '2', '3', '4', '5', '6', '7'];
  private lettersAll: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  private yearsAll: string[] = Array.from(
    { length: new Date().getFullYear() - 2018 + 1 },
    (_, i) => String(2018 + i)
  );

  // Sugerencias visibles (se actualizan en cada completeMethod)
  teacherSuggestions: string[] = [];
  preceptorSuggestions: string[] = [];
  courseNums: string[] = [...this.courseNumsAll];
  letters: string[] = [...this.lettersAll];
  years: string[] = [...this.yearsAll];

  // Mock de correlativas (para mostrar ID seleccionado)
  private allSubjectsMock = [
    { id: 1, subjectName: 'Matemática I' },
    { id: 2, subjectName: 'Historia I' },
    { id: 3, subjectName: 'Lengua I' },
    { id: 4, subjectName: 'Geografía I' },
  ];

  // Helpers
  private filterContains(source: string[], q: string): string[] {
    const query = (q || '').toLowerCase().trim();
    return !query
      ? [...source]
      : source.filter((v) => v.toLowerCase().includes(query));
  }

  // ------- Métodos de búsqueda para p-autoComplete -------
  searchTeachers(e: any) {
    this.teacherSuggestions = this.filterContains(
      this.teacherOptionsAll,
      e?.query
    );
  }

  searchPreceptors(e: any) {
    this.preceptorSuggestions = this.filterContains(
      this.preceptorOptionsAll,
      e?.query
    );
  }

  searchCourseNums(e: any) {
    this.courseNums = this.filterContains(this.courseNumsAll, e?.query);
  }

  searchLetters(e: any) {
    this.letters = this.filterContains(this.lettersAll, e?.query);
  }

  searchYears(e: any) {
    this.years = this.filterContains(this.yearsAll, e?.query);
  }

  onSearchCorr(e: any) {
    const names = this.allSubjectsMock.map((s) => s.subjectName);
    this.corrSuggestions = this.filterContains(names, e?.query);
  }

  onPickCorr(value: string) {
    const found = this.allSubjectsMock.find((s) => s.subjectName === value);
    this.corrSelectedId = found ? found.id : null;
    this.corrQuery = value;
  }

  goBack() {
    this.router.navigate(['/subjects']);
  }
}
