import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Accesibilidad (WCAG 2.1 AA): texto alternativo, roles válidos, foco, etc.
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Las etiquetas envuelven su texto en <span> anidados (título + descripción): se busca más hondo.
      'jsx-a11y/label-has-associated-control': ['error', { depth: 3 }],
    },
  },
  {
    // Capas: app/ arma las features; features/ usan shared/; shared/ no conoce a nadie de arriba.
    // La excepción es @/app/routes: el mapa de rutas es una constante que todos pueden usar.
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/features/*', '@/app/App', '@/app/guards', '@/app/layouts/*'],
          message: 'shared/ no puede depender de features/ ni de app/: mueve lo común a shared/.',
        }],
      }],
    },
  },
])
