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
exports.FinalExamsController = void 0;
const common_1 = require("@nestjs/common");
const final_exams_service_1 = require("./final-exams.service"); // Servicio de exámenes finales
const final_exam_entity_1 = require("../../../entities/final-exam.entity"); // Entidad de examen final
const roles_guard_1 = require("../../../guards/roles.guard");
const roles_decorator_1 = require("../../users/auth/roles.decorator");
const hierarchy_guard_1 = require("../../../guards/hierarchy.guard");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
let FinalExamsController = class FinalExamsController {
    constructor(finalExamsService) {
        this.finalExamsService = finalExamsService;
    }
    async createExam(examData) {
        return this.finalExamsService.create(examData); // Crear un nuevo examen final
    }
    async updateExam(id, examData) {
        return this.finalExamsService.update(parseInt(id), examData); // Actualizar un examen final
    }
    async deleteExam(id) {
        return this.finalExamsService.delete(parseInt(id)); // Eliminar un examen final
    }
};
exports.FinalExamsController = FinalExamsController;
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL') // Solo los usuarios con rol 'ADMIN_GENERAL' pueden crear exámenes
    ,
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [final_exam_entity_1.FinalExam]),
    __metadata("design:returntype", Promise)
], FinalExamsController.prototype, "createExam", null);
__decorate([
    (0, common_1.Put)('update/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL') // Solo los usuarios con rol 'ADMIN_GENERAL' pueden actualizar exámenes
    ,
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, final_exam_entity_1.FinalExam]),
    __metadata("design:returntype", Promise)
], FinalExamsController.prototype, "updateExam", null);
__decorate([
    (0, common_1.Delete)('delete/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL') // Solo los usuarios con rol 'ADMIN_GENERAL' pueden eliminar exámenes
    ,
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinalExamsController.prototype, "deleteExam", null);
exports.FinalExamsController = FinalExamsController = __decorate([
    (0, common_1.Controller)('exams/manage'),
    __metadata("design:paramtypes", [final_exams_service_1.FinalExamsService])
], FinalExamsController);
//# sourceMappingURL=final-exams.controller.js.map