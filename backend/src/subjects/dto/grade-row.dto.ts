export class GradeRowDto {
  studentId: string;
  fullName: string;
  legajo: string;
  partial1: number | null;
  partial2: number | null;
  final: number | null;
  attendance: number;
  condition: string | null;
  absencesCount?: number;
}

