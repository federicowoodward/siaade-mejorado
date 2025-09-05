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
exports.Preceptor = void 0;
const typeorm_1 = require("typeorm");
const users_entity_1 = require("./users.entity");
const subjects_entity_1 = require("./subjects.entity");
let Preceptor = class Preceptor {
};
exports.Preceptor = Preceptor;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], Preceptor.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => users_entity_1.User, (u) => u.preceptor, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", users_entity_1.User)
], Preceptor.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subjects_entity_1.Subject, (s) => s.preceptorRel),
    __metadata("design:type", Array)
], Preceptor.prototype, "subjects", void 0);
exports.Preceptor = Preceptor = __decorate([
    (0, typeorm_1.Entity)('preceptors')
], Preceptor);
//# sourceMappingURL=preceptors.entity.js.map