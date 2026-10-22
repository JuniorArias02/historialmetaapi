import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GuardiaJwt } from '../../../../autenticacion/presentacion/http/guardias/guardia-jwt';
import { ErrorRespuestaDto } from '../../../../autenticacion/presentacion/http/dto/respuestas-autenticacion.dto';
import { ActualizarConfiguracionInformeUseCase } from '../../../aplicacion/casos-uso/actualizar-configuracion-informe.use-case';
import { ObtenerConfiguracionInformeUseCase } from '../../../aplicacion/casos-uso/obtener-configuracion-informe.use-case';
import {
  ActualizarConfiguracionInformeDto,
  ConfiguracionInformeRespuestaDto,
} from '../dto/configuracion-informe.dto';

@ApiTags('Configuración del informe')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorRespuestaDto, description: 'Sin sesión válida' })
@UseGuards(GuardiaJwt)
@Controller('configuracion-informe')
export class ConfiguracionInformeController {
  constructor(
    private readonly obtenerConfiguracion: ObtenerConfiguracionInformeUseCase,
    private readonly actualizarConfiguracion: ActualizarConfiguracionInformeUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Cabecera de los informes y tasa de cambio de referencia' })
  @ApiOkResponse({ type: ConfiguracionInformeRespuestaDto })
  obtener(): Promise<ConfiguracionInformeRespuestaDto> {
    return this.obtenerConfiguracion.ejecutar();
  }

  @Patch()
  @ApiOperation({ summary: 'Actualiza solo los campos enviados' })
  @ApiOkResponse({ type: ConfiguracionInformeRespuestaDto })
  @ApiBadRequestResponse({ type: ErrorRespuestaDto })
  actualizar(
    @Body() dto: ActualizarConfiguracionInformeDto,
  ): Promise<ConfiguracionInformeRespuestaDto> {
    return this.actualizarConfiguracion.ejecutar(dto);
  }
}
