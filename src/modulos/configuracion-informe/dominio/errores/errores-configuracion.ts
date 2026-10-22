import { ErrorDominio } from '../../../../compartido/dominio/errores/error-dominio';

export class ConfiguracionInvalidaError extends ErrorDominio {
  readonly tipo = 'VALIDACION';
  readonly codigo = 'CONFIGURACION_INVALIDA';
}
