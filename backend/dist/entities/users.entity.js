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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const roles_entity_1 = require("./roles.entity");
const user_info_entity_1 = require("./user_info.entity");
const common_data_entity_1 = require("./common_data.entity");
const students_entity_1 = require("./students.entity");
const teachers_entity_1 = require("./teachers.entity");
const preceptors_entity_1 = require("./preceptors.entity");
const secretaries_entity_1 = require("./secretaries.entity");
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "last_name", nullable: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "cuil", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "role_id" }),
    __metadata("design:type", Number)
], User.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => roles_entity_1.Role, (r) => r.users),
    (0, typeorm_1.JoinColumn)({ name: "role_id" }),
    __metadata("design:type", roles_entity_1.Role)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_info_entity_1.UserInfo, (ui) => ui.user),
    __metadata("design:type", user_info_entity_1.UserInfo)
], User.prototype, "userInfo", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => common_data_entity_1.CommonData, (cd) => cd.user),
    __metadata("design:type", common_data_entity_1.CommonData)
], User.prototype, "commonData", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => students_entity_1.Student, (s) => s.user),
    __metadata("design:type", students_entity_1.Student)
], User.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => teachers_entity_1.Teacher, (t) => t.user),
    __metadata("design:type", teachers_entity_1.Teacher)
], User.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => preceptors_entity_1.Preceptor, (p) => p.user),
    __metadata("design:type", preceptors_entity_1.Preceptor)
], User.prototype, "preceptor", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => secretaries_entity_1.Secretary, (s) => s.user),
    __metadata("design:type", secretaries_entity_1.Secretary)
], User.prototype, "secretary", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)("users")
], User);
//# sourceMappingURL=users.entity.js.map