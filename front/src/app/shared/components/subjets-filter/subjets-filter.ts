// src/app/shared/components/subject-filter/subject-filter.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { WritableSignal } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-subject-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule],
  templateUrl: './subjets-filter.html',
})
export class SubjectsFilterComponent {
  @Input() courseData!: WritableSignal<{
    num: string;
    letter: string;
    year: string;
  }>;
  @Input() clear$?: Subject<void>;

  private readonly courseNumsAll = ['1', '2', '3', '4', '5', '6', '7'];
  private readonly courseLettersAll = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  private readonly yearsAll = Array.from(
    { length: new Date().getFullYear() - 2010 + 1 },
    (_, i) => String(2010 + i)
  );

  courseNums = [...this.courseNumsAll];
  courseLetters = [...this.courseLettersAll];
  years = [...this.yearsAll];

  constructor() {
    this.clear$
      ?.pipe(takeUntilDestroyed())
      .subscribe(() => this.clearFilters());
  }

  searchCourseNums(event: { query: string }) {
    const q = (event?.query ?? '').trim();
    this.courseNums = this.courseNumsAll.filter((n) => n.startsWith(q));
  }

  searchCourseLetters(event: { query: string }) {
    const q = (event?.query ?? '').toUpperCase().trim();
    this.courseLetters = this.courseLettersAll.filter((l) => l.startsWith(q));
  }

  searchYears(event: { query: string }) {
    const q = (event?.query ?? '').trim();
    this.years = this.yearsAll.filter((y) => y.startsWith(q));
  }

  clearFilters(): void {
    this.courseData.set({ num: '', letter: '', year: '' });
    this.courseNums = [...this.courseNumsAll];
    this.courseLetters = [...this.courseLettersAll];
    this.years = [...this.yearsAll];
  }
}
