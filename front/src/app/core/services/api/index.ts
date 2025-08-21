import { Injectable, inject } from '@angular/core';
import { AuthApiService } from './auth-api.service';
import { UsersApiService } from './users-api.service';
import { RolesApiService } from './roles-api.service';
import { SubjectsApiService } from './subjects-api.service';
import { ExamsApiService } from './exams-api.service';

/**
 * Servicio principal que agrupa todos los servicios API específicos
 * Proporciona un punto de acceso unificado para todas las operaciones del backend
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  
  // Inyección de todos los servicios específicos
  readonly auth = inject(AuthApiService);
  readonly users = inject(UsersApiService);
  readonly roles = inject(RolesApiService);
  readonly subjects = inject(SubjectsApiService);
  readonly exams = inject(ExamsApiService);

  constructor() {
    console.log('🚀 ApiService initialized - All API modules ready');
  }

  /**
   * Método para verificar el estado de la conexión con el backend
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      // Intenta hacer una petición simple para verificar conectividad
      await this.users.getUsers().toPromise();
      console.log('✅ Backend connection healthy');
      return true;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return false;
    }
  }

  /**
   * Método para limpiar cache o datos almacenados
   */
  clearCache(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    console.log('🧹 API cache cleared');
  }

  /**
   * Obtiene información del estado actual de la API
   */
  getApiStatus() {
    return {
      baseUrl: this.auth['baseUrl'],
      isAuthenticated: this.auth.isAuthenticated,
      currentUser: this.auth.currentUser,
      timestamp: new Date().toISOString()
    };
  }
}

// Re-exportar tipos importantes para facilitar su uso
export * from './auth-api.service';
export * from './users-api.service';
export * from './roles-api.service';
export * from './subjects-api.service';
export * from './exams-api.service';
export * from './base-api.service';
