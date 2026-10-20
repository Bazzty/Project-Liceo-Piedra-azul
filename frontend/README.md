# frontend

Aplicación web "Leer para Todos" (React 19 + TypeScript + Vite + Tailwind 3).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
npm run lint
```

- Alias de importación: `@/` apunta a `src/`.
- Tipos de dominio en `src/types/`.
- Prototipo: los datos viven en IndexedDB (Dexie) con datos de ejemplo; no hay backend.

## Estructura de `src/`

```
app/        App con la tabla de rutas, guardas por rol y constantes de rutas (routes.ts)
api/        Acceso a datos: funciones + hooks por recurso. Los componentes solo importan de aquí
mocks/      Datos de ejemplo del prototipo (seed). Se elimina al conectar el backend
db/         Esquema de IndexedDB (Dexie), solo lo usa api/ y mocks/
types/      Tipos de dominio (Alumno, Cuento, Progreso…)
features/   Funcionalidades: acceso, inicio, aprender, estrellas, tablero, docente
shared/     ui/ (componentes base), components/, layouts/, config/, store/
styles/     Tokens de diseño por tema (theme.css); se consumen vía tailwind.config.js
```

Paletas: `suave` (por defecto), `alto-contraste`, `calida` y `monocromatica`, más `admin` para el panel docente. Cada una cumple contraste AA; `--border-strong` (3:1) delimita controles. La ruta `/muestra` muestra todos los componentes para revisar cada paleta.

Espacio del estudiante (niños que aún no leen): imagen primero, voz al tocar y casi nada de texto.
Todas sus pantallas usan `shared/components/LayoutEstudiante` (barra con nombre, calma y ajustes, fondo con paisaje
y aviso amable de inactividad). Ajustes persistentes (sonido, movimiento, voz lenta, agenda "Primero – Después") en
`shared/store/useAjustesStore`. El osito (autoría del equipo; no agregar otros personajes ni fotos sin revisar
`docs/legal-y-privacidad.md`) tiene tres formas: `OsoBurbuja` (cabeza que habla al tocarla), `OsitoActor` (cuerpo entero:
llega caminando, saluda, reacciona y se va) y `OsitoAsoma` (se asoma por un borde). `OsoCabeza` es la cabeza animada
(parpadea, sigue el dedo y mueve la boca). Cualquier pantalla puede hacerlo reaccionar con
`useGuideStore.getState().reaccionar('feliz')`, o pedirlo en `LayoutEstudiante` con la prop `osito`.

Reglas: usar colores solo desde los tokens (`bg-brand`, `text-statusDanger`…), nunca de la paleta de Tailwind;
navegar con `ROUTES`; leer/escribir datos solo a través de `@/api`.
