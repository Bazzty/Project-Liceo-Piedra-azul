# Cuento con IA («Crear con IA»)

La docente escribe de qué trata el cuento y el servidor redacta un **borrador**: título, descripción y una frase por página. Después el formulario busca los pictogramas solos. La docente lo lee, lo corrige y recién entonces genera el audio y lo envía a revisión. Nada llega a los niños sin pasar por ella y por la revisora.

## Cómo funciona

`POST /api/v1/cuentos/generar` (docente o admin, 10 por minuto) → `OllamaGenerador` → servidor Ollama (`/api/chat`, `format: json`).

- Modelo abierto, **sin costo por uso** y sin mandar datos a un tercero: viajan el tema y, si se piden, las palabras para practicar; y van a tu propio servidor.
- La respuesta se valida: JSON con título y frases, sin frases vacías, sin frases que no tengan letras (por ejemplo «...») ni de más de 120 caracteres, y no más de las páginas pedidas.
- El prompt fija el largo de las frases (`nivel` A de la API: 2 a 4 palabras; B: 4 a 8), tono tranquilo, sin miedo ni violencia, sin nombres reales, y que ignore instrucciones escondidas en el tema.
- Ese `nivel` no es el código de la app: Cuentos e Historias (D y E) piden frases de 4 a 8 palabras; los demás niveles, las mínimas.
- Sin `OLLAMA_URL`, el botón responde «La IA de cuentos aún no está activada» y el resto de la app sigue igual.

## Palabras para practicar

La ficha del estudiante muestra las palabras que más le cuestan en los juegos. El botón **Crear cuento con estas palabras** abre «Crear con IA» con ellas cargadas.

- `POST /api/v1/cuentos/generar` acepta `palabras` (opcional): hasta 6, de 2 a 30 letras cada una, solo letras y espacios. Se agregan al mensaje pidiendo usarlas.
- **Privacidad:** solo viajan las palabras. Ni el nombre ni el id del niño salen de la ficha: la docente llega al formulario con las palabras en el estado de la navegación, no en la dirección ni en el servidor. El formulario también avisa que no se escriban nombres de estudiantes en el tema.
- Un modelo pequeño puede omitirlas, así que después de generar el formulario muestra cuáles **aparecen** y cuáles **no** (se compara con el texto, sin importar tildes ni mayúsculas, y exige la palabra completa: «charcos» no cuenta como «charco»). Si la docente agrega la palabra a mano, pasa a aparecer.
- Medido con el modelo real (`qwen2.5:3b`, 12 cuentos, 3 palabras cada uno): usó **31 de las 36** palabras pedidas (86 %). En frases mínimas (nivel A, 5 páginas): 18 de 18. En oraciones (nivel B, 8 páginas): 13 de 18. Lo que faltó fueron plurales («charcos») y palabras sueltas como «leche» o «diente».

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
| Solo CPU, 4 GB de RAM libres | `qwen2.5:3b` (por defecto) | ~2 GB. Buen español para frases cortas; un borrador tarda de 8 a 15 s con la máquina tranquila (ver «Velocidad medida»). |
| Solo CPU, 8 GB o más | `qwen2.5:7b` | Mejor redacción, 2 a 3 veces más lento. |
| Con GPU | `qwen2.5:7b` o mayor | Segundos por borrador. |

`OLLAMA_NUM_PARALLEL=1` y `OLLAMA_MAX_LOADED_MODELS=1` evitan que dos cuentos a la vez dejen lento el servidor. `keep_alive` de 30 min mantiene el modelo en memoria: el primer borrador del día tarda más, los siguientes no.

## Velocidad medida

Mac con Docker (10 CPU, 8 GB), `qwen2.5:3b`, sin GPU, 4 de noviembre de 2026. El Mac no estaba libre: otros procesos del sistema mantenían un promedio de carga de 10 a 16 durante las mediciones, y Ollama arrancaba en 0 % de CPU. Por eso hay mucho ruido (±15 %). Las medianas son de 6 cuentos por escenario y excluyen la carga del modelo.

