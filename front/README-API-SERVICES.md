# 🚀 Documentación de API Services - Frontend Angular

## 📋 Estructura Organizada

La nueva estructura de servicios API está organizada por módulos funcionales:

```
src/app/core/services/api/
├── base-api.service.ts          # Servicio base con funcionalidades comunes
├── auth-api.service.ts          # Autenticación y autorización
├── users-api.service.ts         # Gestión de usuarios
├── roles-api.service.ts         # Gestión de roles
├── subjects-api.service.ts      # Gestión de materias
├── exams-api.service.ts         # Gestión de exámenes
└── index.ts                     # Servicio principal unificado
```

## 🎯 Cómo Usar los Servicios

### 1. Importación Simplificada

```typescript
import { ApiService } from '../core/services/api';
// O importar servicios específicos:
import { AuthApiService, UsersApiService } from '../core/services/api';
```

### 2. Inyección en Componentes

```typescript
export class MyComponent {
  private readonly api = inject(ApiService);
  
  // O inyectar servicios específicos
  private readonly authService = inject(AuthApiService);
  private readonly usersService = inject(UsersApiService);
}
```

### 3. Autenticación

```typescript
// Login
const credentials = { email: 'user@example.com', password: 'password123' };
this.api.auth.login(credentials).subscribe({
  next: (response) => console.log('Login exitoso:', response),
  error: (error) => console.error('Error en login:', error)
});

// Verificar estado
if (this.api.auth.isAuthenticated) {
  const user = this.api.auth.currentUser;
  console.log('Usuario actual:', user);
}

// Verificar roles
if (this.api.auth.isAdmin) {
  // Usuario es administrador
}
```

### 4. Gestión de Usuarios

```typescript
// Obtener todos los usuarios
this.api.users.getUsers().subscribe(users => {
  console.log('Usuarios:', users);
});

// Obtener usuarios por rol
this.api.users.getStudents().subscribe(students => {
  console.log('Estudiantes:', students);
});

// Crear usuario
const newUser = {
  name: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  cuil: '20-12345678-9',
  password: 'password123',
  roleId: 2
};

this.api.users.createUser(newUser).subscribe({
  next: (user) => console.log('Usuario creado:', user),
  error: (error) => console.error('Error:', error)
});

// Actualizar usuario
this.api.users.updateUser('user-id', { name: 'Nuevo Nombre' }).subscribe();

// Eliminar usuario
this.api.users.deleteUser('user-id').subscribe();
```

### 5. Gestión de Materias

```typescript
// Obtener materias
this.api.subjects.getSubjects().subscribe(subjects => {
  console.log('Materias:', subjects);
});

// Materias por año
this.api.subjects.getSubjectsByYear(2024).subscribe();

// Crear materia
const newSubject = {
  name: 'Matemáticas I',
  code: 'MAT101',
  credits: 6,
  year: 1,
  semester: 1,
  teacherId: 'teacher-id'
};

this.api.subjects.createSubject(newSubject).subscribe();

// Inscribir estudiante
this.api.subjects.enrollStudent({
  studentId: 'student-id',
  subjectId: 'subject-id'
}).subscribe();
```

### 6. Gestión de Exámenes

```typescript
// Exámenes regulares
this.api.exams.getExams().subscribe(exams => {
  console.log('Exámenes:', exams);
});

// Exámenes finales
this.api.exams.getFinalExams().subscribe(finalExams => {
  console.log('Exámenes finales:', finalExams);
});

// Crear examen
const newExam = {
  title: 'Primer Parcial',
  type: 'PARTIAL' as const,
  date: '2024-12-01T10:00:00Z',
  duration: 120,
  maxScore: 100,
  subjectId: 'subject-id'
};

this.api.exams.createExam(newExam).subscribe();

// Registrar estudiante para examen final
this.api.exams.registerStudentForFinalExam('final-exam-id', 'student-id').subscribe();
```

### 7. Gestión de Roles

```typescript
// Obtener roles
this.api.roles.getRoles().subscribe(roles => {
  console.log('Roles:', roles);
});

// Verificar tipo de rol
const isTeaching = this.api.roles.isTeachingRole(3); // true para profesor
const isAdmin = this.api.roles.isAdminRole(1); // true para administrador

// Obtener nombre del rol
const roleName = this.api.roles.getRoleName(2); // "Estudiante"
```

## 🔧 Características Avanzadas

### 1. Manejo Automático de Errores

```typescript
// Los errores se manejan automáticamente
this.api.users.getUsers().subscribe({
  next: (users) => {
    // Manejar datos exitosos
  },
  error: (apiError) => {
    // El error ya está procesado y normalizado
    console.error('Error normalizado:', apiError.message);
    console.error('Código de estado:', apiError.status);
  }
});
```

### 2. Interceptores Automáticos

- **JWT Interceptor**: Agrega automáticamente tokens de autenticación
- **Error Interceptor**: Normaliza y procesa errores HTTP
- **Logging**: Logs automáticos en desarrollo

### 3. Tipado TypeScript Completo

```typescript
import { User, Subject, Exam, Role } from '../core/services/api';

// Todos los tipos están disponibles
const user: User = {
  id: '1',
  name: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  cuil: '20-12345678-9',
  roleId: 2,
  role: { id: 2, name: 'Estudiante' }
};
```

### 4. Verificación de Salud del Backend

```typescript
// Verificar conectividad
const isHealthy = await this.api.checkBackendHealth();
if (!isHealthy) {
  // Manejar problemas de conectividad
}

// Obtener estado de la API
const status = this.api.getApiStatus();
console.log('Estado de la API:', status);
```

## 🛡️ Seguridad

### 1. Tokens JWT Automáticos

Los tokens se manejan automáticamente:
- Se agregan a todas las peticiones no públicas
- Se almacenan en localStorage
- Se limpian automáticamente en logout o errores 401

### 2. Endpoints Públicos

Los siguientes endpoints no requieren autenticación:
- `/auth/login`
- `/auth/sign-in`
- `/auth/reset-password`
- `/auth/refresh`

### 3. Manejo de Errores de Autorización

- **401 Unauthorized**: Limpia datos de auth y redirige al login
- **403 Forbidden**: Muestra mensaje de permisos insuficientes

## 📊 Logging y Debugging

En modo desarrollo (`environment.production = false`):
- Logs automáticos de todas las peticiones HTTP
- Detalles completos de errores
- Información de interceptores

```typescript
// Los logs aparecen automáticamente en consola:
// 🌐 [API] GET http://localhost:3000/api/users
// 📥 Response: [array de usuarios]
// 🔐 [JWT Interceptor] Token added to request
```

## 🔄 Migración desde el Sistema Anterior

Para migrar código existente:

```typescript
// ANTES (sistema antiguo)
this.apiService.getAll('users').subscribe();
this.apiService.create('users', userData).subscribe();

// DESPUÉS (sistema nuevo)
this.api.users.getUsers().subscribe();
this.api.users.createUser(userData).subscribe();
```

## 📝 Ejemplos Prácticos

Ver el archivo `api-example.component.ts` para ejemplos completos de uso en componentes reales.

## 🚀 Beneficios de la Nueva Estructura

1. **Organización**: Servicios separados por funcionalidad
2. **Tipado**: TypeScript completo en todas las operaciones
3. **Automatización**: Manejo automático de tokens y errores
4. **Consistencia**: Interfaz unificada para todas las operaciones
5. **Escalabilidad**: Fácil agregar nuevos endpoints o servicios
6. **Mantenibilidad**: Código más limpio y fácil de mantener
7. **Debugging**: Logs detallados y manejo de errores mejorado

