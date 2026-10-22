import { Pago } from '../../dominio/entidades/pago';
import { LineaNoEncontradaError } from '../../dominio/errores/errores-pago';
import { crearDatosPago } from '../../dominio/objetos-valor/datos-pago';
import { RepositorioPagos } from '../../dominio/puertos/repositorio-pagos';

export interface ComandoRegistrarPago {
  lineaId: number;
  /** AAAA-MM-DD */
  fecha: string;
  /** USD */
  monto: number;
  nota?: string;
}

/**
 * Registra un pago en una línea existente: la entidad y el proyecto se toman de la línea.
 * Queda como movimiento manual. Las advertencias coinciden con las que calcula la importación
 * del frontend, para que el análisis de calidad de datos las muestre igual.
 */
export class RegistrarPagoUseCase {
  constructor(private readonly repositorio: RepositorioPagos) {}

  async ejecutar(comando: ComandoRegistrarPago): Promise<Pago> {
    const linea = await this.repositorio.buscarLinea(comando.lineaId);
    if (!linea) throw new LineaNoEncontradaError(comando.lineaId);

    const datos = crearDatosPago({
      entidad: linea.entidad,
      proyecto: linea.proyecto,
      linea: linea.nombre,
      fecha: comando.fecha,
      monto: comando.monto,
    });
    const advertencias: string[] = [];
    if (datos.monto < 0) advertencias.push('Monto negativo (podría ser un ajuste o reembolso)');
    if (datos.monto === 0) advertencias.push('Monto en cero');

    return this.repositorio.crear({
      ...datos,
      origen: 'manual',
      ubicacion: 'Registro manual',
      ficticio: false,
      nota: (comando.nota ?? '').trim(),
      advertencias,
      original: null,
    });
  }
}
