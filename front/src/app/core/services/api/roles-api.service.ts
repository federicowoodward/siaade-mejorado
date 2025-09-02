import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

@Injectable({ providedIn: 'root' })
export class RolesApiService extends BaseApiService {

  /**
   * Obtiene todos los roles
   */
  getRoles(): Observable<Role[]> {
    return this.get<Role[]>('roles');
  }

  /**
   * Obtiene un rol por ID
   */
  getRoleById(id: number): Observable<Role> {
    return this.get<Role>(`roles/${id}`);
  }

  /**
   * Crea un nuevo rol
   */
  createRole(roleData: CreateRoleRequest): Observable<Role> {
    return this.post<Role>('roles', roleData);
  }

  /**
   * Actualiza un rol
   */
  updateRole(id: number, roleData: UpdateRoleRequest): Observable<Role> {
    return this.put<Role>(`roles/${id}`, roleData);
  }

  /**
   * Elimina un rol
   */
  deleteRole(id: number): Observable<{ deleted: boolean; message: string }> {
    return this.delete<{ deleted: boolean; message: string }>(`roles/${id}`);
  }

  /**
   * Obtiene permisos disponibles
   */
  getAvailablePermissions(): Observable<string[]> {
    return this.get<string[]>('roles/permissions');
  }

  /**
   * Obtiene usuarios por rol
   */
  getUsersByRole(roleId: number): Observable<any[]> {
    return this.get<any[]>(`roles/${roleId}/users`);
  }

  /**
   * Asigna rol a usuario
   */
  assignRoleToUser(userId: string, roleId: number): Observable<any> {
    return this.post(`roles/${roleId}/assign`, { userId });
  }

  /**
   * Remueve rol de usuario
   */
  removeRoleFromUser(userId: string, roleId: number): Observable<any> {
    return this.delete(`roles/${roleId}/remove`, { userId });
  }

  // Constantes de roles del sistema
  static readonly ROLES = {
    ADMINISTRATOR: 1,
    STUDENT: 2,
    TEACHER: 3,
    PRECEPTOR: 4,
    SECRETARY: 5
  } as const;

  /**
   * Obtiene el nombre del rol por ID
   */
  getRoleName(roleId: number): string {
    const roleNames: { [key: number]: string } = {
      1: 'Administrador',
      2: 'Estudiante',
      3: 'Profesor',
      4: 'Preceptor',
      5: 'Secretario'
    };
    
    return roleNames[roleId] || 'Desconocido';
  }

  /**
   * Verifica si un rol tiene permisos administrativos
   */
  isAdminRole(roleId: number): boolean {
    return roleId === RolesApiService.ROLES.ADMINISTRATOR;
  }

  /**
   * Verifica si un rol es de personal docente
   */
  isTeachingRole(roleId: number): boolean {
    return [3, 4].includes(roleId); // TEACHER, PRECEPTOR
  }

  /**
   * Verifica si un rol es de personal administrativo
   */
  isAdministrativeRole(roleId: number): boolean {
    return [1, 5].includes(roleId); // ADMINISTRATOR, SECRETARY
  }
}
