import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';  // Usamos la clave definida en el decorador
import { JwtAuthGuard } from './jwt.guard';  // Usamos el AuthGuard que ya tienes implementado

@Injectable()
export class RolesGuard extends JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());  // Recupera los roles permitidos de la metadata de la ruta
    if (!requiredRoles) {
      return true;  // Si no hay roles especificados, dejamos que pase
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // El usuario que está haciendo la solicitud
    
    // Verificar si el usuario existe y tiene rol
    if (!user || !user.role || !user.role.name) {
      return false;
    }
    
    // Verificar si el rol del usuario está en la lista de roles permitidos
    return requiredRoles.includes(user.role.name);
  }
}