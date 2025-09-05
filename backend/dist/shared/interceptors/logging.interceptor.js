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
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../decorators/public.decorator");
let LoggingInterceptor = class LoggingInterceptor {
    constructor(jwtService, reflector) {
        this.jwtService = jwtService;
        this.reflector = reflector;
    }
    intercept(context, next) {
        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, url, ip } = request;
        // Verificar si la ruta está marcada como pública
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        // Lista adicional de rutas públicas por URL
        const publicUrls = [
            '/api/docs',
            '/api',
            '/api/auth/login',
            '/api/auth/sign-in',
            '/api/auth/reset-password',
        ];
        const isPublicUrl = publicUrls.some(route => url.startsWith(route));
        if (!isPublic && !isPublicUrl) {
            // Extraer token JWT del header Authorization
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                console.log(`❌ Unauthorized access attempt to ${method} ${url} from ${ip}`);
                throw new common_1.UnauthorizedException('Token de acceso requerido');
            }
            const token = authHeader.substring(7); // Remover 'Bearer '
            try {
                // Verificar y decodificar el token
                const payload = this.jwtService.verify(token);
                request.user = payload; // Agregar usuario al request
                console.log(`🔐 JWT validated for user: ${payload.email || payload.username} accessing ${method} ${url}`);
            }
            catch (error) {
                console.log(`❌ Invalid JWT token for ${method} ${url} from ${ip}`);
                throw new common_1.UnauthorizedException('Token inválido o expirado');
            }
        }
        else {
            console.log(`🌐 Public route accessed: ${method} ${url} from ${ip}`);
        }
        console.log(`📥 ${method} ${url} - Started at ${new Date().toISOString()}`);
        return next
            .handle()
            .pipe((0, operators_1.tap)(() => {
            const responseTime = Date.now() - now;
            const statusCode = response.statusCode;
            console.log(`📤 ${method} ${url} - ${statusCode} - ${responseTime}ms`);
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map