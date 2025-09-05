import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../entities/users.entity';
import { Role } from '../../../entities/roles.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar que el rol existe
    const role = await this.rolesRepository.findOne({
      where: { id: createUserDto.roleId }
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.mapToResponseDto(savedUser, role);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      relations: ['role'],
    });
    return users.map(user => this.mapToResponseDto(user, user.role));
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToResponseDto(user, user.role);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Si se cambia el rol, verificar que existe
    let role = user.role;
    if (updateUserDto.roleId && updateUserDto.roleId !== user.roleId) {
      const newRole = await this.rolesRepository.findOne({
        where: { id: updateUserDto.roleId }
      });
      if (!newRole) {
        throw new NotFoundException('Role not found');
      }
      role = newRole;
    }

    await this.usersRepository.update(id, updateUserDto);
    const updatedUser = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    return this.mapToResponseDto(updatedUser, updatedUser.role);
  }

  async delete(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.delete(id);
  }

  private mapToResponseDto(user: User, role?: Role): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      cuil: user.cuil,
      roleId: user.roleId,
      role: role ? {
        id: role.id,
        name: role.name,
      } : undefined,
    };
  }

  // Método para validar usuario por email y contraseña (usado por Auth)
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        relations: ['role']
      });
      
      if (user && await bcrypt.compare(password, user.password)) {
        return user;
      }
      return null;
    } catch (error: any) {
      throw new BadRequestException('Error al validar usuario: ' + error.message);
    }
  }

  // Métodos para el controlador de lectura
  async getUserInfo(id: string): Promise<UserResponseDto> {
    return this.findById(id);
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.findAll();
  }
}