# Tablero de comunicación editable (estilo Asterics Grid)

**Historia Jira:** PLPA-109 «Mejorar el tablero de comunicaciones con referencia a características de Asterics Grid».
**Estado:** análisis y decisiones cerradas; implementación en curso: **T1 a T5 y T7 hechas**. **No se crearán subtareas en Jira**: el trabajo avanza según las tareas T1–T8 de este documento y **todos los commits usan `PLPA-109`**.
**Origen:** pedido del cliente (la profesora): que el tablero se parezca a los de Asterics Grid, que ella pueda editar lo que ve cada niño y que exista un teclado para escribir.

## Cómo está hoy (antes del cambio)

- `frontend/src/features/tablero/components/TableroSAAC.tsx`: pantalla completa con el osito y su burbuja arriba y **una sola grilla con las 36 palabras fijas** del catálogo semilla. El orden sale de una lista escrita en el código (`PRIMERAS` y `ordenarTablero` en `categoriasTablero.ts`). Las categorías son 6 fijas y el color de la franja depende de ellas. La frase admite 8 palabras como máximo.
- Los datos viven en **IndexedDB** (Dexie). El backend solo tiene login, cuento con IA y `POST /api/v1/audio`. No hay tableros en el servidor (las tablas `usos_tablero` solo sirven para seguimiento).
- `Header.tsx` tiene un botón HABLAR, pero solo lo usa `MainLayout`, y ese layout solo aparece en la página de muestra. Las vistas del niño abren el tablero con su propio botón (`VistaPrincipal.tsx`); el docente y el login no tienen ninguno.
- Ya existe el buscador de ARASAAC (`searchArasaacPictograms`) y la cadena de voz: `audioUrl` de la palabra → índice por texto → voz del navegador (`decirSecuencia`).

## Qué se quiere lograr

1. Una **plantilla general** que trae la app y que todos los niños reciben, y que el profesor puede **editar de forma personalizada por niño**: agregar, eliminar, editar y ordenar acciones, clasificarlas por tipo y tener **varias plantillas** que también puede crear y quitar.
2. Un **teclado** para que el niño escriba, con sonido de cada letra y de la palabra formada.
3. El tablero **accesible desde cualquier vista**, con un botón fijo en el encabezado.

## Decisiones tomadas

