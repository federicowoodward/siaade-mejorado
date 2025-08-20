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
exports.Exam = void 0;
const typeorm_1 = require("typeorm");
const subject_entity_1 = require("./subject.entity");
let Exam = class Exam {
};
exports.Exam = Exam;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Exam.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subject_id' }),
    __metadata("design:type", Number)
], Exam.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Exam.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Exam.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_valid', default: true }),
    __metadata("design:type", Boolean)
], Exam.prototype, "isValid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subject_entity_1.Subject),
    (0, typeorm_1.JoinColumn)({ name: 'subject_id' }),
    __metadata("design:type", subject_entity_1.Subject)
], Exam.prototype, "subject", void 0);
exports.Exam = Exam = __decorate([
    (0, typeorm_1.Entity)('exams')
], Exam);
//# sourceMappingURL=exam.entity.js.map