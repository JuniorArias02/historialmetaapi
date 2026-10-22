import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { VariablesEntorno } from '../../../../configuracion/entorno.config';
import { GeneradorTokens, TokenAcceso } from '../../dominio/puertos/generador-tokens';

interface CargaToken {
  sub: number;
}

function esCargaToken(valor: unknown): valor is CargaToken {
  return (
    typeof valor === 'object' && valor !== null && 'sub' in valor && Number.isInteger(valor.sub)
  );
}

@Injectable()
export class GeneradorTokensJwt implements GeneradorTokens {
  private readonly expiraEnSegundos: number;

  constructor(
    private readonly jwtService: JwtService,
    configuracion: ConfigService<VariablesEntorno, true>,
  ) {
    this.expiraEnSegundos = configuracion.get('JWT_EXPIRACION_SEGUNDOS', { infer: true });
  }

  async generar(usuarioId: number): Promise<TokenAcceso> {
    const carga: CargaToken = { sub: usuarioId };
    const token = await this.jwtService.signAsync(carga, { expiresIn: this.expiraEnSegundos });
    return { token, expiraEnSegundos: this.expiraEnSegundos };
  }

  async verificar(token: string): Promise<number | null> {
    try {
      const carga: unknown = await this.jwtService.verifyAsync(token);
      return esCargaToken(carga) ? carga.sub : null;
    } catch {
      // Firma inválida, token mal formado o expirado: todos significan "sin sesión".
      return null;
    }
  }
}
