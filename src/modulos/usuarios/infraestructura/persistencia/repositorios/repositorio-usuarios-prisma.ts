import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../compartido/infraestructura/prisma/prisma.service';
import { Usuario } from '../../../dominio/entidades/usuario';
import { CorreoYaRegistradoError } from '../../../dominio/errores/errores-usuario';
import {
  DatosNuevoUsuario,
  RepositorioUsuarios,
} from '../../../dominio/puertos/repositorio-usuarios';
import { UsuarioMapeador } from '../mapeadores/usuario.mapeador';

const VIOLACION_RESTRICCION_UNICA = 'P2002';

@Injectable()
export class RepositorioUsuariosPrisma implements RepositorioUsuarios {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: number): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { id } });
    return registro ? UsuarioMapeador.aDominio(registro) : null;
  }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { correo } });
    return registro ? UsuarioMapeador.aDominio(registro) : null;
  }

  async crear(datos: DatosNuevoUsuario): Promise<Usuario> {
    try {
      const registro = await this.prisma.usuario.create({ data: datos });
      return UsuarioMapeador.aDominio(registro);
    } catch (error) {
      // Se confía en el índice único en lugar de consultar antes, para evitar carreras.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === VIOLACION_RESTRICCION_UNICA
      ) {
        throw new CorreoYaRegistradoError();
      }
      throw error;
    }
  }
}
