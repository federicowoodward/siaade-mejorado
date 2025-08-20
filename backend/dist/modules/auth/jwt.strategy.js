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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const passport_jwt_2 = require("passport-jwt");
const users_service_1 = require("../users/manage/users.service"); // Para obtener los datos del usuario
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../entities/user.entity");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(usersService, usersRepository) {
        super({
            secretOrKey: 'SECRET_KEY', // El secreto de la aplicación para validar el JWT
            jwtFromRequest: passport_jwt_2.ExtractJwt.fromAuthHeaderAsBearerToken(), // Extrae el JWT desde el header 'Authorization'
        });
        this.usersService = usersService;
        this.usersRepository = usersRepository;
    }
    async validate(payload) {
        const user = await this.usersRepository.findOne({
            where: { id: payload.sub },
            relations: ['role']
        }); // Busca al usuario usando el ID del JWT
        return user;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        typeorm_2.Repository])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map