/**
 * Flujo HTTP de pagos contra MySQL real. ELIMINA TODOS LOS PAGOS de la base indicada en
 * DATABASE_URL, por eso se niega a ejecutarse si el nombre de la base no contiene «test».
 */
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/compartido/infraestructura/prisma/prisma.service';
import { configurarAplicacion } from '../../src/configuracion/configurar-aplicacion';
import { CrearUsuarioUseCase } from '../../src/modulos/usuarios/aplicacion/casos-uso/crear-usuario.use-case';

interface PagoRespuesta {
  id: number;
  entidad: string;
  fecha: string;
  monto: number;
  ficticio: boolean;
  editado: boolean;
  original: Record<string, unknown> | null;
}

const nombreBase = new URL(process.env.DATABASE_URL ?? 'mysql://x/sin-base').pathname;
if (!nombreBase.includes('test')) {
  throw new Error(
    `Las pruebas de pagos borran datos: DATABASE_URL debe apuntar a una base de pruebas (actual: ${nombreBase})`,
  );
}

const pagoImportado = (cambios: Record<string, unknown> = {}) => ({
  proyecto: 'ESE Imsalud',
  entidad: 'Imsalud',
  linea: '3143644500 Imsalud',
  fecha: '2026-10-08',
  monto: 99.92,
  nota: '',
  advertencias: [],
  origen: 'prueba.json',
  ubicacion: 'Elemento 1 › pago 1',
  ficticio: false,
  original: {
    proyecto: 'ESE Imsalud',
    entidad: 'Imsalud',
    linea: '3143644500 Imsalud',
    fecha: '08/10/2026',
    monto: 99.92,
  },
  ...cambios,
});

