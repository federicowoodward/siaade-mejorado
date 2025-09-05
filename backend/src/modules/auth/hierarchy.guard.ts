import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from './jwt.guard';  // Usamos el AuthGuard que ya tienes implementado

@Injectable()
export class HierarchyGuard extends JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // Obtén el usuario autenticado desde el JWT

    // Aquí agregas la lógica de jerarquía: verifica si el usuario tiene el rol necesario
    if (user.role && user.role.name === 'ADMIN_GENERAL') {
      return true;  // Permite el acceso si el usuario es un ADMIN_GENERAL
    }

    // Si el usuario no tiene el rol necesario, se bloquea el acceso
    return false;
  }
}