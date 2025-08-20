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
exports.ExamsController = void 0;
const common_1 = require("@nestjs/common");
const exams_service_1 = require("./exams.service"); // Importa el servicio de exámenes
const exam_entity_1 = require("../../../../entities/exam.entity"); // Asegúrate de tener la entidad Exam
const roles_guard_1 = require("../../../auth/roles.guard"); // Importa el RolesGuard
const roles_decorator_1 = require("../../../auth/roles.decorator"); // Importa el decorador para roles
const hierarchy_guard_1 = require("../../../auth/hierarchy.guard"); // Importa el HierarchyGuard
const jwt_guard_1 = require("../../../auth/jwt.guard"); // Importa el AuthGuard
let ExamsController = class ExamsController {
    constructor(examsService) {
        this.examsService = examsService;
    }
    async createExam(examData) {
        return this.examsService.create(examData); // Crear un nuevo examen para una materia
    }
    async updateExam(id, examData) {
        return this.examsService.update(parseInt(id), examData); // Actualizar un examen para una materia
    }
    async deleteExam(id) {
        return this.examsService.delete(id); // Eliminar un examen de una materia
    }
};
exports.ExamsController = ExamsController;
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard) // Protege la ruta con los guards
    ,
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'SECRETARIO') // Solo los usuarios con rol 'ADMIN_GENERAL' o 'SECRETARIO' pueden crear exámenes
    ,
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exam_entity_1.Exam]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "createExam", null);
__decorate([
    (0, common_1.Put)('update/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard) // Protege la ruta con los guards
    ,
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'SECRETARIO') // Solo los usuarios con rol 'ADMIN_GENERAL' o 'SECRETARIO' pueden editar exámenes
    ,
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exam_entity_1.Exam]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "updateExam", null);
__decorate([
    (0, common_1.Delete)('delete/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard) // Protege la ruta con los guards
    ,
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'SECRETARIO') // Solo los usuarios con rol 'ADMIN_GENERAL' o 'SECRETARIO' pueden eliminar exámenes
    ,
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "deleteExam", null);
exports.ExamsController = ExamsController = __decorate([
    (0, common_1.Controller)('subjects/exams/manage'),
    __metadata("design:paramtypes", [exams_service_1.ExamsService])
], ExamsController);
//# sourceMappingURL=exams.controller.js.map