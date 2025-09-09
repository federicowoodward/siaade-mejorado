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
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const roles_util_1 = require("../shared/utils/roles.util");
let HierarchyGuard = class HierarchyGuard extends jwt_auth_guard_1.JwtAuthGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const targetId = request.params?.id || request.body?.id;
        const canon = (0, roles_util_1.toCanonicalRole)(user?.role?.name, { isDirective: user?.isDirective });
        if (!canon)
            return false;
        // Superiores
        if (canon === 'ADMIN_GENERAL' || canon === 'SECRETARIO_DIRECTIVO')
            return true;
        // SECRETARIO común y PRECEPTOR: admitimos, la lógica fina se valida en el servicio/controlador
        if (canon === 'SECRETARIO' || canon === 'PRECEPTOR')
            return true;
        // Docente/Alumno: solo permitimos si es sobre sí mismo (edición propia)
        if ((canon === 'DOCENTE' || canon === 'ALUMNO') && targetId && user?.id === targetId) {
            return true;
        }
        return false;
    }
};
exports.HierarchyGuard = HierarchyGuard;
exports.HierarchyGuard = HierarchyGuard = __decorate([
    (0, common_1.Injectable)()
], HierarchyGuard);
//# sourceMappingURL=hierarchy.guard.js.map