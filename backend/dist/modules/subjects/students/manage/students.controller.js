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
exports.StudentsController = void 0;
const common_1 = require("@nestjs/common");
const students_service_1 = require("./students.service"); // Importa el servicio
const students_entity_1 = require("../../../../entities/students.entity"); // Entidad de estudiante
const roles_guard_1 = require("../../../../guards/roles.guard");
const roles_decorator_1 = require("../../../users/auth/roles.decorator"); // Decorador para roles
const hierarchy_guard_1 = require("../../../../guards/hierarchy.guard");
const jwt_auth_guard_1 = require("../../../../guards/jwt-auth.guard");
let StudentsController = class StudentsController {
    constructor(studentsService) {
        this.studentsService = studentsService;
    }
    async enrollStudent(studentData) {
        return this.studentsService.enroll(studentData); // Inscribir un estudiante en una materia
    }
    async updateStudent(id, studentData) {
        return this.studentsService.update(id, studentData); // Actualizar los datos de un estudiante
    }
    async unenrollStudent(id) {
        return this.studentsService.unenroll(id); // Eliminar la inscripción de un estudiante
    }
};
exports.StudentsController = StudentsController;
__decorate([
    (0, common_1.Post)('enroll'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard) // Aplica los guards
    ,
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'SECRETARIO') // Solo los usuarios con estos roles pueden inscribir estudiantes
    ,
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [students_entity_1.Student]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "enrollStudent", null);
__decorate([
    (0, common_1.Put)('update/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard) // Aplica los guards
    ,
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'SECRETARIO') // Solo los usuarios con estos roles pueden actualizar estudiantes
    ,
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, students_entity_1.Student]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "updateStudent", null);
__decorate([
    (0, common_1.Delete)('unenroll/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard) // Aplica los guards
    ,
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'SECRETARIO') // Solo los usuarios con estos roles pueden desinscribir estudiantes
    ,
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "unenrollStudent", null);
exports.StudentsController = StudentsController = __decorate([
    (0, common_1.Controller)('subjects/students/manage') // Ruta para gestionar estudiantes
    ,
    __metadata("design:paramtypes", [students_service_1.StudentsService])
], StudentsController);
//# sourceMappingURL=students.controller.js.map