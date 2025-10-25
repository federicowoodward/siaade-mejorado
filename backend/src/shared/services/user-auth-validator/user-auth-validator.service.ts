// src/shared/services/user-auth-validator/user-auth-validator.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User } from "@/entities/users/user.entity";

const isDev =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

function isBcryptHash(value: string | null | undefined): boolean {
  // Bcrypt hashes suelen empezar con $2a$, $2b$ o $2y$
  return typeof value === "string" && /^\$2[aby]\$/.test(value);
}

@Injectable()
export class UserAuthValidatorService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>
  ) {}

  /**
   * Valida un usuario por email y contraseña.
   * Devuelve el ID si es válido, o null si no.
   */
  async validateUser(
    email: string,
    password: string
  ): Promise<User["id"] | null> {
    try {
      const user = await this.usersRepo.findOne({
        where: { email },
        relations: ["role"],
        select: ["id", "password", "role"], // explícito por seguridad
      });

      if (!user || !user.password) return null;

      // --- Producción: SOLO bcrypt ---
      if (!isDev) {
        const ok = await bcrypt.compare(password, user.password);
        return ok ? user.id : null;
      }

      // --- Desarrollo/Test: primero texto plano, luego bcrypt ---
      // 1) Si el valor almacenado NO parece un hash, probamos igualdad directa
      if (!isBcryptHash(user.password) && password === user.password) {
        return user.id;
      }

      // 2) Si parece hash (o falló el plano), probamos bcrypt
      const ok = await bcrypt.compare(password, user.password);
      return ok ? user.id : null;
    } catch (error: any) {
      throw new BadRequestException(
        "Error al validar usuario: " + error.message
      );
    }
  }
}
