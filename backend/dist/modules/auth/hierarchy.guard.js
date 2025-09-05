"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HierarchyGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("./jwt.guard"); // Usamos el AuthGuard que ya tienes implementado
let HierarchyGuard = class HierarchyGuard extends jwt_guard_1.JwtAuthGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user; // Obtén el usuario autenticado desde el JWT
        // Aquí agregas la lógica de jerarquía: verifica si el usuario tiene el rol necesario
        if (user.role && user.role.name === 'ADMIN_GENERAL') {
            return true; // Permite el acceso si el usuario es un ADMIN_GENERAL
        }
        // Si el usuario no tiene el rol necesario, se bloquea el acceso
        return false;
    }
};
exports.HierarchyGuard = HierarchyGuard;
exports.HierarchyGuard = HierarchyGuard = __decorate([
    (0, common_1.Injectable)()
], HierarchyGuard);
//# sourceMappingURL=hierarchy.guard.js.map