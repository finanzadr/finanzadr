# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build (vite build). **Always run this after editing `src/App.jsx`** — the file is dense (single line per component, minimal formatting) and unbalanced JSX/parens are easy to introduce and easy to miss visually. `vite build` (rolldown) catches syntax errors that the dev server may not surface clearly.
- `npm run preview` — preview the production build
- `npm run lint` — ESLint (flat config in `eslint.config.js`, `dist/` ignored)

No test suite exists in this repo.

## Architecture

This is a single-page marketing/tool site for FinanzaDR ("Wall Street en tu idioma" — investing education for Latin American/Dominican audience), built with Vite + React 19, no router.

**Almost the entire app lives in one file: `src/App.jsx`.** There is no `src/components/` directory. The default export `FinanzasDR` (rendered as `App` from `main.jsx`) is a single component that:
- Holds all top-level state (`tab`, `stocks`, `dark`, news, etc.) with `useState`/`useEffect`, no external state library.
- Implements tab-based navigation purely via a `tab` string in state and conditional rendering (`{tab === "..." && (...)}`) — there is no routing library, and no unmounting/lazy-loading between tabs.
- Renders every section (hero, market pulse, mercados, news, blog, calculator, etc.) inline in one big JSX tree.
- Delegates a few larger pieces to sibling function components defined lower in the same file: `SentimientoMercado` (Fear & Greed index + AI-ish keyword sentiment on news headlines), `NewsletterForm` (MailerLite subscribe), `CompoundCalc` (compound-interest calculator with recharts `ComposedChart` and a yearly/monthly amortization table), `TradingViewCharts` (dynamically injects the TradingView widget script), `SnapshotCard` (draws a shareable market summary image to a `<canvas>` and offers PNG download / clipboard copy / X share). Small presentational helpers (`SectionTitle`, `Label`, `StockCard`) live at the bottom too.
- Uses a module-level, non-reactive theme object `C` (mutated to `DARK`/`LIGHT` on each render based on the `dark` state) for all colors, referenced directly inside JSX style objects rather than via CSS classes or a theme context.

**Styling is all inline JS style objects** — there are no CSS Modules and effectively no component-scoped CSS. `src/index.css` (loaded via `main.jsx`) only provides global resets/fonts from the original Vite template. `src/App.css` exists but is **not imported anywhere** and is dead leftover from the create-vite template — don't assume it applies. Animations/keyframes and a handful of hover/media-query rules that can't be done as inline styles are injected into `document.head` at runtime inside a `useEffect` in `FinanzasDR`.

**External data sources**, all called directly from the browser with `fetch` (no backend/API layer):
- Finnhub (`FINNHUB_KEY` hardcoded near the top of `App.jsx`) for stock quotes (`/quote`, polled every 60s) and market news (`/news`).
- `api.alternative.me/fng` for the Fear & Greed index.
- MailerLite form endpoint (hardcoded form ID) for newsletter signups.
- TradingView's `tv.js` widget script, injected dynamically for the "Charts en Vivo" tab.

**`FinanzasDR.jsx` at the repo root is a stray duplicate/backup** — it is not imported by `main.jsx` or anything else and is not part of the build. The actual app entry point is `src/main.jsx` → `src/App.jsx`. Don't edit the root-level file expecting it to affect the running app.

The site appears to deploy to Vercel (no `vercel.json`; config is presumably in the Vercel dashboard).
