import { ActualizarPagoUseCase } from '../../src/modulos/pagos/aplicacion/casos-uso/actualizar-pago.use-case';
import { CrearPagoUseCase } from '../../src/modulos/pagos/aplicacion/casos-uso/crear-pago.use-case';
import { EliminarPagosUseCase } from '../../src/modulos/pagos/aplicacion/casos-uso/eliminar-pagos.use-case';
import { ImportarPagosUseCase } from '../../src/modulos/pagos/aplicacion/casos-uso/importar-pagos.use-case';
import { ConfiguracionInvalidaError } from '../../src/modulos/configuracion-informe/dominio/errores/errores-configuracion';
import {
  DatosPagoInvalidosError,
  PagoNoEncontradoError,
  SinValoresOriginalesError,
} from '../../src/modulos/pagos/dominio/errores/errores-pago';
import { RepositorioPagosEnMemoria } from '../dobles/repositorio-pagos-en-memoria';

const datosBase = {
  proyecto: 'ESE Imsalud',
  entidad: 'Imsalud',
  linea: '3143644500 Imsalud',
  fecha: '2026-10-08',
  monto: 99.92,
  nota: '',
  advertencias: [],
};

describe('Casos de uso de pagos', () => {
  let repositorio: RepositorioPagosEnMemoria;

  beforeEach(() => {
    repositorio = new RepositorioPagosEnMemoria();
  });

  describe('CrearPagoUseCase', () => {
    it('marca el pago como manual, recorta textos y redondea a 4 decimales', async () => {
      const pago = await new CrearPagoUseCase(repositorio).ejecutar({
        ...datosBase,
        entidad: '  Imsalud ',
        monto: 1.123456,
        nota: ' revisar ',
      });
      expect(pago).toMatchObject({
        entidad: 'Imsalud',
        monto: 1.1235,
        origen: 'manual',
        ubicacion: 'Registro manual',
        nota: 'revisar',
        original: null,
      });
    });

    it.each([
      ['fecha imposible', { fecha: '2026-02-30' }],
      ['fecha fuera de rango', { fecha: '1999-12-31' }],
      ['monto infinito', { monto: Number.POSITIVE_INFINITY }],
      ['nombre demasiado largo', { entidad: 'x'.repeat(192) }],
    ])('rechaza %s', async (_caso, cambio) => {
      await expect(
        new CrearPagoUseCase(repositorio).ejecutar({ ...datosBase, ...cambio }),
      ).rejects.toThrow(DatosPagoInvalidosError);
    });

    it('admite montos negativos y en cero (ajustes o reembolsos)', async () => {
      const casoUso = new CrearPagoUseCase(repositorio);
      await expect(casoUso.ejecutar({ ...datosBase, monto: -5 })).resolves.toMatchObject({
        monto: -5,
      });
      await expect(casoUso.ejecutar({ ...datosBase, monto: 0 })).resolves.toMatchObject({
        monto: 0,
      });
    });
  });

  describe('ActualizarPagoUseCase', () => {
    const importado = {
      ...datosBase,
      origen: 'datos.json',
      ubicacion: 'Elemento 1',
      ficticio: false,
      original: { ...datosBase, fecha: '08/10/2026' },
    };

    it('cambiar solo la nota no marca el pago como editado', async () => {
      const pago = await repositorio.crear(importado);
      const actualizado = await new ActualizarPagoUseCase(repositorio).ejecutar(pago.id, {
        ...datosBase,
        nota: 'confirmado con la factura',
        restaurarOriginal: false,
      });
      expect(actualizado).toMatchObject({ editado: false, nota: 'confirmado con la factura' });
    });

    it('cambiar el monto marca editado y la marca se conserva en ediciones posteriores', async () => {
      const casoUso = new ActualizarPagoUseCase(repositorio);
      const pago = await repositorio.crear(importado);
      await casoUso.ejecutar(pago.id, { ...datosBase, monto: 10, restaurarOriginal: false });
      const segunda = await casoUso.ejecutar(pago.id, {
        ...datosBase,
        monto: 10,
        nota: 'x',
        restaurarOriginal: false,
      });
      expect(segunda.editado).toBe(true);
    });

    it('restaurar los valores originales quita la marca de edición', async () => {
      const casoUso = new ActualizarPagoUseCase(repositorio);
      const pago = await repositorio.crear(importado);
      await casoUso.ejecutar(pago.id, { ...datosBase, monto: 10, restaurarOriginal: false });
      const restaurado = await casoUso.ejecutar(pago.id, { ...datosBase, restaurarOriginal: true });
      expect(restaurado).toMatchObject({ editado: false, monto: 99.92 });
    });

    it('no permite restaurar un pago sin valores originales', async () => {
      const pago = await repositorio.crear({ ...importado, original: null });
      await expect(
        new ActualizarPagoUseCase(repositorio).ejecutar(pago.id, {
          ...datosBase,
          restaurarOriginal: true,
        }),
      ).rejects.toThrow(SinValoresOriginalesError);
    });

    it('informa cuando el pago no existe', async () => {
      await expect(
        new ActualizarPagoUseCase(repositorio).ejecutar(99, {
          ...datosBase,
          restaurarOriginal: false,
        }),
      ).rejects.toThrow(PagoNoEncontradoError);
    });
  });

  describe('EliminarPagosUseCase', () => {
    it('elimina solo los ficticios', async () => {
      await repositorio.crear({
        ...datosBase,
        origen: 'a',
        ubicacion: '',
        ficticio: false,
        original: null,
      });
      await repositorio.crear({
        ...datosBase,
        origen: 'f',
        ubicacion: '',
        ficticio: true,
        original: null,
      });
      await expect(
        new EliminarPagosUseCase(repositorio).ejecutar({ tipo: 'ficticios' }),
      ).resolves.toBe(1);
      expect(repositorio.pagos).toHaveLength(1);
    });

    it('informa si el pago individual a eliminar no existe', async () => {
      await expect(
        new EliminarPagosUseCase(repositorio).ejecutar({ tipo: 'ids', ids: [7] }),
      ).rejects.toThrow(PagoNoEncontradoError);
    });
  });

  describe('ImportarPagosUseCase', () => {
    const aImportar = {
      ...datosBase,
      origen: 'archivo.csv',
      ubicacion: 'Fila 2',
      ficticio: false,
      original: { fecha: '08/10/2026', monto: '99,92', extra: { no: 'permitido' } },
    };

    it('descarta campos inesperados de los valores originales', async () => {
      await new ImportarPagosUseCase(repositorio).ejecutar({
        modo: 'agregar',
        pagos: [aImportar],
        configuracion: null,
      });
      expect(repositorio.ultimaImportacion?.pagos[0].original).toEqual({
        proyecto: null,
        entidad: null,
        linea: null,
        fecha: '08/10/2026',
        monto: '99,92',
      });
    });

    it('indica qué pago es inválido y no importa ninguno', async () => {
      await expect(
        new ImportarPagosUseCase(repositorio).ejecutar({
          modo: 'reemplazar',
          pagos: [aImportar, { ...aImportar, fecha: '2026-13-01' }],
          configuracion: null,
        }),
      ).rejects.toThrow(/^Pago 2: /);
      expect(repositorio.ultimaImportacion).toBeNull();
    });

    it('valida la tasa de cambio que llega con el archivo', async () => {
      await expect(
        new ImportarPagosUseCase(repositorio).ejecutar({
          modo: 'agregar',
          pagos: [aImportar],
          configuracion: { tasaCambioCop: 0 },
        }),
      ).rejects.toThrow(ConfiguracionInvalidaError);
    });
  });
});
