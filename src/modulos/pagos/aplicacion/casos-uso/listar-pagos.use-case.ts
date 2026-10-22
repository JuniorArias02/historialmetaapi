import { Pago } from '../../dominio/entidades/pago';
import { RepositorioPagos } from '../../dominio/puertos/repositorio-pagos';

/**
 * Devuelve todos los pagos. Los análisis (totales, variaciones, picos) se calculan en el
 * frontend sobre el conjunto completo, por eso no se pagina: el volumen esperado es de
 * cientos o pocos miles de movimientos.
 */
export class ListarPagosUseCase {
  constructor(private readonly repositorio: RepositorioPagos) {}

  ejecutar(): Promise<Pago[]> {
    return this.repositorio.listar();
  }
}
