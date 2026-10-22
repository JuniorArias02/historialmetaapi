/**
 * Importa datos_cobros.json a la base de datos.
 *   npm run prisma:seed                     (busca datos_cobros.json en la raíz del backend)
 *   npx prisma db seed -- ruta/al/archivo.json
 *
 * El archivo contiene datos reales de clientes y no se versiona: cópielo al servidor a mano.
 *
 * Es idempotente y no destructivo: crea entidades, proyectos y líneas que falten,
 * actualiza la configuración del informe y solo inserta pagos en líneas que aún no
 * tienen ninguno (así una segunda ejecución no duplica montos).
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

interface PagoOrigen {
  fecha: string;
  monto: number;
}

interface ItemOrigen {
  proyecto: string;
  entidad: string;
  linea: string;
  pagos: PagoOrigen[];
}

interface ArchivoCobros {
  periodo: string;
  referencia: string;
  titulo: string;
  subtitulo: string;
  moneda: string;
  tasaCambioCOP: number;
  piePagina: string;
  items: ItemOrigen[];
}

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null;
const esTexto = (valor: unknown): valor is string => typeof valor === 'string';
const esTextoNoVacio = (valor: unknown): valor is string => esTexto(valor) && valor.trim() !== '';

function validarArchivo(contenido: unknown): ArchivoCobros {
  if (!esObjeto(contenido) || !Array.isArray(contenido.items)) {
    throw new Error('El archivo debe ser un objeto con la lista "items"');
  }
  for (const campo of ['periodo', 'titulo', 'subtitulo', 'moneda', 'piePagina'] as const) {
    if (!esTexto(contenido[campo])) throw new Error(`Falta el campo de texto "${campo}"`);
  }
  if (typeof contenido.tasaCambioCOP !== 'number' || contenido.tasaCambioCOP <= 0) {
    throw new Error('"tasaCambioCOP" debe ser un número positivo');
  }
  contenido.items.forEach((item: unknown, indice) => {
    const ubicacion = `items[${indice}]`;
    if (!esObjeto(item)) throw new Error(`${ubicacion} no es un objeto`);
    for (const campo of ['proyecto', 'entidad', 'linea'] as const) {
      if (!esTextoNoVacio(item[campo])) throw new Error(`${ubicacion}.${campo} es obligatorio`);
    }
    if (!Array.isArray(item.pagos)) throw new Error(`${ubicacion}.pagos debe ser una lista`);
    item.pagos.forEach((pago: unknown, indicePago) => {
      if (!esObjeto(pago) || !esTexto(pago.fecha) || typeof pago.monto !== 'number') {
        throw new Error(
          `${ubicacion}.pagos[${indicePago}] debe tener fecha (texto) y monto (número)`,
        );
      }
    });
  });
  return contenido as unknown as ArchivoCobros;
}

/** Convierte "DD/MM/AAAA" en una fecha UTC, rechazando fechas imposibles como 31/02. */
function convertirFecha(texto: string): Date {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) throw new Error(`Fecha con formato inválido (se espera DD/MM/AAAA): "${texto}"`);
  const [, dia, mes, anio] = partes.map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) {
    throw new Error(`Fecha inexistente: "${texto}"`);
  }
  return fecha;
}

async function importar(
  prisma: PrismaClient,
  archivo: ArchivoCobros,
  nombreArchivo: string,
): Promise<void> {
  const configuracion = {
    periodo: archivo.periodo,
    referencia: archivo.referencia ?? '',
    titulo: archivo.titulo,
    subtitulo: archivo.subtitulo,
    moneda: archivo.moneda,
    tasaCambioCop: new Prisma.Decimal(archivo.tasaCambioCOP),
    piePagina: archivo.piePagina,
  };

  let pagosInsertados = 0;
  let lineasOmitidas = 0;

  await prisma.$transaction(async (tx) => {
    await tx.configuracionInforme.upsert({
      where: { id: 1 },
      create: { id: 1, ...configuracion },
      update: configuracion,
    });

    for (const [indiceItem, item] of archivo.items.entries()) {
      const entidad = await tx.entidad.upsert({
        where: { nombre: item.entidad.trim() },
        create: { nombre: item.entidad.trim() },
        update: {},
      });
      const proyecto = await tx.proyecto.upsert({
        where: { entidadId_nombre: { entidadId: entidad.id, nombre: item.proyecto.trim() } },
        create: { entidadId: entidad.id, nombre: item.proyecto.trim() },
        update: {},
      });
      const linea = await tx.linea.upsert({
        where: { proyectoId_nombre: { proyectoId: proyecto.id, nombre: item.linea.trim() } },
        create: { proyectoId: proyecto.id, nombre: item.linea.trim() },
        update: {},
      });

      if ((await tx.pago.count({ where: { lineaId: linea.id } })) > 0) {
        lineasOmitidas++;
        continue;
      }
      const { count } = await tx.pago.createMany({
        data: item.pagos.map((pago, indicePago) => ({
          lineaId: linea.id,
          fecha: convertirFecha(pago.fecha),
          monto: new Prisma.Decimal(pago.monto.toFixed(4)),
          origen: nombreArchivo,
          ubicacion: `Elemento ${indiceItem + 1} (${item.proyecto.trim()}) › pago ${indicePago + 1}`,
          original: {
            proyecto: item.proyecto,
            entidad: item.entidad,
            linea: item.linea,
            fecha: pago.fecha,
            monto: pago.monto,
          },
        })),
      });
      pagosInsertados += count;
    }
  });

  console.info(
    `Importación completa: ${archivo.items.length} líneas procesadas, ` +
      `${pagosInsertados} pagos insertados, ${lineasOmitidas} líneas ya tenían pagos y se omitieron.`,
  );
}

/** backend/datos_cobros.json, o la carpeta superior cuando el backend está dentro del proyecto completo. */
function buscarArchivoPorDefecto(): string {
  const candidatos = [
    resolve(__dirname, '../datos_cobros.json'),
    resolve(__dirname, '../../datos_cobros.json'),
  ];
  const encontrado = candidatos.find((ruta) => existsSync(ruta));
  if (!encontrado) {
    throw new Error(
      `No se encontró datos_cobros.json (buscado en: ${candidatos.join(', ')}).\n` +
        'Copie el archivo a la carpeta del backend o indique la ruta: npx prisma db seed -- /ruta/datos_cobros.json',
    );
  }
  return encontrado;
}

async function principal(): Promise<void> {
  const ruta = process.argv[2] ? resolve(process.argv[2]) : buscarArchivoPorDefecto();
  const archivo = validarArchivo(JSON.parse(readFileSync(ruta, 'utf8')));
  const prisma = new PrismaClient();
  try {
    await importar(prisma, archivo, basename(ruta));
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
