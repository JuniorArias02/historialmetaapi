import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ErrorDominio, TipoErrorDominio } from '../../dominio/errores/error-dominio';

export interface RespuestaError {
  statusCode: number;
  codigo: string;
  mensaje: string | string[];
}

const ESTADO_POR_TIPO: Record<TipoErrorDominio, HttpStatus> = {
  VALIDACION: HttpStatus.BAD_REQUEST,
  NO_ENCONTRADO: HttpStatus.NOT_FOUND,
  CONFLICTO: HttpStatus.CONFLICT,
  NO_AUTENTICADO: HttpStatus.UNAUTHORIZED,
};

/** Traduce cualquier error a una respuesta con forma uniforme y sin detalles internos. */
@Catch()
export class FiltroErroresHttp implements ExceptionFilter {
  private readonly logger = new Logger(FiltroErroresHttp.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const cuerpo = this.construirCuerpo(excepcion);
    respuesta.status(cuerpo.statusCode).json(cuerpo);
  }

  private construirCuerpo(excepcion: unknown): RespuestaError {
    if (excepcion instanceof ErrorDominio) {
      return {
        statusCode: ESTADO_POR_TIPO[excepcion.tipo],
        codigo: excepcion.codigo,
        mensaje: excepcion.message,
      };
    }

    if (excepcion instanceof HttpException) {
      const estado: HttpStatus = excepcion.getStatus();
      return {
        statusCode: estado,
        codigo: estado === HttpStatus.BAD_REQUEST ? 'VALIDACION' : HttpStatus[estado],
        mensaje: this.extraerMensaje(excepcion),
      };
    }

    this.logger.error(
      'Error no controlado',
      excepcion instanceof Error ? excepcion.stack : String(excepcion),
    );
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error inesperado',
    };
  }

  private extraerMensaje(excepcion: HttpException): string | string[] {
    const contenido = excepcion.getResponse();
    if (typeof contenido === 'object' && contenido !== null && 'message' in contenido) {
      const { message } = contenido;
      if (typeof message === 'string' || Array.isArray(message)) {
        return message as string | string[];
      }
    }
    return excepcion.message;
  }
}
