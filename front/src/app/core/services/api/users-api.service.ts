import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  cuil: string;
  roleId: number;
  role: {
    id: number;
    name: string;
  };
}

export interface CreateUserRequest {
  name: string;
  lastName: string;
  email: string;
  cuil: string;
  password: string;
  roleId: number;
}

export interface UpdateUserRequest {
  name?: string;
  lastName?: string;
  email?: string;
  cuil?: string;
  roleId?: number;
}

export interface UsersListResponse {
  data: User[];
  message: string;
}

export interface UserDetailResponse {
  data: User;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService extends BaseApiService {

  /**
   * Obtiene todos los usuarios
   */
  getUsers(): Observable<User[]> {
    return this.get<User[]>('users');
  }

  /**
   * Obtiene usuarios con paginación
   */
  getUsersPaginated(page: number = 1, limit: number = 10): Observable<User[]> {
    return this.get<User[]>('users', { page, limit });
  }

  /**
   * Obtiene usuarios por rol
   */
  getUsersByRole(roleId: number): Observable<User[]> {
    return this.get<User[]>('users', { roleId });
  }

  /**
   * Obtiene un usuario por ID
   */
  getUserById(id: string): Observable<User> {
    return this.get<User>(`users/${id}`);
  }

  /**
   * Obtiene usuario por email
   */
  getUserByEmail(email: string): Observable<User> {
    return this.get<User>('users', { email });
  }

  /**
   * Crea un nuevo usuario
   */
  createUser(userData: CreateUserRequest): Observable<User> {
    return this.post<User>('users', userData);
  }

  /**
   * Actualiza un usuario
   */
  updateUser(id: string, userData: UpdateUserRequest): Observable<User> {
    return this.put<User>(`users/${id}`, userData);
  }

  /**
   * Actualiza parcialmente un usuario
   */
  patchUser(id: string, userData: Partial<UpdateUserRequest>): Observable<User> {
    return this.patch<User>(`users/${id}`, userData);
  }

  /**
   * Elimina un usuario
   */
  deleteUser(id: string): Observable<{ deleted: boolean; message: string }> {
    return this.delete<{ deleted: boolean; message: string }>(`users/${id}`);
  }

  /**
   * Busca usuarios por término
   */
  searchUsers(searchTerm: string): Observable<User[]> {
    return this.get<User[]>('users', { search: searchTerm });
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  getUserStats(): Observable<any> {
    return this.get<any>('users/stats');
  }

  /**
   * Verifica si un email está disponible
   */
  checkEmailAvailability(email: string): Observable<{ available: boolean }> {
    return this.get<{ available: boolean }>('users/check-email', { email });
  }

  /**
   * Verifica si un CUIL está disponible
   */
  checkCuilAvailability(cuil: string): Observable<{ available: boolean }> {
    return this.get<{ available: boolean }>('users/check-cuil', { cuil });
  }

  /**
   * Cambia el estado de un usuario (activo/inactivo)
   */
  toggleUserStatus(id: string): Observable<User> {
    return this.patch<User>(`users/${id}/toggle-status`, {});
  }

  /**
   * Restablece la contraseña de un usuario
   */
  resetUserPassword(id: string): Observable<{ temporaryPassword: string }> {
    return this.post<{ temporaryPassword: string }>(`users/${id}/reset-password`, {});
  }

  // Métodos específicos por rol

  /**
   * Obtiene todos los estudiantes
   */
  getStudents(): Observable<User[]> {
    return this.getUsersByRole(2); // Rol Estudiante
  }

  /**
   * Obtiene todos los profesores
   */
  getTeachers(): Observable<User[]> {
    return this.getUsersByRole(3); // Rol Profesor
  }

  /**
   * Obtiene todos los preceptores
   */
  getPreceptors(): Observable<User[]> {
    return this.getUsersByRole(4); // Rol Preceptor
  }

  /**
   * Obtiene todos los secretarios
   */
  getSecretaries(): Observable<User[]> {
    return this.getUsersByRole(5); // Rol Secretario
  }

  /**
   * Obtiene todos los administradores
   */
  getAdministrators(): Observable<User[]> {
    return this.getUsersByRole(1); // Rol Administrador
  }
}
