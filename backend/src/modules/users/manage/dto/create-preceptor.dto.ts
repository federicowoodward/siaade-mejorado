import { ApiProperty } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { BaseUserDto, UserInfoDto } from "./shared.dto";

export class CreatePreceptorDto extends BaseUserDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => UserInfoDto)
  userInfo!: UserInfoDto;
}
