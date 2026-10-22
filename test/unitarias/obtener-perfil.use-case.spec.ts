import { ObtenerPerfilUseCase } from '../../src/modulos/autenticacion/aplicacion/casos-uso/obtener-perfil.use-case';
import { SesionInvalidaError } from '../../src/modulos/autenticacion/dominio/errores/errores-autenticacion';
import { RepositorioUsuariosEnMemoria } from '../dobles/dobles-usuarios';

describe('ObtenerPerfilUseCase', () => {
  const repositorio = new RepositorioUsuariosEnMemoria();
  const activo = repositorio.agregar({
    nombre: 'Ana',
    correo: 'ana@empresa.com',
    contrasenaHash: 'h',
  });
  const inactivo = repositorio.agregar({
    nombre: 'Luis',
    correo: 'luis@empresa.com',
    contrasenaHash: 'h',
    activo: false,
  });
  const casoUso = new ObtenerPerfilUseCase(repositorio);

  it('devuelve los datos públicos del usuario activo', async () => {
    await expect(casoUso.ejecutar(activo.id)).resolves.toEqual({
      id: activo.id,
      nombre: 'Ana',
      correo: 'ana@empresa.com',
    });
  });

  it.each([
    ['inactivo', inactivo.id],
    ['inexistente', 999],
  ])('rechaza a un usuario %s', async (_caso, id) => {
    await expect(casoUso.ejecutar(id)).rejects.toThrow(SesionInvalidaError);
  });
});
