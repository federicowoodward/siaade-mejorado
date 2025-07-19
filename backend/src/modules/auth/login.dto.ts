import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()  // Valida que el email tenga un formato correcto
  email: string;

  @IsString()  // Valida que la contraseña sea una cadena
  password: string;
}