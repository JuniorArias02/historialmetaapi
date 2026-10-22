import { CorreoInvalidoError } from '../errores/errores-usuario';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LONGITUD_MAXIMA = 191;

/** Correo normalizado (sin espacios y en minúsculas) para que el inicio de sesión no dependa de mayúsculas. */
export class Correo {
  private constructor(readonly valor: string) {}

  static crear(texto: string): Correo {
    const normalizado = texto.trim().toLowerCase();
    if (normalizado.length > LONGITUD_MAXIMA || !FORMATO_CORREO.test(normalizado)) {
      throw new CorreoInvalidoError();
    }
    return new Correo(normalizado);
  }
}
