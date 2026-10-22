import { DatosBasicosPago, Pago } from '../../dominio/entidades/pago';
import { crearDatosPago } from '../../dominio/objetos-valor/datos-pago';
import { RepositorioPagos } from '../../dominio/puertos/repositorio-pagos';

export interface ComandoCrearPago extends DatosBasicosPago {
  nota: string;
  advertencias: string[];
}

/** Alta manual de un movimiento: queda marcado con origen «manual» y sin valores originales. */
export class CrearPagoUseCase {
  constructor(private readonly repositorio: RepositorioPagos) {}

  async ejecutar(comando: ComandoCrearPago): Promise<Pago> {
    return this.repositorio.crear({
      ...crearDatosPago(comando),
      origen: 'manual',
      ubicacion: 'Registro manual',
      ficticio: false,
      nota: comando.nota.trim(),
      advertencias: comando.advertencias,
      original: null,
    });
  }
}
