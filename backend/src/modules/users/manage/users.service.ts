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

  async create(userData: User): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, userData: User): Promise<User> {
    await this.usersRepository.update(id, userData);
    return this.usersRepository.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}