export type ValorOriginal = string | number | null;

/** Valores tal como llegaron en el archivo importado (sin normalizar). */
export interface ValoresOriginales {
  proyecto: ValorOriginal;
  entidad: ValorOriginal;
  linea: ValorOriginal;
  fecha: ValorOriginal;
  monto: ValorOriginal;
}

/** Datos que identifican un pago: a qué línea pertenece, cuándo y por cuánto (USD). */
export interface DatosBasicosPago {
  proyecto: string;
  entidad: string;
  linea: string;
  /** Fecha ISO AAAA-MM-DD. */
  fecha: string;
  monto: number;
}

/** Línea de WhatsApp con su proyecto y entidad, para elegir dónde registrar un pago. */
export interface LineaResumen {
  id: number;
  nombre: string;
  proyecto: string;
  entidad: string;
}

export interface Pago extends DatosBasicosPago {
  id: number;
  origen: string;
  ubicacion: string;
  ficticio: boolean;
  editado: boolean;
  nota: string;
  advertencias: string[];
  original: ValoresOriginales | null;
}
