import { DatosBasicosPago, ValoresOriginales, ValorOriginal } from '../entidades/pago';
import { DatosPagoInvalidosError } from '../errores/errores-pago';

/** Coincide con el tamaño de las columnas de nombre en la base de datos. */
export const LONGITUD_MAXIMA_NOMBRE = 191;
/** Límite de DECIMAL(12,4). */
const MONTO_MAXIMO_ABSOLUTO = 99_999_999;
const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const CAMPOS_ORIGINALES = ['proyecto', 'entidad', 'linea', 'fecha', 'monto'] as const;
const LONGITUD_MAXIMA_ORIGINAL = 500;

function validarNombre(valor: string, campo: string): string {
  const limpio = valor.trim();
  if (limpio.length > LONGITUD_MAXIMA_NOMBRE) {
    throw new DatosPagoInvalidosError(
      `El campo «${campo}» supera ${LONGITUD_MAXIMA_NOMBRE} caracteres`,
    );
  }
  return limpio;
}

/** Acepta solo fechas reales entre 2000 y 2100 (mismo criterio que la importación del frontend). */
function validarFecha(valor: string): string {
  const partes = FORMATO_FECHA.exec(valor);
  if (!partes)
    throw new DatosPagoInvalidosError(`Fecha inválida: «${valor}» (se espera AAAA-MM-DD)`);
  const [anio, mes, dia] = partes.slice(1).map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const existe = fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
  if (!existe || anio < 2000 || anio > 2100) {
    throw new DatosPagoInvalidosError(`Fecha inexistente o fuera de rango: «${valor}»`);
  }
  return valor;
}

/** Los montos negativos y en cero se admiten: pueden ser ajustes o reembolsos. */
function validarMonto(valor: number): number {
  if (!Number.isFinite(valor) || Math.abs(valor) > MONTO_MAXIMO_ABSOLUTO) {
    throw new DatosPagoInvalidosError(`Monto fuera de rango: ${valor}`);
  }
  return Math.round(valor * 10_000) / 10_000;
}

export function crearDatosPago(entrada: DatosBasicosPago): DatosBasicosPago {
  return {
    proyecto: validarNombre(entrada.proyecto, 'proyecto'),
    entidad: validarNombre(entrada.entidad, 'entidad'),
    linea: validarNombre(entrada.linea, 'línea'),
    fecha: validarFecha(entrada.fecha),
    monto: validarMonto(entrada.monto),
  };
}

export function datosPagoDifieren(a: DatosBasicosPago, b: DatosBasicosPago): boolean {
  return (
    a.proyecto !== b.proyecto ||
    a.entidad !== b.entidad ||
    a.linea !== b.linea ||
    a.fecha !== b.fecha ||
    a.monto !== b.monto
  );
}

/**
 * Conserva solo los cinco campos esperados con valores simples. Cualquier otra
 * estructura se descarta para no almacenar contenido arbitrario enviado por el cliente.
 */
export function normalizarValoresOriginales(valor: unknown): ValoresOriginales | null {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return null;
  const registro = valor as Record<string, unknown>;
  const simple = (dato: unknown): ValorOriginal => {
    if (typeof dato === 'number' && Number.isFinite(dato)) return dato;
    if (typeof dato === 'string') return dato.slice(0, LONGITUD_MAXIMA_ORIGINAL);
    return null;
  };
  const resultado = {} as ValoresOriginales;
  for (const campo of CAMPOS_ORIGINALES) resultado[campo] = simple(registro[campo]);
  return resultado;
}
