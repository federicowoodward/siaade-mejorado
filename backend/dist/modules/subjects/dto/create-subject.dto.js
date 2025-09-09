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
exports.CreateSubjectDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateSubjectDto {
}
exports.CreateSubjectDto = CreateSubjectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "subjectName", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => (value && typeof value === 'object' && value.id ? value.id : value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9a-fA-F-]{36}$/),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "teacher", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => (value && typeof value === 'object' && value.id ? value.id : value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9a-fA-F-]{36}$/),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "preceptor", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => {
        const n = parseInt(String(value), 10);
        return Number.isNaN(n) ? value : n;
    }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "courseNum", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => String(value).toUpperCase()),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "courseLetter", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "courseYear", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === null || value === undefined || value === '')
            return undefined;
        const n = parseInt(String(value), 10);
        return Number.isNaN(n) ? undefined : n;
    }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSubjectDto.prototype, "correlative", void 0);
//# sourceMappingURL=create-subject.dto.js.map