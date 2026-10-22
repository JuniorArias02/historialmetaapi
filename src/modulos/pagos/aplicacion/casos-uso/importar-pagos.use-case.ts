import {
  CambiosConfiguracionInforme,
  validarCambiosConfiguracion,
} from '../../../configuracion-informe/dominio/entidades/configuracion-informe';
import { DatosBasicosPago } from '../../dominio/entidades/pago';
import { DatosPagoInvalidosError } from '../../dominio/errores/errores-pago';
import {
  crearDatosPago,
  normalizarValoresOriginales,
} from '../../dominio/objetos-valor/datos-pago';
import { RepositorioPagos } from '../../dominio/puertos/repositorio-pagos';

const LONGITUD_MAXIMA_TRAZA = 255;

export interface PagoAImportar extends DatosBasicosPago {
  origen: string;
  ubicacion: string;
  ficticio: boolean;
  nota: string;
  advertencias: string[];
  original: unknown;
}

export interface ComandoImportarPagos {
  modo: 'reemplazar' | 'agregar';
  pagos: PagoAImportar[];
  configuracion: CambiosConfiguracionInforme | null;
}

/**
 * Guarda movimientos ya interpretados y validados en el frontend (JSON/CSV con vista previa).
 * Aquí se vuelven a validar porque nunca se confía en el cliente; si un solo pago es inválido,
 * no se importa nada.
 */
export class ImportarPagosUseCase {
  constructor(private readonly repositorio: RepositorioPagos) {}

  async ejecutar(comando: ComandoImportarPagos): Promise<number> {
    const pagos = comando.pagos.map((pago, indice) => {
      try {
        return {
          ...crearDatosPago(pago),
          origen: pago.origen.trim().slice(0, LONGITUD_MAXIMA_TRAZA) || 'importado',
          ubicacion: pago.ubicacion.trim().slice(0, LONGITUD_MAXIMA_TRAZA),
          ficticio: pago.ficticio,
          nota: pago.nota.trim(),
          advertencias: pago.advertencias,
          original: normalizarValoresOriginales(pago.original),
        };
      } catch (error) {
        if (error instanceof DatosPagoInvalidosError) {
          throw new DatosPagoInvalidosError(`Pago ${indice + 1}: ${error.message}`);
        }
        throw error;
      }
    });

    return this.repositorio.importar({
      modo: comando.modo,
      pagos,
      configuracion: comando.configuracion
        ? validarCambiosConfiguracion(comando.configuracion)
        : null,
    });
  }
}
