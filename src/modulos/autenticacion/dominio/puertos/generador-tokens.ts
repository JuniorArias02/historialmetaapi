export const GENERADOR_TOKENS = Symbol('GeneradorTokens');

export interface TokenAcceso {
  token: string;
  expiraEnSegundos: number;
}

export interface GeneradorTokens {
  generar(usuarioId: number): Promise<TokenAcceso>;
  /** Devuelve el id del usuario si el token es válido y no ha expirado; si no, null. */
  verificar(token: string): Promise<number | null>;
}
