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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
const typeorm_1 = require("typeorm");
const teachers_entity_1 = require("./teachers.entity");
const preceptors_entity_1 = require("./preceptors.entity");
const subject_student_entity_1 = require("./subject_student.entity");
const exams_entity_1 = require("./exams.entity");
const subject_absence_entity_1 = require("./subject_absence.entity");
let Subject = class Subject {
};
exports.Subject = Subject;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Subject.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subject_name' }),
    __metadata("design:type", String)
], Subject.prototype, "subjectName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Subject.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teachers_entity_1.Teacher, (t) => t.subjects, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'teacher' }),
    __metadata("design:type", teachers_entity_1.Teacher)
], Subject.prototype, "teacherRel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Subject.prototype, "preceptor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => preceptors_entity_1.Preceptor, (p) => p.subjects, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'preceptor' }),
    __metadata("design:type", preceptors_entity_1.Preceptor)
], Subject.prototype, "preceptorRel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'course_num', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Subject.prototype, "courseNum", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'course_letter', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Subject.prototype, "courseLetter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'course_year', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Subject.prototype, "courseYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'correlative', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Subject.prototype, "correlative", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subject_student_entity_1.SubjectStudent, (ss) => ss.subject),
    __metadata("design:type", Array)
], Subject.prototype, "subjectStudents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => exams_entity_1.Exam, (e) => e.subject),
    __metadata("design:type", Array)
], Subject.prototype, "exams", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subject_absence_entity_1.SubjectAbsence, (sa) => sa.subject),
    __metadata("design:type", Array)
], Subject.prototype, "absences", void 0);
exports.Subject = Subject = __decorate([
    (0, typeorm_1.Entity)('subjects')
], Subject);
//# sourceMappingURL=subjects.entity.js.map