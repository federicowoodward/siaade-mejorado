export interface Subject {
  id: number;
  subjectName: string;
  teacher: number; // user_id de teachers
  preceptor: number; // user_id de preceptors
  courseNum: number;
  courseLetter: string;
  courseYear: string;
  correlative?: number; // id de otra materia (subject)
}
