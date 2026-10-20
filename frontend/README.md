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
