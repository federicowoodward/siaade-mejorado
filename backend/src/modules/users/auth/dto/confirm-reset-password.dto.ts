// TODO: REVIEW_CONFLICT_SIAD [logic]
/* incoming_branch_snapshot:
   import { IsOptional, IsString, MinLength, Matches } from "class-validator";
   
   export class ConfirmResetPasswordDto {
     @IsString()
     token: string;
   
     @IsString()
     @IsOptional()
     currentPassword?: string;
   
     @IsString()
     @MinLength(8)
     @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
       message:
         "La contraseña debe incluir al menos una mayúscula, una minúscula y un número",
     })
     password: string;
   }
*/
import { IsString, MinLength, Matches } from "class-validator";

export class ConfirmResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      "La contraseña debe incluir al menos una mayúscula, una minúscula y un número",
  })
  password: string;
}
// KEEP: HEAD (lógica vigente hasta revisión)
