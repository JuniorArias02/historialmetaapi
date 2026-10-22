import { Injectable } from '@nestjs/common';
import { ConfiguracionInforme as ConfiguracionPrisma, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../compartido/infraestructura/prisma/prisma.service';
import {
  CambiosConfiguracionInforme,
  CONFIGURACION_POR_DEFECTO,
  ConfiguracionInforme,
} from '../../../dominio/entidades/configuracion-informe';
import { RepositorioConfiguracionInforme } from '../../../dominio/puertos/repositorio-configuracion-informe';

/** La configuración es una fila única con id = 1. */
export const ID_CONFIGURACION = 1;

export function configuracionADominio(registro: ConfiguracionPrisma): ConfiguracionInforme {
  return {
    periodo: registro.periodo,
    referencia: registro.referencia,
    titulo: registro.titulo,
    subtitulo: registro.subtitulo,
    moneda: registro.moneda,
    tasaCambioCop: registro.tasaCambioCop.toNumber(),
    piePagina: registro.piePagina,
  };
}

/** Aplica cambios sobre la fila única usando el cliente dado (permite usarlo dentro de transacciones). */
export async function guardarConfiguracion(
  cliente: Prisma.TransactionClient,
  cambios: CambiosConfiguracionInforme,
): Promise<ConfiguracionPrisma> {
  return cliente.configuracionInforme.upsert({
    where: { id: ID_CONFIGURACION },
    create: { ...CONFIGURACION_POR_DEFECTO, ...cambios, id: ID_CONFIGURACION },
    update: cambios,
  });
}

@Injectable()
export class RepositorioConfiguracionInformePrisma implements RepositorioConfiguracionInforme {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(): Promise<ConfiguracionInforme | null> {
    const registro = await this.prisma.configuracionInforme.findUnique({
      where: { id: ID_CONFIGURACION },
    });
    return registro ? configuracionADominio(registro) : null;
  }

  async actualizar(cambios: CambiosConfiguracionInforme): Promise<ConfiguracionInforme> {
    return configuracionADominio(await guardarConfiguracion(this.prisma, cambios));
  }
}
