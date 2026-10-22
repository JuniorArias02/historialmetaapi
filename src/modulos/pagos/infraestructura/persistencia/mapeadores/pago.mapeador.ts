import { Prisma } from '@prisma/client';
import { Pago } from '../../../dominio/entidades/pago';
import { normalizarValoresOriginales } from '../../../dominio/objetos-valor/datos-pago';

export const INCLUIR_JERARQUIA = {
  linea: { include: { proyecto: { include: { entidad: true } } } },
} satisfies Prisma.PagoInclude;

export type PagoConJerarquia = Prisma.PagoGetPayload<{ include: typeof INCLUIR_JERARQUIA }>;

function aListaDeTextos(valor: Prisma.JsonValue): string[] {
  return Array.isArray(valor) ? valor.filter((x): x is string => typeof x === 'string') : [];
}

export const PagoMapeador = {
  aDominio(registro: PagoConJerarquia): Pago {
    return {
      id: registro.id,
      proyecto: registro.linea.proyecto.nombre,
      entidad: registro.linea.proyecto.entidad.nombre,
      linea: registro.linea.nombre,
      // Columna DATE: Prisma la entrega como medianoche UTC.
      fecha: registro.fecha.toISOString().slice(0, 10),
      monto: registro.monto.toNumber(),
      origen: registro.origen,
      ubicacion: registro.ubicacion,
      ficticio: registro.ficticio,
      editado: registro.editado,
      nota: registro.nota,
      advertencias: aListaDeTextos(registro.advertencias),
      original: normalizarValoresOriginales(registro.original),
    };
  },

  fechaAPersistencia(fecha: string): Date {
    return new Date(`${fecha}T00:00:00.000Z`);
  },

  jsonOpcional(valor: object | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
    return valor === null ? Prisma.DbNull : valor;
  },
};
