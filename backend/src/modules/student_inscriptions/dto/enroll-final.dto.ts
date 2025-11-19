import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID } from "class-validator";

export class EnrollFinalDto {
  @ApiProperty({ description: "Identificador del llamado (final_exam.id)" })
  @IsInt()
  callId!: number;

  @ApiPropertyOptional({
    description:
      "Permite especificar un alumno objetivo (solo para usos administrativos)",
  })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({
    description: "Codigo de razon informado por el front",
  })
  @IsOptional()
  @IsString()
  reasonCode?: string | null;
}
