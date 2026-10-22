# historialmetaapi — Backend de Meta Billing Analytics

API en NestJS + Prisma + MySQL para el informe de consumos de Meta WhatsApp Business.
Es la fuente de verdad de los pagos que consume el frontend React (repositorio
[historialmeta](https://github.com/JuniorArias02/historialmeta), carpeta `frontend/`, desplegado en Vercel).
Todas las rutas, salvo el inicio de sesión, exigen JWT.

- Despliegue en servidor paso a paso: **[DESPLIEGUE.md](DESPLIEGUE.md)**

## Requisitos

- Node.js 22 o 24 (LTS) y npm
- Docker (para MySQL 8)

## Instalación

```bash
cp .env.example .env        # completar contraseñas y JWT_SECRETO (openssl rand -base64 48)
npm install
docker compose up -d        # MySQL en localhost:3309
npm run prisma:deploy       # aplica las migraciones
npm run prisma:seed         # importa ./datos_cobros.json (o: npx prisma db seed -- ruta.json)
npm run usuario:crear -- --nombre "Administrador" --correo admin@empresa.com   # pide la contraseña
npm run start:dev           # http://localhost:3000/api — Swagger en http://localhost:3000/docs
```

No hay registro público: los usuarios solo se crean con `usuario:crear`.

## Variables de entorno

Se validan al arrancar; si alguna falta o es inválida la aplicación no inicia.

| Variable | Descripción |
|---|---|
| `NODE_ENV` | `development`, `production` o `test`. En `production` no se publica Swagger. |
| `PUERTO` | Puerto HTTP (3000 por defecto). |
| `CORS_ORIGENES` | Orígenes permitidos separados por coma (p. ej. `http://localhost:5173`). |
| `DATABASE_URL` | Conexión MySQL usada por Prisma. |
| `JWT_SECRETO` | Mínimo 32 caracteres. |
| `JWT_EXPIRACION_SEGUNDOS` | Validez del token (28800 = 8 h). |
| `CONFIAR_PROXY` | `true` si la API está detrás de Nginx u otro proxy (el límite de intentos de login pasa a ser por IP real). |
| `MYSQL_*` | Solo para `docker-compose.yml`. |

La plantilla comentada, con los valores de desarrollo y de producción, es [`.env.example`](.env.example).

## Qué se sube a git y qué no

| No se sube (`.gitignore`) | Por qué |
|---|---|
| `.env`, `.env.*` (salvo `.env.example`) | Contraseñas de MySQL y secreto JWT. |
| `datos_cobros.json` | Datos reales de clientes. Solo lo usa el seeder: se copia al servidor a mano (`scp`). |
| `*.sql` (salvo las migraciones) | Respaldos de la base de datos. |
| `node_modules/`, `dist/`, `*.tsbuildinfo`, `coverage/` | Se regeneran con `npm ci` y `npm run build`. |

Sí se suben las migraciones (`prisma/migrations/`), `package-lock.json` y `.env.example`.
Antes de cada commit, compruebe que no aparece ningún secreto: `git status` no debe listar `.env` ni `datos_cobros.json`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/autenticacion/iniciar-sesion` | `{ correo, contrasena }` → `{ tokenAcceso, expiraEnSegundos, usuario }`. Máx. 5 intentos/min por IP. |
| `GET` | `/api/autenticacion/perfil` | Usuario de la sesión. Requiere `Authorization: Bearer <token>`. |
| `GET` | `/api/pagos` | Todos los pagos con entidad, proyecto y línea. Sin paginar a propósito: el frontend calcula los análisis sobre el conjunto completo. |
| `POST` | `/api/pagos` | Alta manual (queda con origen `manual`). |
| `PUT` | `/api/pagos/:id` | Edita un pago. Cambiar datos (no solo la nota) lo marca `editado`; `restaurarOriginal: true` quita la marca. |
| `DELETE` | `/api/pagos/:id` | Elimina un pago. |
| `POST` | `/api/pagos/eliminacion` | `{ ids }` elimina varios. |
| `DELETE` | `/api/pagos/ficticios` | Elimina solo los pagos ficticios. |
| `DELETE` | `/api/pagos` | Elimina **todos** los pagos. |
| `POST` | `/api/pagos/importacion` | `{ modo: 'reemplazar' \| 'agregar', pagos, configuracion? }`. Atómica: si un pago es inválido no se guarda ninguno. Máx. 50.000 pagos / 10 MB. |
| `GET` | `/api/lineas` | Catálogo de líneas `{ id, nombre, proyecto, entidad }` (incluye las que aún no tienen pagos). |
| `POST` | `/api/lineas/:lineaId/pagos` | Registra un pago `{ fecha: 'AAAA-MM-DD', monto, nota? }` en la línea. Entidad y proyecto se toman de la línea. 404 si la línea no existe. |
| `POST` | `/api/proyectos` | `{ entidad, proyecto, linea }`: crea entidad y proyecto si no existen y les asigna la línea. 409 si la línea ya está en ese proyecto. |
| `GET` / `PATCH` | `/api/configuracion-informe` | Cabecera de los informes y tasa COP/USD (global, compartida). |

Errores con forma uniforme: `{ statusCode, codigo, mensaje }` (p. ej. `CREDENCIALES_INVALIDAS`, `SESION_INVALIDA`, `VALIDACION`).

## Modelo de datos

```text
Entidad 1─N Proyecto 1─N Linea 1─N Pago (fecha DATE, monto DECIMAL(12,4) USD, origen, ubicación, ficticio, editado, nota, advertencias, original)
ConfiguracionInforme (fila única: título, periodo, moneda, tasa COP, pie de página)
Usuario (correo único normalizado, hash Argon2id, activo)
```

El seed es idempotente: no duplica entidades/proyectos/líneas y solo inserta pagos en líneas que aún no tienen ninguno.
Entidades, proyectos y líneas forman un catálogo: se crean al guardar pagos o con `POST /api/proyectos`, y se conservan aunque no tengan pagos (para poder registrar en ellas).
`original` conserva los valores tal como llegaron en el archivo para poder restaurarlos tras una edición.

## Seguridad: decisiones

- Contraseñas con Argon2id; longitud entre 8 y 128 caracteres.
- El login responde igual (y tarda lo mismo) para correo inexistente, contraseña errónea o usuario inactivo.
- JWT HS256 sin estado: no hay revocación antes de expirar. `/perfil` consulta la base de datos, así que un usuario desactivado deja de tener acceso ahí de inmediato; las rutas futuras que solo usen `GuardiaJwt` aceptarán el token hasta que expire.
- Helmet, CORS con lista explícita, límite global de 100 solicitudes/min y validación estricta (`whitelist` + `forbidNonWhitelisted`).

## Pruebas y calidad

```bash
npm test                    # unitarias (sin base de datos)
npm run lint
npm run build

# Integración: usar una base de pruebas, nunca la de trabajo (las pruebas de pagos la vacían
# y se niegan a ejecutarse si el nombre de la base no contiene «test»)
export DATABASE_URL="mysql://root:<clave>@localhost:3309/meta_billing_test"
npx prisma migrate deploy
npm run test:integracion
```

## Estructura

```text
src/
├── configuracion/            Validación de entorno y configuración HTTP común
├── compartido/               ErrorDominio, filtro de errores HTTP, PrismaService
├── cli/crear-usuario.ts      Alta de usuarios por consola
└── modulos/
    ├── usuarios/             Entidad Usuario, Correo, puertos, CrearUsuarioUseCase, adaptadores Prisma/Argon2
    ├── autenticacion/        IniciarSesion/ObtenerPerfil UseCase, adaptador JWT, guardia y controlador
    ├── pagos/                Pagos (listar, crear, editar, eliminar, importar), líneas (listar, registrar pago) y proyectos (crear con línea)
    └── configuracion-informe/ Obtener/Actualizar la cabecera del informe y la tasa de cambio
prisma/                       schema.prisma, migraciones y seed
test/                         unitarias/, integracion/, dobles/ (fakes de los puertos)
```

Cada módulo sigue arquitectura hexagonal: `dominio` (sin dependencias externas) → `aplicacion` (casos de uso sobre puertos) → `infraestructura` / `presentacion` (Prisma, JWT, NestJS).
