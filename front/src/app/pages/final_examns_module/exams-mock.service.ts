import { Injectable, signal } from '@angular/core';

// Tipos mínimos (alineados al DBML)
export type ExamTable = {
    id: number; name: string; start_date: string; end_date: string; created_by: string;
};
export type FinalExam = {
    id: number; exam_table_id: number; subject_id: number; subject_name: string;
    exam_date: string; aula?: string;
};
export type FinalExamStudent = {
    id: number; final_exams_id: number; student_id: string;
    name: string; enrolled: boolean; enrolled_at: string | null; score: number | null; notes: string;
};

@Injectable({ providedIn: 'root' })
export class ExamsMockService {
    // ids temporales
    private nextTableId = 3;
    private nextFinalId = 5;

    // Mesas iniciales
    examTables = signal<ExamTable[]>([
        { id: 1, name: 'Mesa Diciembre 2025', start_date: '2025-12-01', end_date: '2025-12-20', created_by: 'u_sec1' },
        { id: 2, name: 'Mesa Febrero 2026', start_date: '2026-02-01', end_date: '2026-02-15', created_by: 'u_sec1' },
    ]);

    // Exámenes finales por mesa
    finalExams = signal<FinalExam[]>([
        { id: 1, exam_table_id: 1, subject_id: 101, subject_name: 'Matemática I', exam_date: '2025-12-05', aula: 'Aula 12' },
        { id: 2, exam_table_id: 1, subject_id: 102, subject_name: 'Historia I', exam_date: '2025-12-07', aula: 'Aula 5' },
        { id: 3, exam_table_id: 2, subject_id: 101, subject_name: 'Matemática I', exam_date: '2026-02-03', aula: 'Aula 3' },
        { id: 4, exam_table_id: 2, subject_id: 103, subject_name: 'Lengua I', exam_date: '2026-02-10', aula: 'Aula 7' },
    ]);

    // Inscripciones (solo para demo en final_exam_page; completaré luego)
    finalExamStudents = signal<FinalExamStudent[]>([]);

    // Helpers
    listTables() { return this.examTables(); }
    listFinalsByTable(tableId: number) { return this.finalExams().filter(e => e.exam_table_id === tableId); }
    getTable(id: number) { return this.examTables().find(t => t.id === id) || null; }
    getFinal(id: number) { return this.finalExams().find(f => f.id === id) || null; }

    createTable(payload: Omit<ExamTable, 'id'>) {
        const t: ExamTable = { id: this.nextTableId++, ...payload };
        this.examTables.set([t, ...this.examTables()]);
        return t;
    }
    updateTable(id: number, patch: Partial<ExamTable>) {
        this.examTables.set(this.examTables().map(t => t.id === id ? { ...t, ...patch } : t));
    }
    deleteTable(id: number) {
        this.examTables.set(this.examTables().filter(t => t.id !== id));
        this.finalExams.set(this.finalExams().filter(f => f.exam_table_id !== id));
    }

    createFinal(payload: Omit<FinalExam, 'id'>) {
        const f: FinalExam = { id: this.nextFinalId++, ...payload };
        this.finalExams.set([f, ...this.finalExams()]);
        return f;
    }
    deleteFinal(id: number) {
        this.finalExams.set(this.finalExams().filter(f => f.id !== id));
        this.finalExamStudents.set(this.finalExamStudents().filter(s => s.final_exams_id !== id));
    }
}
