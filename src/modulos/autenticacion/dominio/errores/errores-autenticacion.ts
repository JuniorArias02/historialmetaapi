import { ErrorDominio } from '../../../../compartido/dominio/errores/error-dominio';

/** Mensaje único para correo inexistente, contraseña errónea o usuario inactivo: no revela cuál falló. */
export class CredencialesInvalidasError extends ErrorDominio {
  readonly tipo = 'NO_AUTENTICADO';
  readonly codigo = 'CREDENCIALES_INVALIDAS';

  constructor() {
    super('Correo o contraseña incorrectos');
  }
}

export class SesionInvalidaError extends ErrorDominio {
  readonly tipo = 'NO_AUTENTICADO';
  readonly codigo = 'SESION_INVALIDA';

  constructor() {
    super('La sesión no es válida o ha expirado');
  }
}
