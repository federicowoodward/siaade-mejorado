import { IsString } from 'class-validator';

export class ResetPasswordDto {
  // acepta email, cuil o nombre completo
  @IsString()
  identity: string;
}
