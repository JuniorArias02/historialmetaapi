import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../compartido/infraestructura/prisma/prisma.service';
import { guardarConfiguracion } from '../../../../configuracion-informe/infraestructura/persistencia/repositorios/repositorio-configuracion-informe-prisma';
import { DatosBasicosPago, LineaResumen, Pago } from '../../../dominio/entidades/pago';
import {
  LineaYaRegistradaError,
  PagoNoEncontradoError,
} from '../../../dominio/errores/errores-pago';
import {
  CambiosPago,
  CriterioEliminacion,
  Importacion,
  NuevaLinea,
  NuevoPago,
  RepositorioPagos,
} from '../../../dominio/puertos/repositorio-pagos';
import { INCLUIR_JERARQUIA, PagoMapeador } from '../mapeadores/pago.mapeador';

type Transaccion = Prisma.TransactionClient;

const REGISTRO_NO_ENCONTRADO = 'P2025';
const VIOLACION_RESTRICCION_UNICA = 'P2002';
const TAMANO_LOTE = 1000;
/** Importaciones grandes pueden tardar más que el límite por defecto de Prisma (5 s). */
const OPCIONES_TRANSACCION_LARGA = { timeout: 60_000, maxWait: 10_000 };

const claveLinea = (pago: DatosBasicosPago): string =>
  JSON.stringify([pago.entidad, pago.proyecto, pago.linea]);

@Injectable()
export class RepositorioPagosPrisma implements RepositorioPagos {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<Pago[]> {
    const registros = await this.prisma.pago.findMany({
      include: INCLUIR_JERARQUIA,
      orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
    });
    return registros.map((registro) => PagoMapeador.aDominio(registro));
  }

