import { Correo } from '../../dominio/objetos-valor/correo';
import { ContrasenaInseguraError } from '../../dominio/errores/errores-usuario';
import { RepositorioUsuarios } from '../../dominio/puertos/repositorio-usuarios';
import { ServicioHashContrasenas } from '../../dominio/puertos/servicio-hash-contrasenas';

export const LONGITUD_MINIMA_CONTRASENA = 8;
/** Límite superior para evitar hashear entradas enormes. */
export const LONGITUD_MAXIMA_CONTRASENA = 128;

export interface ComandoCrearUsuario {
  nombre: string;
  correo: string;
  contrasena: string;
}

export interface UsuarioCreado {
  id: number;
  nombre: string;
  correo: string;
}

/** Registra un usuario que podrá iniciar sesión. No hay registro público: se invoca desde la CLI. */
export class CrearUsuarioUseCase {
  constructor(
    private readonly repositorioUsuarios: RepositorioUsuarios,
    private readonly servicioHash: ServicioHashContrasenas,
  ) {}

  async ejecutar(comando: ComandoCrearUsuario): Promise<UsuarioCreado> {
    const correo = Correo.crear(comando.correo);
    const { contrasena } = comando;
    if (
      contrasena.length < LONGITUD_MINIMA_CONTRASENA ||
      contrasena.length > LONGITUD_MAXIMA_CONTRASENA
    ) {
      throw new ContrasenaInseguraError(LONGITUD_MINIMA_CONTRASENA, LONGITUD_MAXIMA_CONTRASENA);
    }

    const usuario = await this.repositorioUsuarios.crear({
      nombre: comando.nombre.trim(),
      correo: correo.valor,
      contrasenaHash: await this.servicioHash.hashear(contrasena),
    });

    return { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo };
  }
}
