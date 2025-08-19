import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../../entities/user.entity';
import { RolesGuard } from '../../auth/roles.guard';  // Asegúrate de importar el RolesGuard
import { Roles } from '../../auth/roles.decorator';  // Importa el decorador para roles
import { JwtAuthGuard } from '../../auth/jwt.guard';  // Importa el AuthGuard

@Controller('users/read')  // Ruta para leer la información de los usuarios
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'PRECEPTOR' consultar usuarios
  async getUserInfo(@Param('id') id: string): Promise<User | null> {
    return this.usersService.getUserInfo(id);  // Consultar información de un usuario por ID
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'SECRETARIO')  // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'SECRETARIO' consultar todos los usuarios
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();  // Consultar todos los usuarios
  }
}