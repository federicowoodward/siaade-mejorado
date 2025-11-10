export type GradeRow = {
  studentId: string;
  fullName: string;
  legajo: string;
  note1: number | null;
  note2: number | null;
  note3: number | null;
  note4: number | null;
  final: number | null;
  attendancePercentage: number;
  condition: string | null;
};

export type GradesApiResponse = {
  subject: { id: number; name: string };
  commissions: Array<{
    commission: { id: number; letter: string | null };
    partials: 2 | 4;
    rows: GradeRow[];
  }>;
};
