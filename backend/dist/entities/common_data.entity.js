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
exports.CommonData = void 0;
const typeorm_1 = require("typeorm");
const users_entity_1 = require("./users.entity");
const address_data_entity_1 = require("./address_data.entity");
let CommonData = class CommonData {
};
exports.CommonData = CommonData;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CommonData.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], CommonData.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => users_entity_1.User, (u) => u.commonData),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", users_entity_1.User)
], CommonData.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_data_id', nullable: true }),
    __metadata("design:type", Number)
], CommonData.prototype, "addressDataId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => address_data_entity_1.AddressData, (a) => a.commonData, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'address_data_id' }),
    __metadata("design:type", address_data_entity_1.AddressData)
], CommonData.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CommonData.prototype, "sex", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'birth_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], CommonData.prototype, "birthDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'birth_place', nullable: true }),
    __metadata("design:type", String)
], CommonData.prototype, "birthPlace", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CommonData.prototype, "nationality", void 0);
exports.CommonData = CommonData = __decorate([
    (0, typeorm_1.Entity)('common_data')
], CommonData);
//# sourceMappingURL=common_data.entity.js.map