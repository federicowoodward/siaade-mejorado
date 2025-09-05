"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_strategy_1 = require("./jwt.strategy"); // Estrategia personalizada de JWT
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const users_module_1 = require("../users/manage/users.module"); // Asegúrate de tener acceso al módulo de usuarios
const users_entity_1 = require("../../entities/users.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            typeorm_1.TypeOrmModule.forFeature([users_entity_1.User]), // Para que JwtStrategy pueda usar el User repository
            jwt_1.JwtModule.register({
                secret: 'SECRET_KEY', // Esto debería ser más seguro en producción
                signOptions: { expiresIn: '3600s' }, // Duración del token en segundos
            }),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule), // Uso de forwardRef para evitar dependencia circular
        ],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy],
        controllers: [auth_controller_1.AuthController],
        exports: [jwt_strategy_1.JwtStrategy, passport_1.PassportModule], // Exportar para que otros módulos puedan usar la estrategia
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map