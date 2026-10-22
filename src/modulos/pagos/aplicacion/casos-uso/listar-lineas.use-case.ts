import { LineaResumen } from '../../dominio/entidades/pago';
import { RepositorioPagos } from '../../dominio/puertos/repositorio-pagos';

export class ListarLineasUseCase {
  constructor(private readonly repositorio: RepositorioPagos) {}

  ejecutar(): Promise<LineaResumen[]> {
    return this.repositorio.listarLineas();
  }
}
