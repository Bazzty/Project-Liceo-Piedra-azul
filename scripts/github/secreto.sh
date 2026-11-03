#!/bin/sh
# Carga un secreto de GitHub Actions sin que quede en el repo, en el historial de la terminal
# ni en la lista de procesos: el valor se pide oculto y va a gh por la entrada estándar.
#   sh scripts/github/secreto.sh NOMBRE_DEL_SECRETO
set -eu
[ $# -eq 1 ] || { echo "Uso: sh scripts/github/secreto.sh NOMBRE_DEL_SECRETO" >&2; exit 1; }

printf 'Valor de %s (no se muestra): ' "$1"
stty -echo; IFS= read -r valor; stty echo; echo
[ -n "$valor" ] || { echo "Vacío: no se guardó nada." >&2; exit 1; }

printf '%s' "$valor" | gh secret set "$1"
echo "Secreto $1 guardado en GitHub Actions."
