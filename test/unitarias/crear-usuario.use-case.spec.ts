import { CrearUsuarioUseCase } from '../../src/modulos/usuarios/aplicacion/casos-uso/crear-usuario.use-case';
import {
  ContrasenaInseguraError,
  CorreoInvalidoError,
  CorreoYaRegistradoError,
} from '../../src/modulos/usuarios/dominio/errores/errores-usuario';
import { RepositorioUsuariosEnMemoria, ServicioHashFalso } from '../dobles/dobles-usuarios';

describe('CrearUsuarioUseCase', () => {
  let repositorio: RepositorioUsuariosEnMemoria;
  let casoUso: CrearUsuarioUseCase;

  beforeEach(() => {
    repositorio = new RepositorioUsuariosEnMemoria();
    casoUso = new CrearUsuarioUseCase(repositorio, new ServicioHashFalso());
  });

  it('crea el usuario con correo normalizado y contraseña hasheada', async () => {
    const creado = await casoUso.ejecutar({
      nombre: ' Ana ',
      correo: 'ANA@empresa.com',
      contrasena: 'clave-segura',
    });

    expect(creado).toEqual({ id: 1, nombre: 'Ana', correo: 'ana@empresa.com' });
    const guardado = await repositorio.buscarPorCorreo('ana@empresa.com');
    expect(guardado?.contrasenaHash).toBe('hash:clave-segura');
  });

  it('rechaza un correo ya registrado aunque cambien las mayúsculas', async () => {
    await casoUso.ejecutar({
      nombre: 'Ana',
      correo: 'ana@empresa.com',
      contrasena: 'clave-segura',
    });

    await expect(
      casoUso.ejecutar({ nombre: 'Otra', correo: 'Ana@Empresa.com', contrasena: 'otra-clave' }),
    ).rejects.toThrow(CorreoYaRegistradoError);
  });

  it.each(['corta', 'x'.repeat(129)])(
    'rechaza contraseñas fuera de 8–128 caracteres',
    async (clave) => {
      await expect(
        casoUso.ejecutar({ nombre: 'Ana', correo: 'ana@empresa.com', contrasena: clave }),
      ).rejects.toThrow(ContrasenaInseguraError);
    },
  );

  it('rechaza correos inválidos', async () => {
    await expect(
      casoUso.ejecutar({ nombre: 'Ana', correo: 'no-es-correo', contrasena: 'clave-segura' }),
    ).rejects.toThrow(CorreoInvalidoError);
  });
});
