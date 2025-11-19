import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateNoticeDto {
  @ApiProperty({ description: "Título del aviso" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: "HTML (contenido del editor)" })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    description: "Audiencia como texto ('student'|'teacher'|'all').",
  })
  @IsOptional()
  @IsString()
  @IsIn(["student", "teacher", "all"])
  visibleFor?: "student" | "teacher" | "all";

  @ApiPropertyOptional({
    description:
      "IDs de subject_commissions a los que aplica el aviso. Vacío = todas las comisiones.",
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  commissionIds?: number[];

  @ApiPropertyOptional({
    description:
      "Números de año de carrera (1, 2, 3, etc.) para filtrar avisos por año. Vacío = todos los años.",
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  yearNumbers?: number[];
}
