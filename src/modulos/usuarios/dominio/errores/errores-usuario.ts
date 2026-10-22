import { ErrorDominio } from '../../../../compartido/dominio/errores/error-dominio';

export class CorreoInvalidoError extends ErrorDominio {
  readonly tipo = 'VALIDACION';
  readonly codigo = 'CORREO_INVALIDO';

  constructor() {
    super('El correo no tiene un formato válido');
  }
}

export class ContrasenaInseguraError extends ErrorDominio {
  readonly tipo = 'VALIDACION';
  readonly codigo = 'CONTRASENA_INSEGURA';

  constructor(longitudMinima: number, longitudMaxima: number) {
    super(`La contraseña debe tener entre ${longitudMinima} y ${longitudMaxima} caracteres`);
  }
}

export class CorreoYaRegistradoError extends ErrorDominio {
  readonly tipo = 'CONFLICTO';
  readonly codigo = 'CORREO_YA_REGISTRADO';

  constructor() {
    super('Ya existe un usuario con ese correo');
  }
}