describe('Pagos (HTTP + Prisma)', () => {
  const correo = `pagos-${Date.now()}@integracion.test`;
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication<NestExpressApplication>();
    configurarAplicacion(app);
    await app.init();
    prisma = app.get(PrismaService);
    await app
      .get(CrearUsuarioUseCase)
      .ejecutar({ nombre: 'Pagos', correo, contrasena: 'clave-de-prueba-123' });
    const login = await api()
      .post('/api/autenticacion/iniciar-sesion')
      .send({ correo, contrasena: 'clave-de-prueba-123' });
    token = (login.body as { tokenAcceso: string }).tokenAcceso;
  });

  afterAll(async () => {
    await prisma.pago.deleteMany();
    await prisma.linea.deleteMany();
    await prisma.proyecto.deleteMany();
    await prisma.entidad.deleteMany();
    await prisma.usuario.deleteMany({ where: { correo: { endsWith: '@integracion.test' } } });
    await app.close();
  });

  it('exige sesión', async () => {
    await api().get('/api/pagos').expect(401);
    await api().get('/api/configuracion-informe').expect(401);
  });

  it('importa en modo reemplazar, actualiza la configuración y lista con la jerarquía', async () => {
    await api()
      .post('/api/pagos/importacion')
      .set(auth())
      .send({
        modo: 'reemplazar',
        pagos: [
          pagoImportado(),
          pagoImportado({
            entidad: 'Otra',
            proyecto: 'P2',
            linea: '300 L',
            monto: -1.5,
            ficticio: true,
          }),
        ],
        configuracion: { periodo: 'Octubre 2026', tasaCambioCop: 4100 },
      })
      .expect(201, { cantidad: 2 });

    const lista = await api().get('/api/pagos').set(auth()).expect(200);
    const pagos = lista.body as PagoRespuesta[];
    expect(pagos).toHaveLength(2);
    expect(pagos[0]).toMatchObject({
      entidad: 'Imsalud',
      fecha: '2026-10-08',
      monto: 99.92,
      editado: false,
    });
    expect(pagos[0].original).toMatchObject({ fecha: '08/10/2026' });

    const configuracion = await api().get('/api/configuracion-informe').set(auth()).expect(200);
    expect(configuracion.body).toMatchObject({ periodo: 'Octubre 2026', tasaCambioCop: 4100 });
  });

  it('rechaza la importación completa si un pago es inválido', async () => {
    const respuesta = await api()
      .post('/api/pagos/importacion')
      .set(auth())
      .send({
        modo: 'reemplazar',
        pagos: [pagoImportado(), pagoImportado({ fecha: '2026-02-30' })],
      })
      .expect(400);
    expect(respuesta.body).toMatchObject({ codigo: 'DATOS_PAGO_INVALIDOS' });
    expect(await prisma.pago.count()).toBe(2);
  });

  it('edita y mueve un pago a otra entidad conservando el catálogo anterior', async () => {
    const [pago] = (await api().get('/api/pagos').set(auth())).body as PagoRespuesta[];
    const editado = await api()
      .put(`/api/pagos/${pago.id}`)
      .set(auth())
      .send({
        proyecto: 'ESE Imsalud',
        entidad: 'Imsalud Nueva',
        linea: '3143644500 Imsalud',
        fecha: '2026-10-08',
        monto: 50,
        nota: '',
        advertencias: [],
      })
      .expect(200);
    expect(editado.body).toMatchObject({ entidad: 'Imsalud Nueva', monto: 50, editado: true });
    // La línea anterior sigue disponible para registrar pagos aunque se haya quedado sin ellos.
    expect(await prisma.entidad.findUnique({ where: { nombre: 'Imsalud' } })).not.toBeNull();
  });

  it('lista las líneas y registra un pago en una de ellas', async () => {
    const lineas = (await api().get('/api/lineas').set(auth()).expect(200)).body as {
      id: number;
      nombre: string;
      entidad: string;
    }[];
    const linea = lineas.find((l) => l.nombre === '3143644500 Imsalud');
    expect(linea).toBeDefined();
    const creado = await api()
      .post(`/api/lineas/${linea?.id}/pagos`)
      .set(auth())
      .send({ fecha: '2026-10-21', monto: 25.4 })
      .expect(201);
    expect(creado.body).toMatchObject({
      linea: '3143644500 Imsalud',
      entidad: linea?.entidad,
      fecha: '2026-10-21',
      monto: 25.4,
      origen: 'manual',
    });
  });

  it('al registrar: 404 si la línea no existe y 400 si faltan fecha o monto', async () => {
    await api()
      .post('/api/lineas/999999/pagos')
      .set(auth())
      .send({ fecha: '2026-10-21', monto: 1 })
      .expect(404);
    const sinMonto = await api()
      .post('/api/lineas/1/pagos')
      .set(auth())
      .send({ fecha: '21/10/2026' })
      .expect(400);
    expect(sinMonto.body).toMatchObject({ codigo: 'VALIDACION' });
    await api().post('/api/lineas/1/pagos').send({ fecha: '2026-10-21', monto: 1 }).expect(401);
  });

  it('crea un proyecto con su entidad y línea, y permite registrar pagos en ella', async () => {
    const nueva = await api()
      .post('/api/proyectos')
      .set(auth())
      .send({ entidad: 'Hospital Regional', proyecto: 'Chatbot Citas', linea: '3001234567 Citas' })
      .expect(201);
    const linea = nueva.body as { id: number; nombre: string; proyecto: string; entidad: string };
    expect(linea).toMatchObject({
      nombre: '3001234567 Citas',
      proyecto: 'Chatbot Citas',
      entidad: 'Hospital Regional',
    });

    const lineas = (await api().get('/api/lineas').set(auth())).body as { id: number }[];
    expect(lineas.some((l) => l.id === linea.id)).toBe(true);

    await api()
      .post(`/api/lineas/${linea.id}/pagos`)
      .set(auth())
      .send({ fecha: '2026-10-22', monto: 3 })
      .expect(201);

    // Otra línea en el mismo proyecto reutiliza la entidad y el proyecto
    await api()
      .post('/api/proyectos')
      .set(auth())
      .send({
        entidad: 'Hospital Regional',
        proyecto: 'Chatbot Citas',
        linea: '3009999999 Urgencias',
      })
      .expect(201);
    expect(await prisma.proyecto.count({ where: { nombre: 'Chatbot Citas' } })).toBe(1);
  });

  it('al crear proyecto: 409 si la línea ya existe y 400 si falta un campo', async () => {
    const repetida = await api()
      .post('/api/proyectos')
      .set(auth())
      .send({ entidad: 'Hospital Regional', proyecto: 'Chatbot Citas', linea: '3001234567 Citas' })
      .expect(409);
    expect(repetida.body).toMatchObject({ codigo: 'LINEA_YA_REGISTRADA' });
    await api().post('/api/proyectos').set(auth()).send({ entidad: 'E', proyecto: '' }).expect(400);
  });

  it('elimina los ficticios sin tocar los reales', async () => {
    await api().delete('/api/pagos/ficticios').set(auth()).expect(200, { cantidad: 1 });
    const pagos = (await api().get('/api/pagos').set(auth())).body as PagoRespuesta[];
    expect(pagos.every((pago) => !pago.ficticio)).toBe(true);
  });

  it('responde 404 al eliminar un pago inexistente y 400 con un id no numérico', async () => {
    await api().delete('/api/pagos/999999').set(auth()).expect(404);
    await api().delete('/api/pagos/abc').set(auth()).expect(400);
  });
});
