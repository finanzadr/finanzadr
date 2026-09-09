# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow: Plan Before Code

For any multi-step or visual change, present a written plan + diff for approval BEFORE editing files. Wait for explicit 'go' on each phase. Never batch multiple phases into one edit run.

## Secrets Handling

NEVER cat, echo, or print `.env.local`, `.env`, or any API key value — not even partially, not for debugging. To verify env vars, only check key NAMES (e.g. `grep -o '^[A-Z_]*=' .env.local`) or confirm non-empty length. Watch for UTF-8 BOM in `.env` files written by the user's editor.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build (vite build). **Always run this after editing `src/App.jsx`** — the file is dense (single line per component, minimal formatting) and unbalanced JSX/parens are easy to introduce and easy to miss visually. `vite build` (rolldown) catches syntax errors that the dev server may not surface clearly.
- `npm run preview` — preview the production build
- `npm run lint` — ESLint (flat config in `eslint.config.js`, `dist/` ignored)

No unit-test suite exists in this repo, but there are two verification scripts:

- `node scripts/verificar-estatico.mjs` — no browser needed. Reads `src/App.jsx` and checks WCAG contrast of the real tokens, the calculator and payoff engines, guide/strategy data integrity, and accessibility heuristics (text under 12px, controls under 44px, emoji used as icons, wide tables outside a scroll container). Exits 1 on failure.
- `node scripts/verificar.mjs` — needs Playwright and a running `npm run preview`; checks horizontal overflow at 360/390/768/1024/1440, single footer, fixed elements, heading order and tab order.

## Commit Policy

After every approved increment: run `npm run build` to verify, then commit and push to main with a scoped message. Commit ONLY the files for the current change — never include pre-existing debug code or unrelated diffs (`git add <specific files>`, never `git add -A`).

## API Testing Policy

For all `/api` work in this repo, skip local testing entirely. Deploy to a Vercel preview, then verify with `curl` against the preview URL (pass the `CRON_SECRET` header where needed) and show the raw response. Never run `vercel dev` or try to read `.env.local`.

## Search Strategy

For any question of the form "where is X used/consumed/defined", launch a Task subagent to search the codebase and return only a file:line list with one-line notes. Never do manual grep loops in the main context.

## Local Testing Constraints (Windows + Vite + Vercel)

`vite dev` does NOT serve `/api` routes and `vercel dev` frequently fails to inject env vars or is unauthenticated. Do not spend cycles debugging local serverless runs — deploy to a Vercel preview/production and verify with `curl` against the deployed URL instead. Playwright/chromium are not installed, so do not attempt screenshots.

## Visual Verification

No Chrome extension is installed — never attempt a screenshot after a UI change. Instead provide, in under 10 lines:
1. A 3-5 item visual checklist with exact viewport widths to test.
2. Expected computed styles for the elements touched.
3. The specific iOS Safari behavior to confirm, if relevant.

## Architecture

This is a single-page marketing/tool site for FinanzaDR ("Wall Street en tu idioma" — investing education for Latin American/Dominican audience), built with Vite + React 19 + React Router (`react-router-dom`, `BrowserRouter`).

