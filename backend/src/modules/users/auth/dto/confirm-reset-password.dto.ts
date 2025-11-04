import { IsString, MinLength } from "class-validator";

export class ConfirmResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}
