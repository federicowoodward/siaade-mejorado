import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
  ValidationArguments,
} from "class-validator";

export class UpdateSubjectPrereqsDto {
  @ApiProperty({
    type: [Number],
    description:
      "Lista completa (reemplazo) de numeros de orden que actuan como correlativa.",
    example: [2, 3, 5],
    required: true,
  })
  @IsArray()
  @ArrayUnique(({ value }: ValidationArguments) => value)
  @IsInt({ each: true })
  @Min(1, { each: true })
  prereqs!: number[];
}
