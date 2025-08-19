"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamsModule = void 0;
const common_1 = require("@nestjs/common");
const exams_controller_1 = require("./exams.controller"); // Controlador de exámenes (lectura)
const exams_service_1 = require("./exams.service"); // Servicio de exámenes (lectura)
const typeorm_1 = require("@nestjs/typeorm");
const exam_entity_1 = require("../../../../entities/exam.entity"); // Asegúrate de tener la entidad Exam
let ExamsModule = class ExamsModule {
};
exports.ExamsModule = ExamsModule;
exports.ExamsModule = ExamsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([exam_entity_1.Exam])], // Importa la entidad Exam
        controllers: [exams_controller_1.ExamsController], // Controlador de lectura de exámenes
        providers: [exams_service_1.ExamsService], // Servicio de lectura de exámenes
    })
], ExamsModule);
//# sourceMappingURL=exams.module.js.map