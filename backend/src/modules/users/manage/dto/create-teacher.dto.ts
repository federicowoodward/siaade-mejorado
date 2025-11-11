// src/modules/users/onboard/dtos/create-teacher.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { BaseUserDto, UserInfoDto, CommonDataDto } from "./shared.dto";

export class CreateTeacherDto extends BaseUserDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => UserInfoDto)
  userInfo!: UserInfoDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CommonDataDto)
  commonData!: CommonDataDto; // address opcional adentro
}
