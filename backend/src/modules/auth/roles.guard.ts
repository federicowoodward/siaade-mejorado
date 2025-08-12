import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Role } from './role.entity';  // Asegúrate de importar la entidad Role
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
    const roles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());  // Recupera los roles permitidos de la metadata de la ruta
    if (!roles) {
      return true;  // Si no hay roles especificados, dejamos que pase
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // El usuario que está haciendo la solicitud
    return roles.some(role => user.roles?.includes(role));  // Verifica si el rol del usuario coincide con alguno de los roles permitidos
  }
}