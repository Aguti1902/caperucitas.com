# Caperucitas.com

Web de anuncios de contactos para adultos (+18) Caperucitas.com. Cliente recurrente de Agutidesigns. Se construyó a partir del código de 9citas.com (mismo cliente), por eso el paquete aún se llama `9citas`.

## Dónde está publicada
- https://www.caperucitas.com (frontend: proyecto de Vercel `caperucitas-com`)
- Backend: Railway

## Tecnología
- `frontend/`: React + Vite + TypeScript + Tailwind (lo publica Vercel).
- `backend/`: Node + Express + Prisma + PostgreSQL, desplegado en **Railway** (no en Vercel).
- Pagos con Stripe, imágenes en Cloudinary, chat en tiempo real con Socket.io.

## Estructura
- `frontend/src/`: páginas y componentes de la web.
- `backend/src/`: API, perfiles, pagos, mensajes. `backend/prisma/`: base de datos.
- Los muchos `.md` de la raíz son guías antiguas de despliegue (Railway, Hostinger, Vercel).

## Importante en este proyecto
- El backend está en Railway: un cambio en `backend/` no se publica con Vercel. Pregunta antes de tocar la base de datos o el backend.
- Contenido adulto: respeta el aviso de mayoría de edad y las páginas legales.
- No confundir con `9citas.com`, que es otra web del mismo cliente.

## Cómo se publica un cambio
1. Haz el cambio en la rama `main` (o en una rama y luego fusiónala).
2. Antes de subir, comprueba que compila: `npm install` y `cd frontend && npm run build`.
3. Al subir a `main`, Vercel publica solo en 1-2 minutos (proyecto `caperucitas-com`). No hace falta tocar nada más.
4. Cuando termines, dile a Alejandro qué has cambiado y en qué URL puede verlo.

## Reglas para trabajar aquí
- Responde siempre en español, claro y sin tecnicismos innecesarios: Alejandro no es programador.
- Las claves (Stripe, Supabase, APIs) viven en las variables de entorno de Vercel. Nunca las escribas en el código ni las subas a GitHub.
- Pregunta antes de: borrar contenido, cambiar precios o pagos, tocar la base de datos, cambiar dominios o variables de Vercel, o enviar algo al cliente.
- Cambios de texto, imágenes, colores o secciones: hazlos directamente.
- Este repositorio es de un cliente de Agutidesigns (Alejandro "Guti"). No mezcles nada de otros clientes.
