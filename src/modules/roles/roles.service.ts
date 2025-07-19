import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';  // Asegúrate de que la entidad Role esté definida
import { CreateRoleDto } from './create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,  // Usamos el repositorio de TypeORM para interactuar con la base de datos
  ) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.rolesRepository.create(createRoleDto);  // Crear un nuevo rol
    return this.rolesRepository.save(role);  // Guardar el rol en la base de datos
  }

  async getRoles(): Promise<Role[]> {
    return this.rolesRepository.find();  // Obtener todos los roles
  }

  async getRoleById(id: string): Promise<Role> {
    return this.rolesRepository.findOne(id);  // Obtener un rol por su ID
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    // Aquí iría la lógica para asignar un rol a un usuario. 
    // Esto puede implicar actualizar la tabla de usuarios para agregar un campo `role_id` o una relación.
  }
}