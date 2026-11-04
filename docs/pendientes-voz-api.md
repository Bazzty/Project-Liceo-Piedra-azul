# Pendientes de la API de voz y la conexión backend-frontend

Lo que **no quedó resuelto** al conectar el frontend con la API de voz (rama `feature/PLPA-93-audio-elevenlabs-api`).
Se escribió para no perder estos puntos: cada uno dice qué falla, cuándo se nota y cómo se arregla.

Lo que sí existe: login docente con Sanctum, `POST /api/v1/audio` (ElevenLabs con respaldo Piper y caché por texto y voz),
el botón «Generar audio» del formulario de cuentos y el lector del niño que lo reproduce. Cómo configurarlo está en el
[README](../README.md).

## Antes de usarlo con familias o en el liceo

| # | Pendiente | Qué pasa hoy | Cómo se arregla |
|---|---|---|---|
| 1 | **Probar ElevenLabs de verdad** | Solo se probó con respuestas simuladas (`Http::fake`). Sin clave, todo sale con Piper y el formulario dice «voz de respaldo». | Poner `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID` en `backend/.env`, generar un cuento y comprobar que dice «voz del proyecto». Escuchar el resultado. |
| 2 | **Enrutar `/api` y `/audio-generado` en producción** | El proxy de Vite solo cubre `npm run dev` y `npm run preview`. Un servidor estático devuelve el `index.html` y «Generar audio» falla con «El servidor no respondió como se esperaba». | Que el servidor web de producción (nginx) mande `/api` y `/audio-generado` al backend, con `fastcgi_read_timeout 120s` como en `docker/nginx/default.conf` (con ElevenLabs caído, un audio puede tardar más de 60 s). Es parte del despliegue, no del código. |
| 3 | **Los cuentos viven en cada navegador** | El frontend guarda los cuentos en IndexedDB (Dexie). El MP3 queda en el servidor, pero el cuento y su `audioPaginaUrl` solo existen en el navegador de la docente: otra tablet no los ve. | Es la conexión completa (opción C): pasar los cuentos a la API. Ver PLPA-64 y el modelo en `docs/modelo-datos.md`. |
| 4 | **Los audios guardados dependen del caché del servidor** | `backend/public/audio-generado/` está fuera de git. Si se borra esa carpeta (nuevo despliegue, limpieza), los cuentos guardados apuntan a MP3 que dan 404 y el lector queda sin voz, sin aviso. | Regenerar desde el texto al detectar el 404, o guardar los audios en un disco persistente (S3) y no bajo `public/`. |

## Seguridad y operación

| # | Pendiente | Detalle |
|---|---|---|
| 5 | **Tokens de cuentas inactivas nunca se podan** | Cada login borra solo los tokens vencidos **de esa docente**. Los de quien no vuelve a ingresar se acumulan en `personal_access_tokens`. Falta programar `sanctum:prune-expired`, y hoy ningún contenedor ejecuta el scheduler (`schedule:work`). |
| 6 | **Sin tope mensual de caracteres** | Cada audio nuevo gasta cuota de ElevenLabs. Hay tope por audio (600 caracteres) y 30 audios nuevos por minuto, pero no por mes. Es PLPA-95: al llegar al tope debe usar Piper y regenerar con la API cuando vuelva la cuota. |
| 7 | **Dos peticiones iguales a la vez gastan cuota doble** | Si dos docentes piden el mismo texto nuevo en el mismo instante, ambas llaman a ElevenLabs antes de que exista el archivo. El botón se desactiva mientras genera, así que solo pasa entre dos personas. Un bloqueo por hash (`Cache::lock`) lo evita. |
| 8 | **El token vive en `sessionStorage`** | Se borra al cerrar la pestaña y vence a las 12 h, pero un XSS podría leerlo. Aceptable para el prototipo; en producción conviene cookie `HttpOnly` (Sanctum en modo SPA). |
| 9 | **Los MP3 son públicos** | `/audio-generado/<hash>.mp3` no pide sesión. El nombre es un hash del texto y la voz, y los cuentos no llevan datos de menores, pero cualquiera que conozca una frase puede comprobar si existe. |

