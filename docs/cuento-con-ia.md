# Cuento con IA («Crear con IA»)

La docente escribe de qué trata el cuento y el servidor redacta un **borrador**: título, descripción y una frase por página. Después el formulario busca los pictogramas solos. La docente lo lee, lo corrige y recién entonces genera el audio y lo envía a revisión. Nada llega a los niños sin pasar por ella y por la revisora.

## Cómo funciona

`POST /api/v1/cuentos/generar` (docente o admin, 10 por minuto) → `OllamaGenerador` → servidor Ollama (`/api/chat`, `format: json`).

- Modelo abierto, **sin costo por uso** y sin mandar datos a un tercero: el tema es lo único que viaja, y va a tu propio servidor.
- La respuesta se valida: JSON con título y frases, sin frases vacías ni de más de 120 caracteres, y no más de las páginas pedidas.
- El prompt fija el nivel (A: 2 a 4 palabras por frase; B: 4 a 8), tono tranquilo, sin miedo ni violencia, sin nombres reales, y que ignore instrucciones escondidas en el tema.
- Sin `OLLAMA_URL`, el botón responde «La IA de cuentos aún no está activada» y el resto de la app sigue igual.

## Activarlo

Con el contenedor del proyecto (opcional, no arranca por defecto):

```bash
docker compose --profile ia up -d
docker exec liceo-ollama ollama pull qwen2.5:3b
```

En `backend/.env`:

```
OLLAMA_URL=http://ollama:11434
# OLLAMA_MODEL=qwen2.5:3b
```

También sirve un Ollama en otro servidor: pon su dirección en `OLLAMA_URL` y, si está detrás de un proxy con clave, `OLLAMA_API_KEY`.

## Qué modelo elegir

| Servidor | Modelo | Notas |
|---|---|---|
| Solo CPU, 4 GB de RAM libres | `qwen2.5:3b` (por defecto) | ~2 GB. Buen español para frases cortas; un borrador tarda entre 10 y 30 s. |
| Solo CPU, 8 GB o más | `qwen2.5:7b` | Mejor redacción, 2 a 3 veces más lento. |
| Con GPU | `qwen2.5:7b` o mayor | Segundos por borrador. |

`OLLAMA_NUM_PARALLEL=1` y `OLLAMA_MAX_LOADED_MODELS=1` evitan que dos cuentos a la vez dejen lento el servidor. `keep_alive` de 30 min mantiene el modelo en memoria: el primer borrador del día tarda más, los siguientes no.

## Pendientes

- **Calidad no medida.** Los tests usan respuestas simuladas; falta leer borradores reales de cada modelo con la docente y ajustar el prompt.
- **Sin cola.** Se genera dentro de la petición (tope 120 s de nginx). Para varias docentes a la vez conviene un job en cola, como el audio (PLPA-64).
- **Sin filtro de contenido propio.** Confía en el prompt y en que la docente revisa. Si el tema es inapropiado, el modelo puede obedecerlo.
