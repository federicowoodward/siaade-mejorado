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
var RolesGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("../modules/users/auth/roles.decorator");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const roles_util_1 = require("../shared/utils/roles.util");
let RolesGuard = RolesGuard_1 = class RolesGuard extends jwt_auth_guard_1.JwtAuthGuard {
    constructor(reflector) {
        super();
        this.reflector = reflector;
        this.logger = new common_1.Logger(RolesGuard_1.name);
    }
    canActivate(context) {
        const requiredRoles = this.reflector.get(roles_decorator_1.ROLES_KEY, context.getHandler());
        if (!requiredRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.role || !user.role.name) {
            this.logger.warn(`Denied: user or role missing`);
            return false;
        }
        const canonicalUser = (0, roles_util_1.toCanonicalRole)(user.role.name, { isDirective: user.isDirective });
        const requiredCanonical = (0, roles_util_1.normalizeRequiredRoles)(requiredRoles);
        if (!canonicalUser) {
            this.logger.warn(`Denied: cannot map user role '${user.role.name}' (isDirective=${user.isDirective ?? false})`);
            return false;
        }
        const allowed = requiredCanonical.includes(canonicalUser) || canonicalUser === 'ADMIN_GENERAL' || canonicalUser === 'SECRETARIO_DIRECTIVO';
        if (!allowed) {
            this.logger.warn(`Denied: user=${canonicalUser} required=${requiredCanonical.join(',')}`);
        }
        return allowed;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = RolesGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map