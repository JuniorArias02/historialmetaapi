import { Module } from '@nestjs/common';
import { AutenticacionModule } from '../../../../autenticacion/presentacion/http/modulos/autenticacion.module';
import { ActualizarConfiguracionInformeUseCase } from '../../../aplicacion/casos-uso/actualizar-configuracion-informe.use-case';
import { ObtenerConfiguracionInformeUseCase } from '../../../aplicacion/casos-uso/obtener-configuracion-informe.use-case';
import {
  REPOSITORIO_CONFIGURACION_INFORME,
  RepositorioConfiguracionInforme,
} from '../../../dominio/puertos/repositorio-configuracion-informe';
import { RepositorioConfiguracionInformePrisma } from '../../../infraestructura/persistencia/repositorios/repositorio-configuracion-informe-prisma';
import { ConfiguracionInformeController } from '../controladores/configuracion-informe.controller';

@Module({
  imports: [AutenticacionModule],
  controllers: [ConfiguracionInformeController],
  providers: [
    { provide: REPOSITORIO_CONFIGURACION_INFORME, useClass: RepositorioConfiguracionInformePrisma },
    {
      provide: ObtenerConfiguracionInformeUseCase,
      inject: [REPOSITORIO_CONFIGURACION_INFORME],
      useFactory: (repositorio: RepositorioConfiguracionInforme) =>
        new ObtenerConfiguracionInformeUseCase(repositorio),
    },
    {
      provide: ActualizarConfiguracionInformeUseCase,
      inject: [REPOSITORIO_CONFIGURACION_INFORME],
      useFactory: (repositorio: RepositorioConfiguracionInforme) =>
        new ActualizarConfiguracionInformeUseCase(repositorio),
    },
  ],
})
export class ConfiguracionInformeModule {}
