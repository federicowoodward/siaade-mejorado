import { IsString, Matches } from "class-validator";

export class VerifyResetCodeDto {
  @IsString()
  identity: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}
