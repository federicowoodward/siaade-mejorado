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
exports.FinalExam = void 0;
const typeorm_1 = require("typeorm");
const subject_entity_1 = require("./subject.entity");
let FinalExam = class FinalExam {
};
exports.FinalExam = FinalExam;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FinalExam.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exam_table_id' }),
    __metadata("design:type", Number)
], FinalExam.prototype, "examTableId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subject_id' }),
    __metadata("design:type", Number)
], FinalExam.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exam_date', type: 'date' }),
    __metadata("design:type", Date)
], FinalExam.prototype, "examDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FinalExam.prototype, "aula", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subject_entity_1.Subject),
    (0, typeorm_1.JoinColumn)({ name: 'subject_id' }),
    __metadata("design:type", subject_entity_1.Subject)
], FinalExam.prototype, "subject", void 0);
exports.FinalExam = FinalExam = __decorate([
    (0, typeorm_1.Entity)('final_exams')
], FinalExam);
//# sourceMappingURL=final-exam.entity.js.map