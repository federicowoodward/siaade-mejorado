// src/modules/users/onboard/dtos/create-secretary.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { BaseUserDto } from "./shared.dto";

export class CreateSecretaryDto extends BaseUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDirective?: boolean;
}
