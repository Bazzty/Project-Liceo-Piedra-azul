# Audios de la interfaz del niño

La app busca primero una **grabación** (la voz suave del proyecto) y solo usa la voz del navegador si el archivo aún no existe. Cada frase tiene una clave (`frontend/src/shared/config/audiosInterfaz.ts`) y un archivo en `frontend/public/audio/interfaz/`.

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
| `nivel_a` | Nivel A. Vocales. |
| `nivel_b` | Nivel B. Sílabas. |
| `nivel_c` | Nivel C. Palabras. |
| `nivel_d` | Nivel D. Cuentos. |
| `nivel_e` | Nivel E. Historias. |
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
6. Controles: límite de caracteres por mes, registro de cuánto se gasta y reintentos si falla.

Cuidado con los datos: los textos de los cuentos se envían a ElevenLabs, así que no deben incluir nombres ni datos de niños.