## Funcionalidad que falta

| # | Pendiente | Detalle |
|---|---|---|
| 10 | **Cola de trabajos** (PLPA-64) | La API genera el audio dentro de la petición (entre 1 y 2 s por página con ElevenLabs). Para cuentos largos corresponde un job en cola con el estado «generando audio» (PLPA-96). El `ServicioDeAudio` actual se reutiliza dentro del job. |
| 11 | **Cuentos de más de 30 páginas** | El límite de 30 audios nuevos por minuto corta la generación a mitad. Los audios ya hechos se conservan y el error lo dice: hay que esperar un minuto y repetir. Los ya generados tienen un cupo aparte (300 por minuto), así que cada intento avanza. |
| 12 | **El audio no se guarda para uso offline** | La PWA no precachea `/audio-generado/*`. Sin conexión, un cuento nuevo se lee sin su voz. Falta incluirlo en la estrategia de Workbox. |
| 13 | **Sin e2e de punta a punta** | El recorrido login → generar → guardar → reproducir solo se probó con un script manual que no quedó en el repo. El CI de `ci-web` no levanta el backend. Falta un workflow que arranque Docker y corra Playwright contra los dos. |

## Voz del osito

| # | Pendiente | Detalle |
|---|---|---|
| 14 | **Textos dinámicos con la voz del navegador** | Los textos fijos (palabras, dígitos, días, stickers, títulos de demostración) ya tienen archivo y se buscan por texto. Siguen con el navegador los que cambian: el barrido, «Tienes N de M stickers», «Tarea de la profe. …» y los cuentos nuevos de la docente sin «Generar audio». Se resuelve con un endpoint de voz que no pida sesión de docente. |
| 15 | **Velocidad de lectura** | La voz nueva lee más rápido que las grabaciones viejas (en los cuentos, 1,4 s de media frente a 3,0 s). Para niños que están aprendiendo a leer conviene `VOZ_VELOCIDAD=0.9` y regenerar con `npm run audios -- --forzar`. |
| 16 | **`fonemas/m.mp3` sigue con la voz vieja** | Es el sonido /m/ suelto. Un TTS diría «eme», así que se dejó como estaba. Hay que regrabarlo a mano o buscar otro modo de generarlo. |
| 17 | **Los fonemas con TTS no se escucharon** | Se comprobó que los 30 archivos son válidos y de duración razonable, pero nadie los ha oído. Una vocal o sílaba suelta puede sonar rara; hay que revisarlos con la docente. |

## Detalles menores

- **El rol del login local y el del servidor son independientes.** El panel docente acepta cualquier correo y clave (es una simulación) y el servidor decide si el token sirve. Si alguien entra como «revisor» en el panel con credenciales de una docente, el servidor le dará un token de docente. Desaparece cuando el login deje de ser simulado.
- **Un intento de login fallido borra el token vigente.** `iniciarSesionEnServidor` limpia el token si el servidor responde 401, aunque el panel local ya esté abierto. La docente verá «vuelve a ingresar» y debe repetir el login.
- **El límite de login es por correo+IP (5 por minuto) y por IP (60 por minuto).** Detrás de nginx todos comparten IP, así que el tope por IP es global: 60 logins por minuto entre todo el liceo. Con `trustProxies` bien configurado cuenta la IP real.
- **Commit mezclado:** la rama tiene un commit titulado PLPA-96 que incluye también el backend de PLPA-93 y PLPA-94 (commitlint rechazó el primero y el siguiente arrastró sus archivos). Como el repositorio fusiona con squash, el historial final usa el título del PR y no afecta a `develop`.

## Tickets relacionados en Jira

- PLPA-93: interfaz `TtsProvider` con drivers ElevenLabs y Piper (implementado)
- PLPA-94: caché de audio por hash de texto y voz (implementado)
- PLPA-96: estado «generando audio» en la vista de la docente (solo el botón con su progreso; falta el estado persistente)
- PLPA-64: job en cola que genera el audio al guardar o publicar (pendiente)
- PLPA-95: respaldo automático, tope mensual y regeneración con la API (el respaldo está; faltan el tope y la regeneración)
