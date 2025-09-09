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
exports.ExamResult = void 0;
const typeorm_1 = require("typeorm");
const exams_entity_1 = require("./exams.entity");
const students_entity_1 = require("./students.entity");
let ExamResult = class ExamResult {
};
exports.ExamResult = ExamResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ExamResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exam_id' }),
    __metadata("design:type", Number)
], ExamResult.prototype, "examId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => exams_entity_1.Exam, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'exam_id' }),
    __metadata("design:type", exams_entity_1.Exam)
], ExamResult.prototype, "exam", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id', type: 'uuid' }),
    __metadata("design:type", String)
], ExamResult.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => students_entity_1.Student, (s) => s.examResults, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id', referencedColumnName: 'userId' }),
    __metadata("design:type", students_entity_1.Student)
], ExamResult.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ExamResult.prototype, "score", void 0);
exports.ExamResult = ExamResult = __decorate([
    (0, typeorm_1.Entity)('exam_results')
], ExamResult);
//# sourceMappingURL=exam_result.entity.js.map