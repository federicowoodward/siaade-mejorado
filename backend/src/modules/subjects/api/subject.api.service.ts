import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Subject } from '../../../entities/subjects.entity';
import { SubjectAbsence } from '../../../entities/subject_absence.entity';
import { SubjectStudent } from '../../../entities/subject_student.entity';
import { Exam } from '../../../entities/exams.entity';
import { ExamResult } from '../../../entities/exam_result.entity';
import { Student } from '../../../entities/students.entity';

@Injectable()
export class SubjectApiService {
  constructor(
    @InjectRepository(Subject) private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(SubjectAbsence) private readonly absenceRepo: Repository<SubjectAbsence>,
    @InjectRepository(SubjectStudent) private readonly subjStudentRepo: Repository<SubjectStudent>,
    @InjectRepository(Exam) private readonly examRepo: Repository<Exam>,
    @InjectRepository(ExamResult) private readonly examResultRepo: Repository<ExamResult>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
  ) {}

  // Ausencias
  async addAbsence(body: { subject_id: number; student_id: string | string[]; date: string }) {
    const { subject_id, student_id, date } = body;
    const subject = await this.subjectRepo.findOne({ where: { id: subject_id } });
    if (!subject) throw new NotFoundException('Subject not found');
    const studentIds = Array.isArray(student_id) ? student_id : [student_id];
    for (const sid of studentIds) {
      let record = await this.absenceRepo.findOne({ where: { subjectId: subject_id, studentId: sid } });
      if (!record) {
        record = this.absenceRepo.create({ subjectId: subject_id, studentId: sid, dates: [new Date(date)] });
      } else {
        const d = new Date(date);
  const exists = (record.dates || []).some((x: Date) => new Date(x).getTime() === d.getTime());
        if (!exists) record.dates = [...(record.dates || []), d];
      }
      await this.absenceRepo.save(record);
    }
    return { ok: true };
  }

  async listAbsences(body: { subject_id: number; student_id?: string }) {
    const { subject_id, student_id } = body;
    if (student_id) {
      const rec = await this.absenceRepo.findOne({ where: { subjectId: subject_id, studentId: student_id } });
      return rec ?? { subjectId: subject_id, studentId: student_id, dates: [] };
    }
    return this.absenceRepo.find({ where: { subjectId: subject_id } });
  }

  async removeAbsence(body: { subject_id: number; student_id: string; date: string }) {
    const { subject_id, student_id, date } = body;
  const rec = await this.absenceRepo.findOne({ where: { subjectId: subject_id, studentId: student_id } });
    if (!rec) return { ok: true };
  const d = new Date(date).getTime();
  rec.dates = (rec.dates || []).filter((x: Date) => new Date(x).getTime() !== d);
    await this.absenceRepo.save(rec);
    return { ok: true };
  }

  // Enrollments
  async enroll(body: { subject_id: number; student_id: string | string[] }) {
    const { subject_id } = body;
    const studentIds = Array.isArray(body.student_id) ? body.student_id : [body.student_id];
    const subject = await this.subjectRepo.findOne({ where: { id: subject_id } });
    if (!subject) throw new NotFoundException('Subject not found');
    let processed = 0;
    for (const sid of studentIds) {
      const student = await this.studentRepo.findOne({ where: { userId: sid } });
      if (!student) continue;
      let ss = await this.subjStudentRepo.findOne({ where: { subjectId: subject_id, studentId: sid } });
      if (!ss) {
        ss = this.subjStudentRepo.create({ subjectId: subject_id, studentId: sid, enrollmentDate: new Date() });
        await this.subjStudentRepo.save(ss);
        processed++;
      }
    }
    return { ok: true, processed };
  }

  async unenroll(body: { subject_id: number; student_id: string | string[] }) {
    const { subject_id } = body;
    const studentIds = Array.isArray(body.student_id) ? body.student_id : [body.student_id];
    let processed = 0;
    for (const sid of studentIds) {
      const ss = await this.subjStudentRepo.findOne({ where: { subjectId: subject_id, studentId: sid } });
      if (!ss) continue;
      await this.subjStudentRepo.delete(ss.id);
      processed++;
    }
    return { ok: true, processed };
  }

