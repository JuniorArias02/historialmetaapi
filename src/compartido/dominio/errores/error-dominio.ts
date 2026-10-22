/**
 * Categorías de error independientes de HTTP. La capa de presentación decide
 * qué código de estado corresponde a cada una.
 */
export type TipoErrorDominio = 'VALIDACION' | 'NO_ENCONTRADO' | 'CONFLICTO' | 'NO_AUTENTICADO';

export abstract class ErrorDominio extends Error {
  abstract readonly tipo: TipoErrorDominio;
  abstract readonly codigo: string;

  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}
