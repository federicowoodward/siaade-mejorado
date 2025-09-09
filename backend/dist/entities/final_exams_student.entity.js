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
exports.FinalExamsStudent = void 0;
const typeorm_1 = require("typeorm");
const final_exam_entity_1 = require("./final_exam.entity");
const students_entity_1 = require("./students.entity");
let FinalExamsStudent = class FinalExamsStudent {
};
exports.FinalExamsStudent = FinalExamsStudent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FinalExamsStudent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'final_exams_id', type: 'int' }),
    __metadata("design:type", Number)
], FinalExamsStudent.prototype, "finalExamsId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => final_exam_entity_1.FinalExam, (fe) => fe.students, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'final_exams_id' }),
    __metadata("design:type", final_exam_entity_1.FinalExam)
], FinalExamsStudent.prototype, "finalExam", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id', type: 'uuid' }),
    __metadata("design:type", String)
], FinalExamsStudent.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => students_entity_1.Student, (s) => s.finals, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id', referencedColumnName: 'userId' }),
    __metadata("design:type", students_entity_1.Student)
], FinalExamsStudent.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], FinalExamsStudent.prototype, "enrolled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'enrolled_at', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], FinalExamsStudent.prototype, "enrolledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], FinalExamsStudent.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FinalExamsStudent.prototype, "notes", void 0);
exports.FinalExamsStudent = FinalExamsStudent = __decorate([
    (0, typeorm_1.Entity)('final_exams_students')
], FinalExamsStudent);
//# sourceMappingURL=final_exams_student.entity.js.map