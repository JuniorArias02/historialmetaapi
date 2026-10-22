import { RepositorioUsuarios } from '../../../usuarios/dominio/puertos/repositorio-usuarios';
import { SesionInvalidaError } from '../../dominio/errores/errores-autenticacion';
import { UsuarioAutenticado } from '../dto/usuario-autenticado';

/**
 * Devuelve el usuario de la sesión. Consulta la base de datos para que un usuario
 * desactivado deje de tener acceso aunque su token todavía no haya expirado.
 */
export class ObtenerPerfilUseCase {
  constructor(private readonly repositorioUsuarios: RepositorioUsuarios) {}

  async ejecutar(usuarioId: number): Promise<UsuarioAutenticado> {
    const usuario = await this.repositorioUsuarios.buscarPorId(usuarioId);
    if (!usuario || !usuario.activo) {
      throw new SesionInvalidaError();
    }
    return { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo };
  }
}
