# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build (vite build). **Always run this after editing `src/App.jsx`** — the file is dense (single line per component, minimal formatting) and unbalanced JSX/parens are easy to introduce and easy to miss visually. `vite build` (rolldown) catches syntax errors that the dev server may not surface clearly.
- `npm run preview` — preview the production build
- `npm run lint` — ESLint (flat config in `eslint.config.js`, `dist/` ignored)

No test suite exists in this repo.

## Architecture

This is a single-page marketing/tool site for FinanzaDR ("Wall Street en tu idioma" — investing education for Latin American/Dominican audience), built with Vite + React 19 + React Router (`react-router-dom`, `BrowserRouter`).

**Almost the entire app lives in one file: `src/App.jsx`.** There is no `src/components/` or `src/pages/` directory — route page components are plain functions defined in the same file, a deliberate choice to keep the single-file convention rather than splitting into per-route files. The default export `FinanzasDR` (rendered as `App` from `main.jsx`) just wires up `<BrowserRouter><Routes>...</Routes></BrowserRouter>`:
- A single parent `<Route element={<Layout />}>` wraps every page. `Layout` renders the market ticker bar, header, nav, footer, and `<main><Outlet /></main>` — it owns all state shared across pages (`stocks`, `dark`, `noticias`, `lastUpdate`, etc.) with `useState`/`useEffect`, no external state library, and passes it down via `<Outlet context={...}>`.
- Child routes are plain function components (`InicioPage`, `MercadosPage`, `HeatmapPage`, `SentimientoPage`, `NoticiasPage`, `AprendePage`, `BrokersPage`, `CalculadoraPage`, `CompartirPage`, `NewsletterPage`, `PrivacidadPage`, `TerminosPage`, `AvisoPage`, `NotFoundPage`). Anything that needs shared state or the current theme calls `useOutletContext()` — this works for any descendant of `<Outlet>`, not just the direct route element, so presentational helpers (`SectionTitle`, `Label`, `StockCard`, `BrokerCard`) and self-contained feature components (`SentimientoMercado`, `CompoundCalc`, `TradingViewCharts`, `SnapshotCard`, `NewsletterForm`) call it too instead of receiving props.
- Only 8 of the 13 routes appear in the nav bar (`NAV_ITEMS`, rendered with `NavLink` so the active route is highlighted automatically): `/`, `/mercados`, `/heatmap`, `/sentimiento`, `/noticias`, `/aprende`, `/brokers`, `/calculadora`. `/compartir` and `/newsletter` are reachable only via buttons in the footer; `/privacidad`, `/terminos`, `/aviso` only via the small legal links in the fixed bottom bar. A catch-all `*` route renders a 404 page.
- Mercados has an internal "Ver Cards" / "Ver Charts" toggle (`mercadosView`) that is **local component state, not a nested route** — links that want to land directly on the charts view do so via a `?view=charts` query param that only seeds the initial state; the toggle itself doesn't sync back to the URL after that.
- Theme: `C` (the `DARK`/`LIGHT` color object) is a plain `const` computed inside `Layout` from the `dark` boolean and passed through the same Outlet context. It is **not** a mutated module-level variable — an earlier version of this codebase did that (`let C = {...}; C = dark ? DARK : LIGHT` reassigned at the top of the one big component's render), which only worked because everything rendered synchronously in one tree; it was replaced when routing was introduced since that assumption no longer holds once pages are independent route components.

**Styling is all inline JS style objects** — there are no CSS Modules and effectively no component-scoped CSS. `src/index.css` (loaded via `main.jsx`) only provides global resets/fonts from the original Vite template. `src/App.css` exists but is **not imported anywhere** and is dead leftover from the create-vite template — don't assume it applies. Animations/keyframes and a handful of hover/media-query rules that can't be done as inline styles are injected into `document.head` at runtime inside a `useEffect` in `Layout`.

**External data sources**, all called directly from the browser with `fetch` (no backend/API layer):
- Finnhub (`FINNHUB_KEY` hardcoded near the top of `App.jsx`) for stock quotes (`/quote`, polled every 60s) and market news (`/news`).
- `api.alternative.me/fng` for the crypto Fear & Greed index — labeled "Sentimiento Cripto" in the UI on purpose, since it measures crypto market sentiment, not the traditional stock market.
- MailerLite form endpoint (hardcoded form ID) for newsletter signups.
- TradingView's `tv.js` widget script (Charts en Vivo, nested inside Mercados) and TradingView's `embed-widget-stock-heatmap.js` script (Heat Map page), both injected dynamically.

**`FinanzasDR.jsx` at the repo root is a stray duplicate/backup** — it is not imported by `main.jsx` or anything else and is not part of the build. The actual app entry point is `src/main.jsx` → `src/App.jsx`. Don't edit the root-level file expecting it to affect the running app.

The site deploys to Vercel. `vercel.json` has a catch-all rewrite (`/(.*)` → `/index.html`) so client-side routes resolve on direct navigation/refresh — required once real routes replaced in-memory tab state.
