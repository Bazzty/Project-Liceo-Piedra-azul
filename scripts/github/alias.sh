#!/bin/sh
# Alias de gh comunes al equipo (se guardan en la configuración de gh de cada equipo, no en el repo).
# Uso: sh scripts/github/alias.sh   — se puede repetir: actualiza los que ya existan.
# En Windows, los que empiezan con «!» necesitan Git Bash (gh los corre con sh).
set -eu
alias_gh() { gh alias set --clobber "$1" "$2" >/dev/null && echo "  gh $1"; }

echo "Alias del equipo:"
# Rama nueva desde develop al día:  gh rama 33 stack-web  →  feature/PLPA-33-stack-web
alias_gh rama '!git switch develop && git pull --ff-only && git switch -c "feature/PLPA-$1-$2"'
# PR hacia develop con el título y cuerpo del último commit, asignado a quien lo abre.
alias_gh pr-nuevo 'pr create --base develop --fill --assignee @me'
alias_gh mios 'pr list --author @me'
alias_gh por-revisar 'pr list --search "review-requested:@me"'
# Traer el PR de otro para probarlo y ver su diff:  gh revisar 15
alias_gh revisar '!gh pr checkout "$1" && gh pr diff "$1"'
alias_gh aprobar 'pr review --approve'
# El repositorio solo permite squash.
alias_gh mergear 'pr merge --squash --delete-branch'
# CI desde la terminal.
alias_gh checks 'pr checks --watch'
alias_gh ci 'run watch'
alias_gh ci-fallo 'run view --log-failed'
