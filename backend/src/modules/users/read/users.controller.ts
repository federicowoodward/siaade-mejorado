import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';  // Servicio local de users read
import { UserResponseDto } from '../manage/dto/user.dto';  // DTO de respuesta de usuario
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../auth/roles.decorator';  // Decorador para definir los roles
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('users/read')  // Ruta para leer la información de los usuarios
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'PRECEPTOR' consultar usuarios
  async getUserInfo(@Param('id') id: string): Promise<UserResponseDto | null> {
    return this.usersService.getUserInfo(id);  // Consultar información de un usuario por ID
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'SECRETARIO')  // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'SECRETARIO' consultar todos los usuarios
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.getAllUsers();  // Consultar todos los usuarios
  }
}