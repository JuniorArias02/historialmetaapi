import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IniciarSesionUseCase } from '../../../aplicacion/casos-uso/iniciar-sesion.use-case';
import { ObtenerPerfilUseCase } from '../../../aplicacion/casos-uso/obtener-perfil.use-case';
import { UsuarioIdActual } from '../decoradores/usuario-id-actual.decorator';
import { IniciarSesionDto } from '../dto/iniciar-sesion.dto';
import {
  ErrorRespuestaDto,
  SesionRespuestaDto,
  UsuarioRespuestaDto,
} from '../dto/respuestas-autenticacion.dto';
import { GuardiaJwt } from '../guardias/guardia-jwt';

@ApiTags('Autenticación')
@Controller('autenticacion')
export class AutenticacionController {
  constructor(
    private readonly iniciarSesion: IniciarSesionUseCase,
    private readonly obtenerPerfil: ObtenerPerfilUseCase,
  ) {}

  @Post('iniciar-sesion')
  @HttpCode(HttpStatus.OK)
  // Límite estricto por IP para frenar ataques de fuerza bruta.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Inicia sesión con correo y contraseña y devuelve un JWT' })
  @ApiOkResponse({ type: SesionRespuestaDto })
  @ApiBadRequestResponse({ type: ErrorRespuestaDto, description: 'Datos de entrada inválidos' })
  @ApiUnauthorizedResponse({ type: ErrorRespuestaDto, description: 'Credenciales incorrectas' })
  @ApiTooManyRequestsResponse({ description: 'Más de 5 intentos por minuto' })
  iniciar(@Body() dto: IniciarSesionDto): Promise<SesionRespuestaDto> {
    return this.iniciarSesion.ejecutar({ correo: dto.correo, contrasena: dto.contrasena });
  }

  @Get('perfil')
  @UseGuards(GuardiaJwt)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve el usuario de la sesión actual' })
  @ApiOkResponse({ type: UsuarioRespuestaDto })
  @ApiUnauthorizedResponse({
    type: ErrorRespuestaDto,
    description: 'Token ausente, inválido o expirado',
  })
  perfil(@UsuarioIdActual() usuarioId: number): Promise<UsuarioRespuestaDto> {
    return this.obtenerPerfil.ejecutar(usuarioId);
  }
}
