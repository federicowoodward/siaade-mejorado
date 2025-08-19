export interface SubjectAbsence {
    id: number;
    subjectId: number;
    studentId: string;   // UUID
    dates: string[];     // Array de fechas en formato YYYY-MM-DD
  }
  