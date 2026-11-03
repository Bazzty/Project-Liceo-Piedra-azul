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
- Requieren 1 aprobación y conversaciones resueltas; se mergean con squash. La regla está en `scripts/github/proteccion-ramas.json`.
- Revisores sugeridos por área en `.github/CODEOWNERS`.
- Usa la plantilla de PR e incluye el ticket (`PLPA-n`).

## Definition of Done
Una historia pasa a **Listo** en Jira solo cuando:

1. **Tiene sus tests** y pasan: Pest para el backend (`backend/tests/`), Vitest junto al código del frontend (`*.test.ts(x)`) y Playwright (`frontend/e2e/`) si cambia un flujo completo. Una historia de configuración prueba que la configuración funciona (por ejemplo, que el hook bloquea un commit malo).
2. **El CI está en verde** (`ci-web`, `ci-api`, CodeQL) y el PR tiene 1 aprobación.
3. **Es accesible** (WCAG 2.1 AA): sin errores de jsx-a11y ni de axe, se usa con teclado y toda imagen o pictograma lleva texto alternativo.
4. **Cuida los datos**: sin secretos ni datos reales de estudiantes; datos de menores mínimos.
5. **Está documentada** si cambia cómo se instala, se usa o se decide algo (README, `docs/`).
6. Está **mergeada en `develop`**.

Sin tests no se cierra, aunque funcione: se deja en revisión con un comentario de qué falta.

## GitHub CLI (gh)

### Instalar y entrar (una vez por equipo)
- macOS: `brew install gh` · Windows: `winget install --id GitHub.cli` (y Git Bash para los alias con `!`).
- `gh auth login` → GitHub.com → HTTPS → navegador. Revisar con `gh auth status`.
- Cargar los alias del equipo: `sh scripts/github/alias.sh`.

### Flujo diario de un PR
```bash
gh rama 33 stack-web            # feature/PLPA-33-stack-web desde develop al día
# … commits feat(PLPA-33): …
git push -u origin HEAD
gh pr-nuevo                     # PR a develop con el último commit como título; completar la plantilla
gh checks                       # espera los checks del PR (ci-web, ci-api, CodeQL)
```
Para revisar el de otra persona:
```bash
gh por-revisar                  # PRs donde te pidieron revisión
gh revisar 15                   # trae la rama del PR 15 y muestra el diff; probar con make test
gh aprobar 15                   # o: gh pr review 15 --request-changes -b "qué falta"
gh mergear 15                   # squash (el único permitido) y borra la rama
```

### Seguir el CI desde la terminal
- `gh ci` (`gh run watch`): elige una ejecución en curso y la sigue hasta que termina.
- `gh ci-fallo <id>` (`gh run view --log-failed`): muestra solo el log de los pasos que fallaron.
- `gh run list --branch "$(git branch --show-current)"` lista las ejecuciones de tu rama.

### Secretos de Actions
Nunca en el repo, en `.env` subidos ni en el chat. Se cargan con `sh scripts/github/secreto.sh NOMBRE`: pide el valor oculto y se lo pasa a `gh secret set` por la entrada estándar (no queda en el historial). `gh secret list` muestra los nombres, nunca los valores. Hoy el CI no necesita ninguno: la base de pruebas es un contenedor efímero. La clave de ElevenLabs vive solo en el servidor, no en Actions.

### Alias del equipo (`scripts/github/alias.sh`)
| Alias | Hace |
|---|---|
| `gh rama <n> <desc>` | `develop` al día y rama `feature/PLPA-n-desc` |
| `gh pr-nuevo` | `gh pr create --base develop --fill --assignee @me` |
| `gh mios` / `gh por-revisar` | tus PRs / los que esperan tu revisión |
| `gh revisar <n>` | `gh pr checkout` + `gh pr diff` |
| `gh aprobar <n>` | `gh pr review --approve` |
| `gh mergear <n>` | `gh pr merge --squash --delete-branch` |
| `gh checks` | `gh pr checks --watch` |
| `gh ci` / `gh ci-fallo <id>` | `gh run watch` / `gh run view --log-failed` |

### Configuración del repositorio, versionada
- `sh scripts/github/etiquetas-y-milestones.sh`: etiquetas `fase-n` (las mismas de Jira), `func-*`, `web`/`api`/`db` y milestones S1 a S4.
- `sh scripts/github/proteccion.sh`: protección de `main` y `develop` (ruleset en `proteccion-ramas.json`). `--ver` muestra lo que aplicaría; `--con-checks` además exige `ci-web` y `ci-api` en verde (usarlo cuando esos workflows ya estén en `develop`).

Los scripts se pueden correr varias veces: actualizan, no duplican. Cambiarlos pasa por PR, como el código.

## Issues
Plantillas en `.github/ISSUE_TEMPLATE/` (historia, error).

## Seguridad
Secret scanning y push protection activos; Dependabot y CodeQL configurados en `.github/`. Nunca subas `.env` ni datos reales de estudiantes.
