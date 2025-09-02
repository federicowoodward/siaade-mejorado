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
const config_1 = require("@nestjs/config");
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
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST'),
                    port: parseInt(config.get('DB_PORT', '5432'), 10),
                    username: config.get('DB_USERNAME'),
                    password: config.get('DB_PASSWORD'),
                    database: config.get('DB_DATABASE'),
                    entities: [user_entity_1.User, subject_entity_1.Subject, final_exam_entity_1.FinalExam, role_entity_1.Role, student_entity_1.Student, exam_entity_1.Exam],
                    synchronize: false,
                    logging: true,
                }),
            }),
        ],
    })
], ConfigModule);
//# sourceMappingURL=config.module.js.map