**Almost the entire app lives in one file: `src/App.jsx`.** There is no `src/components/` or `src/pages/` directory — route page components are plain functions defined in the same file, a deliberate choice to keep the single-file convention rather than splitting into per-route files. The default export `FinanzasDR` (rendered as `App` from `main.jsx`) just wires up `<BrowserRouter><Routes>...</Routes></BrowserRouter>`:
- A single parent `<Route element={<Layout />}>` wraps every page. `Layout` renders the market ticker bar, header, nav, footer, and `<main><Outlet /></main>` — it owns all state shared across pages (`stocks`, `dark`, `noticias`, `lastUpdate`, etc.) with `useState`/`useEffect`, no external state library, and passes it down via `<Outlet context={...}>`.
- Child routes are plain function components (`InicioPage`, `MercadosPage`, `HeatmapPage`, `SentimientoPage`, `NoticiasPage`, `AprendePage`, `BrokersPage`, `CalculadoraPage`, `CompartirPage`, `NewsletterPage`, `PrivacidadPage`, `TerminosPage`, `AvisoPage`, `NotFoundPage`). Anything that needs shared state or the current theme calls `useOutletContext()` — this works for any descendant of `<Outlet>`, not just the direct route element, so presentational helpers (`SectionTitle`, `Label`, `Boton`, `Variacion`, `BrokerCard`) and self-contained feature components (`SentimientoMercado`, `CompoundCalc`, `TradingViewCharts`, `SnapshotCard`, `NewsletterForm`) call it too instead of receiving props.
- The nav is driven by `SECCIONES`: five top-level entries (Inicio, Aprende, Actualidad, Mercados, Herramientas), each listing the `rutas` that belong to it so the section stays highlighted on child pages, plus `hijos` for the sub-nav. Routes not in `SECCIONES` are reachable from the footer (`/newsletter`, `/compartir`) or the legal links (`/privacidad`, `/terminos`, `/aviso`). A catch-all `*` route renders a 404 page.
- `/aprende` is a library plus a reading view in one route: no param renders the library, `?guia=<slug>` opens a guide, and the older `?articulo=<n>` still resolves to the same guide by index (`resolverGuia`). `/opciones` works the same way with `?estrategia=<id>`. Neither opens a long article on top of its listing by default, which is what the previous `expanded` state did.
- Mercados has an internal "Cotizaciones" / "Gráficos" toggle that is **derived from the query string, not a nested route**: `?view=charts` and `?symbol=SPY` (plus optional `?interval=`) decide what renders, and the toggle writes back to the URL. It used to be local state that the query param only seeded, which meant clicking an instrument while already on the page changed the URL but not the view. `TradingViewCharts` is keyed by symbol so it remounts when the URL symbol changes.
- Theme: `C` (the `DARK`/`LIGHT` color object) is a plain `const` computed inside `Layout` from the `dark` boolean and passed through the same Outlet context. It is **not** a mutated module-level variable — an earlier version of this codebase did that (`let C = {...}; C = dark ? DARK : LIGHT` reassigned at the top of the one big component's render), which only worked because everything rendered synchronously in one tree; it was replaced when routing was introduced since that assumption no longer holds once pages are independent route components.

**Styling is all inline JS style objects** — there are no CSS Modules and effectively no component-scoped CSS. `src/index.css` (loaded via `main.jsx`) only provides global resets/fonts from the original Vite template. `src/App.css` exists but is **not imported anywhere** and is dead leftover from the create-vite template — don't assume it applies. Animations/keyframes and a handful of hover/media-query rules that can't be done as inline styles are injected into `document.head` at runtime inside a `useEffect` in `Layout`.

**External data sources:**
- Finnhub stock quotes and market news are **not** called directly from the browser — `FINNHUB_KEY` lives server-side only (`process.env.FINNHUB_KEY` in `api/_agente-mercados.js`, which exports `fetchPrecios()`/`fetchNoticiasCrudas()`). The frontend polls `/api/precios` (quotes, polled every 60s from `Layout`) and `/api/noticias` (market news) instead, both thin serverless endpoints (`api/precios.js`, `api/noticias.js`) with a short in-memory cache (25s / 90s respectively) to avoid multiplying real Finnhub calls per concurrent visitor. Neither endpoint takes query params — they always serve the fixed `WS_STOCKS` symbol set / general news category, so they can't be used as an open proxy to Finnhub.
- `api.alternative.me/fng` for the crypto Fear & Greed index, still called directly from the browser — labeled "Sentimiento Cripto" in the UI on purpose, since it measures crypto market sentiment, not the traditional stock market.
- MailerLite form endpoint (hardcoded form ID) for newsletter signups, called directly from the browser.
- TradingView's `tv.js` widget script (Charts en Vivo, nested inside Mercados) and TradingView's `embed-widget-stock-heatmap.js` script (Heat Map page), both injected dynamically, browser-side.

**`FinanzasDR.jsx` at the repo root is a stray duplicate/backup** — it is not imported by `main.jsx` or anything else and is not part of the build. The actual app entry point is `src/main.jsx` → `src/App.jsx`. Don't edit the root-level file expecting it to affect the running app.

The site deploys to Vercel. `vercel.json` has a catch-all rewrite (`/(.*)` → `/index.html`) so client-side routes resolve on direct navigation/refresh — required once real routes replaced in-memory tab state.

## Styling Conventions

### CSS / Layout Rules

Do not use absolute positioning for badges or overlays inside interactive containers — use flex/inline layout so nothing overlaps buttons. Embedded widgets (TradingView, iframes) must get an explicit pixel height, never `height: '100%'`.
