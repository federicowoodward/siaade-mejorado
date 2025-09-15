import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExecutionContext, CallHandler, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip } = request;
    console.log('interceptor activado')

    // Verificar si la ruta está marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
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
        throw new UnauthorizedException('Token de acceso requerido');
      }

      const token = authHeader.substring(7); // Remover 'Bearer '
      
      try {
        // Verificar y decodificar el token
        const payload = this.jwtService.verify(token);
        request.user = payload; // Agregar usuario al request
        console.log(`🔐 JWT validated for user: ${payload.email || payload.username} accessing ${method} ${url}`);
      } catch (error) {
        console.log(`❌ Invalid JWT token for ${method} ${url} from ${ip}`);
        throw new UnauthorizedException('Token inválido o expirado');
      }
    } else {
      console.log(`🌐 Public route accessed: ${method} ${url} from ${ip}`);
    }

    console.log(`📥 ${method} ${url} - Started at ${new Date().toISOString()}`);

    return next
      .handle()
      .pipe(
        tap(() => {
          const responseTime = Date.now() - now;
          const statusCode = response.statusCode;
          console.log(`📤 ${method} ${url} - ${statusCode} - ${responseTime}ms`);
        }),
      );
  }
}
