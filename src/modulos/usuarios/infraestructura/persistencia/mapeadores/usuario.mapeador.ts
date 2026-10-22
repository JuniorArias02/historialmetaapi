import type { Usuario as UsuarioPrisma } from '@prisma/client';
import { Usuario } from '../../../dominio/entidades/usuario';

export const UsuarioMapeador = {
  aDominio(registro: UsuarioPrisma): Usuario {
    return new Usuario({
      id: registro.id,
      nombre: registro.nombre,
      correo: registro.correo,
      contrasenaHash: registro.contrasenaHash,
      activo: registro.activo,
    });
  },
};
