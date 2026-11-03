#!/bin/sh
# Revisa el estilo (Pint) de los PHP que se van a commitear, dentro del contenedor app.
# Recibe rutas absolutas desde lint-staged y las pasa relativas a backend/.
set -e
raiz=$(git rev-parse --show-toplevel)

if ! docker compose -f "$raiz/docker-compose.yml" ps --status running --services 2>/dev/null | grep -qx app; then
  echo "⚠ Pint no se revisó: el contenedor app no está corriendo (make up). El CI lo revisará en el PR." >&2
  exit 0
fi

rutas=""
for f in "$@"; do rutas="$rutas ${f#"$raiz/backend/"}"; done
# shellcheck disable=SC2086
docker compose -f "$raiz/docker-compose.yml" exec -T app vendor/bin/pint --test $rutas
