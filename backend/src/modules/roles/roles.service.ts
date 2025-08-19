import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { CreateRoleDto } from './create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.rolesRepository.create(createRoleDto);
    return this.rolesRepository.save(role);
  }

  async getRoles(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async getRoleById(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async updateRole(id: number, updateData: Partial<CreateRoleDto>): Promise<Role> {
    const role = await this.getRoleById(id);
    await this.rolesRepository.update(id, updateData);
    const updatedRole = await this.rolesRepository.findOne({ where: { id } });
    if (!updatedRole) {
      throw new NotFoundException('Role not found after update');
    }
    return updatedRole;
  }

  async deleteRole(id: number): Promise<void> {
    const role = await this.getRoleById(id);
    await this.rolesRepository.delete(id);
  }
}