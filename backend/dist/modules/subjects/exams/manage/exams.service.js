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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exams_entity_1 = require("../../../../entities/exams.entity");
let ExamsService = class ExamsService {
    constructor(examsRepository) {
        this.examsRepository = examsRepository;
    }
    async create(examData) {
        const exam = this.examsRepository.create(examData); // Crear el examen
        return this.examsRepository.save(exam); // Guardar el examen en la base de datos
    }
    async update(id, examData) {
        await this.examsRepository.update(id, examData); // Actualizar el examen
        return this.examsRepository.findOne({
            where: { id }
        }); // Retornar el examen actualizado
    }
    async delete(id) {
        await this.examsRepository.delete(id); // Eliminar el examen
    }
    // Métodos para el controlador de lectura
    async getExamInfo(id) {
        return this.examsRepository.findOne({
            where: { id },
            relations: ['subject']
        });
    }
    async getAllExams() {
        return this.examsRepository.find({
            relations: ['subject']
        });
    }
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exams_entity_1.Exam)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExamsService);
//# sourceMappingURL=exams.service.js.map