import {
  CambiosConfiguracionInforme,
  ConfiguracionInforme,
  validarCambiosConfiguracion,
} from '../../dominio/entidades/configuracion-informe';
import { RepositorioConfiguracionInforme } from '../../dominio/puertos/repositorio-configuracion-informe';

export class ActualizarConfiguracionInformeUseCase {
  constructor(private readonly repositorio: RepositorioConfiguracionInforme) {}

  async ejecutar(cambios: CambiosConfiguracionInforme): Promise<ConfiguracionInforme> {
    return this.repositorio.actualizar(validarCambiosConfiguracion(cambios));
  }
}
