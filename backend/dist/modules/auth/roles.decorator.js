"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'roles'; // Clave para acceder a los roles en el metadata
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles); // El decorador para asignar roles
exports.Roles = Roles;
//Este decorador Roles va a recibir una lista de roles y los va a agregar como metadata en la ruta que lo utilices. Esto nos permitirá verificar qué roles tienen acceso a una ruta en particular.
//# sourceMappingURL=roles.decorator.js.map