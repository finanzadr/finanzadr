// Entrada del prerender (scripts/prerender.mjs). No se sirve en producción:
// se compila con `vite build --ssr` y se ejecuta una vez por ruta en el build
// para escribir dist/<ruta>/index.html con el HTML real de la página.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { Rutas, cabeceraSSR } from "./App.jsx";

// Datos que el prerender necesita para saber qué rutas escribir.
export { RUTAS_ESTATICAS, ARTICULOS, ARTICULOS_OPCIONES, SITIO } from "./App.jsx";

export function render(url) {
  cabeceraSSR.activo = true;
  cabeceraSSR.meta = null;
  cabeceraSSR.jsonLd = [];
  try {
    const html = renderToString(
      <StrictMode>
        <StaticRouter location={url}>
          <Rutas />
        </StaticRouter>
      </StrictMode>
    );
    return { html, meta: cabeceraSSR.meta, jsonLd: cabeceraSSR.jsonLd };
  } finally {
    cabeceraSSR.activo = false;
  }
}
