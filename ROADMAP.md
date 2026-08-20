# Compositor — contexto y roadmap del proyecto

## Qué es

Web app personal para ayudar a componer canciones desde un nivel básico. El usuario
(Ignacio) es bajista, no domina guitarra ni teoría avanzada, y quiere una herramienta
que le facilite arrancar: escuchar progresiones, armar las propias, guardar ideas,
trabajar la letra, y recibir feedback de un asistente con LLM sobre cómo viene el
concepto de la canción.

Nace de un prototipo (`ChordPlayer.jsx`, artifact de React + Tone.js) que ya reproduce
4 progresiones de acordes con línea de bajo (raíz en octava grave) y un modo "sucio"
(distorsión + bitcrusher). Esa lógica de audio se reutiliza como base de la Fase 1.

## Dirección de diseño: banda garage de los 2000

La estética de referencia es la de un flyer de banda garage-rock de esa época
(The Strokes y alrededores): volante fotocopiado, contraste alto, tipografía cruda,
textura de grano/xerox, nada pulido ni corporativo.

- **Paleta**: fondo casi negro (`#141210`), texto/papel hueso (`#eee6d8`), un rojo
  óxido de acento (`#c9402a`), grises de tinta gastada (`#5a5245`, `#a89f8d`). Evitar
  gradientes prolijos o sombras suaves tipo SaaS.
- **Tipografía**: un display serif de peso alto para títulos (tipo poster de banda) +
  monoespaciada para todo lo funcional (etiquetas de acordes, datos, UI). Mezcla
  deliberadamente "impresa" y no un solo palo neutro tipo Inter en toda la página.
- **Textura**: grano sutil, bordes duros (sin border-radius grande), líneas
  punteadas/dobles como en flyers fotocopiados, contraste fuerte en vez de sombras.
- **Interacción**: feedback visual directo (el acorde que suena se resalta en rojo),
  nada de animaciones largas o "glassmorphism". Botones que parecen sellos o stickers,
  no botones de dashboard genérico.
- **Principio guía**: cada pantalla nueva debe sentirse parte del mismo "volante", no
  una pantalla de SaaS con un tema oscuro aplicado encima.

## Stack técnico

- **Frontend**: Next.js (App Router) + React. Reutiliza y expande el `ChordPlayer.jsx`
  existente como el primer componente real de la app.
- **Audio**: Tone.js en cliente, tal como en el prototipo.
- **Backend / DB / Auth**: Supabase (Postgres + Auth + Storage). Evita mantener
  servidor propio; suficiente para uso personal y tier gratuito.
- **Asistente LLM**: Gemini API, llamado desde API routes de Next.js (la key nunca
  viaja al cliente).
- **Hosting**: Vercel (frontend + API routes) + Supabase cloud.

### Modelo de datos inicial (Postgres / Supabase)

- `songs`: id, user_id, título, tono, bpm, estado
- `progressions`: id, song_id, acordes en orden (label, notas, bajo), nombre
- `lyrics_drafts`: id, song_id, texto, versión, fecha
- `feedback_history`: id, song_id, prompt enviado, respuesta de Gemini, fecha

## Roadmap (en orden de prioridad)

### Fase 0 — Fundación del repo
Migrar el prototipo de artifact a proyecto Next.js real. Setup de Supabase (auth +
tablas base). Deploy inicial en Vercel. Aplicar la dirección de diseño (paleta,
tipografía, componentes base) desde el arranque, no como retoque posterior.

### Fase 1 — Cuentas y guardado real
Login/registro con Supabase Auth. CRUD básico de `songs`: crear canción, guardarla,
listarla, volver a abrirla. El `ChordPlayer` pasa a ser la pantalla de detalle de una
canción, con sus acordes guardados en la base en vez de hardcodeados.

### Fase 2 — Editor de progresiones propio
Reemplazar las 4 progresiones fijas por un editor real: elegir acordes (grid o
selector por compás), armar la propia progresión, escuchar, guardar. Esto es el
corazón de la herramienta — sin esto, todo lo demás es decorado.

### Fase 3 — Asistente de concepto (Gemini)
Botón "¿Qué opinás de esto?" en la pantalla de la canción: envía título, tono, bpm,
acordes y letra actual a Gemini vía API route, devuelve una opinión concisa sobre
coherencia entre música y letra, y sugerencias puntuales. Se guarda en
`feedback_history` para ver la evolución.

### Fase 4 — Herramientas de letra
- Banco de frases / freewriting con timer, para arrancar sin saber tema ni tono.
- Métrica: contador de sílabas por verso alineado a los compases de la progresión.
- Aviso de "rima de más": detecta cuándo un verso rima de forma muy prolija respecto
  al resto y lo marca (no lo corrige solo, es un aviso).

### Fase 5 — Asistencia musical inteligente
- Sugeridor de próximos acordes según el actual (diatónicos + préstamos típicos de
  rock/garage).
- Generador de línea de bajo automática sobre una progresión (raíz, raíz+quinta,
  cromatismo simple entre acordes).
- Detector de tonalidad a partir de los acordes elegidos.

### Fase 6 — Ambicioso / a futuro
- Grabador de ideas (loop + grabación de audio tocando encima).
- Export a MIDI o tab simple.
- "Modo Strokes": presets de producción (palm mute, tono garage) aplicados directo
  al player.
- Compartir canciones/ideas con otra persona (pensado para si vuelve a tocar en
  banda).

## Notas para Claude Code

- Priorizar funcionalidad real sobre pulido en las primeras fases — pero el diseño
  visual (paleta, tipografía, texturas) se aplica desde la Fase 0, no se deja para el
  final.
- El prototipo `ChordPlayer.jsx` ya resuelve la parte de audio (Tone.js, progresiones,
  modo sucio) — reutilizar esa lógica en vez de rehacerla.
- Mobile: el audio con Tone.js necesita iniciarse dentro del gesto de tap del usuario
  (sin creación de contexto de audio antes de la primera interacción), por
  restricciones de Safari/iOS.
- Mantener las claves de API (Supabase service role, Gemini) solo en variables de
  entorno del servidor, nunca expuestas en el cliente.
