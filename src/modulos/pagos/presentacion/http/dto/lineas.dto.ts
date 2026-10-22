import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RegistrarPagoDto {
  @ApiProperty({ example: '2026-10-21', description: 'Fecha del pago (AAAA-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener el formato AAAA-MM-DD' })
  fecha!: string;

  @ApiProperty({
    example: 25.4,
    description: 'Monto en USD; se admiten negativos (ajustes o reembolsos)',
  })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 4 },
    { message: 'El monto debe ser un número con hasta 4 decimales' },
  )
  monto!: number;

  @ApiPropertyOptional({ example: 'Factura Meta #12345', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nota?: string;
}

export class CrearProyectoDto {
  @ApiProperty({
    example: 'Hospital Regional',
    maxLength: 191,
    description: 'Se crea si no existe',
  })
  @IsString()
  @IsNotEmpty({ message: 'La entidad es obligatoria' })
  @MaxLength(191)
  entidad!: string;

  @ApiProperty({
    example: 'Chatbot Citas',
    maxLength: 191,
    description: 'Se crea si no existe en la entidad',
  })
  @IsString()
  @IsNotEmpty({ message: 'El proyecto es obligatorio' })
  @MaxLength(191)
  proyecto!: string;

  @ApiProperty({
    example: '3001234567 Citas',
    maxLength: 191,
    description: 'Número y nombre de la línea de WhatsApp',
  })
  @IsString()
  @IsNotEmpty({ message: 'La línea es obligatoria' })
  @MaxLength(191)
  linea!: string;
}

export class LineaRespuestaDto {
  @ApiProperty({ example: 6 }) id!: number;
  @ApiProperty({ example: '3143644500 Imsalud' }) nombre!: string;
  @ApiProperty({ example: 'ESE Imsalud' }) proyecto!: string;
  @ApiProperty({ example: 'Imsalud' }) entidad!: string;
}
