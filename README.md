# 📚 Leer para Todos — Espacio Digital de Fomento Lector Inclusivo

[![Licencia](https://img.shields.io/badge/Licencia-Educativa-blue.svg)]()
[![PWA](https://img.shields.io/badge/PWA-Offline--First-green.svg)]()
[![WCAG 2.1 AA](https://img.shields.io/badge/Accesibilidad-WCAG%202.1%20AA-orange.svg)]()

**Proyecto de Vinculación con el Medio**  
* **Institución:** Universidad San Sebastián (Sede De la Patagonia, Puerto Montt)
* **Socio Comunitario:** Liceo Piedra Azul (Puerto Montt)
* **Carreras:** Ingeniería Civil Informática · Pedagogía Diferencial Advance · Ingeniería Civil Industrial Advance

---

## 🎯 Propósito del Proyecto

**"Leer para Todos"** es una aplicación web progresiva (PWA) de fomento lector adaptada con Sistemas Aumentativos y Alternativos de Comunicación (SAAC). Diseñada para niños y niñas de Prekínder y Kínder con Necesidades Educativas Especiales (NEE) y Trastorno del Espectro Autista (TEA). 

---

## 🛠️ Stack Tecnológico & Estrategia de Recursos

### Frontend (`/web`)

* **Core:** React 18 + TypeScript + Vite
* **Estilos & Accesibilidad:** Tailwind CSS (Bajo estímulo visual / Ley TEA 21.545) + Lucide Icons
* **Modo Offline & PWA:** `vite-plugin-pwa` + Workbox
* **Base de Datos Local:** Dexie.js (IndexedDB) para cuentos y progreso offline
* **Gestión de Estado:** Zustand (Estado UI) + TanStack Query (API)

### 🎙️ Estrategia de IA de Voces

1. **ElevenLabs (Pre-generación $0 CLP):** Generación de audios `.mp3` con entonación cálida en español chileno nativo y clonación de voz de la educadora del liceo mediante rotación de cuentas gratuitas (alojados en `/public/audio/`).
2. **Respaldo Técnico:**
   * **MediaRecorder API:** Módulo para que la educadora grabe audios directamente con el micrófono de su PC.
   * **Microsoft Edge Neural Voices (`edge-tts`):** Generación complementaria con voz chilena `es-CL-CatalinaNeural`.

### 🖼️ Catálogo de Pictogramas e Imágenes Reales

* **ARASAAC:** Catálogo oficial en formato vectorial/PNG para asociación palabra-imagen.
* **Fotografías Reales:** Función "Cargar Foto Real" en el módulo docente para personalizar elementos cotidianos del Liceo Piedra Azul (ej. fachada del liceo, foto de la profesora o del entorno rural).

## 📁 Estructura del Proyecto

```text
Project-Liceo-Piedra-azul/
├── README.md                      # Documentación general del proyecto
├── .gitignore                     # Archivos ignorados por Git
├── api/                           # Espacio reservado para el Backend (Laravel / Supabase API)
└── web/                           # Aplicación Frontend (React + TypeScript + Vite + PWA)
    ├── public/                    # Archivos estáticos y recursos locales (Modo Offline)
    │   ├── favicon.ico
    │   ├── manifest.webmanifest   # Configuración PWA (Nombre, colores, íconos)
    │   ├── icons/                 # Íconos PWA (192x192, 512x512)
    │   ├── audio/                 # Audios pre-generados (.mp3 - ElevenLabs / Voces)
    │   │   ├── vocales/           # Audios de vocales y consonantes iniciales
    │   │   ├── palabras/          # Audios de palabras funcionales y pictogramas
    │   │   └── sistema/           # Audios de bienvenida, instrucciones y refuerzo positivo
    │   └── pictogramas/           # Catálogo gráfico de comunicación aumentativa
    │       ├── arasaac/           # Pictogramas vectoriales y PNG de ARASAAC
    │       └── fotos_reales/      # Fotografías reales del entorno (Liceo Piedra Azul, docentes)
    ├── src/                       # Código fuente de la aplicación React
    │   ├── assets/                # Imágenes estáticas, logotipos e ilustraciones
    │   ├── components/            # Componentes reutilizables de la interfaz
    │   │   ├── common/            # Botones, tarjetas y modales accesibles (Radix UI)
    │   │   ├── lectura/           # Lector Dual (Texto + Pictogramas + TTS)
    │   │   ├── tablero/           # Tablero de comunicación aumentativa (SAAC)
    │   │   └── ui/                # Controles de paletas de bajo estímulo visual (Ley TEA)
    │   ├── db/                    # Base de datos local IndexedDB (Dexie.js para modo offline)
    │   ├── hooks/                 # Custom Hooks (Audio, sintetizador TTS, estado de red)
    │   ├── pages/                 # Vistas principales de la aplicación
    │   │   ├── MosaicoAlumnos.tsx # Selección de perfil por avatar/foto (Modo Aula)
    │   │   ├── CatalogoCuentos.tsx# Repositorio de lecturas adaptadas
    │   │   ├── LecturaView.tsx    # Pantalla interactiva de lectura asistida
    │   │   └── AdminDocente.tsx   # Panel de gestión, carga de recursos y fotos reales
    │   ├── services/              # Cliente API y consultas (TanStack Query)
    │   ├── store/                 # Estado global con Zustand (Perfil, Paleta cromática, Progreso)
    │   ├── styles/                # Configuración de estilos y directivas de Tailwind CSS
    │   ├── App.tsx                # Enrutamiento y contenedor principal
    │   ├── main.tsx               # Punto de entrada de React
    │   ├── index.css              # Estilos globales y Tailwind CSS
    │   └── sw.ts                  # Service Worker personalizado para caché PWA
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

2. **Instalar dependencias e iniciar en modo desarrollo:**
   ```bash
   cd web
   npm install
   npm run dev
   ```
   *Acceder a [http://localhost:5173](http://localhost:5173).*

3. **Probar la PWA y compilación:**
   ```bash
   npm run build
   npm run preview
   ```

