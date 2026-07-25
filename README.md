# QR Assist - Sistema Web de Asistencia por QR

Aplicacion web completa de asistencia con Node.js + Express + frontend HTML/CSS/JS, autenticacion JWT, roles y modulos separados por vista.

## Caracteristicas

- Registro de usuarios.
- Inicio de sesion con cedula y contraseña.
- Autenticacion JWT.
- Roles: admin, supervisor, empleado y qr_operator.
- Modulos separados:
  - Login/Bienvenida
  - Modulo Usuario
  - Modulo Escaneo QR
  - Modulo Administracion
  - Modulo Generador QR por sede
- QR rotativo por sede (actualizacion cada 3 segundos) visible solo para el usuario generador.
- Escaneo por camara desde navegador.
- Registro de asistencia con hora de generacion del QR y hora de registro del usuario.
- Zona horaria operativa en Colombia (America/Bogota).
- Visualizacion y filtrado de registros por fecha y estado.
- Filtro de tardanza por hora configurable (ejemplo: 09:05).
- Tardanzas destacadas en rojo.
- Cooldown de 10 minutos por usuario para volver a registrar asistencia.
- Exportacion de reportes a PDF y Excel.
- Administracion de credenciales por cedula (busqueda y reseteo de contraseña).
- Interfaz responsive y mobile-friendly.
- Manejo de errores con mensajes claros.
- Preparada para despliegue en Render.

## Arquitectura

- backend/
  - src/
    - config/
    - controllers/
    - db/
      - migrations/
      - seeds/
    - middleware/
    - routes/
    - app.js
    - server.js
- frontend/
  - public/
    - css/
    - js/
    - index.html
    - user.html
    - scan.html
    - admin.html
    - generator.html

## Requisitos

- Node.js 18+
- npm 9+

## Instalacion local

1. Instalar dependencias:
   npm install
2. Crear archivo .env basado en .env.example.
3. Ejecutar migraciones y seed demo:
   npm run setup
4. Iniciar en desarrollo:
   npm run dev
5. Abrir:
   http://localhost:4000

## Credenciales demo (seed)

- admin / Admin123*
- supervisor / Admin123*
- empleado / Admin123*
- qrgenerador@1@2@3 / r3g1st4o@

## Scripts

- npm run dev: arranca con nodemon.
- npm run start: arranca en modo produccion.
- npm run migrate: ejecuta migraciones.
- npm run seed: ejecuta seeds.
- npm run setup: migrate + seed.

## Base de datos

Tablas implementadas:

- users
- branches
- attendance
- reports

### SQLite (local)

Usa por defecto:

DB_CLIENT=sqlite3
DB_FILENAME=./backend/data/app.db

### PostgreSQL (produccion)

Definir variables:

DB_CLIENT=pg
DATABASE_URL=postgresql://...

## Flujo funcional

1. Usuario inicia sesion.
2. El usuario qrgenerador@1@2@3 visualiza QR en vivo por sede.
3. Empleado escanea QR desde modulo Escaneo.
4. Se registra asistencia con hora de generacion del QR y hora de registro.
5. Admin/Supervisor filtra reportes.
6. Exporta PDF o Excel.

## Despliegue en Render

Tambien puedes desplegar con Blueprint usando render.yaml incluido en la raiz del proyecto.

1. En Render, entra a New + > Blueprint.
2. Selecciona el repositorio y rama main.
3. Render detectara render.yaml y creara automaticamente:
  - Servicio web qr-assist-app
  - Base PostgreSQL qr-assist-db
4. Aplica el Blueprint y espera el primer deploy.

Notas:
- El build en Render solo instala dependencias; las migraciones se ejecutan al iniciar el servicio.
- El seed no se ejecuta automaticamente en produccion.
- Si quieres cargar usuarios demo, ejecuta npm run seed una sola vez desde Shell del servicio.
- Si aparece error por limite Free (cannot have more than one active free tier database), elimina la DB Free previa o cambia plan: free por starter en render.yaml.
- JWT_SECRET y QR_SECRET se autogeneran con generateValue en el blueprint.
- APP_TIMEZONE define la zona horaria operativa (recomendado: America/Bogota).
- ATTENDANCE_COOLDOWN_MINUTES define minutos minimos entre registros del mismo usuario.
- Si el plan Free no esta disponible en tu cuenta, cambia plan: free por starter en render.yaml para web y database.

## Seguridad y notas

- Cambia secretos JWT/QR en produccion.
- El frontend guarda token en localStorage para la demo.
- Para endurecer seguridad en escenarios reales, migrar a cookies httpOnly y refresh tokens.

## Crear primer admin sin Shell (Render Free)

Si no puedes usar Shell en Render, crea el primer admin por API con token de bootstrap:

1. En Environment del servicio, agrega BOOTSTRAP_ADMIN_TOKEN con un valor largo y secreto.
2. Haz deploy del servicio.
3. Ejecuta una peticion POST a /api/auth/bootstrap-admin con header x-bootstrap-token y el body del nuevo admin.
4. Luego elimina BOOTSTRAP_ADMIN_TOKEN y vuelve a deploy para desactivar el endpoint.

Ejemplo de body JSON:

{
  "fullName": "Admin Inicial",
  "cedula": "admin",
  "password": "Admin123*"
}

Reglas:

- Solo funciona si no existe ningun admin activo.
- Requiere token correcto.

Si recibes 409 porque ya existe un admin y no tienes acceso, usa recuperacion:

1. Ejecuta POST a /api/auth/recover-admin con el mismo header x-bootstrap-token.
2. Ese endpoint crea o actualiza el usuario indicado como admin y resetea contraseña.

Ejemplo de body JSON para recuperacion:

{
  "fullName": "Admin Recuperado",
  "cedula": "admin",
  "password": "Admin123*"
}
