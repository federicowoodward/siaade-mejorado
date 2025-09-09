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
exports.ExamResultsAliasController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exam_result_entity_1 = require("../../../entities/exam_result.entity");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const roles_decorator_1 = require("../../users/auth/roles.decorator");
let ExamResultsAliasController = class ExamResultsAliasController {
    constructor(repo) {
        this.repo = repo;
    }
    async getAll() {
        // Devolver examId como subjectId para que el front pueda cruzar con subjects directamente
        const rows = await this.repo
            .createQueryBuilder('er')
            .leftJoin('er.exam', 'exam')
            .select([
            'er.id AS id',
            'exam.subject_id AS examId',
            'er.student_id AS studentId',
            'er.score AS score',
        ])
            .getRawMany();
        return rows.map((r) => ({
            id: Number(r.id),
            examId: Number(r.examId),
            studentId: r.studentId,
            score: r.score,
        }));
    }
};
exports.ExamResultsAliasController = ExamResultsAliasController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExamResultsAliasController.prototype, "getAll", null);
exports.ExamResultsAliasController = ExamResultsAliasController = __decorate([
    (0, common_1.Controller)('exam_results'),
    __param(0, (0, typeorm_1.InjectRepository)(exam_result_entity_1.ExamResult)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExamResultsAliasController);
//# sourceMappingURL=exam-results.alias.controller.js.map