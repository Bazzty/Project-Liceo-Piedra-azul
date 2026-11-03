#!/bin/sh
# Aplica la protección de main y develop desde proteccion-ramas.json (un ruleset de GitHub).
# Si el ruleset ya existe lo reemplaza; si no, lo crea. Así la configuración vive en el repo
# y cualquier cambio pasa por un PR.
#
#   sh scripts/github/proteccion.sh               # aplica
#   sh scripts/github/proteccion.sh --ver         # muestra lo que aplicaría, sin tocar nada
#   sh scripts/github/proteccion.sh --con-checks  # además exige ci-web y ci-api en verde
#
# --con-checks solo cuando los workflows ya estén en develop: un PR sin esos checks no se
# podría mergear.
set -eu
dir=$(dirname "$0")
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)

config=$(cat "$dir/proteccion-ramas.json")
case "${1:-}" in
  --con-checks) config=$(echo "$config" | jq --slurpfile c "$dir/checks-requeridos.json" '.rules += $c') ;;
esac

if [ "${1:-}" = "--ver" ]; then echo "$config" | jq .; exit 0; fi

nombre=$(echo "$config" | jq -r .name)
id=$(gh api "repos/$repo/rulesets" -q ".[] | select(.name == \"$nombre\") | .id")
if [ -n "$id" ]; then
  echo "$config" | gh api --method PUT "repos/$repo/rulesets/$id" --input - >/dev/null
  echo "Ruleset «${nombre}» actualizado ($id)."
else
  echo "$config" | gh api --method POST "repos/$repo/rulesets" --input - >/dev/null
  echo "Ruleset «${nombre}» creado."
fi
