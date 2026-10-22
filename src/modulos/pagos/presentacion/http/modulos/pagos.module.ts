import { Module } from '@nestjs/common';
import { AutenticacionModule } from '../../../../autenticacion/presentacion/http/modulos/autenticacion.module';
import { ActualizarPagoUseCase } from '../../../aplicacion/casos-uso/actualizar-pago.use-case';
import { CrearPagoUseCase } from '../../../aplicacion/casos-uso/crear-pago.use-case';
import { CrearProyectoUseCase } from '../../../aplicacion/casos-uso/crear-proyecto.use-case';
import { EliminarPagosUseCase } from '../../../aplicacion/casos-uso/eliminar-pagos.use-case';
import { ImportarPagosUseCase } from '../../../aplicacion/casos-uso/importar-pagos.use-case';
import { ListarLineasUseCase } from '../../../aplicacion/casos-uso/listar-lineas.use-case';
import { ListarPagosUseCase } from '../../../aplicacion/casos-uso/listar-pagos.use-case';
import { RegistrarPagoUseCase } from '../../../aplicacion/casos-uso/registrar-pago.use-case';
import { REPOSITORIO_PAGOS, RepositorioPagos } from '../../../dominio/puertos/repositorio-pagos';
import { RepositorioPagosPrisma } from '../../../infraestructura/persistencia/repositorios/repositorio-pagos-prisma';
import { LineasController } from '../controladores/lineas.controller';
import { PagosController } from '../controladores/pagos.controller';
import { ProyectosController } from '../controladores/proyectos.controller';

const casoDeUso = <T>(clase: new (repositorio: RepositorioPagos) => T) => ({
  provide: clase,
  inject: [REPOSITORIO_PAGOS],
  useFactory: (repositorio: RepositorioPagos) => new clase(repositorio),
});

@Module({
  imports: [AutenticacionModule],
  controllers: [PagosController, LineasController, ProyectosController],
  providers: [
    { provide: REPOSITORIO_PAGOS, useClass: RepositorioPagosPrisma },
    casoDeUso(ListarPagosUseCase),
    casoDeUso(CrearPagoUseCase),
    casoDeUso(ActualizarPagoUseCase),
    casoDeUso(EliminarPagosUseCase),
    casoDeUso(ImportarPagosUseCase),
    casoDeUso(ListarLineasUseCase),
    casoDeUso(RegistrarPagoUseCase),
    casoDeUso(CrearProyectoUseCase),
  ],
})
export class PagosModule {}
