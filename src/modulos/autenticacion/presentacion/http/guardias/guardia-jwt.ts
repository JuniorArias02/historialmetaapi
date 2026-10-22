import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { SesionInvalidaError } from '../../../dominio/errores/errores-autenticacion';
import { GENERADOR_TOKENS, GeneradorTokens } from '../../../dominio/puertos/generador-tokens';

export interface SolicitudAutenticada extends Request {
  usuarioId: number;
}

/** Exige un token Bearer válido y deja el id del usuario en la solicitud. */
@Injectable()
export class GuardiaJwt implements CanActivate {
  constructor(@Inject(GENERADOR_TOKENS) private readonly generadorTokens: GeneradorTokens) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const solicitud = contexto.switchToHttp().getRequest<Request & Partial<SolicitudAutenticada>>();
    const [esquema, token] = solicitud.headers.authorization?.split(' ') ?? [];
    if (esquema !== 'Bearer' || !token) {
      throw new SesionInvalidaError();
    }

    const usuarioId = await this.generadorTokens.verificar(token);
    if (usuarioId === null) {
      throw new SesionInvalidaError();
    }
    solicitud.usuarioId = usuarioId;
    return true;
  }
}
