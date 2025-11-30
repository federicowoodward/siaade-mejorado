import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateAlertAuditDto {
  @ApiProperty({
    description: "Mensaje mostrado al usuario en el toast.",
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: "Severidad del toast.",
    enum: ["info", "warn", "error", "success"],
  })
  @IsString()
  @IsIn(["info", "warn", "error", "success"])
  severity!: "info" | "warn" | "error" | "success";

  @ApiPropertyOptional({
    description:
      "Fecha/hora del evento (ISO-8601). Si se omite, se toma la del servidor.",
  })
  @IsOptional()
  @IsISO8601()
  timestamp?: string;

  @ApiPropertyOptional({
    description: "Ruta actual del front al disparar el toast.",
  })
  @IsOptional()
  @IsString()
  frontRoute?: string;

  @ApiPropertyOptional({
    description: "Nombre lógico del módulo de front (opcional).",
  })
  @IsOptional()
  @IsString()
  frontModule?: string;

  @ApiPropertyOptional({
    description:
      "Identificador de acción (ej. ENROLL_STUDENT, RESET_PASSWORD), opcional.",
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: "Metadata adicional asociada al toast.",
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
