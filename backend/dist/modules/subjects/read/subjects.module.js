"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectsReadModule = void 0;
const common_1 = require("@nestjs/common");
const subjects_service_1 = require("./subjects.service");
const subjects_controller_1 = require("./subjects.controller");
const subjects_alias_controller_1 = require("./subjects.alias.controller");
const typeorm_1 = require("@nestjs/typeorm");
const subjects_entity_1 = require("../../../entities/subjects.entity");
const auth_module_1 = require("../../users/auth/auth.module");
let SubjectsReadModule = class SubjectsReadModule {
};
exports.SubjectsReadModule = SubjectsReadModule;
exports.SubjectsReadModule = SubjectsReadModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([subjects_entity_1.Subject]),
            auth_module_1.AuthModule, // Importar AuthModule para usar JwtStrategy
        ],
        controllers: [subjects_controller_1.SubjectsController, subjects_alias_controller_1.SubjectsAliasController],
        providers: [subjects_service_1.SubjectsService],
    })
], SubjectsReadModule);
//# sourceMappingURL=subjects.module.js.map