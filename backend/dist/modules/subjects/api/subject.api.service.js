"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectApiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subjects_entity_1 = require("../../../entities/subjects.entity");
const subject_absence_entity_1 = require("../../../entities/subject_absence.entity");
const subject_student_entity_1 = require("../../../entities/subject_student.entity");
const exams_entity_1 = require("../../../entities/exams.entity");
const exam_result_entity_1 = require("../../../entities/exam_result.entity");
const students_entity_1 = require("../../../entities/students.entity");
let SubjectApiService = class SubjectApiService {
    constructor(subjectRepo, absenceRepo, subjStudentRepo, examRepo, examResultRepo, studentRepo) {
        this.subjectRepo = subjectRepo;
        this.absenceRepo = absenceRepo;
        this.subjStudentRepo = subjStudentRepo;
        this.examRepo = examRepo;
        this.examResultRepo = examResultRepo;
        this.studentRepo = studentRepo;
    }
    // Ausencias
    async addAbsence(body) {
        const { subject_id, student_id, date } = body;
        const subject = await this.subjectRepo.findOne({ where: { id: subject_id } });
        if (!subject)
            throw new common_1.NotFoundException('Subject not found');
        const studentIds = Array.isArray(student_id) ? student_id : [student_id];
        for (const sid of studentIds) {
            let record = await this.absenceRepo.findOne({ where: { subjectId: subject_id, studentId: sid } });
            if (!record) {
                record = this.absenceRepo.create({ subjectId: subject_id, studentId: sid, dates: [new Date(date)] });
            }
            else {
                const d = new Date(date);
                const exists = (record.dates || []).some((x) => new Date(x).getTime() === d.getTime());
                if (!exists)
                    record.dates = [...(record.dates || []), d];
            }
            await this.absenceRepo.save(record);
        }
        return { ok: true };
    }
    async listAbsences(body) {
        const { subject_id, student_id } = body;
        if (student_id) {
            const rec = await this.absenceRepo.findOne({ where: { subjectId: subject_id, studentId: student_id } });
            return rec ?? { subjectId: subject_id, studentId: student_id, dates: [] };
        }
        return this.absenceRepo.find({ where: { subjectId: subject_id } });
    }
    async removeAbsence(body) {
        const { subject_id, student_id, date } = body;
        const rec = await this.absenceRepo.findOne({ where: { subjectId: subject_id, studentId: student_id } });
        if (!rec)
            return { ok: true };
        const d = new Date(date).getTime();
        rec.dates = (rec.dates || []).filter((x) => new Date(x).getTime() !== d);
        await this.absenceRepo.save(rec);
        return { ok: true };
    }
    // Enrollments
    async enroll(body) {
        const { subject_id, student_id } = body;
        const subject = await this.subjectRepo.findOne({ where: { id: subject_id } });
        if (!subject)
            throw new common_1.NotFoundException('Subject not found');
        const student = await this.studentRepo.findOne({ where: { userId: student_id } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        let ss = await this.subjStudentRepo.findOne({ where: { subjectId: subject_id, studentId: student_id } });
        if (!ss)
            ss = this.subjStudentRepo.create({ subjectId: subject_id, studentId: student_id, enrollmentDate: new Date() });
        await this.subjStudentRepo.save(ss);
        return { ok: true };
    }
    async unenroll(body) {
        const { subject_id, student_id } = body;
        const ss = await this.subjStudentRepo.findOne({ where: { subjectId: subject_id, studentId: student_id } });
        if (!ss)
            return { ok: true };
        await this.subjStudentRepo.delete(ss.id);
        return { ok: true };
    }
    // Exámenes
    async createExam(body) {
        const { subject_id, title, date } = body;
        const subject = await this.subjectRepo.findOne({ where: { id: subject_id } });
        if (!subject)
            throw new common_1.NotFoundException('Subject not found');
        const exam = this.examRepo.create({ subjectId: subject_id, title: title ?? null, date: date ? new Date(date) : null });
        const saved = await this.examRepo.save(exam);
        // Crear resultados en null para cada alumno inscripto
        const enrolls = await this.subjStudentRepo.find({ where: { subjectId: subject_id } });
        if (enrolls.length) {
            const results = enrolls.map((e) => this.examResultRepo.create({ examId: saved.id, studentId: e.studentId, score: null }));
            await this.examResultRepo.save(results);
        }
        return saved;
    }
    listExams(body) {
        return this.examRepo.find({ where: { subjectId: body.subject_id } });
    }
    async listExamResults(body) {
        return this.examResultRepo.find({ where: { examId: body.exam_id } });
    }
    async editExam(body) {
        const exam = await this.examRepo.findOne({ where: { id: body.exam_id } });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        if (typeof body.title !== 'undefined')
            exam.title = body.title;
        if (typeof body.date !== 'undefined')
            exam.date = body.date ? new Date(body.date) : null;
        await this.examRepo.save(exam);
        return exam;
    }
    async deleteExam(body) {
        await this.examRepo.delete(body.exam_id);
        return { ok: true };
    }
    async editScore(body) {
        let res = await this.examResultRepo.findOne({ where: { examId: body.exam_id, studentId: body.student_id } });
        if (!res) {
            res = this.examResultRepo.create({ examId: body.exam_id, studentId: body.student_id, score: null });
        }
        // Guardar con DECIMAL como string
        res.score = (Math.round(body.score * 100) / 100).toFixed(2);
        await this.examResultRepo.save(res);
        return res;
    }
};
exports.SubjectApiService = SubjectApiService;
exports.SubjectApiService = SubjectApiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subjects_entity_1.Subject)),
    __param(1, (0, typeorm_1.InjectRepository)(subject_absence_entity_1.SubjectAbsence)),
    __param(2, (0, typeorm_1.InjectRepository)(subject_student_entity_1.SubjectStudent)),
    __param(3, (0, typeorm_1.InjectRepository)(exams_entity_1.Exam)),
    __param(4, (0, typeorm_1.InjectRepository)(exam_result_entity_1.ExamResult)),
    __param(5, (0, typeorm_1.InjectRepository)(students_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SubjectApiService);
//# sourceMappingURL=subject.api.service.js.map