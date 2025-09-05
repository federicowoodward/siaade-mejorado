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
exports.Student = void 0;
const typeorm_1 = require("typeorm");
const users_entity_1 = require("./users.entity");
const subject_student_entity_1 = require("./subject_student.entity");
const exam_result_entity_1 = require("./exam_result.entity");
const subject_absence_entity_1 = require("./subject_absence.entity");
const final_exams_student_entity_1 = require("./final_exams_student.entity");
let Student = class Student {
};
exports.Student = Student;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], Student.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => users_entity_1.User, (u) => u.student, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", users_entity_1.User)
], Student.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Student.prototype, "legajo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subject_student_entity_1.SubjectStudent, (ss) => ss.student),
    __metadata("design:type", Array)
], Student.prototype, "subjectStudents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => exam_result_entity_1.ExamResult, (er) => er.student),
    __metadata("design:type", Array)
], Student.prototype, "examResults", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subject_absence_entity_1.SubjectAbsence, (sa) => sa.student),
    __metadata("design:type", Array)
], Student.prototype, "subjectAbsences", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => final_exams_student_entity_1.FinalExamsStudent, (fes) => fes.student),
    __metadata("design:type", Array)
], Student.prototype, "finals", void 0);
exports.Student = Student = __decorate([
    (0, typeorm_1.Entity)('students')
], Student);
//# sourceMappingURL=students.entity.js.map