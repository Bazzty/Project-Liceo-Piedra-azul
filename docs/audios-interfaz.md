# Audios de la interfaz del niño

La app busca primero una **grabación** (la voz suave del proyecto) y solo usa la voz del navegador si el archivo aún no existe. Cada frase tiene una clave (`frontend/src/shared/config/audiosInterfaz.ts`) y un archivo en `frontend/public/audio/interfaz/`.

## ⚠ ADVERTENCIA: hay dos voces mezcladas (por corregir)

**Los audios de la app NO suenan todos con la misma voz.** Se debe corregir antes de usarla con niños.

- **Voz del osito** (id `WOY6pnQ1WCg0mrOZ54lM`): es una voz de la *biblioteca* de ElevenLabs. Con el plan gratuito la API responde **402 `paid_plan_required`**, así que no se pueden generar audios nuevos con ella.
- **Voz usada para lo nuevo** (id `hpp4J3VqNfWAUOO0d1Us`, predeterminada, sí disponible en el plan gratuito): se generaron con ella, el 2026-11-11, **26 audios** que antes no existían:
  - Sonidos de las consonantes del teclado, en `frontend/public/audio/fonemas/`: `b c d f g h j k l n p q r s t v w x y z` y `enie` (Ñ).
  - Nombres de las carpetas de la plantilla general, en `frontend/public/audio/textos/`: `necesidades`, `emociones`, `personas`, `acciones`, `objetos`.
- **Además**, todo audio que la docente genere desde el editor del tablero (palabras nuevas y el botón «Generar audios que faltan») o desde el formulario de cuentos usa la voz que esté en `backend/.env`, hoy la segunda.

**Qué se nota:** al tocar una letra o una carpeta suena una voz distinta a la del resto de la app (vocales, sílabas, números, palabras, interfaz y personaje).

**Cómo corregirlo** (elegir una):
1. **Volver a la voz del osito:** pasar a un plan de pago de ElevenLabs (o conseguir que esa voz esté en «Mis voces»), poner su id en `frontend/.env.local` y `backend/.env` y regenerar los 26 con `npm run audios -- --forzar --solo=fonemas` y `--solo=textos` (ojo: `--solo=textos` y `--solo=fonemas` regeneran **toda** la carpeta, también audios que ya eran del osito; es lo que se quiere: todos con la misma voz).
2. **Unificar todo con la voz nueva:** `npm run audios -- --forzar` regenera los 334 audios del manifiesto (≈3.700 caracteres) y **reemplaza la voz del osito**. Conviene tener todo comiteado antes, para poder volver atrás.

**Además, revisar la pronunciación de los 26 audios nuevos** (nadie los escuchó aún): un TTS no dice bien una consonante suelta. Las alargadas se pidieron como «sss», «fff», «lll»…; las explosivas, con una e breve («pe», «te»); `h` dice «hache» (no tiene sonido) y `w` dice «gu». Los textos están en `frontend/scripts/audios-pendientes.mjs`. Para regenerar solo una letra: se corrige su texto allí, se borra su archivo (`frontend/public/audio/fonemas/<letra>.mp3`) y se corre `npm run audios`, que genera únicamente los que faltan.

## Estado original: una sola voz, la del osito (ver la advertencia de arriba)

Los audios de `frontend/scripts/audios.manifest.json` (interfaz, cuentos, pictogramas, palabras y fonemas) se generan con la **voz del osito** (ElevenLabs, voz masculina joven y alegre), con el modelo `eleven_turbo_v2_5` y `language_code: es`. Sin forzar el idioma, una palabra suelta puede leerse como inglés («Lana»); el modelo `eleven_multilingual_v2` no admite ese parámetro, por eso se usa turbo. La API del servidor envía los mismos ajustes.

**Revisar la pronunciación:** con el servidor de Vite en marcha, abre `http://localhost:5173/revision-audios.html` (si existe en tu copia), escucha los audios y marca los que suenen mal. Una palabra mal dicha se corrige cambiando su `texto` en el manifiesto (por ejemplo, separando sílabas o con otra grafía) y ejecutando `npm run audios -- --forzar --solo=<carpeta>`. Para regenerarlos: `npm run audios -- --forzar` desde `frontend/`, con la clave en el entorno (ver abajo).

- **Fuera del manifiesto, a propósito:** `fonemas/m.mp3` (el sonido /m/ suelto; un TTS diría «eme»).
- **Cómo elige el osito la voz:** el tablero «Hablar» usa `decirSecuencia` (cada palabra con su `audioUrl`, y si falta, la del índice); el resto de la app usa `useHablar`, que busca primero la grabación por **clave** (`audiosInterfaz.ts`) y, si no hay, por el **texto** exacto (`src/shared/config/audiosPorTexto.json`: palabras, dígitos, días, stickers, títulos de los cuentos de demostración). Solo si no encuentra ninguna usa la voz del navegador.
- **Agregar un texto fijo:** suma una entrada al manifiesto en `textos/` (con `para: [...]` si la app lo pide con otras palabras), corre `npm run audios` (genera lo que falta y reescribe el índice) y revisa el resultado. Los tests fallan si un sticker o un dígito queda sin audio, o si el índice no coincide con el manifiesto (`npm run audios:indice`).
- **Siguen con la voz del navegador** solo los textos que no se conocen de antemano: los cuentos y palabras que cree la docente (hasta que genere su audio con «Generar audio»), los pictogramas con foto real que suba la docente, los nombres que lee el barrido y frases con datos del niño (cuántos stickers tiene, el título de una tarea).
- **Cambiar la voz** obliga a regenerar todo: los audios ya grabados no se actualizan solos.

