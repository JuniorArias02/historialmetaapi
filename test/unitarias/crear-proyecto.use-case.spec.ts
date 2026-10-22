import { CrearProyectoUseCase } from '../../src/modulos/pagos/aplicacion/casos-uso/crear-proyecto.use-case';
import { DatosPagoInvalidosError } from '../../src/modulos/pagos/dominio/errores/errores-pago';
import { RepositorioPagosEnMemoria } from '../dobles/repositorio-pagos-en-memoria';

describe('CrearProyectoUseCase', () => {
  it('crea el proyecto con la línea, recortando espacios', async () => {
    const repositorio = new RepositorioPagosEnMemoria();
    const linea = await new CrearProyectoUseCase(repositorio).ejecutar({
      entidad: ' Hospital Regional ',
      proyecto: 'Chatbot Citas ',
      linea: ' 3001234567 Citas',
    });
    expect(linea).toEqual({
      id: 1,
      nombre: '3001234567 Citas',
      proyecto: 'Chatbot Citas',
      entidad: 'Hospital Regional',
    });
  });

  it.each(['entidad', 'proyecto', 'linea'] as const)('exige el campo %s', async (campo) => {
    const datos = { entidad: 'E', proyecto: 'P', linea: 'L', [campo]: '   ' };
    await expect(
      new CrearProyectoUseCase(new RepositorioPagosEnMemoria()).ejecutar(datos),
    ).rejects.toThrow(DatosPagoInvalidosError);
  });
});
