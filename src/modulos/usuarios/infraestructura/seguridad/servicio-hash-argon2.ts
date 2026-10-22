import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ServicioHashContrasenas } from '../../dominio/puertos/servicio-hash-contrasenas';

/** Argon2id con los parámetros por defecto de la librería (recomendados por OWASP). */
@Injectable()
export class ServicioHashArgon2 implements ServicioHashContrasenas {
  private hashSimulado: Promise<string> | null = null;

  hashear(contrasena: string): Promise<string> {
    return argon2.hash(contrasena, { type: argon2.argon2id });
  }

  async verificar(contrasena: string, hash: string | null): Promise<boolean> {
    if (hash === null) {
      await argon2.verify(await this.obtenerHashSimulado(), contrasena);
      return false;
    }
    return argon2.verify(hash, contrasena);
  }

  private obtenerHashSimulado(): Promise<string> {
    this.hashSimulado ??= this.hashear('contrasena-simulada-para-igualar-tiempos');
    return this.hashSimulado;
  }
}
