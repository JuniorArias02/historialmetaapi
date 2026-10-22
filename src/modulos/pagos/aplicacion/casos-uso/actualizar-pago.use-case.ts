import { DatosBasicosPago, Pago } from '../../dominio/entidades/pago';
import {
  PagoNoEncontradoError,
  SinValoresOriginalesError,
} from '../../dominio/errores/errores-pago';
import { crearDatosPago, datosPagoDifieren } from '../../dominio/objetos-valor/datos-pago';
import { RepositorioPagos } from '../../dominio/puertos/repositorio-pagos';

export interface ComandoActualizarPago extends DatosBasicosPago {
  nota: string;
  advertencias: string[];
  /** true cuando los valores enviados son los originales del archivo y se quiere quitar la marca de edición. */
  restaurarOriginal: boolean;
}

/**
 * Edita un movimiento. Cambiar proyecto, entidad, línea, fecha o monto lo marca como
 * «editado» (cambiar solo la nota no). La marca se conserva hasta restaurar los valores originales.
 */
export class ActualizarPagoUseCase {
  constructor(private readonly repositorio: RepositorioPagos) {}

  async ejecutar(id: number, comando: ComandoActualizarPago): Promise<Pago> {
    const actual = await this.repositorio.buscarPorId(id);
    if (!actual) throw new PagoNoEncontradoError(id);
    if (comando.restaurarOriginal && !actual.original) throw new SinValoresOriginalesError();

    const datos = crearDatosPago(comando);
    const editado = comando.restaurarOriginal
      ? false
      : actual.editado || datosPagoDifieren(datos, actual);

    return this.repositorio.actualizar(id, {
      ...datos,
      nota: comando.nota.trim(),
      advertencias: comando.advertencias,
      editado,
    });
  }
}
