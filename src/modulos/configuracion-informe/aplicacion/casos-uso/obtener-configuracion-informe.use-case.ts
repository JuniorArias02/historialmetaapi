import {
  CONFIGURACION_POR_DEFECTO,
  ConfiguracionInforme,
} from '../../dominio/entidades/configuracion-informe';
import { RepositorioConfiguracionInforme } from '../../dominio/puertos/repositorio-configuracion-informe';

export class ObtenerConfiguracionInformeUseCase {
  constructor(private readonly repositorio: RepositorioConfiguracionInforme) {}

  async ejecutar(): Promise<ConfiguracionInforme> {
    return (await this.repositorio.obtener()) ?? { ...CONFIGURACION_POR_DEFECTO };
  }
}
