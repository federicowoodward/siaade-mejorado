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
exports.SubjectStudent = void 0;
const typeorm_1 = require("typeorm");
const subjects_entity_1 = require("./subjects.entity");
const students_entity_1 = require("./students.entity");
let SubjectStudent = class SubjectStudent {
};
exports.SubjectStudent = SubjectStudent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SubjectStudent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subject_id' }),
    __metadata("design:type", Number)
], SubjectStudent.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subjects_entity_1.Subject, (s) => s.subjectStudents, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'subject_id' }),
    __metadata("design:type", subjects_entity_1.Subject)
], SubjectStudent.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id', type: 'uuid' }),
    __metadata("design:type", String)
], SubjectStudent.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => students_entity_1.Student, (s) => s.subjectStudents, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id', referencedColumnName: 'userId' }),
    __metadata("design:type", students_entity_1.Student)
], SubjectStudent.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'enrollment_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], SubjectStudent.prototype, "enrollmentDate", void 0);
exports.SubjectStudent = SubjectStudent = __decorate([
    (0, typeorm_1.Entity)('subject_students'),
    (0, typeorm_1.Unique)(['subjectId', 'studentId'])
], SubjectStudent);
//# sourceMappingURL=subject_student.entity.js.map