export interface ExamResult {
    id: number;
    examId: number;
    studentId: number;
    score?: number; // Puede ser null (opcional)
  }

  // posible busqueda idea: filtro por score