### Datos y alcance
| # | Decisión |
|---|---|
| 1 | Los tableros se guardan **primero en el navegador (IndexedDB)**, pero el modelo se diseña para pasarlo después al backend (PostgreSQL) sin rehacerlo. |
| 2 | **Copia por niño al editar por primera vez**: mientras la profesora no toque nada, el niño usa la plantilla general y recibe sus mejoras; desde su primera edición tiene una copia propia que ya no cambia sola. Botón «restablecer a la plantilla». |
| 3 | El niño ve **un tablero principal activo**; el resto se alcanza por celdas-carpeta. |
| 4 | **Un nivel de carpetas**: tablero principal + carpetas (ver [Carpetas](#carpetas)). |
| 5 | Cada celda lleva pictograma y palabra, **texto hablado distinto del mostrado**, **categoría y color propios** y **foto real**. |
| 6 | El profesor puede **crear categorías propias** (nombre y color). Deja de existir la lista cerrada de 6. El color se elige de una **paleta de 6** sacada de los temas (azul, verde, naranja, amarillo, rojo, celeste), para conservar el contraste y el bajo estímulo. |

### Editor del profesor
| # | Decisión |
|---|---|
| 7 | Se edita en una **sección nueva del panel docente**, con vista previa en vivo. El niño nunca edita. |
| 8 | Reordenar con **arrastrar y soltar** y también con botones «mover antes/después» (accesible con teclado, WCAG 2.1.1). |
| 9 | El profesor **escribe la palabra** y la app muestra una lista de pictogramas de ARASAAC para que elija (o sube una foto). Las imágenes elegidas se **descargan y guardan** para funcionar sin internet. Se muestra el **crédito de ARASAAC** (licencia CC BY-NC-SA); falta definir dónde (ajustes o editor). |
| 10 | Las palabras nuevas **generan su audio al guardar** con la voz del osito (`POST /api/v1/audio`); si falla, voz del navegador. No deben llevar nombres de niños. |

### Teclado
| # | Decisión |
|---|---|
| 11 | **QWERTY simple**: letras, números, espacio, Enter y borrar. Teclas grandes, Ñ incluida. |
| 12 | Al tocar una letra suena **su sonido** (/m/, no «eme»). **Es un requisito firme**, no depende de confirmar nada. |
| 13 | La palabra formada la dice la **voz del navegador** (sin costo ni retraso). |
| 14 | **Todos los niños** pueden usarlo: es un **botón dentro del tablero** que abre el teclado. No depende de un apoyo del alumno. |
| 15 | Dibujos y letras **se mezclan en la misma frase**. |
| 16 | **No se guarda en el seguimiento lo que escribe el niño** (puede traer nombres u otros datos personales; CLAUDE.md pide datos mínimos de menores). Solo se registra que usó el teclado y cuántas palabras. |
| 17 | **Enter** hace que el osito diga lo escrito. |
| 17b | Los audios que falten de letras (sonidos) y dígitos se **generan con la API de ElevenLabs** (`npm run audios`, ver `docs/audios-interfaz.md`) y se revisan escuchándolos. |

### Botón global
| # | Decisión |
|---|---|
| 18 | El botón del encabezado aparece en las **vistas del niño y el panel docente**, no en el login ni en la espera de aula. |
| 19 | Sin alumno activo (profesor), abre la **plantilla general**. |
| 20 | La **frase se conserva** al cambiar de página y al cerrar el tablero, hasta que el niño la borre o termine la sesión. Por eso el estado vive en un store y no dentro del componente. |

## Carpetas

El tablero principal mezcla **palabras** y **carpetas**. Una carpeta es una celda que, al tocarla, abre **otro tablero** (una plantilla más). Una categoría del punto 6 se convierte en carpeta.

```
TABLERO PRINCIPAL                      AL TOCAR «Comida»
┌────┬────┬────┬────┐                  ┌────┬────┬────┬─────┐
│ yo │quie│ más│ no │  palabras        │ ←  │agua│pan │leche│
├────┼────┼────┼────┤  frecuentes      ├────┼────┼────┼─────┤
│📁  │📁  │📁  │📁  │  carpetas        │fruta│sopa│...      │
└────┴────┴────┴────┘                  └────┴────┴────┴─────┘
```

- **Profundidad:** principal + una carpeta (no hay carpetas dentro de carpetas).
- **Cuántas celdas hay en cada carpeta lo decide el profesor.** Cada carpeta es, en sí, una plantilla: la plantilla general viene con carpetas ya armadas (Comida, Sentimientos, Personas…) y el profesor puede **crear más carpetas, editarlas o quitarlas**, por niño.
- Al elegir una palabra dentro de una carpeta, **vuelve sola al tablero principal** (configurable por el profesor).
- **Palabras núcleo siempre visibles** (por ejemplo «yo», «quiero», «más», «no», «ayuda») en una fila fija, también dentro de las carpetas.
- Una carpeta se distingue de una palabra por **forma** (borde en pestaña o ícono de carpeta) y por el color de su categoría. Al tocarla **dice su nombre**.
- La flecha de volver es **siempre visible, grande y en la misma esquina** (donde hoy está «Volver»).
- Un profesor puede armar un tablero **sin carpetas** para un niño que prefiere una sola grilla.

## Qué cambia en el código y los datos

- Sacar del código la lista de palabras, el orden y las categorías: la plantilla general pasa a ser **datos**, una plantilla más.
- Unificar el encabezado: hoy hay un `Header` que casi nadie usa y botones HABLAR sueltos en cada vista.
- Cada palabra nueva se guarda como **pictograma real** (origen `arasaac` o `propio`), para no romper el seguimiento, que usa `pictogramaIds`.
- **Modelo (T2, hecho)** en Dexie v4, con tipos en `frontend/src/types/index.ts`:
  - `tableros`: id, nombre, `esPlantilla`, `alumnoId` (si es copia de un niño), `copiadoDe`, `principal` y **sus celdas dentro del mismo registro**, en orden. Es lo más simple para copiar, reordenar y guardar de una vez; al pasar al backend (T8) se normaliza en una tabla `tablero_celdas` (id, tablero_id, orden, tipo, pictograma_id, texto_mostrado, texto_hablado, categoria_id, destino_tablero_id, es_nucleo).
  - Celda: `tipo` (`palabra` o `carpeta`), `pictogramaId`, `textoMostrado`, `textoHablado`, `categoriaId`, `destinoTableroId` (solo carpeta) y `esNucleo`.
  - `categorias`: id, nombre, color (de la paleta) y orden, editables.
  - La plantilla general (`plantilla-general` y una carpeta por categoría) se construye con `construirPlantillaGeneral` y se carga al iniciar si falta (`mocks/tableros.ts`). Cada palabra queda en un solo lugar: las 8 núcleo en el principal y el resto en su carpeta.
  - Un niño usa su tablero propio si existe y, si no, la plantilla general (`api/tableros.ts`). La copia propia se crea al editar por primera vez (T4).
- **Dexie:** v4 solo agrega las tablas; no migra datos porque la plantilla se siembra al iniciar. Cubierto por `db/esquema.test.ts` y `features/tablero/plantillaGeneral.test.ts`. 
- **Carpetas en el tablero del niño (T3, hecho):** el tablero principal ocupa casi todo el ancho y las **carpetas van en una columna fija a la derecha**, una debajo de la otra (en pantallas angostas, menos de 640 px, pasan a una **franja abajo**). La columna sigue visible con una carpeta abierta: la abierta se marca (borde grueso, aro y `aria-pressed`) y se puede pasar a otra directamente; tocar la abierta vuelve al principal. Encima va la **fila de palabras núcleo**, siempre a la vista, y debajo el área grande: las palabras del principal o las de la carpeta abierta. Cada carpeta lleva un **dibujo que representa su categoría** dentro del ícono (pestaña y borde punteado), más su nombre; al tocarla dice el nombre. La flecha de siempre vuelve al principal desde una carpeta y, en el principal, cierra el tablero. Al elegir una palabra dentro de una carpeta se vuelve sola al principal (`Tablero.volverAlElegir`, por defecto sí; el editor de T4 lo cambia). La frase se conserva al navegar. Un solo nivel. La lógica está en `useTableroDelNino.ts` y se prueba en `useTableroDelNino.test.ts`, `plantillaGeneral.test.ts` y `tableroSAAC.test.tsx`.
- **Dibujos de las carpetas de la plantilla** (del catálogo que ya viene, sin internet): Necesidades → agua, Emociones → feliz, Personas → mamá, Acciones → jugar, Objetos → libro. La docente los cambiará con el selector de T5. Si el navegador ya tenía la plantilla guardada sin dibujos, `sembrarTableros` los rellena sin pisar lo que ella haya elegido (`conImagenesDeCarpeta`).
- **Edición (T4a, hecho)** — la capa de datos del editor, sin pantalla todavía:
  - `edicionTablero.ts`: operaciones puras sobre un **conjunto** (un tablero principal y las carpetas que abre): agregar y quitar palabras, crear carpetas (al quitar una se quita su tablero), actualizar, mover una posición o a otro lugar, pasar una palabra a otra carpeta, renombrar y `volverAlElegir`. Las palabras núcleo solo existen en el principal y las carpetas no se anidan.
  - `gestionTableros.ts`: cargar lo que se edita (una plantilla o el tablero de un niño), guardar un cambio, crear/eliminar plantillas, asignar una plantilla a un niño, restablecer al niño y restablecer la plantilla general de fábrica. La general no se puede eliminar.
  - **Copia al primer cambio:** un niño sin copia ve una copia *virtual* de la general con los ids que tendrá al guardarse (`copia-<niño>-<id>`); no se escribe nada hasta su primera edición. Así la pantalla no pierde de vista ninguna celda cuando la copia se guarda, y editar a un niño nunca cambia la general ni a otros niños.
  - `api/tableros.ts` suma `guardarTableros` (en una transacción), `obtenerTableros`, `tablerosDeAlumno`, `borrarTablerosDeAlumno` y `usePlantillas`. `useConjuntoEditable` entrega lo editado siempre al día.
- **Editor del profesor (T4b, hecho):** el ítem «Tablero de comunicaciones» de la barra lateral abre una página propia (`/profesor/tablero`, `EditorTablero.tsx`). Arriba se elige qué editar: la plantilla general o el tablero de un niño. Debajo, una **vista previa editable** con la misma estructura que ve el niño: fila de palabras siempre a la vista, grilla y columna de carpetas. Cada tarjeta tiene botones para mover antes/después, editar y quitar; también se puede **arrastrar** (sobre otra palabra toma su lugar; sobre una carpeta, la palabra entra a ella). Hay botones «Agregar palabra», «Agregar palabra siempre a la vista» y «Agregar carpeta». Una carpeta se abre para editar lo que tiene dentro.
  - **Guardado al instante**, sin botón. Un aviso anuncia lo hecho y **«Deshacer»** revierte el último cambio (también al quitar una carpeta con contenido o restablecer a un niño). Un niño sin tablero propio recibe su copia en su primer cambio; «Restablecer a la plantilla» se la quita.
  - **Agregar o editar:** se escribe la palabra, opcionalmente lo que dice el tablero si es distinto, la categoría (define el color) y el dibujo. El selector (`SelectorPictograma.tsx`) busca mientras se escribe en el **catálogo de la app** y en **ARASAAC**; un dibujo de ARASAAC se guarda como pictograma propio (`arasaac-<id>`) apuntando a su URL. Foto propia, descarga para uso sin internet y crédito de ARASAAC siguen en T5.
  - **El niño ve y oye lo editado:** el tablero muestra el texto de la celda y dice `textoHablado` si existe; la grabación del pictograma solo se usa si se dice su misma palabra. Las palabras nuevas suenan con la voz del navegador hasta T6. `Pictograma.categoria` pasó a ser abierta (`string`).
  - **Plantillas, asignación y categorías (T4c, hecho):** el selector de arriba del editor lista todas las plantillas (la general primero) y los niños. Una barra de acciones cambia según lo que se edita:
  - **Plantilla:** «Nueva plantilla» (copia otra y pasa a editarla), «Cambiar nombre» y «Eliminar plantilla» (no se aplican a la general; al eliminar, los niños que la recibieron conservan su copia), «Asignar a niños» y, en la general, «Restablecer de fábrica».
  - **Niño:** «Cambiar de plantilla», y si ya tiene tablero propio, «Guardar como plantilla» y «Restablecer a la plantilla».
  - **Asignar** (`DialogoAsignar.tsx`): se elige una plantilla y uno o varios niños («Todos» incluido); cada niño recibe su propia copia. Avisa cuántos ya tenían tablero propio y se reemplazan. `asignarPlantillaAVarios` devuelve cómo deshacerlo y devuelve a cada niño a lo que tenía.
  - **Restablecer de fábrica** reconstruye la general con el catálogo base (`esDelCatalogoBase` deja fuera los dibujos `arasaac-*` y `foto-*` que la docente agregó, para que no aparezcan sueltos) y recupera las categorías de fábrica si las había borrado.
  - **Categorías** (`DialogoCategorias.tsx`, `edicionCategorias.ts`): crear, renombrar (al salir del campo), cambiar de color (paleta de 6, con nombre del color), ordenar y quitar. **No se puede quitar** una categoría en uso (se indica en cuántas celdas) ni la última.
  - Todo es **deshacible** salvo las categorías, que no son destructivas (lo que está en uso no se borra).
- **Teclado (T7, hecho):** un botón «Teclado» en la cabecera del tablero (junto a «Ayuda») abre un teclado QWERTY simple en lugar de la grilla; la fila de palabras de siempre y la burbuja se quedan, así dibujos y palabras escritas se mezclan en la misma frase. Lógica en `teclado.ts` (disposición, sonido de cada tecla, traducción del teclado físico), `useEscritura.ts` (lo que se va escribiendo) y `components/TecladoNino.tsx`.
  - Teclas: los números 0–9, las letras con la Ñ, **Espacio**, **Borrar** y **Enter**. Cada letra suena con **su sonido** (`public/audio/fonemas/<letra>.mp3`; la Ñ es `enie.mp3`) y cada número con su grabación.
  - **Espacio** pasa la palabra escrita a la frase y la dice entera (con su grabación si existe, si no con la voz del navegador). **Enter** dice toda la frase, incluida la palabra a medias. **Borrar** quita la última letra y, sin letras, la última palabra de la frase. Si el niño toca un dibujo con una palabra a medias, esa palabra queda antes del dibujo.
  - También se escribe con el teclado del computador mientras está abierto; el espacio no activa el botón que tenga el foco. **Escape** cierra primero el teclado y luego el tablero; la flecha de volver hace lo mismo. Una palabra tiene hasta 20 letras y la frase sigue siendo de 8 palabras.
  - **Privacidad:** lo escrito **no se guarda** en el seguimiento. El registro dice, por ejemplo, `Tablero: «quiero …» (teclado: 1 palabra)`, y los ids de pictograma no incluyen las palabras escritas.
- **Selector de dibujos completo (T5, hecho):** `SelectorPictograma.tsx` suma lo que faltaba de T4b.
  - **Foto propia:** botón «Subir una foto» (necesita la palabra escrita antes). La foto se **reduce a 400 px y se guarda como WebP** (`imagenes.ts`), lo que además **elimina sus metadatos** (ubicación, fecha, cámara) y respeta su orientación. Se guarda como pictograma `foto-<id>` con `esFotoReal`. Se rechaza lo que no es imagen y lo que pesa más de 10 MB. El selector advierte «No subas fotos de niños» (datos de menores mínimos). Las fotos ya subidas quedan en **«Mis fotos»** para reutilizarlas.
  - **Uso sin internet:** al elegir un dibujo de ARASAAC se **baja y se guarda en el navegador** (también WebP de 400 px) y el selector avisa «se verá también sin internet». Si no se pudo bajar, usa la dirección de internet y avisa que solo se verá con conexión. Un dibujo ya guardado se reutiliza sin volver a bajarlo. (No hay un plugin de PWA configurado; esto cubre el caso sin depender de él.)
  - **Atribución de ARASAAC (licencia CC BY-NC-SA):** se muestra el componente `Creditos` **junto a los dibujos de ARASAAC del selector y al pie de la página del editor**, además del login que ya lo tenía.
  - `esDelCatalogoBase` deja fuera `arasaac-*` y `foto-*` al restablecer la plantilla de fábrica.
- **Accesibilidad:** cada acción tiene un único control con nombre propio («Mover «agua» antes», «Quitar «agua»»…); el arrastre tiene su alternativa con botones; los avisos van en una región `aria-live`. «Probar el tablero» abre el tablero real.
- **Accesibilidad:** el tablero es un `role="dialog"`; el editor debe usarse solo con teclado; todo pictograma o imagen lleva texto alternativo; no depender solo del color para distinguir carpetas.

## Tareas propuestas

Todas dentro de **PLPA-109**, sin subtareas en Jira: las ramas y los commits usan siempre `PLPA-109` (por ejemplo `feature/PLPA-109-t1-boton-global`, `feat(PLPA-109): ...`). Cada tarea incluye sus tests (regla del proyecto).

| # | Tarea | Qué incluye | Depende de |
|---|---|---|---|
| T1 ✅ | **Botón global y estado del tablero** | Un solo botón en el encabezado visible en niño y docente; frase y estado de apertura en un store; quitar los botones sueltos. | — |
| T2 ✅ | **Modelo de datos y plantilla general como datos** | Tablas de tableros, celdas y categorías abiertas; migración de Dexie con test; plantilla general (con carpetas) cargada desde datos; el tablero lee de ahí. | — |
| T3 ✅ | **Tablero del niño con carpetas** | Celdas-carpeta, volver siempre visible, fila de palabras núcleo, regreso automático, nombre hablado de la carpeta. | T2 |
| T4 ✅ | **Editor del profesor** | Sección en el panel docente: crear/duplicar/editar/eliminar tableros y carpetas, celdas, categorías propias, reordenar (arrastrar y botones), asignar a cada niño, restablecer. | T2 |
| T5 ✅ | **Selector de pictogramas** | Escribir la palabra y elegir de ARASAAC o subir foto; descarga para uso sin internet; crédito de ARASAAC. | T4 |
| T6 | **Audio de palabras nuevas** | Generar el audio al guardar (`/audio`) con respaldo a la voz del navegador, sin datos de niños. | T4 |
| T7 ✅ | **Teclado** | Botón dentro del tablero; teclado QWERTY simple; sonido de cada letra; Enter dice lo escrito; mezcla con pictogramas; registro sin el texto. | T1 |
| T8 | **Sincronizar con el backend** | API y tablas en PostgreSQL para pasar los tableros del navegador al servidor. Posterior; se decide cuando se retome la conexión backend-frontend (PLPA-64). | T2 |

Orden sugerido (T1 a T4 ya hechas): **T1 y T2** primero (no dependen entre sí), luego T3, T4 y T7; después T5 y T6; T8 al final.

## Pendientes

- Los **nombres de las carpetas** (Necesidades, Emociones…) aún no tienen audio grabado: al tocar una carpeta suena la voz del navegador. Agregarlos al manifiesto de audios (`frontend/scripts/audios.manifest.json`) y generarlos con ElevenLabs.

- Definir **dónde se muestra el crédito de ARASAAC** (punto 9).
- Conseguir **capturas o un tablero de ejemplo de Asterics Grid** del cliente para ajustar el diseño visual.
- **Estado de la clave de ElevenLabs (2026-11-11):** la clave y el id de voz ya están configurados en `backend/.env` y `frontend/.env.local` (ambos ignorados por git). **La clave actual no tiene el permiso `text_to_speech`**, así que ElevenLabs responde 401 a cualquier generación. En ElevenLabs → *Developers → API keys* hay que activar **Text to Speech** para esa clave (o crear otra con ese permiso). Mientras tanto, el servidor usa Piper de respaldo y las letras suenan con la voz del navegador. La clave se compartió por chat: conviene **rotarla** una vez corregidos los permisos.
- **Faltan los sonidos de 21 letras** para el teclado. Ya hay grabación de las vocales (`a e i o u`) y de la **m** (`/m/`, hecha a mano), y de los números 0–9. Faltan en `frontend/public/audio/fonemas/`: `b c d f g h j k l n p q r s t v w x y z` y `enie` (Ñ). Mientras falten, la tecla suena con la **voz del navegador, que dice el nombre de la letra** («be»), no su sonido: es solo un respaldo.
  - **Cómo generarlos:** agregar cada uno al manifiesto (`frontend/scripts/audios.manifest.json`, `archivo: "fonemas/<letra>.mp3"`), correr `npm run audios -- --solo=fonemas` con `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID` en `frontend/.env.local`, y `npm run audios:indice`. No se agregaron al manifiesto antes porque una prueba exige que cada entrada tenga su archivo.
  - **Ojo pedagógico:** un TTS no dice bien una consonante suelta (`/p/` sale «pe»). Para las que se pueden alargar (`s f l n r j z v`) sirve un texto como «sss», «fff»; para las explosivas (`p t k b d g`) conviene que la profesora decida cómo se enseñan (con una vocal de apoyo, o grabarlas a mano, como la `m`). **Escuchar y revisar cada una** antes de dar el audio por bueno."
