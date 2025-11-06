import { IsOptional, IsString, MinLength, Matches } from "class-validator";

export class ConfirmResetPasswordDto {
  @IsString()
  token: string;

  // Campo opcional: si el usuario está logueado y quiere agregar verificación extra
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      "La contraseña debe incluir al menos una mayúscula, una minúscula y un número",
  })
  password: string;
}
