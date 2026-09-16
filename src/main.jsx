import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'

const raiz = document.getElementById('root')
const arbol = (
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>
)

// En producción el HTML llega prerenderizado (scripts/prerender.mjs) y se
// hidrata; en `vite dev` el contenedor viene vacío y se monta desde cero.
if (raiz.hasChildNodes()) hydrateRoot(raiz, arbol)
else createRoot(raiz).render(arbol)
