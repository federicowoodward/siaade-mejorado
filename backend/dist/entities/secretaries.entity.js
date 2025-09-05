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
exports.Secretary = void 0;
const typeorm_1 = require("typeorm");
const users_entity_1 = require("./users.entity");
const exam_table_entity_1 = require("./exam_table.entity");
let Secretary = class Secretary {
};
exports.Secretary = Secretary;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], Secretary.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => users_entity_1.User, (u) => u.secretary, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", users_entity_1.User)
], Secretary.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_directive', default: false }),
    __metadata("design:type", Boolean)
], Secretary.prototype, "isDirective", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => exam_table_entity_1.ExamTable, (et) => et.createdByRel),
    __metadata("design:type", Array)
], Secretary.prototype, "createdExamTables", void 0);
exports.Secretary = Secretary = __decorate([
    (0, typeorm_1.Entity)('secretaries')
], Secretary);
//# sourceMappingURL=secretaries.entity.js.map