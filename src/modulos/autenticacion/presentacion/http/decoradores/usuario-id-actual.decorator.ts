import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SolicitudAutenticada } from '../guardias/guardia-jwt';

/** Id del usuario autenticado. Usar solo en rutas protegidas con GuardiaJwt. */
export const UsuarioIdActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): number =>
    contexto.switchToHttp().getRequest<SolicitudAutenticada>().usuarioId,
);
