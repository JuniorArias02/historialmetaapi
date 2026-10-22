import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { FiltroErroresHttp } from '../compartido/infraestructura/filtros-http/filtro-errores-http';

/** Las importaciones envían miles de pagos en un solo cuerpo JSON. */
const LIMITE_CUERPO_JSON = '10mb';

/** Configuración HTTP común a main.ts y a las pruebas de integración. */
export function configurarAplicacion(app: NestExpressApplication): void {
  app.setGlobalPrefix('api');
  app.useBodyParser('json', { limit: LIMITE_CUERPO_JSON });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new FiltroErroresHttp());
}
