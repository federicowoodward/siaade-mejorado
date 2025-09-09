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
exports.SubjectApiController = void 0;
const common_1 = require("@nestjs/common");
const subject_api_service_1 = require("./subject.api.service");
const jwt_auth_guard_1 = require("../../users/auth/jwt-auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const hierarchy_guard_1 = require("../../../guards/hierarchy.guard");
const roles_decorator_1 = require("../../users/auth/roles.decorator");
let SubjectApiController = class SubjectApiController {
    constructor(service) {
        this.service = service;
    }
    // /add-absence
    addAbsence(body) {
        return this.service.addAbsence(body);
    }
    // /list-absences
    listAbsences(body) {
        return this.service.listAbsences(body);
    }
    // /remove-absence
    removeAbsence(body) {
        return this.service.removeAbsence(body);
    }
    // /enroll-student
    enroll(body) {
        return this.service.enroll(body);
    }
    // /unenroll-student
    unenroll(body) {
        return this.service.unenroll(body);
    }
    // /create-exam
    createExam(body) {
        return this.service.createExam(body);
    }
    // /list-exams
    listExams(body) {
        return this.service.listExams(body);
    }
    // /list-exam-results
    listExamResults(body) {
        return this.service.listExamResults(body);
    }
    // /edit-exam
    editExam(body) {
        return this.service.editExam(body);
    }
    // /delete-exam
    deleteExam(id) {
        return this.service.deleteExam({ exam_id: parseInt(id) });
    }
    // /edit-score
    editScore(body) {
        return this.service.editScore(body);
    }
};
exports.SubjectApiController = SubjectApiController;
__decorate([
    (0, common_1.Post)('add-absence'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'PRECEPTOR'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "addAbsence", null);
__decorate([
    (0, common_1.Post)('list-absences'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL', 'ALUMNO'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "listAbsences", null);
__decorate([
    (0, common_1.Post)('remove-absence'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'PRECEPTOR'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "removeAbsence", null);
__decorate([
    (0, common_1.Post)('enroll-student'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SECRETARIO', 'PRECEPTOR', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "enroll", null);
__decorate([
    (0, common_1.Post)('unenroll-student'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SECRETARIO', 'PRECEPTOR', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "unenroll", null);
__decorate([
    (0, common_1.Post)('create-exam'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "createExam", null);
__decorate([
    (0, common_1.Post)('list-exams'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "listExams", null);
__decorate([
    (0, common_1.Post)('list-exam-results'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL', 'ALUMNO'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "listExamResults", null);
__decorate([
    (0, common_1.Put)('edit-exam'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "editExam", null);
__decorate([
    (0, common_1.Delete)('delete-exam/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "deleteExam", null);
__decorate([
    (0, common_1.Post)('edit-score'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectApiController.prototype, "editScore", null);
exports.SubjectApiController = SubjectApiController = __decorate([
    (0, common_1.Controller)('subject'),
    __metadata("design:paramtypes", [subject_api_service_1.SubjectApiService])
], SubjectApiController);
//# sourceMappingURL=subject.api.controller.js.map