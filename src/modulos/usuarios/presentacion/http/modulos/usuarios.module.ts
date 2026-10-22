import { Module } from '@nestjs/common';
import { CrearUsuarioUseCase } from '../../../aplicacion/casos-uso/crear-usuario.use-case';
import {
  REPOSITORIO_USUARIOS,
  RepositorioUsuarios,
} from '../../../dominio/puertos/repositorio-usuarios';
import {
  SERVICIO_HASH_CONTRASENAS,
  ServicioHashContrasenas,
} from '../../../dominio/puertos/servicio-hash-contrasenas';
import { RepositorioUsuariosPrisma } from '../../../infraestructura/persistencia/repositorios/repositorio-usuarios-prisma';
import { ServicioHashArgon2 } from '../../../infraestructura/seguridad/servicio-hash-argon2';

/** Sin controladores: los usuarios se crean por CLI y se consumen desde autenticación. */
@Module({
  providers: [
    { provide: REPOSITORIO_USUARIOS, useClass: RepositorioUsuariosPrisma },
    { provide: SERVICIO_HASH_CONTRASENAS, useClass: ServicioHashArgon2 },
    {
      provide: CrearUsuarioUseCase,
      inject: [REPOSITORIO_USUARIOS, SERVICIO_HASH_CONTRASENAS],
      useFactory: (repositorio: RepositorioUsuarios, hash: ServicioHashContrasenas) =>
        new CrearUsuarioUseCase(repositorio, hash),
    },
  ],
  exports: [REPOSITORIO_USUARIOS, SERVICIO_HASH_CONTRASENAS, CrearUsuarioUseCase],
})
export class UsuariosModule {}
