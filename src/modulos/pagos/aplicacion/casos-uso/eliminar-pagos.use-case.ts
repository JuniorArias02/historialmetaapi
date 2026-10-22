import { PagoNoEncontradoError } from '../../dominio/errores/errores-pago';
import { CriterioEliminacion, RepositorioPagos } from '../../dominio/puertos/repositorio-pagos';

/** Elimina pagos por ids, solo los ficticios o todos. Entidades, proyectos y líneas se conservan. */
export class EliminarPagosUseCase {
  constructor(private readonly repositorio: RepositorioPagos) {}

  async ejecutar(criterio: CriterioEliminacion): Promise<number> {
    const eliminados = await this.repositorio.eliminar(criterio);
    if (criterio.tipo === 'ids' && criterio.ids.length === 1 && eliminados === 0) {
      throw new PagoNoEncontradoError(criterio.ids[0]);
    }
    return eliminados;
  }
}