  // Exámenes
  async createExam(body: { subject_id: number; title?: string; date?: string }) {
    const { subject_id, title, date } = body;
    const subject = await this.subjectRepo.findOne({ where: { id: subject_id } });
    if (!subject) throw new NotFoundException('Subject not found');
  const exam = this.examRepo.create({ subjectId: subject_id, title: (title as any) ?? null, date: date ? (new Date(date) as unknown as Date) : (null as unknown as Date) });
    const saved = await this.examRepo.save(exam);
    // Crear resultados en null para cada alumno inscripto
    const enrolls = await this.subjStudentRepo.find({ where: { subjectId: subject_id } });
    if (enrolls.length) {
  const results = enrolls.map((e: SubjectStudent) => this.examResultRepo.create({ examId: saved.id, studentId: e.studentId, score: null }));
      await this.examResultRepo.save(results);
    }
    return saved;
  }

  listExams(body: { subject_id: number }) {
    return this.examRepo.find({ where: { subjectId: body.subject_id } });
  }

  async listExamResults(body: { exam_id: number }) {
    return this.examResultRepo.find({ where: { examId: body.exam_id } });
  }

  async editExam(body: { exam_id: number; title?: string; date?: string }) {
    const exam = await this.examRepo.findOne({ where: { id: body.exam_id } });
    if (!exam) throw new NotFoundException('Exam not found');
  if (typeof body.title !== 'undefined') exam.title = body.title as any;
  if (typeof body.date !== 'undefined') exam.date = body.date ? (new Date(body.date) as unknown as Date) : (null as unknown as Date);
    await this.examRepo.save(exam);
    return exam;
  }

  async deleteExam(body: { exam_id: number }) {
    await this.examRepo.delete(body.exam_id);
    return { ok: true };
  }

  async editScore(body: { exam_id: number; student_id: string; score: number }) {
    let res = await this.examResultRepo.findOne({ where: { examId: body.exam_id, studentId: body.student_id } });
    if (!res) {
      res = this.examResultRepo.create({ examId: body.exam_id, studentId: body.student_id, score: null });
    }
    // Guardar con DECIMAL como string
  res.score = (Math.round(body.score * 100) / 100).toFixed(2) as any;
    await this.examResultRepo.save(res);
    return res;
  }

  async getSubjectDetail(id: number) {
    const qb = this.subjectRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.teacherRel', 't')
      .leftJoinAndSelect('t.user', 'tuser')
      .leftJoinAndSelect('s.preceptorRel', 'p')
      .leftJoinAndSelect('p.user', 'puser')
      .leftJoinAndSelect('s.subjectStudents', 'ss')
      .leftJoinAndSelect('ss.student', 'stu')
      .leftJoinAndSelect('stu.user', 'stuuser')
      .leftJoinAndSelect('s.absences', 'abs')
      .leftJoinAndSelect('s.exams', 'ex')
      .where('s.id = :id', { id });

    const subject = await qb.getOne();
    if (!subject) throw new NotFoundException('Subject not found');

    const examIds = (subject.exams || []).map((e) => e.id);
    let resultsByExam: Record<number, { student_id: string; score: string | null }[]> = {};
    if (examIds.length) {
      const results = await this.examResultRepo.find({ where: { examId: In(examIds) } });
      for (const r of results) {
        if (!resultsByExam[r.examId]) resultsByExam[r.examId] = [];
        resultsByExam[r.examId].push({ student_id: r.studentId, score: r.score });
      }
    }

    const mapUser = (u?: any) => (u ? { id: u.id, name: u.name, lastName: u.lastName, email: u.email } : null);

    return {
      id: subject.id,
      subjectName: subject.subjectName,
      courseNum: subject.courseNum,
      courseLetter: subject.courseLetter,
      courseYear: subject.courseYear,
      correlative: subject.correlative,
      teacher: mapUser(subject.teacherRel?.user),
      preceptor: mapUser(subject.preceptorRel?.user),
      students: (subject.subjectStudents || []).map((ss) => ({
        userId: ss.studentId,
        ...mapUser(ss.student?.user),
      })),
      absences: (subject.absences || []).map((a) => ({ studentId: a.studentId, dates: a.dates })),
      exams: (subject.exams || []).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        isValid: e.isValid,
        results: resultsByExam[e.id] || [],
      })),
    };
  }
}
