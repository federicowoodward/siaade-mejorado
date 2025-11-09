export type AcademicSituationRow = {
  studentId: string;
  fullName: string;
  legajo: string;
  dni: string;
  commissionId: number;
  commissionLetter: string | null;
  note1: number | null;
  note2: number | null;
  note3: number | null;
  note4: number | null;
  final: number | null;
  attendancePercentage: number;
  condition: string | null;
  enrolled: boolean;
};

export type AcademicSituationApiResponse = {
  subject: { id: number; name: string; partials: 2 | 4 };
  commissions: Array<{ id: number; letter: string | null }>;
  rows: AcademicSituationRow[];
};
