# Despliegue del backend (historialmetaapi)

Servidor Linux (Ubuntu 22.04/24.04) con la API y la base de datos. El frontend se publica aparte en
Vercel (repositorio `historialmeta`, ver su `frontend/README.md`).

```text
Vercel (frontend)  ──HTTPS──▶  Nginx (api.midominio.com) ──▶ API NestJS (PM2, 127.0.0.1:3000)
                                                                  │
                                                                  ▼
                                                      MySQL 8 (Docker, 127.0.0.1:3309)
```

Sustituya `api.midominio.com` por su dominio y `historialmeta.vercel.app` por la URL de su frontend.

---

## 1. Preparar el servidor (una sola vez)

```bash
sudo apt update && sudo apt install -y git nginx curl ca-certificates openssl

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v                              # v22.x

# Docker con el plugin compose
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER        # cierre la sesión SSH y vuelva a entrar

# PM2 mantiene la API en marcha y la arranca al reiniciar el servidor
sudo npm install -g pm2
```

El servidor necesita acceso al repositorio (clave SSH de despliegue o HTTPS con token).

## 2. Obtener el código y el archivo de datos

```bash
git clone git@github.com:JuniorArias02/historialmetaapi.git /opt/historialmetaapi
cd /opt/historialmetaapi
```

`datos_cobros.json` **no está en git** (datos de clientes). Cópielo desde su equipo a la carpeta del backend:

```bash
# Ejecutar en SU equipo, no en el servidor
scp datos_cobros.json usuario@servidor:/opt/historialmetaapi/
```

## 3. Variables de entorno (`.env`)

```bash
cd /opt/historialmetaapi
cp .env.example .env
openssl rand -hex 16          # → MYSQL_PASSWORD
openssl rand -hex 16          # → MYSQL_ROOT_PASSWORD
openssl rand -base64 48       # → JWT_SECRETO
nano .env
chmod 600 .env
```

Valores de producción:

```dotenv
NODE_ENV=production
PUERTO=3000
CORS_ORIGENES=https://historialmeta.vercel.app

MYSQL_DATABASE=meta_billing
MYSQL_USER=meta_billing
MYSQL_PASSWORD=<contraseña 1>
MYSQL_ROOT_PASSWORD=<contraseña 2>
MYSQL_PORT=3309

# Usuario de la aplicación, no root
DATABASE_URL="mysql://meta_billing:<contraseña 1>@127.0.0.1:3309/meta_billing"

JWT_SECRETO=<secreto generado>
JWT_EXPIRACION_SEGUNDOS=28800
CONFIAR_PROXY=true
```

| Variable | En producción |
|---|---|
| `NODE_ENV` | `production` (desactiva Swagger en `/docs`). |
| `CORS_ORIGENES` | URL exacta del frontend en Vercel (y su dominio propio, si tiene uno), separadas por coma, sin barra final. Las URL de *preview* de Vercel cambian en cada despliegue y no quedan autorizadas. |
| `DATABASE_URL` | Usuario `meta_billing`, no `root`. |
| `JWT_SECRETO` | Uno nuevo, distinto del de desarrollo. Cambiarlo cierra todas las sesiones. |
| `CONFIAR_PROXY` | `true`: la API está detrás de Nginx. Sin esto, cinco intentos fallidos de cualquier persona bloquean el login de todos. |

Si algo falta o es inválido, la API no arranca y muestra `Variables de entorno inválidas` con el detalle.

## 4. Levantar la base de datos

```bash
docker compose up -d
docker compose ps                    # esperar a "healthy"
```

MySQL solo escucha en `127.0.0.1:3309` (no queda expuesto a internet). Los datos viven en el volumen
`meta_billing_datos` y sobreviven a reinicios y a `docker compose down`.

> La primera vez MySQL se reinicia tras inicializarse. Si el paso 6 falla con
> `P1017: Server has closed the connection`, espere 15 segundos y repita.

## 5. Instalar y compilar

```bash
npm ci                               # dependencias exactas del package-lock
npx prisma generate
npm run build
ls dist/main.js                      # debe existir
```

Se instalan también las dependencias de desarrollo: las migraciones (`prisma`), el seeder (`tsx`) y
la creación de usuarios (`ts-node`) las necesitan.

## 6. Migraciones

```bash
npx prisma migrate status            # muestra las pendientes
npm run prisma:deploy                # aplica las pendientes (prisma migrate deploy)
npx prisma migrate status            # "Database schema is up to date!"
```

