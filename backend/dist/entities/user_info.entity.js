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
exports.UserInfo = void 0;
const typeorm_1 = require("typeorm");
const users_entity_1 = require("./users.entity");
let UserInfo = class UserInfo {
};
exports.UserInfo = UserInfo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserInfo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], UserInfo.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => users_entity_1.User, (u) => u.userInfo),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", users_entity_1.User)
], UserInfo.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'document_type', nullable: true }),
    __metadata("design:type", String)
], UserInfo.prototype, "documentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'document_value', nullable: true }),
    __metadata("design:type", String)
], UserInfo.prototype, "documentValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserInfo.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'emergency_name', nullable: true }),
    __metadata("design:type", String)
], UserInfo.prototype, "emergencyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'emergency_phone', nullable: true }),
    __metadata("design:type", String)
], UserInfo.prototype, "emergencyPhone", void 0);
exports.UserInfo = UserInfo = __decorate([
    (0, typeorm_1.Entity)('user_info')
], UserInfo);
//# sourceMappingURL=user_info.entity.js.map