📚 SIAADE – Documentación del Proyecto
🚀 Introducción

SIAADE es una plataforma moderna de administración de alumnos, docentes y personal administrativo para facultades.
Este proyecto incluye backend (NestJS + PostgreSQL) y frontend (Angular + PrimeNG).

🛠️ Requisitos Previos

Node.js v20+

PostgreSQL 15+

npm 10+

Docker (opcional, recomendado para entorno productivo)

⚙️ Setup Inicial

Desde la raíz del proyecto, ejecutar:

# Instalar dependencias backend

cd backend && npm run install && cd ..

# Instalar dependencias frontend

cd front && npm run install --force && cd ..

🗄️ Migraciones

Para crear la base de datos con la estructura inicial:

cd backend && npm run db:migration:run && cd ..

Esto creará todas las tablas definidas en el esquema (DBML definitivo) dentro de la base de datos PostgreSQL.

🔑 Usuarios de Prueba

El sistema ya incluye usuarios iniciales para cada rol, útiles en el desarrollo y testing.

Rol Email Contraseña
📘 Director s.director@example.com pass
📝 Secretario s.secretary@example.com pass
👨‍🏫 Preceptor s.preceptor@example.com pass
🎓 Alumno s.student@example.com pass
📚 Docente s.teacher@example.com pass
📂 Estructura General del Proyecto
/backend -> API con NestJS + TypeORM + PostgreSQL
/front -> Frontend Angular + PrimeNG

Backend: contiene módulos organizados por dominio (users, subjects, exams, shared, etc.).

Frontend: aplicación en Angular 20 con módulos y componentes reutilizables.

▶️ Ejecución
Backend
cd backend
npm run start:dev

Por defecto corre en: http://localhost:3000

Frontend
cd front
npm start

Por defecto corre en: http://localhost:4200

📖 Endpoints y Swagger

El backend incluye Swagger para documentar todos los endpoints disponibles.
Acceso en:

http://localhost:3000/api/docs

🧪 Próximos Pasos

Agregar más datos de prueba (materias, exámenes, correlativas).

Configurar despliegue en Vercel (Frontend) y Docker (Backend).

Implementar validaciones avanzadas y Guards.
