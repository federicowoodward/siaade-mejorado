import { Component, inject, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsersTableComponent } from '../../../../shared/components/users-table/users-table.component';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { SubjectStudent } from '../../../../core/models/subject_student.model';
import { Button } from "primeng/button";
import { GoBackService } from '../../../../core/services/go_back.service';

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [CommonModule, UsersTableComponent, Button],
  templateUrl: './students-page.html',
  styleUrls: ['./students-page.scss'],
})
export class StudentsPage implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private goBack = inject(GoBackService)

  subjectId!: string;
  students: string[] = [];

  ngOnInit() {
    this.subjectId = this.route.snapshot.paramMap.get('subjectId')!;

    this.api.getAll<SubjectStudent>('subject_students').subscribe((rels) => {
      this.students = rels
        .filter((r) => r.subjectId.toString() === this.subjectId)
        .map((r) => r.studentId.toString());
    });
  }

  back(): void {
    this.goBack.back()
  }
}
