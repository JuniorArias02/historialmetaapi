import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorRespuestaDto } from '../../../../autenticacion/presentacion/http/dto/respuestas-autenticacion.dto';
import { GuardiaJwt } from '../../../../autenticacion/presentacion/http/guardias/guardia-jwt';
import { CrearProyectoUseCase } from '../../../aplicacion/casos-uso/crear-proyecto.use-case';
import { CrearProyectoDto, LineaRespuestaDto } from '../dto/lineas.dto';

@ApiTags('Proyectos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorRespuestaDto, description: 'Sin sesión válida' })
@UseGuards(GuardiaJwt)
@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly crearProyecto: CrearProyectoUseCase) {}

  @Post()
  @ApiOperation({
    summary: 'Crea un proyecto en una entidad y le asigna una línea',
    description:
      'Si la entidad o el proyecto ya existen se reutilizan (sirve para añadir otra línea a un proyecto). Devuelve la línea creada, lista para registrar pagos.',
  })
  @ApiCreatedResponse({ type: LineaRespuestaDto })
  @ApiBadRequestResponse({ type: ErrorRespuestaDto })
  @ApiConflictResponse({
    type: ErrorRespuestaDto,
    description: 'La línea ya existe en ese proyecto',
  })
  crear(@Body() dto: CrearProyectoDto): Promise<LineaRespuestaDto> {
    return this.crearProyecto.ejecutar(dto);
  }
}
