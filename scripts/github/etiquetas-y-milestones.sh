#!/bin/sh
# Crea o actualiza las etiquetas y los milestones del repositorio. Se puede correr las veces que
# sea: lo que ya existe se actualiza, no se duplica. Uso: sh scripts/github/etiquetas-y-milestones.sh
set -eu
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)

etiqueta() { gh label create "$1" --color "$2" --description "$3" --force --repo "$repo" >/dev/null && echo "  etiqueta $1"; }

echo "Fases (las mismas etiquetas que usan las historias en Jira):"
etiqueta fase-0  c5def5 "F0 · Organización del proyecto"
etiqueta fase-1  c5def5 "F1 · Prototipo"
etiqueta fase-2  c5def5 "F2 · Preparación de entorno"
etiqueta fase-3  c5def5 "F3 · Instalación de tecnologías"
etiqueta fase-4  c5def5 "F4 · Pruebas unitarias"
etiqueta fase-5  c5def5 "F5 · GitHub CLI"
etiqueta fase-ds c5def5 "DS · Sistema de diseño"
etiqueta fase-6  c5def5 "F6 · Base de datos"
etiqueta fase-7  c5def5 "F7 · Backend"
etiqueta fase-8  c5def5 "F8 · Frontend"
etiqueta fase-9  c5def5 "F9 · QA"
etiqueta fase-10 c5def5 "F10 · Aplicación final"

echo "Funcionalidades (qué parte de la app toca):"
etiqueta func-acceso        bfe5bf "Ingreso con tarjeta, login docente, sesión de aula"
etiqueta func-lectura       bfe5bf "Lector dual: texto, pictograma y voz"
etiqueta func-actividades   bfe5bf "Juegos y actividades después de leer"
etiqueta func-tablero       bfe5bf "Tablero de comunicación SAAC"
etiqueta func-pictogramas   bfe5bf "ARASAAC y pictogramas propios"
etiqueta func-voz           bfe5bf "Audios: ElevenLabs y Piper"
etiqueta func-panel-docente bfe5bf "Estudiantes, tareas, avance e informes"
etiqueta func-accesibilidad bfe5bf "WCAG 2.1 AA, temas de bajo estímulo, teclado"

echo "Áreas (igual que en Jira):"
etiqueta web d4c5f9 "Frontend (React)"
etiqueta api d4c5f9 "Backend (Laravel)"
etiqueta db  d4c5f9 "Base de datos (PostgreSQL)"

# Fechas sacadas de los vencimientos de las historias en Jira; el piloto va del 16 al 29 de noviembre.
milestone() {
  numero=$(gh api "repos/$repo/milestones?state=all&per_page=100" -q ".[] | select(.title == \"$1\") | .number")
  if [ -n "$numero" ]; then
    gh api --method PATCH "repos/$repo/milestones/$numero" -f title="$1" -f due_on="$2T23:59:00Z" -f description="$3" >/dev/null
  else
    gh api --method POST "repos/$repo/milestones" -f title="$1" -f due_on="$2T23:59:00Z" -f description="$3" >/dev/null
  fi
  echo "  milestone $1 (vence $2)"
}

echo "Milestones:"
milestone "S1" 2026-11-01 "Organización, prototipo y base del frontend (fases 0 y 1)"
milestone "S2" 2026-11-08 "Entorno, tecnologías, pruebas, GitHub CLI, sistema de diseño y base de datos (fases 2 a 6)"
milestone "S3" 2026-11-15 "Backend y frontend conectados (fases 7 y 8)"
milestone "S4" 2026-11-29 "QA, versión 1.0 y piloto en el liceo (fases 9 y 10)"
