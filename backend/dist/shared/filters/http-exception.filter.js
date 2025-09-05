"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const res = host.switchToHttp().getResponse();
        const status = exception?.status || 500;
        // Si es HttpException, intentamos devolver el body completo (incluye 'message' como array en ValidationPipe)
        if (exception instanceof common_1.HttpException) {
            const body = exception.getResponse?.();
            if (body) {
                // body puede ser string u objeto
                if (typeof body === 'string') {
                    return res.status(status).json({ statusCode: status, message: body });
                }
                return res.status(status).json(body);
            }
        }
        // Fallback genérico
        res.status(status).json({
            statusCode: status,
            message: exception?.message || 'Internal Server Error',
            error: 'UnhandledException',
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)() // Este decorador captura cualquier tipo de excepción
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map