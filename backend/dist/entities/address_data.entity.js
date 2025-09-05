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
exports.AddressData = void 0;
const typeorm_1 = require("typeorm");
const common_data_entity_1 = require("./common_data.entity");
let AddressData = class AddressData {
};
exports.AddressData = AddressData;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AddressData.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AddressData.prototype, "street", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AddressData.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AddressData.prototype, "floor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AddressData.prototype, "apartment", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AddressData.prototype, "neighborhood", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AddressData.prototype, "locality", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AddressData.prototype, "province", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'postal_code', nullable: true }),
    __metadata("design:type", String)
], AddressData.prototype, "postalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AddressData.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => common_data_entity_1.CommonData, (cd) => cd.address),
    __metadata("design:type", Array)
], AddressData.prototype, "commonData", void 0);
exports.AddressData = AddressData = __decorate([
    (0, typeorm_1.Entity)('address_data')
], AddressData);
//# sourceMappingURL=address_data.entity.js.map