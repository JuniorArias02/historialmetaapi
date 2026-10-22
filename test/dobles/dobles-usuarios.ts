import { Usuario } from '../../src/modulos/usuarios/dominio/entidades/usuario';
import { CorreoYaRegistradoError } from '../../src/modulos/usuarios/dominio/errores/errores-usuario';
import {
  DatosNuevoUsuario,
  RepositorioUsuarios,
} from '../../src/modulos/usuarios/dominio/puertos/repositorio-usuarios';
import { ServicioHashContrasenas } from '../../src/modulos/usuarios/dominio/puertos/servicio-hash-contrasenas';
import {
  GeneradorTokens,
  TokenAcceso,
} from '../../src/modulos/autenticacion/dominio/puertos/generador-tokens';

export class RepositorioUsuariosEnMemoria implements RepositorioUsuarios {
  private readonly usuarios: Usuario[] = [];

  agregar(datos: DatosNuevoUsuario & { activo?: boolean }): Usuario {
    const usuario = new Usuario({ id: this.usuarios.length + 1, activo: true, ...datos });
    this.usuarios.push(usuario);
    return usuario;
  }

  buscarPorId(id: number): Promise<Usuario | null> {
    return Promise.resolve(this.usuarios.find((usuario) => usuario.id === id) ?? null);
  }

  buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return Promise.resolve(this.usuarios.find((usuario) => usuario.correo === correo) ?? null);
  }

  async crear(datos: DatosNuevoUsuario): Promise<Usuario> {
    if (await this.buscarPorCorreo(datos.correo)) throw new CorreoYaRegistradoError();
    return this.agregar(datos);
  }
}

/** Hash reversible y trivial: solo para pruebas. */
export class ServicioHashFalso implements ServicioHashContrasenas {
  readonly verificacionesSinHash: string[] = [];

  hashear(contrasena: string): Promise<string> {
    return Promise.resolve(`hash:${contrasena}`);
  }

  verificar(contrasena: string, hash: string | null): Promise<boolean> {
    if (hash === null) {
      this.verificacionesSinHash.push(contrasena);
      return Promise.resolve(false);
    }
    return Promise.resolve(hash === `hash:${contrasena}`);
  }
}

export class GeneradorTokensFalso implements GeneradorTokens {
  generar(usuarioId: number): Promise<TokenAcceso> {
    return Promise.resolve({ token: `token-${usuarioId}`, expiraEnSegundos: 3600 });
  }

  verificar(token: string): Promise<number | null> {
    const coincidencia = /^token-(\d+)$/.exec(token);
    return Promise.resolve(coincidencia ? Number(coincidencia[1]) : null);
  }
}
