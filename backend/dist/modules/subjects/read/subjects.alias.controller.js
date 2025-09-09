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
exports.SubjectsAliasController = void 0;
const common_1 = require("@nestjs/common");
const subjects_service_1 = require("./subjects.service");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const roles_decorator_1 = require("../../users/auth/roles.decorator");
let SubjectsAliasController = class SubjectsAliasController {
    constructor(subjectsService) {
        this.subjectsService = subjectsService;
    }
    async getAllSubjects() {
        return this.subjectsService.getAllSubjects();
    }
};
exports.SubjectsAliasController = SubjectsAliasController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubjectsAliasController.prototype, "getAllSubjects", null);
exports.SubjectsAliasController = SubjectsAliasController = __decorate([
    (0, common_1.Controller)('subjects'),
    __metadata("design:paramtypes", [subjects_service_1.SubjectsService])
], SubjectsAliasController);
//# sourceMappingURL=subjects.alias.controller.js.map