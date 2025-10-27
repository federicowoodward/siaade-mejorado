export type GradesApiResponse = {
  subject: { id: number; name: string };
  commissions: Array<{
    commission: { id: number; letter: string | null };
    rows: Array<{
      studentId: string;
      fullName: string;
      legajo: string;
      partial1: number | null;
      partial2: number | null;
      final: number | null;
      attendance: number | null;
      condition: string | null;
      absencesCount: number | null;
      progress: {
        id: number;
        subjectCommissionId: number;
        studentId: string;
        statusId: number | null;
        partialScores: Record<string, number> | null;
        attendancePercentage: number | null;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  }>;
};

