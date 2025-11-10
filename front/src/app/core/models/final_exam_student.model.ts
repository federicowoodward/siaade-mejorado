export interface FinalExamStudent {
    id: number;
    finalExamsId: string; // UUID
    studentId: number;
    enrolled: boolean;
    enrolledAt: string;   // YYYY-MM-DD
    score?: number;
    notes?: string;
  }
  