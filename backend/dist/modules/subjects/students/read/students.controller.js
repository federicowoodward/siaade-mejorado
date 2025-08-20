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
const students_service_1 = require("./students.service"); // Importa el servicio de estudiantes
const roles_guard_1 = require("../../../auth/roles.guard"); // Importa el RolesGuard
const roles_decorator_1 = require("../../../auth/roles.decorator"); // Importa el decorador para roles
const jwt_guard_1 = require("../../../auth/jwt.guard"); // Importa el AuthGuard
let StudentsController = class StudentsController {
    constructor(studentsService) {
        this.studentsService = studentsService;
    }
    async getStudentInfo(id) {
        return this.studentsService.getStudentInfo(id); // Consultar información de un estudiante por su ID
    }
    async getAllStudents() {
        return this.studentsService.getAllStudents(); // Consultar todos los estudiantes
    }
};
exports.StudentsController = StudentsController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard) // Protege la ruta con los guards
    ,
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'PRECEPTOR') // Permite a los usuarios con estos roles consultar estudiantes
    ,
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "getStudentInfo", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard) // Protege la ruta con los guards
    ,
    (0, roles_decorator_1.Roles)('ADMIN_GENERAL', 'PRECEPTOR') // Permite a los usuarios con estos roles consultar todos los estudiantes
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "getAllStudents", null);
exports.StudentsController = StudentsController = __decorate([
    (0, common_1.Controller)('subjects/students/read') // Ruta para leer la información de los estudiantes
    ,
    __metadata("design:paramtypes", [students_service_1.StudentsService])
], StudentsController);
//# sourceMappingURL=students.controller.js.map