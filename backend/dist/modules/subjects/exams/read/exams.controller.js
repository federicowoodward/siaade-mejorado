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
const exams_service_1 = require("./exams.service");
const roles_guard_1 = require("../../../auth/roles.guard"); // Importa el RolesGuard
const roles_decorator_1 = require("../../../auth/roles.decorator"); // Importa el decorador para roles
const jwt_guard_1 = require("../../../auth/jwt.guard"); // Importa el AuthGuard
let ExamsController = class ExamsController {
    constructor(examsService) {
        this.examsService = examsService;
    }
    async getExamInfo(id) {
        return this.examsService.getExamInfo(parseInt(id)); // Consultar información de un examen por ID
    }
    async getAllExams() {
        return this.examsService.getAllExams(); // Listar todos los exámenes de una materia
    }
};
exports.ExamsController = ExamsController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'PRECEPTOR') // Permite a los roles ADMIN_GENERAL y PRECEPTOR acceder
    ,
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "getExamInfo", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'PRECEPTOR') // Permite a los roles ADMIN_GENERAL y PRECEPTOR acceder
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "getAllExams", null);
exports.ExamsController = ExamsController = __decorate([
    (0, common_1.Controller)('subjects/exams/read'),
    __metadata("design:paramtypes", [exams_service_1.ExamsService])
], ExamsController);
//# sourceMappingURL=exams.controller.js.map