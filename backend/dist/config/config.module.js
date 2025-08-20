"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../entities/user.entity");
const subject_entity_1 = require("../entities/subject.entity");
const final_exam_entity_1 = require("../entities/final-exam.entity");
const role_entity_1 = require("../entities/role.entity");
const student_entity_1 = require("../entities/student.entity");
const exam_entity_1 = require("../entities/exam.entity");
let ConfigModule = class ConfigModule {
};
exports.ConfigModule = ConfigModule;
exports.ConfigModule = ConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: 'localhost',
                port: 5433,
                username: 'postgres',
                password: 'Joeldatabase*',
                database: 'dbsiaade',
                entities: [user_entity_1.User, subject_entity_1.Subject, final_exam_entity_1.FinalExam, role_entity_1.Role, student_entity_1.Student, exam_entity_1.Exam],
                synchronize: false, // Como ya tenemos la DB creada, no sincronizamos
                logging: true, // Para debug
            }),
        ],
    })
], ConfigModule);
//# sourceMappingURL=config.module.js.map