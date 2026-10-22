/**
 * Flujo HTTP completo contra MySQL real. Requiere DATABASE_URL apuntando a una base
 * de pruebas con migraciones aplicadas (ver README). Solo borra los usuarios que crea.
 */
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/compartido/infraestructura/prisma/prisma.service';
import { configurarAplicacion } from '../../src/configuracion/configurar-aplicacion';
import { CrearUsuarioUseCase } from '../../src/modulos/usuarios/aplicacion/casos-uso/crear-usuario.use-case';
import { CorreoYaRegistradoError } from '../../src/modulos/usuarios/dominio/errores/errores-usuario';

interface CuerpoSesion {
  tokenAcceso: string;
  usuario: { id: number; correo: string };
}

describe('Autenticación (HTTP + Prisma)', () => {
  const correo = `prueba-${Date.now()}@integracion.test`;
  const contrasena = 'clave-de-prueba-123';
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication<NestExpressApplication>();
    configurarAplicacion(app);
    await app.init();
    prisma = app.get(PrismaService);
    await app.get(CrearUsuarioUseCase).ejecutar({ nombre: 'Prueba', correo, contrasena });
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { correo: { endsWith: '@integracion.test' } } });
    await app.close();
  });

  it('el repositorio Prisma impide correos duplicados', async () => {
    await expect(
      app.get(CrearUsuarioUseCase).ejecutar({ nombre: 'Otra', correo, contrasena }),
    ).rejects.toThrow(CorreoYaRegistradoError);
  });

  it('guarda la contraseña como hash Argon2id, nunca en texto plano', async () => {
    const registro = await prisma.usuario.findUniqueOrThrow({ where: { correo } });
    expect(registro.contrasenaHash).toMatch(/^\$argon2id\$/);
  });

  it('inicia sesión y accede al perfil con el token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/autenticacion/iniciar-sesion')
      .send({ correo: correo.toUpperCase(), contrasena })
      .expect(200);
    const sesion = login.body as CuerpoSesion;
    expect(sesion.usuario.correo).toBe(correo);
    expect(JSON.stringify(sesion)).not.toContain('contrasena');

    const perfil = await request(app.getHttpServer())
      .get('/api/autenticacion/perfil')
      .set('Authorization', `Bearer ${sesion.tokenAcceso}`)
      .expect(200);
    expect(perfil.body).toEqual({ id: sesion.usuario.id, nombre: 'Prueba', correo });
  });

  it('responde 401 con credenciales incorrectas', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/autenticacion/iniciar-sesion')
      .send({ correo, contrasena: 'incorrecta' })
      .expect(401);
    expect(respuesta.body).toEqual({
      statusCode: 401,
      codigo: 'CREDENCIALES_INVALIDAS',
      mensaje: 'Correo o contraseña incorrectos',
    });
  });

  it('responde 400 si el cuerpo es inválido o trae campos extra', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/autenticacion/iniciar-sesion')
      .send({ correo: 'no-es-correo', contrasena: '', rol: 'admin' })
      .expect(400);
    expect(respuesta.body).toMatchObject({ statusCode: 400, codigo: 'VALIDACION' });
  });

  it('responde 401 en el perfil sin token o con token alterado', async () => {
    await request(app.getHttpServer()).get('/api/autenticacion/perfil').expect(401);
    await request(app.getHttpServer())
      .get('/api/autenticacion/perfil')
      .set('Authorization', 'Bearer token.falso.firmado')
      .expect(401);
  });

  it('limita los intentos de inicio de sesión a 5 por minuto', async () => {
    // Las pruebas anteriores ya consumieron 3 intentos de esta IP.
    const intentar = () =>
      request(app.getHttpServer())
        .post('/api/autenticacion/iniciar-sesion')
        .send({ correo, contrasena: 'incorrecta' });
    await intentar().expect(401);
    await intentar().expect(401);
    await intentar().expect(429);
  });
});
