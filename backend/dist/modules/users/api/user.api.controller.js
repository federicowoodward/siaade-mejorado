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
exports.UserApiController = void 0;
const common_1 = require("@nestjs/common");
const user_api_service_1 = require("./user.api.service");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../../../guards/roles.guard");
const hierarchy_guard_1 = require("../../../guards/hierarchy.guard");
const owner_guard_1 = require("../../../guards/owner.guard");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let UserApiController = class UserApiController {
    constructor(service) {
        this.service = service;
    }
    // /sign-in - manejado por módulo auth existente; no exponemos aquí
    // /reset-password (POST MVP) - asumimos ruta en módulo auth, no duplicar
    // /secretarie/up
    secretarieUp(body) { return this.service.secretarieUp(body); }
    // /preceptor
    preceptor(body) { return this.service.createPreceptor(body); }
    // /teacher
    teacher(body) { return this.service.createTeacher(body); }
    // /student
    student(body) { return this.service.createStudent(body); }
    // /delete
    delete(id) { return this.service.deleteUser(id); }
    // /edit
    edit(id, body) { return this.service.editUser(id, body); }
    // /list:rol
    listByRole(rol) { return this.service.listByRole(rol); }
    // /list-all:rol
    listAllByRole(rol) { return this.service.listAllByRole(rol); }
    // /list-user:id
    getUser(id) { return this.service.getUser(id); }
};
exports.UserApiController = UserApiController;
__decorate([
    (0, common_1.Post)('secretarie/up'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserApiController.prototype, "secretarieUp", null);
__decorate([
    (0, common_1.Post)('preceptor'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserApiController.prototype, "preceptor", null);
__decorate([
    (0, common_1.Post)('teacher'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserApiController.prototype, "teacher", null);
__decorate([
    (0, common_1.Post)('student'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserApiController.prototype, "student", null);
__decorate([
    (0, common_1.Delete)('delete/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard),
    (0, roles_decorator_1.Roles)('PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserApiController.prototype, "delete", null);
__decorate([
    (0, common_1.Put)('edit/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, hierarchy_guard_1.HierarchyGuard, owner_guard_1.OwnerGuard),
    (0, roles_decorator_1.Roles)('DOCENTE', 'ALUMNO', 'PRECEPTOR', 'SECRETARIO', 'ADMIN_GENERAL'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UserApiController.prototype, "edit", null);
__decorate([
    (0, common_1.Get)('list/:rol'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'SECRETARIO', 'PRECEPTOR'),
    __param(0, (0, common_1.Param)('rol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserApiController.prototype, "listByRole", null);
__decorate([
    (0, common_1.Get)('list-all/:rol'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'SECRETARIO'),
    __param(0, (0, common_1.Param)('rol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserApiController.prototype, "listAllByRole", null);
__decorate([
    (0, common_1.Get)('list-user/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'SECRETARIO', 'PRECEPTOR', 'DOCENTE', 'ALUMNO'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserApiController.prototype, "getUser", null);
exports.UserApiController = UserApiController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_api_service_1.UserApiService])
], UserApiController);
//# sourceMappingURL=user.api.controller.js.map