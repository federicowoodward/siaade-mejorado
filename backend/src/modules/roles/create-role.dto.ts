import { IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  readonly name: string;  // Nombre del rol (por ejemplo: 'ADMIN_GENERAL', 'PRECEPTOR')
}