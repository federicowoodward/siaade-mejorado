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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalExamsAliasController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const final_exam_entity_1 = require("../../../entities/final_exam.entity");
const final_exams_student_entity_1 = require("../../../entities/final_exams_student.entity");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const roles_decorator_1 = require("../../users/auth/roles.decorator");
let FinalExamsAliasController = class FinalExamsAliasController {
    constructor(finalExamsRepo, finalsStudentsRepo) {
        this.finalExamsRepo = finalExamsRepo;
        this.finalsStudentsRepo = finalsStudentsRepo;
    }
    async getAllFinalExams() {
        return this.finalExamsRepo.find();
    }
    async getAllFinalExamsStudents() {
        return this.finalsStudentsRepo.find();
    }
};
exports.FinalExamsAliasController = FinalExamsAliasController;
__decorate([
    (0, common_1.Get)('final_exams'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinalExamsAliasController.prototype, "getAllFinalExams", null);
__decorate([
    (0, common_1.Get)('final_exams_students'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinalExamsAliasController.prototype, "getAllFinalExamsStudents", null);
exports.FinalExamsAliasController = FinalExamsAliasController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, typeorm_1.InjectRepository)(final_exam_entity_1.FinalExam)),
    __param(1, (0, typeorm_1.InjectRepository)(final_exams_student_entity_1.FinalExamsStudent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FinalExamsAliasController);
//# sourceMappingURL=final-exams.alias.controller.js.map