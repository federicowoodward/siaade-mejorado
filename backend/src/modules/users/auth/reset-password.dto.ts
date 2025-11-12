// src/modules/users/auth/reset-password.dto.ts
import { IsEmail } from "class-validator";

export class ResetPasswordDto {
  @IsEmail() // Valida que el email esté en el formato correcto
  email: string;
}
