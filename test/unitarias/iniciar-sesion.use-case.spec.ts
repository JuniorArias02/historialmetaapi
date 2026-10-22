import { IniciarSesionUseCase } from '../../src/modulos/autenticacion/aplicacion/casos-uso/iniciar-sesion.use-case';
import { CredencialesInvalidasError } from '../../src/modulos/autenticacion/dominio/errores/errores-autenticacion';
import {
  GeneradorTokensFalso,
  RepositorioUsuariosEnMemoria,
  ServicioHashFalso,
} from '../dobles/dobles-usuarios';

describe('IniciarSesionUseCase', () => {
  let repositorio: RepositorioUsuariosEnMemoria;
  let hash: ServicioHashFalso;
  let casoUso: IniciarSesionUseCase;

  beforeEach(() => {
    repositorio = new RepositorioUsuariosEnMemoria();
    hash = new ServicioHashFalso();
    casoUso = new IniciarSesionUseCase(repositorio, hash, new GeneradorTokensFalso());
    repositorio.agregar({
      nombre: 'Ana',
      correo: 'ana@empresa.com',
      contrasenaHash: 'hash:clave-segura',
    });
  });

  it('devuelve token y datos públicos del usuario con credenciales correctas', async () => {
    const sesion = await casoUso.ejecutar({
      correo: ' ANA@empresa.com',
      contrasena: 'clave-segura',
    });

    expect(sesion).toEqual({
      tokenAcceso: 'token-1',
      expiraEnSegundos: 3600,
      usuario: { id: 1, nombre: 'Ana', correo: 'ana@empresa.com' },
    });
    expect(sesion.usuario).not.toHaveProperty('contrasenaHash');
  });

  it('rechaza una contraseña incorrecta', async () => {
    await expect(
      casoUso.ejecutar({ correo: 'ana@empresa.com', contrasena: 'otra' }),
    ).rejects.toThrow(CredencialesInvalidasError);
  });

  it('rechaza un correo inexistente verificando igualmente contra un hash simulado', async () => {
    await expect(
      casoUso.ejecutar({ correo: 'nadie@empresa.com', contrasena: 'clave-segura' }),
    ).rejects.toThrow(CredencialesInvalidasError);
    expect(hash.verificacionesSinHash).toEqual(['clave-segura']);
  });

  it('rechaza un correo mal formado con el mismo error genérico', async () => {
    await expect(
      casoUso.ejecutar({ correo: 'no-es-correo', contrasena: 'clave-segura' }),
    ).rejects.toThrow(CredencialesInvalidasError);
  });

  it('rechaza a un usuario inactivo aunque la contraseña sea correcta', async () => {
    repositorio.agregar({
      nombre: 'Inactivo',
      correo: 'inactivo@empresa.com',
      contrasenaHash: 'hash:clave-segura',
      activo: false,
    });

    await expect(
      casoUso.ejecutar({ correo: 'inactivo@empresa.com', contrasena: 'clave-segura' }),
    ).rejects.toThrow(CredencialesInvalidasError);
  });
});
