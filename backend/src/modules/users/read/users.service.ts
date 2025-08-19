import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getUserInfo(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['role']
    });  // Buscar un usuario por ID
  }

  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find();  // Obtener todos los usuarios
  }
}