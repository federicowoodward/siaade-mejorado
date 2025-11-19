import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({ name: "v_subject_grades" })
export class SubjectGradesView {
  @ViewColumn({ name: "subject_id" })
  subjectId: number;

  @ViewColumn({ name: "subject_name" })
  subjectName: string;

  @ViewColumn({ name: "commission_id" })
  commissionId: number;

  @ViewColumn({ name: "commission_letter" })
  commissionLetter: string | null;

  @ViewColumn({ name: "partials" })
  partials: number;

  @ViewColumn({ name: "student_id" })
  studentId: string;

  @ViewColumn({ name: "legajo" })
  legajo: string;

  @ViewColumn({ name: "full_name" })
  fullName: string;

  @ViewColumn({ name: "note1" })
  note1: number | null;

  @ViewColumn({ name: "note2" })
  note2: number | null;

  @ViewColumn({ name: "note3" })
  note3: number | null;

  @ViewColumn({ name: "note4" })
  note4: number | null;

  @ViewColumn({ name: "final" })
  final: number | null;

  @ViewColumn({ name: "attendance_percentage" })
  attendancePercentage: string;

  @ViewColumn({ name: "condition" })
  condition: string | null;
}