  async crearLinea(datos: NuevaLinea): Promise<LineaResumen> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const entidad = await tx.entidad.upsert({
          where: { nombre: datos.entidad },
          create: { nombre: datos.entidad },
          update: {},
        });
        const proyecto = await tx.proyecto.upsert({
          where: { entidadId_nombre: { entidadId: entidad.id, nombre: datos.proyecto } },
          create: { entidadId: entidad.id, nombre: datos.proyecto },
          update: {},
        });
        const linea = await tx.linea.create({
          data: { proyectoId: proyecto.id, nombre: datos.linea },
        });
        return {
          id: linea.id,
          nombre: linea.nombre,
          proyecto: proyecto.nombre,
          entidad: entidad.nombre,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === VIOLACION_RESTRICCION_UNICA
      ) {
        throw new LineaYaRegistradaError(datos.linea, datos.proyecto);
      }
      throw error;
    }
  }

  async listarLineas(): Promise<LineaResumen[]> {
    const lineas = await this.prisma.linea.findMany({
      include: { proyecto: { include: { entidad: true } } },
      orderBy: [
        { proyecto: { entidad: { nombre: 'asc' } } },
        { proyecto: { nombre: 'asc' } },
        { nombre: 'asc' },
      ],
    });
    return lineas.map((l) => ({
      id: l.id,
      nombre: l.nombre,
      proyecto: l.proyecto.nombre,
      entidad: l.proyecto.entidad.nombre,
    }));
  }

  async buscarLinea(id: number): Promise<LineaResumen | null> {
    const l = await this.prisma.linea.findUnique({
      where: { id },
      include: { proyecto: { include: { entidad: true } } },
    });
    return l
      ? {
          id: l.id,
          nombre: l.nombre,
          proyecto: l.proyecto.nombre,
          entidad: l.proyecto.entidad.nombre,
        }
      : null;
  }

  async buscarPorId(id: number): Promise<Pago | null> {
    const registro = await this.prisma.pago.findUnique({
      where: { id },
      include: INCLUIR_JERARQUIA,
    });
    return registro ? PagoMapeador.aDominio(registro) : null;
  }

  async crear(pago: NuevoPago): Promise<Pago> {
    const registro = await this.prisma.$transaction(async (tx) => {
      const lineaId = await this.obtenerLineaId(tx, pago);
      return tx.pago.create({
        data: this.datosCreacion(pago, lineaId),
        include: INCLUIR_JERARQUIA,
      });
    });
    return PagoMapeador.aDominio(registro);
  }

  async actualizar(id: number, cambios: CambiosPago): Promise<Pago> {
    try {
      const registro = await this.prisma.$transaction(async (tx) => {
        const lineaId = await this.obtenerLineaId(tx, cambios);
        const actualizado = await tx.pago.update({
          where: { id },
          data: {
            lineaId,
            fecha: PagoMapeador.fechaAPersistencia(cambios.fecha),
            monto: new Prisma.Decimal(cambios.monto),
            nota: cambios.nota,
            advertencias: cambios.advertencias,
            editado: cambios.editado,
          },
          include: INCLUIR_JERARQUIA,
        });
        return actualizado;
      });
      return PagoMapeador.aDominio(registro);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === REGISTRO_NO_ENCONTRADO
      ) {
        throw new PagoNoEncontradoError(id);
      }
      throw error;
    }
  }

  async eliminar(criterio: CriterioEliminacion): Promise<number> {
    const filtro: Prisma.PagoWhereInput =
      criterio.tipo === 'ids'
        ? { id: { in: criterio.ids } }
        : criterio.tipo === 'ficticios'
          ? { ficticio: true }
          : {};
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.pago.deleteMany({ where: filtro });
      return count;
    });
  }

  async importar(importacion: Importacion): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      if (importacion.modo === 'reemplazar') await tx.pago.deleteMany();

      // Una sola resolución de línea por combinación entidad/proyecto/línea.
      const lineas = new Map<string, number>();
      for (const pago of importacion.pagos) {
        const clave = claveLinea(pago);
        if (!lineas.has(clave)) lineas.set(clave, await this.obtenerLineaId(tx, pago));
      }

      let insertados = 0;
      for (let inicio = 0; inicio < importacion.pagos.length; inicio += TAMANO_LOTE) {
        const lote = importacion.pagos.slice(inicio, inicio + TAMANO_LOTE);
        const { count } = await tx.pago.createMany({
          data: lote.map((pago) => this.datosCreacion(pago, lineas.get(claveLinea(pago)) ?? 0)),
        });
        insertados += count;
      }

      if (importacion.configuracion) await guardarConfiguracion(tx, importacion.configuracion);
      return insertados;
    }, OPCIONES_TRANSACCION_LARGA);
  }

  private datosCreacion(pago: NuevoPago, lineaId: number): Prisma.PagoCreateManyInput {
    return {
      lineaId,
      fecha: PagoMapeador.fechaAPersistencia(pago.fecha),
      monto: new Prisma.Decimal(pago.monto),
      origen: pago.origen,
      ubicacion: pago.ubicacion,
      ficticio: pago.ficticio,
      nota: pago.nota,
      advertencias: pago.advertencias,
      original: PagoMapeador.jsonOpcional(pago.original),
    };
  }

  /** Busca o crea entidad → proyecto → línea y devuelve el id de la línea. */
  private async obtenerLineaId(tx: Transaccion, pago: DatosBasicosPago): Promise<number> {
    const entidad = await tx.entidad.upsert({
      where: { nombre: pago.entidad },
      create: { nombre: pago.entidad },
      update: {},
    });
    const proyecto = await tx.proyecto.upsert({
      where: { entidadId_nombre: { entidadId: entidad.id, nombre: pago.proyecto } },
      create: { entidadId: entidad.id, nombre: pago.proyecto },
      update: {},
    });
    const linea = await tx.linea.upsert({
      where: { proyectoId_nombre: { proyectoId: proyecto.id, nombre: pago.linea } },
      create: { proyectoId: proyecto.id, nombre: pago.linea },
      update: {},
    });
    return linea.id;
  }
}
