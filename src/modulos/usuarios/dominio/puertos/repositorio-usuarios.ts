import { Usuario } from '../entidades/usuario';

export const REPOSITORIO_USUARIOS = Symbol('RepositorioUsuarios');

export interface DatosNuevoUsuario {
  nombre: string;
  correo: string;
  contrasenaHash: string;
}

export interface RepositorioUsuarios {
  buscarPorId(id: number): Promise<Usuario | null>;
  /** Recibe el correo ya normalizado. */
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  /** Lanza CorreoYaRegistradoError si el correo ya existe. */
  crear(datos: DatosNuevoUsuario): Promise<Usuario>;
}
