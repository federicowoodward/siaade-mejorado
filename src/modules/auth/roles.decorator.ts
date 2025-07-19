import { SetMetadata } from '@nestjs/common';
import { Role } from './role.entity';  // Asegúrate de importar correctamente la entidad Role

export const ROLES_KEY = 'roles';  // Clave para acceder a los roles en el metadata
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);  // El decorador para asignar roles


//Este decorador Roles va a recibir una lista de roles y los va a agregar como metadata en la ruta que lo utilices. Esto nos permitirá verificar qué roles tienen acceso a una ruta en particular.