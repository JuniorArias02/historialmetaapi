import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorRespuestaDto } from '../../../../autenticacion/presentacion/http/dto/respuestas-autenticacion.dto';
import { GuardiaJwt } from '../../../../autenticacion/presentacion/http/guardias/guardia-jwt';
import { ActualizarPagoUseCase } from '../../../aplicacion/casos-uso/actualizar-pago.use-case';
import { CrearPagoUseCase } from '../../../aplicacion/casos-uso/crear-pago.use-case';
import { EliminarPagosUseCase } from '../../../aplicacion/casos-uso/eliminar-pagos.use-case';
import { ImportarPagosUseCase } from '../../../aplicacion/casos-uso/importar-pagos.use-case';
import { ListarPagosUseCase } from '../../../aplicacion/casos-uso/listar-pagos.use-case';
import {
  ActualizarPagoDto,
  DatosPagoDto,
  EliminarPagosDto,
  ImportarPagosDto,
  PagoRespuestaDto,
  ResultadoCantidadDto,
} from '../dto/pagos.dto';

@ApiTags('Pagos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorRespuestaDto, description: 'Sin sesión válida' })
@UseGuards(GuardiaJwt)
@Controller('pagos')
export class PagosController {
  constructor(
    private readonly listarPagos: ListarPagosUseCase,
    private readonly crearPago: CrearPagoUseCase,
    private readonly actualizarPago: ActualizarPagoUseCase,
    private readonly eliminarPagos: EliminarPagosUseCase,
    private readonly importarPagos: ImportarPagosUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Todos los pagos con su entidad, proyecto y línea' })
  @ApiOkResponse({ type: [PagoRespuestaDto] })
  listar(): Promise<PagoRespuestaDto[]> {
    return this.listarPagos.ejecutar();
  }

  @Post()
  @ApiOperation({ summary: 'Agrega un movimiento manual' })
  @ApiCreatedResponse({ type: PagoRespuestaDto })
  @ApiBadRequestResponse({ type: ErrorRespuestaDto })
  crear(@Body() dto: DatosPagoDto): Promise<PagoRespuestaDto> {
    return this.crearPago.ejecutar(dto);
  }

  @Post('importacion')
  @ApiOperation({
    summary: 'Importa movimientos ya validados en el frontend',
    description:
      'Atómico: si un pago es inválido no se guarda ninguno. «reemplazar» elimina antes todos los pagos.',
  })
  @ApiCreatedResponse({ type: ResultadoCantidadDto })
  @ApiBadRequestResponse({ type: ErrorRespuestaDto })
  async importar(@Body() dto: ImportarPagosDto): Promise<ResultadoCantidadDto> {
    const cantidad = await this.importarPagos.ejecutar({
      modo: dto.modo,
      configuracion: dto.configuracion ?? null,
      pagos: dto.pagos.map((pago) => ({ ...pago, original: pago.original ?? null })),
    });
    return { cantidad };
  }

  @Post('eliminacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Elimina varios pagos por id' })
  @ApiOkResponse({ type: ResultadoCantidadDto })
  async eliminarVarios(@Body() dto: EliminarPagosDto): Promise<ResultadoCantidadDto> {
    return { cantidad: await this.eliminarPagos.ejecutar({ tipo: 'ids', ids: dto.ids }) };
  }

  // Declarada antes de DELETE :id para que «ficticios» no se interprete como id.
  @Delete('ficticios')
  @ApiOperation({ summary: 'Elimina los pagos ficticios; los reales no se modifican' })
  @ApiOkResponse({ type: ResultadoCantidadDto })
  async eliminarFicticios(): Promise<ResultadoCantidadDto> {
    return { cantidad: await this.eliminarPagos.ejecutar({ tipo: 'ficticios' }) };
  }

  @Delete()
  @ApiOperation({ summary: 'Elimina TODOS los pagos (irreversible)' })
  @ApiOkResponse({ type: ResultadoCantidadDto })
  async eliminarTodos(): Promise<ResultadoCantidadDto> {
    return { cantidad: await this.eliminarPagos.ejecutar({ tipo: 'todos' }) };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Reemplaza los datos de un pago' })
  @ApiOkResponse({ type: PagoRespuestaDto })
  @ApiNotFoundResponse({ type: ErrorRespuestaDto })
  @ApiConflictResponse({ type: ErrorRespuestaDto, description: 'No hay valores originales' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPagoDto,
  ): Promise<PagoRespuestaDto> {
    return this.actualizarPago.ejecutar(id, {
      ...dto,
      restaurarOriginal: dto.restaurarOriginal ?? false,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un pago' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorRespuestaDto })
  async eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.eliminarPagos.ejecutar({ tipo: 'ids', ids: [id] });
  }
}