## Ya grabados (no hay que hacer nada)

| Clave | Archivo | Dónde suena |
|---|---|---|
| `hola` | `audio/personaje/bienvenida.mp3` | Saludo del osito en el menú y al entrar |
| `felicitaciones` | `audio/personaje/felicitaciones.mp3` | Al terminar un cuento |
| `despedida` | `audio/personaje/despedida.mp3` | Al salir o cerrar la sesión |
| `espera` | `audio/personaje/esperando_profesora.mp3` | Espera en el laboratorio |

## Por grabar (15 frases cortas)

Guardar cada una como `frontend/public/audio/interfaz/<clave>.mp3`.

| Clave | Frase |
|---|---|
| `toca_numeros` | Toca los números de tu tarjeta. Después toca la palomita. |
| `intentemos` | Intentemos otra vez. |
| `descansemos` | Descansemos un momento. |
| `leer` | Leer. |
| `hablar` | Hablar. |
| `estrellas` | Mis estrellas. |
| `elige_nivel` | Elige un nivel para empezar a leer. |
| `elige_cuento` | Elige el cuento que más te guste. |
| `nivel_a` | Nivel A. Sílabas. |
| `nivel_b` | Nivel B. Vocales. |
| `nivel_c` | Nivel C. Palabras. |
| `nivel_d` | Nivel D. Cuentos. |
| `nivel_e` | Nivel E. Historias. |
| `instrucciones_silabas` | Vamos a jugar con sílabas. Escucha cada palabra y mira su dibujo. Toca el parlante para oírla otra vez. |
| `instrucciones_vocales` | Vamos a conocer las vocales. Mira la letra, escucha su sonido y descubre palabras que empiezan con ella. |
| `instrucciones_palabras` | Vamos a aprender palabras de todos los días. Mira el dibujo y escucha la palabra. |
| `instrucciones_cuentos` | Vamos a leer cuentos. Toca Escuchar para oír cada página y la flecha para seguir. |
| `instrucciones_historias` | Vamos a leer historias más largas. Escucha con atención y toca la flecha para pasar la página. |
| `cual_es` | ¿Cuál es? |
| `que_empieza` | ¿Con qué empieza? |
| `busca_parejas` | Busca las parejas. |
| `que_falta` | ¿Qué falta? |
| `pon_en_orden` | Pon en orden. |
| `inhala` | Inhala. |
| `exhala` | Exhala. |
| `burbujas` | Toca las burbujas. |
| `luciernagas` | Toca el cielo y nacen luces. |
| `dibuja` | Dibuja con tu dedo. |
| `como_estas` | ¿Cómo estás ahora? |
| `pronto` | Este nivel llega pronto. |
| `respira` | Respira conmigo. Inhala... y exhala. |
| `sigues_ahi` | ¿Sigues ahí? |

## Generarlas automáticamente (recomendado)

Desde `frontend/`, un script crea los audios que falten con la voz del proyecto (ElevenLabs). Está en `scripts/generar-audios.mjs` y lee la lista `scripts/audios.manifest.json`.

1. Copiar `.env.example` como `.env.local` y completar `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID` (la clave nunca se sube a git ni se comparte por chat).
2. `npm run audios -- --dry-run` muestra qué audios faltan sin gastar créditos.
3. `npm run audios` genera solo los que faltan o cuyo texto cambió, y los guarda en `public/audio/`.
4. Opciones: `--forzar` (regenera todo) y `--solo=interfaz` (solo una carpeta).

**Para agregar un audio nuevo** (un cuento, un pictograma, una frase): añadir una línea al manifiesto con `archivo` (ruta dentro de `public/audio/`) y `texto`, y ejecutar `npm run audios`. Si se cambia el texto de una línea, se regenera sola.

> El script no se ha probado contra la API real (no se dispone de clave en el desarrollo del prototipo): la primera ejecución debe revisarse con `--solo=interfaz` y escuchando los resultados.

### Grabarlas a mano (alternativa)

Entrar a ElevenLabs con la misma voz y ajustes (velocidad 1.0, estabilidad 30 %, similitud 100 %), generar cada frase de la tabla, descargar el `.mp3`, nombrarlo con su clave y copiarlo a `frontend/public/audio/interfaz/`. La app lo usa apenas existe.

## Cuando la docente cree contenido (producción)

El script sirve para el equipo de desarrollo. Para que la **docente** agregue un cuento o pictograma y el audio aparezca solo, hace falta un backend (la clave de ElevenLabs nunca puede estar en el navegador):

1. La docente escribe o edita un cuento en el editor y lo guarda.
2. El backend crea un **trabajo de audio** por cada página o palabra nueva. Estados visibles en el editor: *pendiente → generando → listo / error*.
3. Antes de llamar a ElevenLabs revisa un **caché** (huella del texto + voz + ajustes): si ya existe, reutiliza el archivo y no gasta créditos.
4. El audio se guarda en almacenamiento de archivos y se asigna a la página (`audioPaginaUrl`). Mientras esté pendiente, la app usa la voz del navegador.
5. El **revisor** escucha los audios antes de validar el cuento (la voz de IA puede pronunciar mal).
6. Controles: límite de caracteres por mes (según el plan de ElevenLabs), registro de cuánto se gasta y reintentos si falla. Si la API falla o se alcanza el tope, el trabajo usa **Piper** (local) y esas páginas se regeneran con ElevenLabs cuando vuelve la cuota.

Cuidado con los datos: los textos de los cuentos se envían a ElevenLabs, así que no deben incluir nombres ni datos de niños.
