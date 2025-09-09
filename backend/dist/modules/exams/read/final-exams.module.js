"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalExamsModule = void 0;
const common_1 = require("@nestjs/common");
const final_exams_service_1 = require("./final-exams.service");
const final_exams_controller_1 = require("./final-exams.controller");
const final_exams_alias_controller_1 = require("./final-exams.alias.controller");
const exam_results_alias_controller_1 = require("./exam-results.alias.controller");
const typeorm_1 = require("@nestjs/typeorm");
const final_exam_entity_1 = require("../../../entities/final_exam.entity");
const final_exams_student_entity_1 = require("../../../entities/final_exams_student.entity");
const exam_result_entity_1 = require("../../../entities/exam_result.entity");
let FinalExamsModule = class FinalExamsModule {
};
exports.FinalExamsModule = FinalExamsModule;
exports.FinalExamsModule = FinalExamsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([final_exam_entity_1.FinalExam, final_exams_student_entity_1.FinalExamsStudent, exam_result_entity_1.ExamResult])],
        controllers: [final_exams_controller_1.FinalExamsController, final_exams_alias_controller_1.FinalExamsAliasController, exam_results_alias_controller_1.ExamResultsAliasController],
        providers: [final_exams_service_1.FinalExamsService],
    })
], FinalExamsModule);
//# sourceMappingURL=final-exams.module.js.map