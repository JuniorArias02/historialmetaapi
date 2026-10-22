import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class ActualizarConfiguracionInformeDto {
  @ApiPropertyOptional({ example: 'Octubre 2026', maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  periodo?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  referencia?: string;

  @ApiPropertyOptional({ maxLength: 191 })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  titulo?: string;

  @ApiPropertyOptional({ maxLength: 191 })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  subtitulo?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  piePagina?: string;

  @ApiPropertyOptional({ example: 3200, description: 'COP por 1 USD (tasa fija de referencia)' })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'La tasa debe ser numérica' })
  @IsPositive({ message: 'La tasa debe ser mayor que cero' })
  tasaCambioCop?: number;
}

export class ConfiguracionInformeRespuestaDto {
  @ApiProperty({ example: 'Octubre 2026' }) periodo!: string;
  @ApiProperty({ example: '' }) referencia!: string;
  @ApiProperty({ example: 'Informe de Consumos Meta API' }) titulo!: string;
  @ApiProperty({ example: 'Detalle de cobros WhatsApp Business' }) subtitulo!: string;
  @ApiProperty({ example: 'USD' }) moneda!: string;
  @ApiProperty({ example: 3200 }) tasaCambioCop!: number;
  @ApiProperty() piePagina!: string;
}
