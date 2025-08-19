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
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("./roles.decorator"); // Usamos la clave definida en el decorador
const jwt_guard_1 = require("./jwt.guard"); // Usamos el AuthGuard que ya tienes implementado
let RolesGuard = class RolesGuard extends jwt_guard_1.JwtAuthGuard {
    constructor(reflector) {
        super();
        this.reflector = reflector;
    }
    canActivate(context) {
        const roles = this.reflector.get(roles_decorator_1.ROLES_KEY, context.getHandler()); // Recupera los roles permitidos de la metadata de la ruta
        if (!roles) {
            return true; // Si no hay roles especificados, dejamos que pase
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user; // El usuario que está haciendo la solicitud
        return roles.some(role => user.roles?.includes(role)); // Verifica si el rol del usuario coincide con alguno de los roles permitidos
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map