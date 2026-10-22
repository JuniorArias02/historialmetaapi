import { CambiosConfiguracionInforme } from '../../../configuracion-informe/dominio/entidades/configuracion-informe';
import { DatosBasicosPago, LineaResumen, Pago, ValoresOriginales } from '../entidades/pago';

export const REPOSITORIO_PAGOS = Symbol('RepositorioPagos');

export interface NuevoPago extends DatosBasicosPago {
  origen: string;
  ubicacion: string;
  ficticio: boolean;
  nota: string;
  advertencias: string[];
  original: ValoresOriginales | null;
}

export interface CambiosPago extends DatosBasicosPago {
  nota: string;
  advertencias: string[];
  editado: boolean;
}

export type CriterioEliminacion =
  { tipo: 'ids'; ids: number[] } | { tipo: 'ficticios' } | { tipo: 'todos' };

export interface Importacion {
  /** "reemplazar" elimina todos los pagos existentes antes de insertar. */
  modo: 'reemplazar' | 'agregar';
  pagos: NuevoPago[];
  /** Cambios de cabecera del informe que llegan con el archivo, aplicados en la misma transacción. */
  configuracion: CambiosConfiguracionInforme | null;
}

export interface NuevaLinea {
  entidad: string;
  proyecto: string;
  linea: string;
}

/**
 * Persistencia de pagos. Entidades, proyectos y líneas forman un catálogo: se crean al guardar
 * pagos o de forma explícita, y se conservan aunque no tengan pagos (para poder registrar en ellas).
 */
export interface RepositorioPagos {
  listar(): Promise<Pago[]>;
  /** Líneas ordenadas por entidad, proyecto y nombre. */
  listarLineas(): Promise<LineaResumen[]>;
  buscarLinea(id: number): Promise<LineaResumen | null>;
  /** Crea la entidad y el proyecto si no existen y les asigna la línea. Lanza LineaYaRegistradaError si ya existe. */
  crearLinea(datos: NuevaLinea): Promise<LineaResumen>;
  buscarPorId(id: number): Promise<Pago | null>;
  crear(pago: NuevoPago): Promise<Pago>;
  actualizar(id: number, cambios: CambiosPago): Promise<Pago>;
  /** Devuelve cuántos pagos se eliminaron. */
  eliminar(criterio: CriterioEliminacion): Promise<number>;
  /** Operación atómica: o se aplica todo o nada. Devuelve cuántos pagos se insertaron. */
  importar(importacion: Importacion): Promise<number>;
}
