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
exports.ExamTable = void 0;
const typeorm_1 = require("typeorm");
const secretaries_entity_1 = require("./secretaries.entity");
const final_exam_entity_1 = require("./final_exam.entity");
let ExamTable = class ExamTable {
};
exports.ExamTable = ExamTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ExamTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ExamTable.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'date' }),
    __metadata("design:type", Date)
], ExamTable.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'date' }),
    __metadata("design:type", Date)
], ExamTable.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], ExamTable.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => secretaries_entity_1.Secretary, (s) => s.createdExamTables),
    (0, typeorm_1.JoinColumn)({ name: 'created_by', referencedColumnName: 'userId' }),
    __metadata("design:type", secretaries_entity_1.Secretary)
], ExamTable.prototype, "createdByRel", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => final_exam_entity_1.FinalExam, (fe) => fe.examTable),
    __metadata("design:type", Array)
], ExamTable.prototype, "finals", void 0);
exports.ExamTable = ExamTable = __decorate([
    (0, typeorm_1.Entity)('exam_table')
], ExamTable);
//# sourceMappingURL=exam_table.entity.js.map