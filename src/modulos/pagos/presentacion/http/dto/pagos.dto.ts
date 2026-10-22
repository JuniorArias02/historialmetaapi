import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ActualizarConfiguracionInformeDto } from '../../../../configuracion-informe/presentacion/http/dto/configuracion-informe.dto';

const MAXIMO_PAGOS_POR_IMPORTACION = 50_000;

export class DatosPagoDto {
  @ApiProperty({ example: 'ESE Imsalud', maxLength: 191 })
  @IsString()
  @MaxLength(191)
  proyecto!: string;

  @ApiProperty({ example: 'Imsalud', maxLength: 191 })
  @IsString()
  @MaxLength(191)
  entidad!: string;

  @ApiProperty({ example: '3143644500 Imsalud', maxLength: 191 })
  @IsString()
  @MaxLength(191)
  linea!: string;

  @ApiProperty({ example: '2026-10-08', description: 'AAAA-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener el formato AAAA-MM-DD' })
  fecha!: string;

  @ApiProperty({ example: 99.92, description: 'USD; se admiten negativos (ajustes)' })
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'El monto debe ser numérico' })
  monto!: number;

  @ApiProperty({ example: '', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  nota!: string;

  @ApiProperty({ type: [String], description: 'Advertencias de calidad calculadas al validar' })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  advertencias!: string[];
}

export class ActualizarPagoDto extends DatosPagoDto {
  @ApiPropertyOptional({ default: false, description: 'Quita la marca «editado»' })
  @IsOptional()
  @IsBoolean()
  restaurarOriginal?: boolean;
}

export class PagoAImportarDto extends DatosPagoDto {
  @ApiProperty({ example: 'datos_cobros.json', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  origen!: string;

  @ApiProperty({ example: 'Elemento 6 (ESE Imsalud) › pago 14', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  ubicacion!: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  ficticio!: boolean;

  @ApiPropertyOptional({
    description: 'Valores sin normalizar del archivo: {proyecto, entidad, linea, fecha, monto}',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  original?: Record<string, unknown>;
}

export class ImportarPagosDto {
  @ApiProperty({ enum: ['reemplazar', 'agregar'] })
  @IsIn(['reemplazar', 'agregar'])
  modo!: 'reemplazar' | 'agregar';

  @ApiProperty({ type: [PagoAImportarDto] })
  @IsArray()
  @ArrayMaxSize(MAXIMO_PAGOS_POR_IMPORTACION)
  @ValidateNested({ each: true })
  @Type(() => PagoAImportarDto)
  pagos!: PagoAImportarDto[];

  @ApiPropertyOptional({ type: ActualizarConfiguracionInformeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActualizarConfiguracionInformeDto)
  configuracion?: ActualizarConfiguracionInformeDto;
}

export class EliminarPagosDto {
  @ApiProperty({ type: [Number], example: [12, 13] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAXIMO_PAGOS_POR_IMPORTACION)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}

export class ValoresOriginalesDto {
  @ApiProperty({ nullable: true, oneOf: [{ type: 'string' }, { type: 'number' }] })
  proyecto!: string | number | null;
  @ApiProperty({ nullable: true, oneOf: [{ type: 'string' }, { type: 'number' }] })
  entidad!: string | number | null;
  @ApiProperty({ nullable: true, oneOf: [{ type: 'string' }, { type: 'number' }] })
  linea!: string | number | null;
  @ApiProperty({ nullable: true, oneOf: [{ type: 'string' }, { type: 'number' }] })
  fecha!: string | number | null;
  @ApiProperty({ nullable: true, oneOf: [{ type: 'string' }, { type: 'number' }] })
  monto!: string | number | null;
}

export class PagoRespuestaDto {
  @ApiProperty({ example: 87 }) id!: number;
  @ApiProperty({ example: 'ESE Imsalud' }) proyecto!: string;
  @ApiProperty({ example: 'Imsalud' }) entidad!: string;
  @ApiProperty({ example: '3143644500 Imsalud' }) linea!: string;
  @ApiProperty({ example: '2026-10-08' }) fecha!: string;
  @ApiProperty({ example: 99.92 }) monto!: number;
  @ApiProperty({ example: 'datos_cobros.json' }) origen!: string;
  @ApiProperty({ example: 'Elemento 6 (ESE Imsalud) › pago 14' }) ubicacion!: string;
  @ApiProperty() ficticio!: boolean;
  @ApiProperty() editado!: boolean;
  @ApiProperty() nota!: string;
  @ApiProperty({ type: [String] }) advertencias!: string[];
  @ApiProperty({ type: ValoresOriginalesDto, nullable: true })
  original!: ValoresOriginalesDto | null;
}

export class ResultadoCantidadDto {
  @ApiProperty({ example: 110, description: 'Cantidad de pagos afectados' })
  cantidad!: number;
}
