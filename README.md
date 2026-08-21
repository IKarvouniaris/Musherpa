# MuSherpa

Herramienta personal para componer canciones desde cero: armá progresiones
de acordes, escuchalas, guardá tus ideas y pedí una opinión sobre cómo viene
el concepto.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) (Postgres + Auth) con Row Level Security
- [Tone.js](https://tonejs.github.io) para el audio en el cliente
- [Gemini API](https://ai.google.dev) para el asistente de feedback

## Funcionalidades

- **Cuentas**: registro con email/contraseña o modo invitado — se puede
  probar todo sin crear cuenta, y registrarse después sin perder nada de lo
  que ya se armó.
- **Editor de progresiones**: paleta de acordes (mayores, menores, power
  chords), armado de secuencia, reemplazo/reordenamiento de acordes, y
  reproducción en vivo con línea de bajo.
- **Letra y asistente de concepto**: un lugar para la letra de cada canción
  y un botón para pedirle a Gemini una opinión concisa sobre cómo viene la
  coherencia entre música y letra.

## Desarrollo local

### Requisitos

- Node.js 18.18 o superior
- Una cuenta de [Supabase](https://supabase.com) (tier gratis alcanza)
- Una API key de [Gemini](https://aistudio.google.com/apikey) (tier gratis)

### Setup

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env.local` y completar las variables (ver
   tabla abajo).

3. Correr las migraciones SQL en el SQL Editor del proyecto de Supabase,
   en orden: `supabase/migrations/0001_init.sql`, luego
   `supabase/migrations/0002_grants.sql`.

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

### Variables de entorno

| Variable | Dónde conseguirla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon / publishable key |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

Las tres son necesarias para correr la app localmente. Ninguna se commitea
al repo — `.env.local` está en `.gitignore`.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |

## Seguridad

El control de acceso a los datos vive en la base, no en el código de la
app: cada tabla tiene Row Level Security habilitado en Postgres, así que
un usuario solo puede leer y escribir sus propias canciones, progresiones,
letras e historial de feedback — sin importar qué haga (o deje de hacer)
el frontend. Las claves con privilegios (Gemini, y cualquier clave de
servicio de Supabase a futuro) viven únicamente en variables de entorno
del servidor y nunca se exponen al cliente.

## Deploy

Pensado para desplegarse en [Vercel](https://vercel.com), con el
proyecto de Supabase como backend. Hace falta configurar las mismas tres
variables de entorno en el proyecto de Vercel, y agregar la URL de
producción a las Redirect URLs de Supabase (Authentication → URL
Configuration) para que los links de confirmación de email funcionen.
