import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { VariablesEntorno } from '../../../../../configuracion/entorno.config';
import {
  REPOSITORIO_USUARIOS,
  RepositorioUsuarios,
} from '../../../../usuarios/dominio/puertos/repositorio-usuarios';
import {
  SERVICIO_HASH_CONTRASENAS,
  ServicioHashContrasenas,
} from '../../../../usuarios/dominio/puertos/servicio-hash-contrasenas';
import { UsuariosModule } from '../../../../usuarios/presentacion/http/modulos/usuarios.module';
import { IniciarSesionUseCase } from '../../../aplicacion/casos-uso/iniciar-sesion.use-case';
import { ObtenerPerfilUseCase } from '../../../aplicacion/casos-uso/obtener-perfil.use-case';
import { GENERADOR_TOKENS, GeneradorTokens } from '../../../dominio/puertos/generador-tokens';
import { GeneradorTokensJwt } from '../../../infraestructura/jwt/generador-tokens-jwt';
import { AutenticacionController } from '../controladores/autenticacion.controller';
import { GuardiaJwt } from '../guardias/guardia-jwt';

@Module({
  imports: [
    UsuariosModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configuracion: ConfigService<VariablesEntorno, true>) => ({
        secret: configuracion.get('JWT_SECRETO', { infer: true }),
        signOptions: { algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AutenticacionController],
  providers: [
    { provide: GENERADOR_TOKENS, useClass: GeneradorTokensJwt },
    {
      provide: IniciarSesionUseCase,
      inject: [REPOSITORIO_USUARIOS, SERVICIO_HASH_CONTRASENAS, GENERADOR_TOKENS],
      useFactory: (
        repositorio: RepositorioUsuarios,
        hash: ServicioHashContrasenas,
        tokens: GeneradorTokens,
      ) => new IniciarSesionUseCase(repositorio, hash, tokens),
    },
    {
      provide: ObtenerPerfilUseCase,
      inject: [REPOSITORIO_USUARIOS],
      useFactory: (repositorio: RepositorioUsuarios) => new ObtenerPerfilUseCase(repositorio),
    },
    GuardiaJwt,
  ],
  // Exportados para proteger los futuros módulos de cobros.
  exports: [GENERADOR_TOKENS, GuardiaJwt],
})
export class AutenticacionModule {}
