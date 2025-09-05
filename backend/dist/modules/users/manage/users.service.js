"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const users_entity_1 = require("../../../entities/users.entity");
const roles_entity_1 = require("../../../entities/roles.entity");
let UsersService = class UsersService {
    constructor(usersRepository, rolesRepository) {
        this.usersRepository = usersRepository;
        this.rolesRepository = rolesRepository;
    }
    async create(createUserDto) {
        // Verificar que el rol existe
        const role = await this.rolesRepository.findOne({
            where: { id: createUserDto.roleId }
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        const savedUser = await this.usersRepository.save(user);
        return this.mapToResponseDto(savedUser, role);
    }
    async findAll() {
        const users = await this.usersRepository.find({
            relations: ['role'],
        });
        return users.map(user => this.mapToResponseDto(user, user.role));
    }
    async findById(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.mapToResponseDto(user, user.role);
    }
    async update(id, updateUserDto) {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        // Si se proporciona una nueva contraseña, hashearla
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        // Si se cambia el rol, verificar que existe
        let role = user.role;
        if (updateUserDto.roleId && updateUserDto.roleId !== user.roleId) {
            const newRole = await this.rolesRepository.findOne({
                where: { id: updateUserDto.roleId }
            });
            if (!newRole) {
                throw new common_1.NotFoundException('Role not found');
            }
            role = newRole;
        }
        await this.usersRepository.update(id, updateUserDto);
        const updatedUser = await this.usersRepository.findOne({
            where: { id },
            relations: ['role'],
        });
        if (!updatedUser) {
            throw new common_1.NotFoundException('User not found after update');
        }
        return this.mapToResponseDto(updatedUser, updatedUser.role);
    }
    async delete(id) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.usersRepository.delete(id);
    }
    mapToResponseDto(user, role) {
        return {
            id: user.id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            cuil: user.cuil,
            roleId: user.roleId,
            role: role ? {
                id: role.id,
                name: role.name,
            } : undefined,
        };
    }
    // Método para validar usuario por email y contraseña (usado por Auth)
    async validateUser(email, password) {
        try {
            const user = await this.usersRepository.findOne({
                where: { email },
                relations: ['role']
            });
            if (user && await bcrypt.compare(password, user.password)) {
                return user;
            }
            return null;
        }
        catch (error) {
            throw new common_1.BadRequestException('Error al validar usuario: ' + error.message);
        }
    }
    // Métodos para el controlador de lectura
    async getUserInfo(id) {
        return this.findById(id);
    }
    async getAllUsers() {
        return this.findAll();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(roles_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map