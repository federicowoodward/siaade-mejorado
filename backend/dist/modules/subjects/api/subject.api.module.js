"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectApiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const subject_api_service_1 = require("./subject.api.service");
const subject_api_controller_1 = require("./subject.api.controller");
const subjects_entity_1 = require("../../../entities/subjects.entity");
const subject_absence_entity_1 = require("../../../entities/subject_absence.entity");
const subject_student_entity_1 = require("../../../entities/subject_student.entity");
const exams_entity_1 = require("../../../entities/exams.entity");
const exam_result_entity_1 = require("../../../entities/exam_result.entity");
const students_entity_1 = require("../../../entities/students.entity");
let SubjectApiModule = class SubjectApiModule {
};
exports.SubjectApiModule = SubjectApiModule;
exports.SubjectApiModule = SubjectApiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([subjects_entity_1.Subject, subject_absence_entity_1.SubjectAbsence, subject_student_entity_1.SubjectStudent, exams_entity_1.Exam, exam_result_entity_1.ExamResult, students_entity_1.Student])
        ],
        controllers: [subject_api_controller_1.SubjectApiController],
        providers: [subject_api_service_1.SubjectApiService],
    })
], SubjectApiModule);
//# sourceMappingURL=subject.api.module.js.map