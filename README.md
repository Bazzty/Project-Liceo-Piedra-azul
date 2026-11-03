# 📚 Leer para Todos — Espacio Digital de Fomento Lector Inclusivo

[![Licencia](https://img.shields.io/badge/Licencia-Educativa-blue.svg)]()
[![PWA](https://img.shields.io/badge/PWA-Offline--First-green.svg)]()
[![WCAG 2.1 AA](https://img.shields.io/badge/Accesibilidad-WCAG%202.1%20AA-orange.svg)]()

> **Ramas:** `main` (estable, vacía por ahora) · `develop` (integración; incluye el frontend del prototipo) · `prototipo` (archivada, solo referencia). Ver [CONTRIBUTING.md](CONTRIBUTING.md).

**Proyecto de Vinculación con el Medio**  
* **Institución:** Universidad San Sebastián (Sede De la Patagonia, Puerto Montt)
* **Socio Comunitario:** Liceo Piedra Azul (Puerto Montt)
* **Carreras:** Ingeniería Civil Informática · Pedagogía Diferencial Advance · Ingeniería Civil Industrial Advance

---

## 🎯 Propósito del Proyecto

**"Leer para Todos"** es una aplicación web progresiva (PWA) de fomento lector adaptada con Sistemas Aumentativos y Alternativos de Comunicación (SAAC). Diseñada para niños y niñas de Prekínder y Kínder con Necesidades Educativas Especiales (NEE) y Trastorno del Espectro Autista (TEA). 

---

## 🛠️ Stack Tecnológico & Estrategia de Recursos

### Frontend (`/frontend`)

* **Core:** React 19 + TypeScript + Vite
* **Estilos & Accesibilidad:** Tailwind CSS (Bajo estímulo visual / Ley TEA 21.545) + Lucide Icons
* **Modo Offline & PWA:** `vite-plugin-pwa` + Workbox
* **Base de Datos Local:** Dexie.js (IndexedDB) para cuentos y progreso offline
* **Gestión de Estado:** Zustand (Estado UI) + TanStack Query (API)

### 🎙️ Voz (texto a voz)

1. **ElevenLabs (API, voz principal):** el backend genera un `.mp3` por página o ítem con una voz única en español, mediante un job en cola en el worker. La clave de la API vive solo en el servidor. La docente no graba audios.
2. **Piper (local, $0, respaldo):** si la API falla o se alcanza el tope mensual de caracteres, el worker genera el audio con Piper; cuando vuelve la cuota, se regenera con ElevenLabs. El driver se elige con `TTS_DRIVER`. Viene instalado en la imagen de Docker (Piper 1.8.0, voz `es_MX-claude-high`, MP3 con `lame`); para probarlo: `docker compose exec worker sh -c 'echo Hola | $PIPER_BINARIO -m $PIPER_VOZ -f /tmp/hola.wav'`.
3. **Último recurso:** `speechSynthesis` del navegador si falta el audio.

### 🖼️ Catálogo de Pictogramas e Imágenes Reales

* **ARASAAC:** Catálogo oficial en formato vectorial/PNG para asociación palabra-imagen.
* **Fotografías Reales:** Función "Cargar Foto Real" en el módulo docente para personalizar elementos cotidianos del Liceo Piedra Azul (ej. fachada del liceo, foto de la profesora o del entorno rural).

## 📁 Estructura del Proyecto

```text
Project-Liceo-Piedra-azul/
├── README.md                      # Documentación general del proyecto
├── .gitignore                     # Archivos ignorados por Git
├── backend/                       # Backend (Laravel 12, API /api/v1)
└── frontend/                      # Aplicación Frontend (React + TypeScript + Vite + PWA)
    ├── public/                    # Archivos estáticos y recursos locales (Modo Offline)
    │   ├── favicon.ico
    │   ├── manifest.webmanifest   # Configuración PWA (Nombre, colores, íconos)
    │   ├── icons/                 # Íconos PWA (192x192, 512x512)
    │   ├── audio/                 # Audios pre-generados (.mp3 - ElevenLabs / Piper)
    │   │   ├── vocales/           # Audios de vocales y consonantes iniciales
    │   │   ├── palabras/          # Audios de palabras funcionales y pictogramas
    │   │   └── sistema/           # Audios de bienvenida, instrucciones y refuerzo positivo
    │   └── pictogramas/           # Catálogo gráfico de comunicación aumentativa
    │       ├── arasaac/           # Pictogramas vectoriales y PNG de ARASAAC
    │       └── fotos_reales/      # Fotografías reales del entorno (Liceo Piedra Azul, docentes)
    ├── src/                       # Código fuente (capas: app → features → shared)
    │   ├── app/                   # Rutas (routes.ts), guardias de acceso y layouts que arman las features
    │   ├── features/              # Una carpeta por área: acceso, aprender, docente, tablero, tareas, estrellas…
    │   │   └── <feature>/         # pages/ y components/ propios de esa área
    │   ├── shared/                # Lo común: ui/ (botón, modal…), components/, hooks/, store/ (Zustand), audio/
    │   ├── api/                   # Cliente de datos por recurso (hoy sobre mocks; luego /api/v1)
    │   ├── db/                    # Caché local IndexedDB (Dexie)
    │   ├── mocks/                 # Datos ficticios del prototipo
    │   ├── styles/                # Temas de bajo estímulo y estilos de lectura
    │   ├── test/                  # Setup de Vitest y Testing Library
    │   └── main.tsx               # Punto de entrada de React
    ├── e2e/                       # Pruebas de punta a punta con Playwright (+ revisión WCAG con axe)
    ├── index.html                 # Plantilla HTML base
    ├── package.json               # Dependencias y scripts de Node.js
    ├── postcss.config.js          # Configuración de PostCSS
    ├── tailwind.config.js         # Configuración de Tailwind CSS (Paleta bajo estímulo Ley TEA)
    ├── tsconfig.json              # Configuración de TypeScript
    └── vite.config.ts             # Configuración de Vite y vite-plugin-pwa
```


---

# ⚡ Guía de Inicio Rápido

1. **Clonar repositorio y cambiar a la rama develop:**
   ```bash
   git clone https://github.com/Bazzty/Project-Liceo-Piedra-azul.git
   cd Project-Liceo-Piedra-azul
   git checkout develop
   ```

2. **Instalar los hooks de commit (en la raíz, valida `feat(PLPA-n): ...`):**
   ```bash
   npm install
   ```

3. **Levantar el entorno con Docker (solo necesitas Docker; en Windows, WSL2 con el proyecto dentro de WSL):**
   ```bash
   make setup   # la primera vez: construye la imagen, instala dependencias, genera la clave y crea las tablas
   make up      # los días siguientes
   ```
   | Servicio | Contenedor | Dirección |
   |---|---|---|
   | Web (Vite, React) | `liceo-web` | [http://localhost:5173](http://localhost:5173) |
   | API (Nginx + PHP-FPM) | `liceo-nginx`, `liceo-php` | [http://localhost:8000](http://localhost:8000) |
   | PostgreSQL | `liceo-db` | `localhost:5432` |

   Además corre un `worker` (`liceo-worker`) para la cola de trabajos. Otros comandos: `make shell` (terminal de PHP), `make logs s=worker`, `make psql`, `make down`. Si ya usas el puerto 8000 o 5173, cámbialo en `.env` (`WEB_PORT`, `VITE_PORT`).

   *Solo el frontend, sin Docker:* `cd frontend && npm install && npm run dev`.

   **Generar el audio de un cuento (API de voz).** El servidor crea un MP3 por página: ElevenLabs si está configurado y, si no responde, Piper (local). Un mismo texto no se genera dos veces.
   1. En `backend/.env` (nunca en git ni en el chat): `ELEVENLABS_API_KEY=` y `ELEVENLABS_VOICE_ID=`. Sin ellos se usa Piper. `TTS_DRIVER=piper` fuerza solo la voz local.
   2. Crea la docente de demostración: `docker compose exec --user www-data app php artisan db:seed --class=DocenteDemoSeeder` (su contraseña sale de `DEMO_DOCENTE_CLAVE` en `backend/.env`; si falta, el comando muestra una).
   3. Para el botón «Usar cuenta de demostración», copia esa contraseña en `frontend/.env.local` (`VITE_DEMO_CORREO`, `VITE_DEMO_CLAVE`; ver `frontend/.env.example`). Sin eso, ingresa escribiendo el correo y la contraseña.
   4. Panel docente → Cuentos → escribe el texto → **Generar audio** → guarda. El lector del niño lo reproduce.

4. **Probar la PWA y compilación:**
   ```bash
   npm run build
   npm run preview
   ```

---

# 🔀 Flujo de Trabajo

1. Crea tu rama desde `develop`: `feature/PLPA-n-descripcion` o `fix/PLPA-n-descripcion`.
2. Haz commits con la clave Jira: `feat(PLPA-n): descripción`. Un hook los valida; sin clave el commit falla.
3. Sube tu rama con `git push` y abre un Pull Request hacia `develop`.
4. El responsable del repositorio revisa y hace el merge con **Squash**: queda un commit por ticket.

`main` y `develop` están protegidas: no se hace push directo ni se mergea sin PR. Solo el responsable del repositorio puede mergear. Detalle de ramas y commits en [CONTRIBUTING.md](CONTRIBUTING.md).

> **Si ya clonaste el repositorio:** tras `git pull origin develop`, corre `npm install` en la raíz para activar el hook de commits.
