import { RegistrarPagoUseCase } from '../../src/modulos/pagos/aplicacion/casos-uso/registrar-pago.use-case';
import {
  DatosPagoInvalidosError,
  LineaNoEncontradaError,
} from '../../src/modulos/pagos/dominio/errores/errores-pago';
import { RepositorioPagosEnMemoria } from '../dobles/repositorio-pagos-en-memoria';

describe('RegistrarPagoUseCase', () => {
  let repositorio: RepositorioPagosEnMemoria;
  let casoUso: RegistrarPagoUseCase;

  beforeEach(() => {
    repositorio = new RepositorioPagosEnMemoria();
    repositorio.lineas = [
      { id: 6, nombre: '3143644500 Imsalud', proyecto: 'ESE Imsalud', entidad: 'Imsalud' },
    ];
    casoUso = new RegistrarPagoUseCase(repositorio);
  });

  it('toma la entidad y el proyecto de la línea y marca el pago como manual', async () => {
    const pago = await casoUso.ejecutar({
      lineaId: 6,
      fecha: '2026-10-21',
      monto: 25.4,
      nota: ' factura 1 ',
    });
    expect(pago).toMatchObject({
      entidad: 'Imsalud',
      proyecto: 'ESE Imsalud',
      linea: '3143644500 Imsalud',
      fecha: '2026-10-21',
      monto: 25.4,
      origen: 'manual',
      nota: 'factura 1',
      advertencias: [],
      original: null,
    });
  });

  it.each([
    [-3, 'Monto negativo (podría ser un ajuste o reembolso)'],
    [0, 'Monto en cero'],
  ])('registra el monto %s con su advertencia', async (monto, advertencia) => {
    const pago = await casoUso.ejecutar({ lineaId: 6, fecha: '2026-10-21', monto });
    expect(pago.advertencias).toEqual([advertencia]);
  });

  it('informa si la línea no existe', async () => {
    await expect(casoUso.ejecutar({ lineaId: 99, fecha: '2026-10-21', monto: 1 })).rejects.toThrow(
      LineaNoEncontradaError,
    );
  });

  it('rechaza fechas inexistentes', async () => {
    await expect(casoUso.ejecutar({ lineaId: 6, fecha: '2026-02-30', monto: 1 })).rejects.toThrow(
      DatosPagoInvalidosError,
    );
  });
});
