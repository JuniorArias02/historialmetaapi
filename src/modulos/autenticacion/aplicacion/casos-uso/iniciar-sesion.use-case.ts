import { CorreoInvalidoError } from '../../../usuarios/dominio/errores/errores-usuario';
import { Correo } from '../../../usuarios/dominio/objetos-valor/correo';
import { RepositorioUsuarios } from '../../../usuarios/dominio/puertos/repositorio-usuarios';
import { ServicioHashContrasenas } from '../../../usuarios/dominio/puertos/servicio-hash-contrasenas';
import { CredencialesInvalidasError } from '../../dominio/errores/errores-autenticacion';
import { GeneradorTokens } from '../../dominio/puertos/generador-tokens';
import { SesionIniciada } from '../dto/usuario-autenticado';

export interface ComandoIniciarSesion {
  correo: string;
  contrasena: string;
}

/** Valida credenciales y emite un token de acceso. */
export class IniciarSesionUseCase {
  constructor(
    private readonly repositorioUsuarios: RepositorioUsuarios,
    private readonly servicioHash: ServicioHashContrasenas,
    private readonly generadorTokens: GeneradorTokens,
  ) {}

  async ejecutar(comando: ComandoIniciarSesion): Promise<SesionIniciada> {
    const correo = this.normalizarCorreo(comando.correo);
    const usuario = correo ? await this.repositorioUsuarios.buscarPorCorreo(correo) : null;

    // Se verifica siempre (con hash simulado si no hay usuario) para igualar tiempos de respuesta.
    const contrasenaValida = await this.servicioHash.verificar(
      comando.contrasena,
      usuario?.contrasenaHash ?? null,
    );
    if (!usuario || !contrasenaValida || !usuario.activo) {
      throw new CredencialesInvalidasError();
    }

    const { token, expiraEnSegundos } = await this.generadorTokens.generar(usuario.id);
    return {
      tokenAcceso: token,
      expiraEnSegundos,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
    };
  }

  private normalizarCorreo(texto: string): string | null {
    try {
      return Correo.crear(texto).valor;
    } catch (error) {
      if (error instanceof CorreoInvalidoError) return null;
      throw error;
    }
  }
}
