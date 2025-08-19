"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("./config/config.module");
const auth_module_1 = require("./modules/users/auth/auth.module");
const users_module_1 = require("./modules/users/manage/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const subjects_module_1 = require("./modules/subjects/manage/subjects.module");
const subjects_module_2 = require("./modules/subjects/read/subjects.module");
const filters_module_1 = require("./shared/filters/filters.module");
const interceptors_module_1 = require("./shared/interceptors/interceptors.module");
const services_module_1 = require("./shared/services/services.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            subjects_module_1.SubjectsManageModule,
            subjects_module_2.SubjectsReadModule,
            filters_module_1.FiltersModule,
            interceptors_module_1.InterceptorsModule,
            services_module_1.ServicesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map