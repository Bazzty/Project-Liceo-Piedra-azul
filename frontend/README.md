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
features/   Funcionalidades: acceso, inicio, aprender, tablero, docente
shared/     ui/ (componentes base), components/, layouts/, config/, store/
styles/     Tokens de diseño por tema (theme.css); se consumen vía tailwind.config.js
```

Reglas: usar colores solo desde los tokens (`bg-brand`, `text-statusDanger`…), nunca de la paleta de Tailwind;
navegar con `ROUTES`; leer/escribir datos solo a través de `@/api`.
