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

## Pull requests
- Base: `develop`. `main` solo recibe merges desde `develop` al cerrar versión.
- Requieren 1 aprobación, rama actualizada y conversaciones resueltas.
- Revisores sugeridos por área en `.github/CODEOWNERS`.
- Usa la plantilla de PR e incluye el ticket (`PLPA-n`).

## Issues
Plantillas en `.github/ISSUE_TEMPLATE/` (historia, error).

## Seguridad
Secret scanning y push protection activos; Dependabot y CodeQL configurados en `.github/`. Nunca subas `.env` ni datos reales de estudiantes.
