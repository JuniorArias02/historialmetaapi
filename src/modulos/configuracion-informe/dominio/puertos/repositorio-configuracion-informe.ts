import {
  CambiosConfiguracionInforme,
  ConfiguracionInforme,
} from '../entidades/configuracion-informe';

export const REPOSITORIO_CONFIGURACION_INFORME = Symbol('RepositorioConfiguracionInforme');

export interface RepositorioConfiguracionInforme {
  /** null si todavía no se ha guardado ninguna configuración. */
  obtener(): Promise<ConfiguracionInforme | null>;
  /** Crea la configuración con los valores por defecto si no existía. */
  actualizar(cambios: CambiosConfiguracionInforme): Promise<ConfiguracionInforme>;
}
