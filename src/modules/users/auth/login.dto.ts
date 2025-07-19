import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()  // Valida que el email sea un formato válido
  email: string;

  @IsString()  // Valida que la contraseña sea una cadena de texto
  password: string;
}