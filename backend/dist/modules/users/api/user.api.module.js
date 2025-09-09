"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserApiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const users_entity_1 = require("../../../entities/users.entity");
const secretaries_entity_1 = require("../../../entities/secretaries.entity");
const preceptors_entity_1 = require("../../../entities/preceptors.entity");
const teachers_entity_1 = require("../../../entities/teachers.entity");
const students_entity_1 = require("../../../entities/students.entity");
const user_info_entity_1 = require("../../../entities/user_info.entity");
const common_data_entity_1 = require("../../../entities/common_data.entity");
const address_data_entity_1 = require("../../../entities/address_data.entity");
const roles_entity_1 = require("../../../entities/roles.entity");
const user_api_service_1 = require("./user.api.service");
const user_api_controller_1 = require("./user.api.controller");
let UserApiModule = class UserApiModule {
};
exports.UserApiModule = UserApiModule;
exports.UserApiModule = UserApiModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([users_entity_1.User, secretaries_entity_1.Secretary, preceptors_entity_1.Preceptor, teachers_entity_1.Teacher, students_entity_1.Student, user_info_entity_1.UserInfo, common_data_entity_1.CommonData, address_data_entity_1.AddressData, roles_entity_1.Role])],
        controllers: [user_api_controller_1.UserApiController],
        providers: [user_api_service_1.UserApiService],
    })
], UserApiModule);
//# sourceMappingURL=user.api.module.js.map