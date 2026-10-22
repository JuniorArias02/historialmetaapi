import { ApiProperty } from '@nestjs/swagger';

export class UsuarioRespuestaDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Administrador' })
  nombre!: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  correo!: string;
}

export class SesionRespuestaDto {
  @ApiProperty({ description: 'JWT para enviar en la cabecera Authorization: Bearer <token>' })
  tokenAcceso!: string;

  @ApiProperty({ example: 28800, description: 'Segundos de validez del token' })
  expiraEnSegundos!: number;

  @ApiProperty({ type: UsuarioRespuestaDto })
  usuario!: UsuarioRespuestaDto;
}

export class ErrorRespuestaDto {
  @ApiProperty({ example: 401 })
  statusCode!: number;

  @ApiProperty({ example: 'CREDENCIALES_INVALIDAS' })
  codigo!: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Correo o contraseña incorrectos',
  })
  mensaje!: string | string[];
}
