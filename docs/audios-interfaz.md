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
| `nivel_a` | Nivel A. Sílabas. |
| `nivel_b` | Nivel B. Cuentos. |
| `nivel_c` | Nivel C. Palabras. |
| `nivel_d` | Nivel D. Historias. |
| `pronto` | Este nivel llega pronto. |
| `respira` | Respira conmigo. Inhala... y exhala. |
| `sigues_ahi` | ¿Sigues ahí? |

## Cómo grabarlas con la misma voz

Los audios actuales se hicieron con **ElevenLabs** (el nombre del archivo de origen indica la voz "Playful, High-pitched Friend" y sus ajustes: velocidad 1.0, estabilidad 30 %, similitud 100 %). Para que todo suene igual:

1. Entrar a la cuenta de ElevenLabs con la que se hicieron los audios (la persona que los generó).
2. Elegir **la misma voz** y **los mismos ajustes**.
3. Pegar cada frase de la tabla, generar y descargar el `.mp3`.
4. Renombrar el archivo con su clave (por ejemplo `leer.mp3`) y copiarlo a `frontend/public/audio/interfaz/`.
5. Recargar la página: no hay que tocar código. La app usa el archivo apenas existe.

Recomendaciones: un solo tono (suave, sin gritar), frases con una pausa corta al inicio y al final, y volumen parecido al de los audios existentes.

## Importante antes de producción

- Verificar que la **licencia de la voz** y el **plan de ElevenLabs** permiten este uso. Si es una voz compartida por un tercero, puede tener límites (por ejemplo, uso comercial). Ver `docs/legal-y-privacidad.md`.
- Los textos que cambian (nombre del niño, "3 días seguidos") no se graban: usan la voz del navegador. Si se quiere que también suenen con la voz suave, hay que grabar combinaciones fijas (números del 1 al 8, etc.) o usar un servicio de voz con API.
