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
const final_exams_service_1 = require("./final-exams.service");
const roles_guard_1 = require("../../auth/roles.guard"); // Importa el RolesGuard
const roles_decorator_1 = require("../../auth/roles.decorator"); // Importa el decorador para roles
const jwt_guard_1 = require("../../auth/jwt.guard"); // Importa el AuthGuard
let FinalExamsController = class FinalExamsController {
    constructor(finalExamsService) {
        this.finalExamsService = finalExamsService;
    }
    async getExamInfo(id) {
        return this.finalExamsService.getExamInfo(parseInt(id)); // Consultar un examen por ID
    }
    async getAllExams() {
        return this.finalExamsService.getAllExams(); // Consultar todos los exámenes
    }
};
exports.FinalExamsController = FinalExamsController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'PRECEPTOR') // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'PRECEPTOR' consultar exámenes
    ,
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinalExamsController.prototype, "getExamInfo", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'PRECEPTOR') // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'PRECEPTOR' consultar todos los exámenes
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinalExamsController.prototype, "getAllExams", null);
exports.FinalExamsController = FinalExamsController = __decorate([
    (0, common_1.Controller)('exams/read'),
    __metadata("design:paramtypes", [final_exams_service_1.FinalExamsService])
], FinalExamsController);
//# sourceMappingURL=final-exams.controller.js.map