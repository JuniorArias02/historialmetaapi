import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validarEntorno } from './configuracion/entorno.config';
import { PrismaModule } from './compartido/infraestructura/prisma/prisma.module';
import { AutenticacionModule } from './modulos/autenticacion/presentacion/http/modulos/autenticacion.module';
import { ConfiguracionInformeModule } from './modulos/configuracion-informe/presentacion/http/modulos/configuracion-informe.module';
import { PagosModule } from './modulos/pagos/presentacion/http/modulos/pagos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AutenticacionModule,
    PagosModule,
    ConfiguracionInformeModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
