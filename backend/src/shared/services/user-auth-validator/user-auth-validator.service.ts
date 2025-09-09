// src/shared/services/user-auth-validator/user-auth-validator.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User } from "@/entities/users.entity";

@Injectable()
export class UserAuthValidatorService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>
  ) {}

  /**
   * Valida un usuario por email y contraseña.
   * Devuelve info mínima si es válido, o null si no.
   */
  async validateUser(
    email: string,
    password: string
  ): Promise<User["id"] | null> {
    try {
      const user = await this.usersRepo.findOne({
        where: { email },
        relations: ["role"],
      });

      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;

      return user.id;
    } catch (error: any) {
      throw new BadRequestException(
        "Error al validar usuario: " + error.message
      );
    }
  }
}