| Prueba | A / 5 páginas | B / 8 páginas |
|---|---|---|
| Prompt actual (consecutivo, así se usa) | 8,8 s · 65 tokens · 19 tok/s | 11,6 s · 116 tokens · 19 tok/s |
| Prompt reestructurado (`system` fijo, `num_ctx` 2048, `num_predict` calculado), consecutivo | 7,6 s · 77 tokens · 15 tok/s | 12,4 s · 143 tokens · 15 tok/s |
| Lo mismo, alternado con el actual | 12,6 s | 10,7 s |
| Prompt actual alternado con el reestructurado | 10,2 s | 14,4 s |
| Prompt actual + `num_ctx` 2048 + `num_predict` calculado | 9,9 s | 13,4 s |

Conclusión: **ningún cambio de prompt ni de parámetros mejoró la velocidad de forma consistente**. El ahorro del prompt (menos cálculo al repetir el prefijo fijo) se compensó con respuestas más largas. Con ese ruido no se puede afirmar una mejora del 5 %.

**Calidad del prompt reestructurado** (24 cuentos por prompt): en frases mínimas dejó de respetar el largo por nivel con más frecuencia (6 de 12 en rango contra 9 de 12 con el actual) y en oraciones también (6 de 12 contra 8 de 12). A cambio entregó las 8 frases pedidas más veces (8 de 12 contra 5 de 12). Se **descartó** y el prompt sigue siendo el original.

**Hilos de CPU** (`num_thread`, prompt actual, 12 cuentos por valor, alternados): con 6 hilos el tiempo total fue casi igual (13,2 y 15,9 s contra 13,6 y 16,0 s); con 8 hilos bajó (12,3 y 13,2 s), pero esas respuestas fueron más cortas y la máquina estaba ocupada, así que no es concluyente. La velocidad de escritura sí subió (de 11,5 y 16,9 tok/s a entre 19 y 22 tok/s), pero la lectura del prompt, que es la parte más lenta, no mejoró. Queda como opción `OLLAMA_HILOS` en `backend/.env`, **vacía por defecto**: pruébala en tu equipo antes de fijarla.

No se probó `OLLAMA_FLASH_ATTENTION` (requiere recrear el contenedor).

Referencia práctica: un borrador tarda unos **8 a 15 segundos** con la máquina tranquila. La primera vez del día suma la carga del modelo (1 a 2 s con el modelo en disco caliente). El tope de 90 s es holgado; si el Mac está saturado puede tardar mucho más (una noche con un proceso colgado dio 1 tok/s), y por eso el formulario permite **cancelar**.

## Calidad real

Se generaron 108 borradores reales con `qwen2.5:3b` (96 de las mediciones y 12 con palabras para practicar) y se leyeron a mano varias decenas. Siempre hay que revisarlos:

- **Menos páginas de las pedidas.** Con el prompt actual y 8 páginas, solo 15 de 36 borradores trajeron las 8 frases; en las pruebas con palabras, 4 de 6 trajeron solo 4. Con 5 páginas siempre llegaron las 5. El formulario lo avisa («Pediste 8 páginas y la IA escribió 4»).
- **Largo por nivel.** En frases mínimas a veces pasa de 4 palabras; en oraciones a veces pasa de 8.
- **Tiempo verbal.** Se pide presente y a veces escribe pasado.
- **Nombres inventados** («Paco», «Lucía», «Juan», «Peluca») aunque el prompt lo prohíbe.
- **Gramática rara** en frases mínimas («Agua florece bien», «Mesa tiene», «Mamá come con mamá») y letras perdidas («Pequeno»).
- **Contenido inadecuado.** En un cuento de un pez escribió «Salió del agua para no morir». Por eso nada llega a los niños sin la revisión.
- En las 108 pruebas el JSON fue siempre válido, ninguna respuesta se cortó por el tope de tokens y no apareció ninguna frase de «...». Ese filtro queda igual como red de seguridad.

## Pendientes

- **Calidad limitada del modelo pequeño.** Hay que probar `qwen2.5:7b` con la docente (2 a 3 veces más lento) y ajustar el prompt con ella.
- **Sin cola.** Se genera dentro de la petición (tope 120 s de nginx). Para varias docentes a la vez conviene un job en cola, como el audio (PLPA-64).
- **Sin filtro de contenido propio.** Confía en el prompt y en que la docente revisa. Si el tema es inapropiado, el modelo puede obedecerlo.
