import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from './jwt-auth.guard';
import { toCanonicalRole } from '../shared/utils/roles.util';

@Injectable()
export class HierarchyGuard extends JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetId: string | undefined = request.params?.id || request.body?.id;
    const canon = toCanonicalRole(user?.role?.name, { isDirective: user?.isDirective });

    if (!canon) return false;

    // Superiores
    if (canon === 'ADMIN_GENERAL' || canon === 'SECRETARIO_DIRECTIVO') return true;

    // SECRETARIO común y PRECEPTOR: admitimos, la lógica fina se valida en el servicio/controlador
    if (canon === 'SECRETARIO' || canon === 'PRECEPTOR') return true;

    // Docente/Alumno: solo permitimos si es sobre sí mismo (edición propia)
    if ((canon === 'DOCENTE' || canon === 'ALUMNO') && targetId && user?.id === targetId) {
      return true;
    }

    return false;
  }
}
