import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // App.jsx exporta, además de componentes, los datos que necesita el
      // prerender (scripts/prerender.mjs). Editarlos recarga la página entera
      // en dev en vez de aplicar Fast Refresh; es un coste asumido.
      'react-refresh/only-export-components': ['error', {
        allowExportNames: ['ARTICULOS', 'ARTICULOS_OPCIONES', 'SITIO', 'RUTAS_ESTATICAS', 'cabeceraSSR'],
      }],
    },
  },
  {
    // Entrada del prerender: corre en Node durante el build, no en el navegador.
    files: ['src/entry-server.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
