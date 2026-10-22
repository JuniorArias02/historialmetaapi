import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configurarAplicacion } from './configuracion/configurar-aplicacion';
import { VariablesEntorno } from './configuracion/entorno.config';

async function iniciar(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configuracion = app.get<ConfigService<VariablesEntorno, true>>(ConfigService);

  if (configuracion.get('CONFIAR_PROXY', { infer: true })) app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({
    origin: configuracion.get('CORS_ORIGENES', { infer: true }).split(','),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  configurarAplicacion(app);

  if (configuracion.get('NODE_ENV', { infer: true }) !== 'production') {
    const documento = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Meta Billing Analytics API')
        .setDescription('Informes de consumos de Meta WhatsApp Business')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, documento);
  }

  app.enableShutdownHooks();
  await app.listen(configuracion.get('PUERTO', { infer: true }));
}

void iniciar();
