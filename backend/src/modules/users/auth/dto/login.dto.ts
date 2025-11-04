import { IsString } from 'class-validator';

export class LoginDto {
  // acepta email, cuil o "Nombre Apellido"
  @IsString()
  identity: string;

  @IsString()
  password: string;
}
