import { Controller, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../../entities/user.entity';
import { RolesGuard } from '../../auth/roles.guard';  // Asegúrate de importar el RolesGuard
import { Roles } from '../../auth/roles.decorator';  // Importa el decorador para roles
import { HierarchyGuard } from '../../auth/hierarchy.guard';  // Importa el HierarchyGuard
import { JwtAuthGuard } from '../../auth/jwt.guard';  // Importa el AuthGuard

@Controller('users/manage')  // Ruta para gestionar usuarios (crear, editar, eliminar)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL')  // Solo los usuarios con rol 'ADMIN_GENERAL' pueden crear usuarios
  async createUser(@Body() userData: User): Promise<User> {
    return this.usersService.create(userData);  // Crear un nuevo usuario
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL')  // Solo los usuarios con rol 'ADMIN_GENERAL' pueden actualizar usuarios
  async updateUser(@Param('id') id: string, @Body() userData: User): Promise<User> {
    return this.usersService.update(id, userData);  // Actualizar un usuario
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL')  // Solo los usuarios con rol 'ADMIN_GENERAL' pueden eliminar usuarios
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);  // Eliminar un usuario
  }
}