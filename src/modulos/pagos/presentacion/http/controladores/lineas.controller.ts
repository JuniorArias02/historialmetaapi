import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorRespuestaDto } from '../../../../autenticacion/presentacion/http/dto/respuestas-autenticacion.dto';
import { GuardiaJwt } from '../../../../autenticacion/presentacion/http/guardias/guardia-jwt';
import { ListarLineasUseCase } from '../../../aplicacion/casos-uso/listar-lineas.use-case';
import { RegistrarPagoUseCase } from '../../../aplicacion/casos-uso/registrar-pago.use-case';
import { LineaRespuestaDto, RegistrarPagoDto } from '../dto/lineas.dto';
import { PagoRespuestaDto } from '../dto/pagos.dto';

@ApiTags('Líneas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorRespuestaDto, description: 'Sin sesión válida' })
@UseGuards(GuardiaJwt)
@Controller('lineas')
export class LineasController {
  constructor(
    private readonly listarLineas: ListarLineasUseCase,
    private readonly registrarPago: RegistrarPagoUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Líneas de WhatsApp disponibles, con su proyecto y entidad' })
  @ApiOkResponse({ type: [LineaRespuestaDto] })
  listar(): Promise<LineaRespuestaDto[]> {
    return this.listarLineas.ejecutar();
  }

  @Post(':lineaId/pagos')
  @ApiOperation({
    summary: 'Registra un pago (fecha y monto) en una línea',
    description:
      'La entidad y el proyecto se toman de la línea. El pago queda con origen «manual».',
  })
  @ApiCreatedResponse({ type: PagoRespuestaDto })
  @ApiBadRequestResponse({ type: ErrorRespuestaDto, description: 'Fecha o monto inválidos' })
  @ApiNotFoundResponse({ type: ErrorRespuestaDto, description: 'La línea no existe' })
  registrar(
    @Param('lineaId', ParseIntPipe) lineaId: number,
    @Body() dto: RegistrarPagoDto,
  ): Promise<PagoRespuestaDto> {
    return this.registrarPago.ejecutar({ lineaId, ...dto });
  }
}
