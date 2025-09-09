"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
let OwnerGuard = class OwnerGuard extends jwt_auth_guard_1.JwtAuthGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const targetId = request.params?.id || request.body?.id || request.body?.userId;
        if (!user?.id || !targetId)
            return false;
        return user.id === targetId;
    }
};
exports.OwnerGuard = OwnerGuard;
exports.OwnerGuard = OwnerGuard = __decorate([
    (0, common_1.Injectable)()
], OwnerGuard);
//# sourceMappingURL=owner.guard.js.map