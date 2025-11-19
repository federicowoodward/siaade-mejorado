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
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * Valida un usuario por identidad flexible (email, cuil o "Nombre Apellido") y contraseña.
   * Devuelve { id, isPlainText } si es válido, o null si no.
   */
  async validateUser(
    identity: string,
    password: string,
  ): Promise<{ id: User["id"]; isPlainText: boolean } | null> {
    try {
      const id = (identity || "").trim();
      let user: (Pick<User, "id" | "password"> & { role?: any }) | null = null;

      // Heurística simple para resolver identidad
      const isEmail = id.includes("@");
      const digits = id.replace(/\D+/g, "");
      const looksLikeCuil = digits.length >= 8 && /^[0-9]+$/.test(digits);

      if (isEmail) {
        user = await this.usersRepo.findOne({
          where: { email: id },
          relations: ["role"],
          select: ["id", "password", "role"],
        });
      }

      if (!user && looksLikeCuil) {
        user = await this.usersRepo.findOne({
          where: { cuil: id },
          relations: ["role"],
          select: ["id", "password", "role"],
        });
      }

      if (!user) {
        // Match por nombre completo: LOWER(TRIM(name) || ' ' || TRIM(last_name)) = LOWER(:id)
        const full = id.toLowerCase().replace(/\s+/g, " ").trim();
        if (full) {
          user = await this.usersRepo
            .createQueryBuilder("u")
            .addSelect(["u.id", "u.password"]) // por seguridad
            .leftJoinAndSelect("u.role", "r")
            .where(
              "LOWER(CONCAT(TRIM(u.name), ' ', TRIM(u.last_name))) = :full",
              { full },
            )
            .getOne();
        }
      }

      if (!user || !user.password) return null;

      // --- Intentar primero: texto plano (para usuarios migrados) ---
      if (password === user.password) {
        return { id: user.id, isPlainText: true };
      }

      // --- Intentar luego: bcrypt (usuarios con contraseña hasheada) ---
      const ok = await bcrypt.compare(password, user.password);
      return ok ? { id: user.id, isPlainText: false } : null;
    } catch (error: any) {
      throw new BadRequestException(
        "Error al validar usuario: " + error.message,
      );
    }
  }
}
