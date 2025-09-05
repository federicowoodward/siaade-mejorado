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
exports.UserApiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const users_entity_1 = require("../../../entities/users.entity");
const roles_entity_1 = require("../../../entities/roles.entity");
const secretaries_entity_1 = require("../../../entities/secretaries.entity");
const preceptors_entity_1 = require("../../../entities/preceptors.entity");
const teachers_entity_1 = require("../../../entities/teachers.entity");
const students_entity_1 = require("../../../entities/students.entity");
const user_info_entity_1 = require("../../../entities/user_info.entity");
const common_data_entity_1 = require("../../../entities/common_data.entity");
const address_data_entity_1 = require("../../../entities/address_data.entity");
const bcrypt = __importStar(require("bcryptjs"));
let UserApiService = class UserApiService {
    constructor(userRepo, roleRepo, secRepo, preRepo, teacherRepo, studentRepo, infoRepo, commonRepo, addressRepo) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.secRepo = secRepo;
        this.preRepo = preRepo;
        this.teacherRepo = teacherRepo;
        this.studentRepo = studentRepo;
        this.infoRepo = infoRepo;
        this.commonRepo = commonRepo;
        this.addressRepo = addressRepo;
    }
    // Helpers
    async ensureRole(name) {
        const r = await this.roleRepo.findOne({ where: { name } });
        if (!r)
            throw new common_1.NotFoundException(`Role ${name} not found`);
        return r;
    }
    async createBaseUser(payload, roleName) {
        const role = await this.ensureRole(roleName);
        const user = this.userRepo.create({
            name: payload.name,
            lastName: payload.last_name ?? payload.lastName,
            email: payload.email,
            password: payload.password ? await bcrypt.hash(payload.password, 10) : undefined,
            cuil: payload.cuil,
            roleId: role.id,
        });
        return this.userRepo.save(user);
    }
    // Secretarie up
    async secretarieUp(body) {
        const user = await this.createBaseUser(body, 'secretary');
        const sec = this.secRepo.create({ userId: user.id, isDirective: !!body.is_directive });
        await this.secRepo.save(sec);
        return { user, secretary: sec };
    }
    async createPreceptor(body) {
        const user = await this.createBaseUser(body, 'preceptor');
        await this.preRepo.save(this.preRepo.create({ userId: user.id }));
        const info = await this.upsertPersonInfo(user.id, body);
        return { user, info };
    }
    async createTeacher(body) {
        const user = await this.createBaseUser(body, 'teacher');
        await this.teacherRepo.save(this.teacherRepo.create({ userId: user.id }));
        const info = await this.upsertPersonInfo(user.id, body);
        return { user, info };
    }
    async createStudent(body) {
        const user = await this.createBaseUser(body, 'student');
        await this.studentRepo.save(this.studentRepo.create({ userId: user.id, legajo: body.legajo ?? null }));
        const info = await this.upsertPersonInfo(user.id, body);
        return { user, info };
    }
    async upsertPersonInfo(userId, body) {
        const info = this.infoRepo.create({
            userId,
            documentType: body.document_type,
            documentValue: body.document_value,
            phone: body.phone,
            emergencyName: body.emergency_name,
            emergencyPhone: body.emergency_phone,
        });
        await this.infoRepo.save(info);
        // Crear AddressData primero si hay datos de dirección
        let addr;
        if (body.street || body.locality || body.country) {
            addr = this.addressRepo.create({
                street: body.street,
                number: body.number,
                floor: body.floor,
                apartment: body.apartment,
                neighborhood: body.neighborhood,
                locality: body.locality,
                province: body.province,
                postalCode: body.postal_code,
                country: body.country,
            });
            addr = await this.addressRepo.save(addr);
        }
        const common = this.commonRepo.create({
            userId,
            addressDataId: addr?.id ?? null,
            sex: body.sex,
            birthDate: body.birth_date ? new Date(body.birth_date) : null,
            birthPlace: body.birth_place,
            nationality: body.nationality,
        });
        await this.commonRepo.save(common);
        return { info, common, address: addr };
    }
    async deleteUser(id) {
        // Por cascada en entidades relacionadas, borrar usuario elimina resto
        const exists = await this.userRepo.findOne({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('User not found');
        await this.userRepo.delete(id);
        return { ok: true };
    }
    async editUser(id, body) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (body.password)
            body.password = await bcrypt.hash(body.password, 10);
        await this.userRepo.update(id, {
            name: body.name ?? user.name,
            lastName: (body.last_name ?? body.lastName) ?? user.lastName,
            email: body.email ?? user.email,
            password: body.password ?? user.password,
            cuil: body.cuil ?? user.cuil,
        });
        // Datos extra si llegan
        if (body.edit_data) {
            const { info, common, address } = body.edit_data;
            if (info)
                await this.infoRepo.upsert({ userId: id, ...info }, ['userId']);
            if (common)
                await this.commonRepo.upsert({ userId: id, ...common }, ['userId']);
            if (address)
                await this.addressRepo.upsert({ userId: id, ...address }, ['userId']);
        }
        return this.getUser(id);
    }
    async listByRole(rol) {
        const role = await this.roleRepo.findOne({ where: { name: rol } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        const users = await this.userRepo.find({ where: { roleId: role.id } });
        return users;
    }
    async listAllByRole(rol) {
        const role = await this.roleRepo.findOne({ where: { name: rol } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        const users = await this.userRepo.find({ where: { roleId: role.id }, relations: ['userInfo', 'commonData', 'teacher', 'student', 'preceptor', 'secretary'] });
        return users;
    }
    async getUser(id) {
        const user = await this.userRepo.findOne({ where: { id }, relations: ['role', 'userInfo', 'commonData', 'teacher', 'student', 'preceptor', 'secretary'] });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
};
exports.UserApiService = UserApiService;
exports.UserApiService = UserApiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(roles_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(secretaries_entity_1.Secretary)),
    __param(3, (0, typeorm_1.InjectRepository)(preceptors_entity_1.Preceptor)),
    __param(4, (0, typeorm_1.InjectRepository)(teachers_entity_1.Teacher)),
    __param(5, (0, typeorm_1.InjectRepository)(students_entity_1.Student)),
    __param(6, (0, typeorm_1.InjectRepository)(user_info_entity_1.UserInfo)),
    __param(7, (0, typeorm_1.InjectRepository)(common_data_entity_1.CommonData)),
    __param(8, (0, typeorm_1.InjectRepository)(address_data_entity_1.AddressData)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UserApiService);
//# sourceMappingURL=user.api.service.js.map