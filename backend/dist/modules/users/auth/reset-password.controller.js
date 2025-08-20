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
exports.ResetPasswordController = void 0;
// src/modules/users/auth/reset-password.controller.ts
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../../auth/auth.service"); // Importa el servicio de autenticación
const reset_password_dto_1 = require("./reset-password.dto"); // El DTO para recibir los datos de restablecimiento
let ResetPasswordController = class ResetPasswordController {
    constructor(authService) {
        this.authService = authService;
    }
    async resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto); // Llama al servicio para restablecer la contraseña
    }
};
exports.ResetPasswordController = ResetPasswordController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], ResetPasswordController.prototype, "resetPassword", null);
exports.ResetPasswordController = ResetPasswordController = __decorate([
    (0, common_1.Controller)('reset-password') // Ruta para restablecer la contraseña
    ,
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], ResetPasswordController);
//# sourceMappingURL=reset-password.controller.js.map