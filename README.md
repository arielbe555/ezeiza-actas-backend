# Ezeiza Actas Backend

Backend Node.js + Express + PostgreSQL para el sistema de gestión de actas de tránsito (Ezeiza).

Incluye:

- Express API
- PostgreSQL (Render) usando `DATABASE_URL`
- MercadoPago (crear preferencia de pago)
- Cloudinary (subida de imagen de prueba/foto)
- Endpoints base para actas

## Scripts

```bash
npm install
npm start      # producción
npm run dev    # desarrollo con nodemon
```

## Variables de entorno necesarias

En local, crear archivo `.env` en la raíz con:

```env
DATABASE_URL=postgresql://auto:...@dpg-....render.com/ezeiza_actas_db
MP_ACCESS_TOKEN=APP_USR-...
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@dlqjvogej
CORS_ORIGIN=*
PORT=3000
```

En Render, configurar las mismas keys en la sección **Environment** del servicio web.
