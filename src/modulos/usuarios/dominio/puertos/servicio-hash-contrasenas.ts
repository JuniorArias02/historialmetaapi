export const SERVICIO_HASH_CONTRASENAS = Symbol('ServicioHashContrasenas');

export interface ServicioHashContrasenas {
  hashear(contrasena: string): Promise<string>;
  /**
   * Compara la contraseña con el hash. Si `hash` es null (usuario inexistente) debe
   * tardar lo mismo que una verificación real y devolver false, para no revelar
   * por tiempo de respuesta qué correos están registrados.
   */
  verificar(contrasena: string, hash: string | null): Promise<boolean>;
}