Nunca use `prisma migrate dev`, `prisma db push` ni `prisma migrate reset` en producción: pueden
pedir borrar datos.

## 7. Seeder (carga inicial, una sola vez)

```bash
npm run prisma:seed                  # usa ./datos_cobros.json
# o con otra ruta:
npx prisma db seed -- /ruta/al/archivo.json
```

Resultado esperado:

```text
Importación completa: 8 líneas procesadas, 110 pagos insertados, 0 líneas ya tenían pagos y se omitieron.
```

Es idempotente: si se repite no duplica nada. Una vez cargado, puede borrar el JSON del servidor.
Los datos nuevos se cargan desde la aplicación (Importar, Registrar pago, Nuevo proyecto).

## 8. Usuario administrador

```bash
npm run usuario:crear -- --nombre "admin" --correo admin@midominio.com    # pide la contraseña (mín. 8)
```

## 9. Arrancar con PM2

```bash
pm2 start dist/main.js --name historialmetaapi --cwd /opt/historialmetaapi
pm2 save
pm2 startup                          # ejecute el comando sudo que imprime

curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/pagos     # 401 = OK
```

Útiles: `pm2 logs historialmetaapi`, `pm2 status`, `pm2 restart historialmetaapi`.

## 10. Nginx y HTTPS

El frontend en Vercel usa HTTPS, así que la API también debe usarlo (el navegador bloquea llamadas
HTTP desde una página HTTPS).

```bash
sudo tee /etc/nginx/sites-available/historialmetaapi >/dev/null <<'NGINX'
server {
    listen 80;
    server_name api.midominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 12m;        # las importaciones admiten hasta 10 MB
    }
}
NGINX
sudo ln -s /etc/nginx/sites-available/historialmetaapi /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.midominio.com
```

En Vercel, la variable del frontend queda: `VITE_API_URL=https://api.midominio.com/api`.

## 11. Verificación

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.midominio.com/api/pagos        # 401
curl -s -X OPTIONS https://api.midominio.com/api/pagos \
  -H "Origin: https://historialmeta.vercel.app" -H "Access-Control-Request-Method: GET" -I \
  | grep -i access-control-allow-origin                                            # debe mostrar su dominio
```

Después, abra el frontend en Vercel e inicie sesión con el usuario del paso 8.

---

## Actualizar a una nueva versión

```bash
cd /opt/historialmetaapi
# 1. Respaldo ANTES de migrar (Prisma no tiene "deshacer")
docker exec meta_billing_db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction meta_billing' \
  > ~/respaldo-$(date +%F-%H%M).sql
# 2. Código, dependencias, compilación y migraciones
git pull
npm ci
npm run build
npm run prisma:deploy
pm2 restart historialmetaapi
```

## Copias de seguridad

```bash
# Crear
docker exec meta_billing_db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction meta_billing' \
  > ~/respaldo-$(date +%F-%H%M).sql

# Restaurar (reemplaza los datos actuales)
docker exec -i meta_billing_db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" meta_billing' < ~/respaldo-AAAA-MM-DD-HHMM.sql
```

Diaria a las 2:00 (`crontab -e`):

```cron
0 2 * * * docker exec meta_billing_db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction meta_billing' > /home/USUARIO/respaldos/meta-billing-$(date +\%F).sql
```

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `P1017: Server has closed the connection` | MySQL aún se inicializa. Espere y repita. |
| `Variables de entorno inválidas` | Revise `.env` contra el paso 3. |
| Error de CORS en el navegador | `CORS_ORIGENES` no coincide exactamente con la URL del frontend (protocolo y dominio, sin barra final). Reinicie con `pm2 restart historialmetaapi`. |
| «No se pudo conectar con el servidor» en el login | `VITE_API_URL` en Vercel mal escrita, la API caída (`pm2 status`) o la API sin HTTPS. |
| Todos reciben «Demasiados intentos» | Falta `CONFIAR_PROXY=true`. |
| `No se encontró datos_cobros.json` al sembrar | Copie el archivo (paso 2) o indique la ruta con `npx prisma db seed -- /ruta.json`. |
| El seeder dice «0 pagos insertados» | Normal si ya se había ejecutado. |
| Se olvidó una contraseña | Cree otro usuario con `npm run usuario:crear`. |
