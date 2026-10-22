import { ErrorDominio } from '../../../../compartido/dominio/errores/error-dominio';

export class DatosPagoInvalidosError extends ErrorDominio {
  readonly tipo = 'VALIDACION';
  readonly codigo = 'DATOS_PAGO_INVALIDOS';
}

export class PagoNoEncontradoError extends ErrorDominio {
  readonly tipo = 'NO_ENCONTRADO';
  readonly codigo = 'PAGO_NO_ENCONTRADO';

  constructor(id: number) {
    super(`No existe el pago ${id}`);
  }
}

export class LineaNoEncontradaError extends ErrorDominio {
  readonly tipo = 'NO_ENCONTRADO';
  readonly codigo = 'LINEA_NO_ENCONTRADA';

  constructor(id: number) {
    super(`No existe la línea ${id}`);
  }
}

export class LineaYaRegistradaError extends ErrorDominio {
  readonly tipo = 'CONFLICTO';
  readonly codigo = 'LINEA_YA_REGISTRADA';

  constructor(linea: string, proyecto: string) {
    super(`La línea «${linea}» ya está asignada al proyecto «${proyecto}»`);
  }
}

export class SinValoresOriginalesError extends ErrorDominio {
  readonly tipo = 'CONFLICTO';
  readonly codigo = 'SIN_VALORES_ORIGINALES';

  constructor() {
    super('El pago no conserva valores originales que restaurar');
  }
}
