# Contribuir

## Ramas
- `main`: reservada para versiones estables. No se commitea directo.
- `develop`: integración. Toda feature entra por PR.
- `prototipo`: prototipo de muestra, archivado. Su contenido ya está en `develop` (PLPA-67); queda solo como referencia histórica.
- `feature/PLPA-n-descripcion`, `fix/PLPA-n-descripcion`: ramas de trabajo, salen de `develop`.

## Commits
Conventional Commits con la clave Jira: `feat(PLPA-n): descripción`.
Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

## Clave Jira obligatoria
Un hook (`commit-msg`, commitlint) rechaza commits sin clave: `feat: algo` falla, `feat(PLPA-12): algo` pasa. Se instala con `npm install` en la raíz.

## Revisión antes de cada commit (pre-commit)
Con `npm install` en la raíz, husky instala dos hooks:

- `pre-commit` (lint-staged, solo sobre lo que está en stage):
  - frontend: ESLint (incluye accesibilidad con jsx-a11y) y los tests de Vitest relacionados con los archivos cambiados;
  - backend: Pint dentro del contenedor `app`. Si Docker no está corriendo avisa y lo deja para el CI.
- `commit-msg`: commitlint exige la clave Jira.

Tipos, la suite completa y el build los corre el CI en cada PR. Saltarse los hooks (`--no-verify`) solo en emergencias: el CI va a fallar igual.

## Pull requests
- Base: `develop`. `main` solo recibe merges desde `develop` al cerrar versión.
- Requieren 1 aprobación, rama actualizada y conversaciones resueltas.
- Revisores sugeridos por área en `.github/CODEOWNERS`.
- Usa la plantilla de PR e incluye el ticket (`PLPA-n`).

## Issues
Plantillas en `.github/ISSUE_TEMPLATE/` (historia, error).

## Seguridad
Secret scanning y push protection activos; Dependabot y CodeQL configurados en `.github/`. Nunca subas `.env` ni datos reales de estudiantes.
