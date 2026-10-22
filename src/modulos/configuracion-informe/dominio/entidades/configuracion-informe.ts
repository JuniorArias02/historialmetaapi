import { ConfiguracionInvalidaError } from '../errores/errores-configuracion';

/** Datos de cabecera de los informes y tasa de referencia COP/USD (una sola configuración global). */
export interface ConfiguracionInforme {
  periodo: string;
  referencia: string;
  titulo: string;
  subtitulo: string;
  moneda: string;
  tasaCambioCop: number;
  piePagina: string;
}

export type CambiosConfiguracionInforme = Partial<
  Pick<
    ConfiguracionInforme,
    'periodo' | 'referencia' | 'titulo' | 'subtitulo' | 'piePagina' | 'tasaCambioCop'
  >
>;

/** Valores que usaba el frontend cuando aún no se había importado ningún archivo. */
export const CONFIGURACION_POR_DEFECTO: ConfiguracionInforme = {
  periodo: '',
  referencia: '',
  titulo: 'Informe de Consumos Meta API',
  subtitulo: 'Detalle de cobros WhatsApp Business',
  moneda: 'USD',
  tasaCambioCop: 3200,
  piePagina: 'Documento generado automáticamente',
};

const TASA_MAXIMA = 1_000_000;
const LIMITES_TEXTO = {
  periodo: 60,
  referencia: 120,
  titulo: 191,
  subtitulo: 191,
  piePagina: 1000,
};

export function validarCambiosConfiguracion(
  cambios: CambiosConfiguracionInforme,
): CambiosConfiguracionInforme {
  const validados: CambiosConfiguracionInforme = {};
  for (const [campo, limite] of Object.entries(LIMITES_TEXTO) as [
    keyof typeof LIMITES_TEXTO,
    number,
  ][]) {
    const valor = cambios[campo];
    if (valor === undefined) continue;
    const limpio = valor.trim();
    if (limpio.length > limite) {
      throw new ConfiguracionInvalidaError(`«${campo}» supera ${limite} caracteres`);
    }
    validados[campo] = limpio;
  }
  if (cambios.tasaCambioCop !== undefined) {
    const tasa = cambios.tasaCambioCop;
    if (!Number.isFinite(tasa) || tasa <= 0 || tasa > TASA_MAXIMA) {
      throw new ConfiguracionInvalidaError(
        'La tasa de cambio debe ser mayor que cero y no superar 1.000.000 COP por USD',
      );
    }
    validados.tasaCambioCop = Math.round(tasa * 100) / 100;
  }
  return validados;
}
