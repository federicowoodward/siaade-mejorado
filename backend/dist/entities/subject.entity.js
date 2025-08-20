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
exports.Subject = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let Subject = class Subject {
};
exports.Subject = Subject;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Subject.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subject_name', nullable: true }),
    __metadata("design:type", String)
], Subject.prototype, "subjectName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Subject.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Subject.prototype, "preceptor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'course_num', nullable: true }),
    __metadata("design:type", Number)
], Subject.prototype, "courseNum", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'course_letter', nullable: true }),
    __metadata("design:type", String)
], Subject.prototype, "courseLetter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'course_year', nullable: true }),
    __metadata("design:type", String)
], Subject.prototype, "courseYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Subject.prototype, "correlative", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'teacher' }),
    __metadata("design:type", user_entity_1.User)
], Subject.prototype, "teacherUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'preceptor' }),
    __metadata("design:type", user_entity_1.User)
], Subject.prototype, "preceptorUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Subject),
    (0, typeorm_1.JoinColumn)({ name: 'correlative' }),
    __metadata("design:type", Subject)
], Subject.prototype, "correlativeSubject", void 0);
exports.Subject = Subject = __decorate([
    (0, typeorm_1.Entity)('subjects')
], Subject);
//# sourceMappingURL=subject.entity.js.map