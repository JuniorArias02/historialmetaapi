import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import { ErrorDominio } from '../compartido/dominio/errores/error-dominio';
import { PrismaModule } from '../compartido/infraestructura/prisma/prisma.module';
import { validarEntorno } from '../configuracion/entorno.config';
import { CrearUsuarioUseCase } from '../modulos/usuarios/aplicacion/casos-uso/crear-usuario.use-case';
import { UsuariosModule } from '../modulos/usuarios/presentacion/http/modulos/usuarios.module';

/**
 * Crea un usuario que puede iniciar sesión.
 *   npm run usuario:crear -- --nombre "Ana Pérez" --correo ana@empresa.com
 * La contraseña se pide por consola (sin eco) para que no quede en el historial del shell.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    PrismaModule,
    UsuariosModule,
  ],
})
class CliUsuariosModule {}

function leerContrasena(pregunta: string): Promise<string> {
  const entrada = process.stdin;
  if (!entrada.isTTY) {
    // Entrada redirigida (p. ej. desde un script): se lee la primera línea.
    const lector = createInterface({ input: entrada });
    return new Promise((resolver) =>
      lector.once('line', (linea) => {
        lector.close();
        resolver(linea);
      }),
    );
  }

  process.stdout.write(pregunta);
  entrada.setRawMode(true);
  entrada.resume();
  entrada.setEncoding('utf8');
  return new Promise((resolver) => {
    let contrasena = '';
    const alPulsar = (tecla: string): void => {
      if (tecla === '\u0003') process.exit(130);
      if (tecla === '\r' || tecla === '\n') {
        entrada.setRawMode(false);
        entrada.pause();
        entrada.off('data', alPulsar);
        process.stdout.write('\n');
        resolver(contrasena);
        return;
      }
      contrasena = tecla === '\u007f' ? contrasena.slice(0, -1) : contrasena + tecla;
    };
    entrada.on('data', alPulsar);
  });
}

async function ejecutar(): Promise<void> {
  const { values: argumentos } = parseArgs({
    options: { nombre: { type: 'string' }, correo: { type: 'string' } },
  });
  if (!argumentos.nombre?.trim() || !argumentos.correo) {
    throw new Error('Uso: npm run usuario:crear -- --nombre "Nombre" --correo correo@dominio.com');
  }

  const contrasena = await leerContrasena('Contraseña: ');
  const app = await NestFactory.createApplicationContext(CliUsuariosModule, { logger: ['error'] });
  try {
    const usuario = await app.get(CrearUsuarioUseCase).ejecutar({
      nombre: argumentos.nombre,
      correo: argumentos.correo,
      contrasena,
    });
    process.stdout.write(`Usuario creado: #${usuario.id} ${usuario.correo}\n`);
  } finally {
    await app.close();
  }
}

ejecutar().catch((error: unknown) => {
  const mensaje =
    error instanceof ErrorDominio || error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${mensaje}\n`);
  process.exit(1);
});
