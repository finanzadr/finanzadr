import { useState, useEffect, useRef } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ── Datos Wall Street ────────────────────────────────────────────
const FINNHUB_KEY = "d88c1mhr01qq4342hla0d88c1mhr01qq4342hlag";

const WS_STOCKS = [
  { s: "SPY",     n: "S&P 500",       p: 528.40,  c:  0.43 },
  { s: "QQQ",     n: "NASDAQ ETF",    p: 446.82,  c:  0.71 },
  { s: "IWM",     n: "Russell 2000",  p: 198.54,  c: -0.34 },
  { s: "DIA",     n: "Dow Jones ETF", p: 391.27,  c: -0.12 },
  { s: "TLT",     n: "Bonos 20+ Año", p: 88.45,   c: -0.22 },
  { s: "XLU",     n: "Utilities ETF", p: 71.20,   c:  0.15 },
  { s: "GLD",     n: "Oro ETF",       p: 224.80,  c:  0.38 },
  { s: "BTC-USD", n: "Bitcoin",       p: 94500.00,c:  1.45 },
];

// ── Contenido estático ───────────────────────────────────────────
const NOTICIAS = [
  {
    titulo: "S&P 500 cierra en máximo histórico mientras mercados celebran pausa de la Fed",
    resumen: "El S&P 500 alcanzó un nuevo récord cerrando por encima de 5,800 puntos este viernes, impulsado por datos de empleo más fuertes de lo esperado. La Reserva Federal señaló que mantendría las tasas sin cambios hasta tener mayor claridad sobre la inflación. Los inversores celebraron la noticia con compras masivas en el sector tecnológico.",
    fuente: "Reuters", tiempo: "Hace 1 hora", categoria: "Mercados"
  },
  {
    titulo: "NVIDIA supera los $1,000 por acción por primera vez en su historia",
    resumen: "Las acciones de NVIDIA cruzaron la barrera de los $1,000 por primera vez impulsadas por una demanda récord de chips para inteligencia artificial. La compañía reportó ingresos trimestrales de $44 mil millones, un 78% más que el año anterior. Los analistas de Wall Street elevaron sus objetivos de precio hasta $1,400.",
    fuente: "Bloomberg", tiempo: "Hace 3 horas", categoria: "Acciones"
  },
  {
    titulo: "El oro alcanza nuevos máximos históricos ante la incertidumbre geopolítica global",
    resumen: "El precio del oro superó los $3,400 por onza este mes, estableciendo un nuevo récord histórico. Los inversores buscan refugio en metales preciosos ante las tensiones geopolíticas y el debilitamiento del dólar. El ETF GLD registró entradas de capital de más de $2 mil millones en la última semana.",
    fuente: "WSJ", tiempo: "Hace 5 horas", categoria: "Materias Primas"
  },
  {
    titulo: "Bitcoin consolida por encima de los $90,000 con creciente adopción institucional",
    resumen: "Bitcoin mantiene su posición por encima de los $90,000 respaldado por compras institucionales y la aprobación de nuevos ETFs en mercados europeos y asiáticos. BlackRock y Fidelity reportaron que sus ETFs de Bitcoin acumulan más de $50 mil millones en activos. Los analistas anticipan nuevos máximos hacia fin de año.",
    fuente: "CNBC", tiempo: "Hace 7 horas", categoria: "Cripto"
  },
  {
    titulo: "Los bonos del Tesoro a 10 años suben ante señales de desaceleración económica",
    resumen: "El rendimiento del bono del Tesoro a 10 años cayó al 4.2% mientras los inversores buscan activos más seguros. Los datos de manufactura publicados esta semana mostraron una contracción por segundo mes consecutivo. El ETF TLT subió un 2.3% en la semana, atrayendo capital de inversores defensivos.",
    fuente: "Financial Times", tiempo: "Hace 9 horas", categoria: "Bonos"
  },
  {
    titulo: "Dow Jones supera los 42,000 puntos impulsado por sector financiero y salud",
    resumen: "El Dow Jones Industrial Average superó los 42,000 puntos esta semana, liderado por fuertes ganancias en el sector financiero y de salud. JPMorgan Chase y UnitedHealth reportaron resultados trimestrales superiores a las expectativas. El ETF DIA acumula una ganancia del 8% en lo que va del año.",
    fuente: "MarketWatch", tiempo: "Hace 11 horas", categoria: "Mercados"
  },
];

const GUIAS = [
  {
    titulo: "Cómo abrir tu primera cuenta de inversión desde Latinoamérica",
    extracto: "Guía paso a paso para abrir una cuenta en Fidelity o Interactive Brokers desde cualquier país de América Latina.",
    contenido: `Invertir en Wall Street desde Latinoamérica es más fácil de lo que piensas. Aquí te explicamos todo lo que necesitas saber para empezar.

PASO 1: ELIGE TU PLATAFORMA
Para principiantes recomendamos Fidelity o Interactive Brokers. Ambas aceptan clientes internacionales y no cobran comisiones por comprar acciones o ETFs.

PASO 2: DOCUMENTOS NECESARIOS
Necesitas tu pasaporte vigente, comprobante de domicilio (recibo de agua, luz o estado de cuenta bancario) y un número de teléfono. Todo el proceso es 100% online.

PASO 3: ABRE LA CUENTA
Entra a fidelity.com o interactivebrokers.com, selecciona "Open an Account" y elige "Individual Brokerage Account". El proceso toma entre 15-30 minutos.

PASO 4: DEPOSITA TU PRIMER DINERO
Puedes depositar desde $1 dólar. La mayoría usa transferencia bancaria internacional o servicios como Wise o Remitly para enviar dinero con comisiones bajas.

PASO 5: COMPRA TU PRIMER ETF
Para empezar, compra VOO (Vanguard S&P 500 ETF). Con un solo producto tienes exposición a las 500 empresas más grandes de Estados Unidos.

CONSEJO FINAL: No esperes el "momento perfecto" para invertir. El mejor momento para empezar fue ayer, el segundo mejor momento es hoy.`,
    autor: "Equipo FinanzaDR",
    fecha: "Mayo 2026",
    tags: ["principiantes", "brokers", "ETF"]
  },
  {
    titulo: "¿Qué es el S&P 500 y por qué es la mejor inversión para principiantes?",
    extracto: "El S&P 500 ha generado un retorno promedio del 10% anual durante los últimos 50 años. Aprende por qué es la inversión favorita de Warren Buffett.",
    contenido: `El S&P 500 es el índice bursátil más importante del mundo. Incluye las 500 empresas más grandes de Estados Unidos, como Apple, Microsoft, Amazon, Google y NVIDIA.

¿POR QUÉ ES TAN BUENA INVERSIÓN?
En los últimos 50 años, el S&P 500 ha generado un retorno promedio del 10% anual. Esto significa que si hubieras invertido $10,000 hace 30 años, hoy tendrías más de $174,000. Todo sin hacer nada más que esperar.

¿CÓMO INVIERTO EN EL S&P 500?
No puedes comprar el índice directamente, pero sí puedes comprar ETFs que lo replican. Los más populares son:
- VOO (Vanguard): La opción más económica con un costo de solo 0.03% anual
- SPY (SPDR): El más antiguo y líquido del mercado
- IVV (iShares): Otra excelente opción de bajo costo

¿CUÁNTO DINERO NECESITO?
Con VOO puedes empezar con el precio de una sola acción, actualmente alrededor de $500. Muchos brokers permiten comprar fracciones de acciones, así que puedes empezar con $10 o $50.

LA ESTRATEGIA GANADORA: DCA
La estrategia más efectiva es Dollar Cost Averaging (DCA): invertir una cantidad fija cada mes sin importar si el mercado sube o baja. Esto elimina el estrés de intentar adivinar el mejor momento para entrar.`,
    autor: "Equipo FinanzaDR",
    fecha: "Mayo 2026",
    tags: ["S&P 500", "ETF", "estrategia"]
  },
  {
    titulo: "Los 5 errores más comunes al invertir por primera vez",
    extracto: "El 80% de los inversores principiantes cometen estos errores. Aprende a evitarlos antes de poner tu dinero en el mercado.",
    contenido: `Invertir es una de las mejores decisiones financieras que puedes tomar, pero también hay errores costosos que muchos principiantes cometen. Aquí los más importantes:

ERROR #1: ESPERAR EL MOMENTO PERFECTO
Muchos principiantes esperan meses o años buscando el "momento perfecto" para invertir. La realidad es que no existe. Los estudios muestran que el tiempo en el mercado siempre supera al timing del mercado.

ERROR #2: PONER TODOS LOS HUEVOS EN UNA CANASTA
Comprar solo acciones de una empresa es muy arriesgado. Si esa empresa cae, pierdes todo. Por eso los ETFs como el S&P 500 son perfectos para principiantes — te dan diversificación automática.

ERROR #3: VENDER CUANDO EL MERCADO CAE
El mercado siempre ha subido a largo plazo, pero tiene caídas temporales. Los inversores que venden durante una caída convierten pérdidas temporales en pérdidas permanentes.

ERROR #4: INVERTIR DINERO QUE PUEDES NECESITAR
Solo invierte dinero que no vas a necesitar en los próximos 5 años. El mercado puede caer en el corto plazo y necesitas tiempo para recuperarte.

ERROR #5: NO EMPEZAR POR MIEDO
El mayor error es no invertir por miedo a perder. Con una estrategia diversificada y largo plazo, el riesgo se minimiza enormemente. El dinero que no inviertes pierde valor cada año por la inflación.`,
    autor: "Equipo FinanzaDR",
    fecha: "Mayo 2026",
    tags: ["errores", "principiantes", "estrategia"]
  },
];

const CONSEJOS = [
  { icono: "🎯", nivel: "Principiante", consejo: "Empieza con ETFs, no acciones individuales", detalle: "Un ETF del S&P 500 te da exposición a 500 empresas con una sola compra. Es la forma más segura de empezar a invertir sin necesitar conocimientos avanzados." },
  { icono: "📅", nivel: "Principiante", consejo: "Invierte una cantidad fija cada mes", detalle: "La estrategia DCA (Dollar Cost Averaging) consiste en invertir la misma cantidad cada mes. Esto elimina el estrés de intentar adivinar cuándo el mercado está 'barato'." },
  { icono: "⏳", nivel: "Principiante", consejo: "Piensa en años, no en días", detalle: "El mercado sube y baja constantemente. Los inversores exitosos ignoran el ruido diario y mantienen su estrategia por años. La paciencia es la herramienta más poderosa." },
  { icono: "🏦", nivel: "Principiante", consejo: "Abre una cuenta en Fidelity o Interactive Brokers", detalle: "Ambas plataformas aceptan clientes de Latinoamérica, no cobran comisiones y son las más confiables para inversores internacionales que quieren acceder a Wall Street." },
];

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clr = (c) => c >= 0 ? "#00d68f" : "#ff4466";
const arr = (c) => c >= 0 ? "▲" : "▼";

const DARK = {
  bg: "#07080f", card: "#0d0f1e", border: "#1a1e35",
  gold: "#c8a84b", goldBg: "#c8a84b18",
  green: "#00d68f", red: "#ff4466",
  text: "#dde1f5", muted: "#484e72", sub: "#8890b5",
  navBg: "#09091a", tickerBg: "#0a0b16",
};

const LIGHT = {
  bg: "#f4f5f8", card: "#ffffff", border: "#e0e4ef",
  gold: "#b8860b", goldBg: "#b8860b15",
  green: "#00875a", red: "#d93025",
  text: "#1a1d2e", muted: "#8891a8", sub: "#555e7a",
  navBg: "#ffffff", tickerBg: "#1a1d2e",
};

let C = { ...DARK };

// ── Componente principal ─────────────────────────────────────────
export default function FinanzasDR() {
  const [tab, setTab]       = useState("inicio");
  const [stocks, setStocks] = useState(WS_STOCKS);
  const [expanded, setExpanded] = useState(null);
  const [dark, setDark]     = useState(true);
  const [realLoading, setRealLoading] = useState(false);
  const [lastUpdate, setLastUpdate]   = useState(null);
  const [realErr, setRealErr]         = useState(null);
  const [noticias, setNoticias]         = useState(NOTICIAS);
  const [noticiasES, setNoticiasES]     = useState([]);
  const [noticiasLoading, setNoticiasLoading] = useState(false);
  const [idiomaNews, setIdiomaNews]     = useState("es");

  const GNEWS_KEY = "5bbe72ba4c16826d08995c2b281afd17";

  // Update C whenever theme changes
  C = dark ? DARK : LIGHT;

  // Fetch English news from Finnhub
  const fetchNoticiasEN = async () => {
    try {
      const res  = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const cats = { "earnings":"Ganancias","ipo":"IPO","merger":"Fusiones","crypto":"Cripto","forex":"Divisas","economy":"Economía","general":"Mercados" };
        const mapped = data.slice(0, 8).map(n => ({
          titulo: n.headline,
          resumen: n.summary?.slice(0, 220) + (n.summary?.length > 220 ? "..." : "") || "Sin resumen disponible.",
          fuente: n.source || "Finnhub",
          tiempo: (() => {
            const mins = Math.floor((Date.now()/1000 - n.datetime) / 60);
            if (mins < 60) return `Hace ${mins} min`;
            if (mins < 1440) return `Hace ${Math.floor(mins/60)}h`;
            return `Hace ${Math.floor(mins/1440)} días`;
          })(),
          categoria: cats[n.category] || "Mercados",
          url: n.url,
        }));
        setNoticias(mapped);
      }
    } catch (e) {}
  };

  // Fetch Spanish news from GNews
  const fetchNoticiasES = async () => {
    try {
      const res  = await fetch(`https://gnews.io/api/v4/search?q=wall+street+bolsa+acciones+finanzas&lang=es&max=8&apikey=${GNEWS_KEY}`);
      const data = await res.json();
      if (data?.articles?.length > 0) {
        const mapped = data.articles.map(n => ({
          titulo: n.title,
          resumen: n.description?.slice(0, 220) + (n.description?.length > 220 ? "..." : "") || "Sin resumen disponible.",
          fuente: n.source?.name || "GNews",
          tiempo: (() => {
            const mins = Math.floor((Date.now() - new Date(n.publishedAt)) / 60000);
            if (mins < 60) return `Hace ${mins} min`;
            if (mins < 1440) return `Hace ${Math.floor(mins/60)}h`;
            return `Hace ${Math.floor(mins/1440)} días`;
          })(),
          categoria: "Mercados",
          url: n.url,
        }));
        setNoticiasES(mapped);
      }
    } catch (e) {}
  };

  const fetchNoticias = async () => {
    setNoticiasLoading(true);
    await Promise.all([fetchNoticiasEN(), fetchNoticiasES()]);
    setNoticiasLoading(false);
  };

  // Auto-fetch news on load
  useEffect(() => { fetchNoticias(); }, []);

  // Fetch real prices from Finnhub
  const fetchRealPrices = async () => {
    setRealLoading(true);
    setRealErr(null);
    try {
      const updated = await Promise.all(
        WS_STOCKS.map(async (st) => {
          try {
            const symbol = st.s === "BTC-USD" ? "BINANCE:BTCUSDT" : st.s;
            const res  = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
            const data = await res.json();
            if (data.c && data.c > 0) {
              const changeP = data.dp ?? ((data.c - data.pc) / data.pc * 100);
              return { ...st, p: data.c, c: +changeP.toFixed(2) };
            }
            return st;
          } catch { return st; }
        })
      );
      setStocks(updated);
      setLastUpdate(new Date().toLocaleTimeString("es-DO"));
    } catch (e) {
      setRealErr("No se pudo conectar con Finnhub.");
    }
    setRealLoading(false);
  };

  // Auto-fetch on load then every 60 seconds
  useEffect(() => {
    fetchRealPrices();
    const t = setInterval(fetchRealPrices, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideToggle { from{opacity:0} to{opacity:1} }
      html, body, #root { width:100%; min-height:100vh; margin:0; padding:0; background:${C.bg}; }
      .ticker-track { display:flex; animation:ticker 50s linear infinite; white-space:nowrap; }
      .ticker-track:hover { animation-play-state:paused; }
      .fade-in { animation: fadeIn 0.4s ease forwards; }
      * { box-sizing:border-box; margin:0; padding:0; transition: background 0.3s, color 0.2s, border-color 0.2s; }
      .nav-btn:hover { color: #c8a84b !important; }
      .card-hover { transition: all 0.2s; }
      .card-hover:hover { border-color: #c8a84b44 !important; transform: translateY(-2px); }
      .theme-toggle:hover { transform: scale(1.05); }

      /* ── MOBILE RESPONSIVE ── */
      @media (max-width: 768px) {
        .main-padding { padding: 16px !important; }
        .hero-grid { flex-direction: column !important; }
        .hero-stocks { display: grid !important; grid-template-columns: 1fr 1fr !important; width: 100% !important; }
        .header-right { flex-direction: column !important; align-items: flex-end !important; gap: 8px !important; }
        .toggle-text { display: none !important; }
        .grid-2col { grid-template-columns: 1fr !important; }
        .grid-3col { grid-template-columns: 1fr 1fr !important; }
        .nav-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; }
        .nav-scroll::-webkit-scrollbar { display: none !important; }
        .pulse-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .summary-grid { grid-template-columns: 1fr !important; }
        .calc-grid { grid-template-columns: 1fr !important; }
        .hero-text h1 { font-size: 26px !important; }
        .hero-text p { font-size: 13px !important; }
        .section-title { font-size: 20px !important; }
        .ticker-bar { height: 32px !important; font-size: 11px !important; }
        .share-btns { flex-direction: column !important; }
        .broker-grid { grid-template-columns: 1fr 1fr !important; }
        .steps-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 480px) {
        .pulse-grid { grid-template-columns: 1fr 1fr !important; }
        .hero-stocks { grid-template-columns: 1fr 1fr !important; }
        .broker-grid { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  const tabs = [
    ["inicio",     "🚀 Empieza Aquí"],
    ["mercados",   "📊 Mercados"],
    ["charts",     "📈 Charts en Vivo"],
    ["ws",         "📰 Noticias"],
    ["blog",       "📚 Aprende"],
    ["calc",       "🧮 Calculadora"],
    ["snapshot",   "📸 Compartir"],
    ["newsletter", "📧 Newsletter"],
  ];

  return (
    <div style={{ minHeight: "100vh", width: "100vw", maxWidth: "100%", background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>

      {/* Ticker */}
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, height: 36, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ background: C.gold, color: "#000", fontFamily: "'IBM Plex Mono'", fontSize: 10, fontWeight: 700, padding: "0 14px", height: "100%", display: "flex", alignItems: "center", flexShrink: 0, letterSpacing: 1 }}>EN VIVO</div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div className="ticker-track">
            {[...stocks, ...stocks].map((st, i) => (
              <span key={i} style={{ padding: "0 20px", fontFamily: "'IBM Plex Mono'", fontSize: 12 }}>
                <span style={{ color: C.gold, fontWeight: 600, marginRight: 6 }}>{st.s}</span>
                <span style={{ marginRight: 5, color: C.text }}>{fmt(st.p)}</span>
                <span style={{ color: clr(st.c) }}>{arr(st.c)} {Math.abs(st.c)}%</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: "0 16px", fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, flexShrink: 0 }}>WALL STREET</div>
      </div>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 32px", background: C.bg, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, color: C.gold, letterSpacing: "-0.5px", lineHeight: 1 }}>FinanzaDR</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.muted, marginTop: 4, letterSpacing: 2 }}>APRENDE A INVERTIR EN WALL STREET · PARA LATINOS</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: C.gold, marginTop: 6, fontStyle: "italic", opacity: 0.85 }}>"Wall Street en tu idioma"</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted }}>{new Date().toLocaleDateString("es-DO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>

          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={() => setDark(d => !d)} style={{
            background: dark ? "#1a1e35" : "#f0f2f8",
            border: `1px solid ${C.border}`,
            borderRadius: 50, padding: "8px 14px",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            transition: "all 0.3s", flexShrink: 0,
          }}>
            <span style={{ fontSize: 18 }}>{dark ? "☀️" : "🌙"}</span>
            <span className="toggle-text" style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 600, color: C.text }}>
              {dark ? "Modo Claro" : "Modo Oscuro"}
            </span>
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="nav-scroll" style={{ borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 32px", background: C.navBg, overflowX: "auto" }}>
        {tabs.map(([id, label]) => (
          <button key={id} className="nav-btn" onClick={() => setTab(id)} style={{
            padding: "14px 18px", border: "none", background: "none", cursor: "pointer",
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
            color: tab === id ? C.gold : C.muted,
            borderBottom: tab === id ? `2px solid ${C.gold}` : "2px solid transparent",
            transition: "color 0.2s",
          }}>{label}</button>
        ))}
      </nav>

      {/* Contenido */}
      <main style={{ padding: "32px", maxWidth: "100%", margin: "0 auto" }} className="main-padding">

        {/* EMPIEZA AQUÍ — LIVE MARKET PULSE */}
        {tab === "inicio" && (
          <div className="fade-in">

            {/* Hero */}
            <div style={{ background: dark ? `linear-gradient(135deg,#0f1228,#130f2a)` : `linear-gradient(135deg,#eef0f8,#e8eaf5)`, border: `1px solid ${C.gold}30`, borderRadius: 16, padding: "40px 40px 32px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }} className="hero-grid">
                <div style={{ maxWidth: 520 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 3, marginBottom: 10 }}>WALL STREET EN TIEMPO REAL</div>
                  <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>
                    Institutional-grade<br/><span style={{ color: C.gold }}>market intelligence.</span>
                  </h1>
                  <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.8, marginBottom: 20 }}>
                    Track markets, analiza sentimiento y aprende a invertir en Wall Street con herramientas de nivel institucional — en español.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={() => setTab("mercados")} style={{ background: C.gold, color: "#000", border: "none", padding: "12px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 700 }}>
                      📊 Ver Mercados
                    </button>
                    <button onClick={() => setTab("charts")} style={{ background: "none", border: `1px solid ${C.gold}`, color: C.gold, padding: "12px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 700 }}>
                      📈 Charts en Vivo
                    </button>
                    <button onClick={() => setTab("calc")} style={{ background: "none", border: `1px solid ${C.border}`, color: C.sub, padding: "12px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 700 }}>
                      🧮 Calculadora
                    </button>
                  </div>
                </div>

                {/* Live stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, minWidth: 260 }}>
                  {stocks.slice(0, 4).map(st => (
                    <div key={st.s} style={{ background: dark ? "#ffffff08" : "#00000008", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 4 }}>{st.s}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 16, fontWeight: 700, color: C.text }}>{fmt(st.p)}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: clr(st.c) }}>{arr(st.c)} {Math.abs(st.c)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Market Pulse */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <Label style={{ margin: 0 }}>── MARKET PULSE · EN VIVO</Label>
                </div>
                {lastUpdate && <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.green }}>✓ {lastUpdate}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }} className="pulse-grid">
                {stocks.map(st => (
                  <div key={st.s} className="card-hover" style={{ background: C.card, border: `1px solid ${st.c >= 0 ? C.green+"33" : C.red+"33"}`, borderLeft: `3px solid ${clr(st.c)}`, borderRadius: 8, padding: "12px 14px", cursor: "pointer" }} onClick={() => setTab("charts")}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 700, color: C.gold }}>{st.s}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: clr(st.c) }}>{arr(st.c)}{Math.abs(st.c)}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{st.n}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 17, fontWeight: 700, color: C.text }}>{fmt(st.p)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginBottom: 28 }} className="summary-grid">
              {/* Market Sentiment */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px" }}>
                <Label style={{ margin: "0 0 12px 0" }}>── SENTIMIENTO HOY</Label>
                {(() => {
                  const gainers = stocks.filter(s => s.c > 0).length;
                  const pct = Math.round(gainers / stocks.length * 100);
                  const sentiment = pct >= 70 ? "Alcista 🟢" : pct >= 40 ? "Neutral ⚪" : "Bajista 🔴";
                  const color = pct >= 70 ? C.green : pct >= 40 ? C.gold : C.red;
                  return (
                    <div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 800, color, marginBottom: 8 }}>{sentiment}</div>
                      <div style={{ background: C.border, borderRadius: 99, height: 6, marginBottom: 8 }}>
                        <div style={{ background: color, borderRadius: 99, height: 6, width: `${pct}%`, transition: "width 0.5s" }} />
                      </div>
                      <p style={{ fontSize: 12, color: C.sub }}>{gainers} de {stocks.length} activos en verde — {pct}% positivo</p>
                    </div>
                  );
                })()}
              </div>

              {/* Top Mover */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px" }}>
                <Label style={{ margin: "0 0 12px 0" }}>── TOP MOVER</Label>
                {(() => {
                  const top = [...stocks].sort((a,b) => Math.abs(b.c) - Math.abs(a.c))[0];
                  return (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 22, fontWeight: 800, color: C.gold }}>{top.s}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 20, fontWeight: 700, color: clr(top.c) }}>{arr(top.c)}{Math.abs(top.c)}%</span>
                      </div>
                      <div style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>{top.n}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 16, color: C.text, fontWeight: 700 }}>{fmt(top.p)}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Quick Actions */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px" }}>
                <Label style={{ margin: "0 0 12px 0" }}>── ACCESO RÁPIDO</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: "📈", label: "Charts en Vivo", tab: "charts" },
                    { icon: "📰", label: "Noticias Wall St.", tab: "ws" },
                    { icon: "🧮", label: "Calculadora", tab: "calc" },
                    { icon: "📧", label: "Newsletter Gratis", tab: "newsletter" },
                  ].map((a, i) => (
                    <button key={i} onClick={() => setTab(a.tab)} style={{ background: C.goldBg, border: `1px solid ${C.gold}30`, borderRadius: 7, padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                      <span style={{ fontSize: 16 }}>{a.icon}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600, color: C.gold }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Brokers */}
            <SectionTitle>¿Dónde abrir tu cuenta?</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginTop: 16, marginBottom: 28 }}>
              {[
                { name: "Robinhood",           emoji: "🟢", nivel: "Principiante", detalle: "Sin comisiones, muy fácil de usar. Ideal para empezar." },
                { name: "Webull",              emoji: "🔵", nivel: "Principiante", detalle: "Sin comisiones, con más herramientas de análisis." },
                { name: "Moomoo",              emoji: "🟠", nivel: "Intermedio",   detalle: "Datos en tiempo real y herramientas profesionales gratis." },
                { name: "Tastytrade",          emoji: "🟣", nivel: "Intermedio",   detalle: "Especializado en opciones y futuros." },
                { name: "Interactive Brokers", emoji: "🌐", nivel: "Avanzado",     detalle: "Acepta clientes de RD y Latinoamérica directamente." },
              ].map((b, i) => (
                <div key={i} className="card-hover" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 14px" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{b.emoji}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{b.name}</div>
                  <div style={{ background: C.goldBg, color: C.gold, display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: "'IBM Plex Mono'", marginBottom: 8 }}>{b.nivel}</div>
                  <p style={{ fontSize: 11, color: C.sub, lineHeight: 1.6 }}>{b.detalle}</p>
                </div>
              ))}
            </div>

            {/* Pasos */}
            <SectionTitle>Tu camino en 4 pasos</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14, marginTop: 16 }}>
              {[
                { n: "01", t: "Elige una plataforma", d: "Robinhood o Webull si eres principiante. Interactive Brokers si vives fuera de EE.UU." },
                { n: "02", t: "Abre tu cuenta", d: "Necesitas pasaporte, dirección y un método de pago. El proceso es 100% online." },
                { n: "03", t: "Empieza con ETFs", d: "El S&P 500 (VOO o SPY) es el mejor inicio. 500 empresas, un solo producto." },
                { n: "04", t: "Invierte consistente", d: "Más importante que el monto es la consistencia. $50/mes durante 20 años supera $10,000 de golpe." },
              ].map((s, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 18px" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, color: `${C.gold}40`, marginBottom: 10 }}>{s.n}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 8 }}>{s.t}</div>
                  <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MERCADOS */}
        {tab === "mercados" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
              <SectionTitle>Mercados Wall Street</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {lastUpdate && <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.green }}>✓ Actualizado {lastUpdate}</span>}
                {realErr    && <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.red }}>⚠ {realErr}</span>}
                <button onClick={fetchRealPrices} disabled={realLoading} style={{
                  background: realLoading ? C.border : C.gold, color: realLoading ? C.muted : "#000",
                  border: "none", padding: "9px 18px", borderRadius: 6, cursor: realLoading ? "not-allowed" : "pointer",
                  fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 700, transition: "all 0.2s",
                }}>
                  {realLoading ? "⏳ Cargando..." : "🔴 Actualizar Precios"}
                </button>
              </div>
            </div>
            <Label>── Precios en tiempo real · Powered by Finnhub</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12, marginBottom: 32 }}>
              {stocks.map(st => <StockCard key={st.s} st={st} />)}
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 28px" }}>
              <Label>── ¿Qué es cada activo?</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                {[
                  { s: "SPY",     d: "ETF que replica el S&P 500 — las 500 empresas más grandes de EE.UU. El activo más popular para inversores a largo plazo." },
                  { s: "QQQ",     d: "ETF del NASDAQ 100 — dominado por tecnología. Apple, Microsoft, NVIDIA, Amazon. Alto potencial de crecimiento." },
                  { s: "IWM",     d: "ETF del Russell 2000 — 2,000 empresas pequeñas de EE.UU. Indica la salud de la economía doméstica americana." },
                  { s: "DIA",     d: "ETF del Dow Jones Industrial Average — las 30 empresas industriales más importantes de EE.UU. El índice más antiguo de Wall Street." },
                  { s: "TLT",     d: "ETF de bonos del Tesoro a 20+ años. Sube cuando los inversores buscan seguridad. Indica el sentimiento del mercado." },
                  { s: "XLU",     d: "ETF del sector Utilities (electricidad, agua, gas). Considerado defensivo — estable en mercados volátiles." },
                  { s: "GLD",     d: "ETF del oro. Activo refugio por excelencia. Sube en momentos de incertidumbre económica o inflación alta." },
                  { s: "BTC-USD", d: "Bitcoin — la criptomoneda más importante del mundo. Alta volatilidad pero con creciente adopción institucional." },
                ].map((x, i) => (
                  <div key={i} style={{ borderLeft: `3px solid ${C.gold}`, paddingLeft: 16 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 6 }}>{x.s}</div>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{x.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NOTICIAS */}
        {tab === "ws" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <SectionTitle>Noticias Wall Street</SectionTitle>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
                  {noticiasLoading ? "Cargando noticias..." : "Noticias de hoy en tiempo real · Finnhub & GNews"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {/* Language Toggle */}
                <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <button onClick={() => setIdiomaNews("es")} style={{ padding: "8px 16px", border: "none", background: idiomaNews === "es" ? C.gold : "none", color: idiomaNews === "es" ? "#000" : C.muted, fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    🇪🇸 Español
                  </button>
                  <button onClick={() => setIdiomaNews("en")} style={{ padding: "8px 16px", border: "none", background: idiomaNews === "en" ? C.gold : "none", color: idiomaNews === "en" ? "#000" : C.muted, fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    🇺🇸 English
                  </button>
                </div>
                <button onClick={fetchNoticias} disabled={noticiasLoading} style={{
                  background: noticiasLoading ? C.border : C.gold, color: noticiasLoading ? C.muted : "#000",
                  border: "none", padding: "9px 16px", borderRadius: 6, cursor: noticiasLoading ? "not-allowed" : "pointer",
                  fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 700,
                }}>
                  {noticiasLoading ? "⏳" : "🔄 Actualizar"}
                </button>
              </div>
            </div>

            {noticiasLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>⚙️</div>
                <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13 }}>Cargando noticias de hoy...</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {(idiomaNews === "es" ? (noticiasES.length > 0 ? noticiasES : NOTICIAS) : noticias).map((item, i) => (
                  <div key={i} onClick={() => item.url && window.open(item.url, "_blank")}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "22px 26px", cursor: item.url ? "pointer" : "default", transition: "all 0.2s" }}
                    onMouseEnter={e => { if(item.url) e.currentTarget.style.borderColor = C.gold+"66"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ background: C.goldBg, color: C.gold, padding: "2px 10px", borderRadius: 4, fontSize: 10, fontFamily: "'IBM Plex Mono'", fontWeight: 600 }}>{item.categoria}</span>
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono'" }}>{item.tiempo} · {item.fuente}</span>
                      {item.url && <span style={{ fontSize: 10, color: C.gold, fontFamily: "'IBM Plex Mono'" }}>↗ Leer artículo completo</span>}
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>{item.titulo}</h3>
                    <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7 }}>{item.resumen}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* APRENDE */}
        {tab === "blog" && (
          <div className="fade-in">
            <SectionTitle>Aprende a Invertir</SectionTitle>
            <p style={{ fontSize: 13, color: C.sub, marginTop: 4, marginBottom: 24 }}>Guías completas para inversores principiantes e intermedios</p>
            <div style={{ display: "grid", gap: 24 }}>
              {GUIAS.map((post, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "26px 30px" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    {post.tags.map((t, j) => (
                      <span key={j} style={{ background: C.border, color: C.sub, padding: "2px 10px", borderRadius: 4, fontSize: 11, fontFamily: "'IBM Plex Mono'" }}>#{t}</span>
                    ))}
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, marginBottom: 8, lineHeight: 1.35, color: C.text }}>{post.titulo}</h3>
                  <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, marginBottom: 14 }}>{post.autor} · {post.fecha}</div>
                  <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.75, whiteSpace: "pre-line" }}>
                    {expanded === i ? post.contenido : post.extracto}
                  </p>
                  <button onClick={() => setExpanded(expanded === i ? null : i)} style={{ marginTop: 18, background: "none", border: `1px solid ${C.gold}`, color: C.gold, padding: "9px 22px", borderRadius: 5, cursor: "pointer", fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600 }}>
                    {expanded === i ? "← Ver menos" : "Leer guía completa →"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALCULADORA */}
        {tab === "calc" && <div className="fade-in"><CompoundCalc /></div>}

        {/* CHARTS EN VIVO */}
        {tab === "charts" && (
          <div className="fade-in">
            <SectionTitle>Charts en Vivo</SectionTitle>
            <p style={{ fontSize: 13, color: C.sub, marginTop: 4, marginBottom: 24 }}>Gráficas en tiempo real de los mercados más importantes — powered by TradingView</p>

            {/* Selector de símbolo */}
            <TradingViewCharts />
          </div>
        )}

        {/* SNAPSHOT */}
        {tab === "snapshot" && (
          <div className="fade-in">
            <SectionTitle>📸 Market Snapshot</SectionTitle>
            <p style={{ fontSize: 13, color: C.sub, marginTop: 4, marginBottom: 24 }}>
              Genera una card visual del mercado lista para compartir en X, Instagram o TikTok.
            </p>
            <SnapshotCard stocks={stocks} />
          </div>
        )}

        {/* NEWSLETTER */}
        {tab === "newsletter" && (
          <div className="fade-in">
            <div style={{ background: dark ? `linear-gradient(135deg,#0f1228,#130f2a)` : `linear-gradient(135deg,#eef0f8,#e8eaf5)`, border: `1px solid ${C.gold}30`, borderRadius: 16, padding: "40px", marginBottom: 32, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
              <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.gold, letterSpacing: 3, marginBottom: 12 }}>GRATIS · CADA SEMANA</div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 14, lineHeight: 1.3 }}>
                Lo más importante de<br/><span style={{ color: C.gold }}>Wall Street en tu idioma</span>
              </h1>
              <p style={{ fontSize: 15, color: C.sub, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.8 }}>
                Cada semana te enviamos un resumen claro y simple de lo que pasó en los mercados y lo que significa para ti como inversor latino.
              </p>
              <div style={{ maxWidth: 480, margin: "0 auto" }}><NewsletterForm /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              {[
                { icon: "📊", title: "Resumen semanal",      desc: "Los movimientos más importantes del S&P 500, NASDAQ y acciones clave explicados en simple." },
                { icon: "🎯", title: "Sin jerga financiera", desc: "Todo explicado como si fuera la primera vez. Para latinos que están aprendiendo." },
                { icon: "⚡", title: "Solo lo importante",   desc: "Sin spam. Sin correos diarios. Solo lo que realmente necesitas saber cada semana." },
                { icon: "🆓", title: "100% gratis",          desc: "Siempre gratuito. Sin tarjeta de crédito. Te puedes dar de baja cuando quieras." },
              ].map((b, i) => (
                <div key={i} className="card-hover" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 20px" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{b.icon}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 8 }}>{b.title}</div>
                  <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "20px 32px", textAlign: "center", fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, marginTop: 40 }}>
        FinanzaDR © 2026 · Educación financiera para latinos · No constituye asesoría de inversión
      </footer>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>{children}</h2>;
}

function Label({ children, style: s }) {
  return <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14, ...s }}>{children}</div>;
}

function StockCard({ st }) {
  const pos = st.c >= 0;
  return (
    <div className="card-hover" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", borderLeft: `3px solid ${pos ? C.green : C.red}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600, color: C.gold }}>{st.s}</span>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: clr(st.c) }}>{arr(st.c)} {Math.abs(st.c)}%</span>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{st.n}</div>
      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 20, fontWeight: 600, color: C.text }}>{fmt(st.p)}</div>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) { setStatus("error"); return; }
    setStatus("loading");
    try {
      await fetch("https://assets.mailerlite.com/jsonp/2369844/forms/188124188244968944/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `fields[email]=${encodeURIComponent(email)}&ml-submit=1&anticsrf=true`,
      });
    } catch(e) {}
    setStatus("success");
    setEmail("");
  };

  if (status === "success") return (
    <div style={{ background: "#00d68f15", border: "1px solid #00d68f", borderRadius: 12, padding: "28px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#00d68f", marginBottom: 8 }}>¡Ya estás suscrito!</div>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7 }}>Revisa tu correo para confirmar. El próximo lunes recibes tu primer resumen de Wall Street.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input type="email" placeholder="tu@email.com" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ flex: 1, minWidth: 200, background: "#0d0f1e", border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 18px", color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 15, outline: "none" }}
        />
        <button onClick={handleSubmit} disabled={status === "loading"} style={{ background: C.gold, color: "#000", border: "none", padding: "14px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
          {status === "loading" ? "⏳ Enviando..." : "Suscribirse gratis →"}
        </button>
      </div>
      {status === "error" && <p style={{ fontSize: 12, color: C.red, fontFamily: "'IBM Plex Mono'" }}>⚠️ Ingresa un email válido</p>}
      <p style={{ fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono'", marginTop: 8 }}>Sin spam · Te puedes dar de baja cuando quieras</p>
    </div>
  );
}

function CompoundCalc() {
  const [capital,    setCapital]    = useState(10000);
  const [aporte,     setAporte]     = useState(200);
  const [tasa,       setTasa]       = useState(10);
  const [anos,       setAnos]       = useState(15);
  const [moneda,     setMoneda]     = useState("USD");
  const [frecuencia, setFrecuencia] = useState("Mensual");
  const [capitaliz,  setCapitaliz]  = useState("Anual");
  const [modelo,     setModelo]     = useState("Lineal");
  const [escenario,  setEscenario]  = useState("Aportes Constantes");
  const [vistaTabla, setVistaTabla] = useState("Anual");

  const sym   = moneda === "DOP" ? "RD$" : "$";
  const fmtM  = (n) => `${sym}${(+n).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (n) => `${(+n).toFixed(2)}%`;

  const freqMap = { "Mensual": 12, "Semanal": 52, "Anual": 1 };
  const periodos = freqMap[frecuencia] || 12;
  const tasaPeriodo = Math.pow(1 + tasa / 100, 1 / periodos) - 1;

  const filas = [];
  let saldo = capital;
  let totalInteresAcum = 0;
  for (let y = 1; y <= anos; y++) {
    const aporteBase = escenario === "Sin Aportes" ? 0 : escenario === "Aportes Crecientes" ? aporte * Math.pow(1.05, y - 1) : aporte;
    let saldoInicio = saldo;
    let aporteAnualReal = 0;
    if (modelo === "Lineal") {
      for (let p = 0; p < periodos; p++) { saldo = saldo * (1 + tasaPeriodo) + aporteBase; aporteAnualReal += aporteBase; }
    } else {
      aporteAnualReal = aporteBase * periodos;
      saldo = saldo * Math.exp(tasa / 100) + aporteAnualReal;
    }
    const interesAnual = saldo - saldoInicio - aporteAnualReal;
    totalInteresAcum += interesAnual;
    filas.push({
      ano: y,
      saldo: saldo,
      capitalBase: saldoInicio,
      aporteBase: aporteAnualReal,
      aporteAcum: capital + aporteBase * periodos * y,
      interesAcum: totalInteresAcum,
      aporteAnual: aporteAnualReal,
      ganancia: interesAnual,
      retorno: saldoInicio > 0 ? (interesAnual / saldoInicio * 100) : 0,
    });
  }

  const totalFinal  = filas[filas.length - 1]?.saldo ?? capital;
  const aporteTotal = escenario === "Sin Aportes" ? capital : capital + aporte * periodos * anos;
  const interesTotal = totalFinal - aporteTotal;
  const gananciaPct  = aporteTotal > 0 ? (interesTotal / aporteTotal * 100) : 0;
  const fmtK = v => { if (v >= 1e6) return sym+(v/1e6).toFixed(1)+"M"; if (v >= 1000) return sym+(v/1000).toFixed(0)+"K"; return sym+Math.round(v); };

  const inputStyle = { width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontFamily: "'IBM Plex Mono'", fontSize: 15, fontWeight: 600, outline: "none" };
  const labelStyle = { fontSize: 13, color: C.sub, marginBottom: 6, display: "block" };
  const selStyle   = { width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontFamily: "'IBM Plex Mono'", fontSize: 13, outline: "none", cursor: "pointer" };
  const stepBtn    = (fn, dir) => (
    <button onClick={fn} style={{ width: 40, background: C.border, border: "none", color: C.gold, fontSize: 20, cursor: "pointer", borderRadius: dir === "left" ? "8px 0 0 8px" : "0 8px 8px 0", flexShrink: 0 }}>
      {dir === "left" ? "−" : "+"}
    </button>
  );
  const numInput = (val, setVal, step, min=0) => (
    <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", height: 42 }}>
      {stepBtn(() => setVal(v => Math.max(min, +(v - step).toFixed(2))), "left")}
      <input type="number" value={val || ""} min={min} placeholder="0"
        onChange={e => setVal(e.target.value === "" ? 0 : Math.max(min, +e.target.value))}
        style={{ flex: 1, background: C.card, border: "none", outline: "none", color: C.gold, fontFamily: "'IBM Plex Mono'", fontSize: 15, fontWeight: 700, textAlign: "center" }} />
      {stepBtn(() => setVal(v => +(v + step).toFixed(2)), "right")}
    </div>
  );

  return (
    <div>
      <SectionTitle>Calculadora de Inversión</SectionTitle>
      <p style={{ fontSize: 13, color: C.sub, marginTop: 4, marginBottom: 20 }}>
        El S&P 500 ha retornado ~10% anual históricamente. Calcula el crecimiento de tu dinero con interés compuesto.
      </p>

      {/* Moneda */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, maxWidth: 260 }}>
        {["USD", "DOP"].map(m => (
          <button key={m} onClick={() => setMoneda(m)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${moneda === m ? C.gold : C.border}`, background: moneda === m ? C.goldBg : "none", color: moneda === m ? C.gold : C.muted, fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {m === "USD" ? "🇺🇸 USD" : "🇩🇴 DOP"}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }} className="calc-grid">

        {/* LEFT — Inputs */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px" }}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Inversión Inicial ({sym})</label>
            {numInput(capital, setCapital, moneda === "DOP" ? 5000 : 1000)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Aportes ({sym})</label>
              {numInput(aporte, setAporte, moneda === "DOP" ? 500 : 50)}
            </div>
            <div>
              <label style={labelStyle}>Frecuencia</label>
              <select value={frecuencia} onChange={e => setFrecuencia(e.target.value)} style={selStyle}>
                {["Mensual","Semanal","Anual"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Retorno Esperado (%)</label>
              {numInput(tasa, setTasa, 0.5, 0.1)}
            </div>
            <div>
              <label style={labelStyle}>Capitalización</label>
              <select value={capitaliz} onChange={e => setCapitaliz(e.target.value)} style={selStyle}>
                {["Anual","Mensual","Trimestral","Semestral"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Años de Crecimiento</label>
            {numInput(anos, setAnos, 1, 1)}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Valor Final highlight */}
          <div style={{ background: `linear-gradient(135deg, ${C.card}, ${C.bg})`, border: `2px solid ${C.gold}`, borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>VALOR FINAL EN {anos} AÑOS</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 800, color: C.gold }}>{fmtM(totalFinal)}</div>
          </div>

          {/* Results grid */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            {[
              { lbl: "Inversión Total",     val: fmtM(aporteTotal),                    color: C.text  },
              { lbl: "Capital % del Final", val: fmtPct(aporteTotal/totalFinal*100),   color: C.muted },
              { lbl: "Aporte Total",        val: fmtM(escenario==="Sin Aportes"?0:aporte*periodos*anos), color: C.sub },
              { lbl: "Ganancia Total",      val: fmtM(Math.max(0, interesTotal)),       color: C.green },
              { lbl: "Ganancia Porcentual", val: fmtPct(Math.max(0, gananciaPct)),      color: C.green },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", borderBottom: i < arr.length-1 ? `1px solid ${C.border}20` : "none" }}>
                <span style={{ fontSize: 13, color: C.muted }}>{r.lbl}</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 15, fontWeight: 700, color: r.color }}>{r.val}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.goldBg, border: `1px solid ${C.gold}30`, borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.7 }}>
              💡 {interesTotal > aporteTotal ? "¡Los intereses superan tu inversión! El interés compuesto está trabajando para ti." : `En ${anos} años ganaste ${fmtM(Math.max(0,interesTotal))} en intereses. La clave es empezar hoy.`}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px", marginTop: 24 }}>
        <Label>── Proyección de Crecimiento</Label>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filas} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.muted} tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, fill: C.muted }} />
              <YAxis stroke={C.muted} tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 9, fill: C.muted }} tickFormatter={fmtK} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'IBM Plex Mono'", fontSize: 12 }}
                formatter={(v, n) => [fmtM(v), n==="aporteAcum"?"Capital Base":n==="interesAcum"?"Ganancias":n==="ganancia"?"Ganancia Año":n]}
                labelFormatter={v => `Año ${v}`} />
              <Legend wrapperStyle={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, paddingTop: 12 }}
                formatter={v => v==="aporteAcum"?"Capital Base":v==="interesAcum"?"Ganancias Acum.":"Ganancia (Año)"} />
              <Bar dataKey="aporteAcum"  stackId="a" fill="#1e4a7a" name="aporteAcum"  radius={[0,0,0,0]} />
              <Bar dataKey="interesAcum" stackId="a" fill="#2d7a4a" name="interesAcum" radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="ganancia" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 3 }} name="ganancia" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Toggle Anual / Mensual */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 12px" }}>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: vistaTabla==="Anual" ? C.gold : C.muted }}>Anual</span>
        <div onClick={() => setVistaTabla(v => v==="Anual"?"Mensual":"Anual")} style={{ width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", background: vistaTabla==="Mensual" ? C.gold : C.border, transition: "background 0.25s" }}>
          <div style={{ position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.25s", left: vistaTabla==="Mensual" ? 23 : 3 }} />
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: vistaTabla==="Mensual" ? C.gold : C.muted }}>Mensual</span>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, marginLeft: 8 }}>
          {vistaTabla==="Mensual" ? `${anos * 12} filas` : `${anos} filas`}
        </span>
      </div>

      {/* Tabla */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'IBM Plex Mono'", fontSize: 12, minWidth: 700 }}>
          <thead>
            <tr style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
              {[vistaTabla==="Mensual"?"Mes":"Año","Capital Base","Aporte","Aporte Acum.","Ganancia","Ganancia Acum.","Valor Final"].map((h,i) => (
                <th key={i} style={{ padding: "10px 12px", fontWeight: 500, textAlign: i===0?"left":"right", color: C.muted, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vistaTabla === "Anual" ? (
              filas.map((f, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}20`, background: i%2===0?"transparent":"#ffffff03" }}>
                  <td style={{ padding:"10px 12px", color: C.gold }}>Año {f.ano}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", color: C.text }}>{fmtM(f.capitalBase)}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", color: C.muted }}>{fmtM(f.aporteBase)}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", color: C.muted }}>{fmtM(f.aporteAcum)}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", color: C.green }}>{fmtM(f.ganancia)}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", color: C.sub }}>{fmtM(f.interesAcum)}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", color: C.gold, fontWeight:700 }}>{fmtM(f.saldo)}</td>
                </tr>
              ))
            ) : (
              // Filas mensuales
              (() => {
                const rows = [];
                let saldoM = capital;
                let interesAcumM = 0;
                let aporteAcumM = capital;
                const tasaM = Math.pow(1 + tasa / 100, 1/12) - 1;
                const aporteM = escenario === "Sin Aportes" ? 0 : aporte;
                for (let m = 1; m <= anos * 12; m++) {
                  const prev = saldoM;
                  saldoM = saldoM * (1 + tasaM) + aporteM;
                  const gananciaM = saldoM - prev - aporteM;
                  interesAcumM += gananciaM;
                  aporteAcumM += aporteM;
                  rows.push(
                    <tr key={m} style={{ borderBottom: `1px solid ${C.border}15`, background: m%2===0?"transparent":"#ffffff02" }}>
                      <td style={{ padding:"8px 12px", color: C.gold }}>Mes {m}</td>
                      <td style={{ padding:"8px 12px", textAlign:"right", color: C.text }}>{fmtM(prev)}</td>
                      <td style={{ padding:"8px 12px", textAlign:"right", color: C.muted }}>{fmtM(aporteM)}</td>
                      <td style={{ padding:"8px 12px", textAlign:"right", color: C.muted }}>{fmtM(aporteAcumM)}</td>
                      <td style={{ padding:"8px 12px", textAlign:"right", color: C.green }}>{fmtM(gananciaM)}</td>
                      <td style={{ padding:"8px 12px", textAlign:"right", color: C.sub }}>{fmtM(interesAcumM)}</td>
                      <td style={{ padding:"8px 12px", textAlign:"right", color: C.gold, fontWeight:700 }}>{fmtM(saldoM)}</td>
                    </tr>
                  );
                }
                return rows;
              })()
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── TradingView Charts Component ─────────────────────────────────
function TradingViewCharts() {
  const [input, setInput]         = useState("");
  const [activeSymbol, setActiveSymbol] = useState("");
  const [activeInterval, setActiveInterval] = useState("D");
  const chartRef = useRef(null);

  const intervals = [
    { v: "1",  l: "1m" },
    { v: "5",  l: "5m" },
    { v: "15", l: "15m" },
    { v: "60", l: "1H" },
    { v: "D",  l: "1D" },
    { v: "W",  l: "1W" },
    { v: "M",  l: "1M" },
  ];

  const loadChart = (sym) => {
    const s = sym.trim().toUpperCase();
    if (!s) return;
    setActiveSymbol(s);
  };

  useEffect(() => {
    if (!activeSymbol || !chartRef.current) return;
    chartRef.current.innerHTML = "";
    const container = document.createElement("div");
    container.id = "tv_chart_main";
    chartRef.current.appendChild(container);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: "tv_chart_main",
          symbol: activeSymbol,
          interval: activeInterval,
          timezone: "America/New_York",
          theme: "dark",
          style: "1",
          locale: "es",
          toolbar_bg: "#0d0f1e",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          backgroundColor: C.bg,
          gridColor: "#1a1e3540",
          width: "100%",
          height: 560,
          studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
          show_popup_button: true,
        });
      }
    };
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, [activeSymbol, activeInterval]);

  return (
    <div>
      {/* Search box */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 32px", marginBottom: 24, textAlign: "center" }}>
        <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 3, marginBottom: 12 }}>BUSCA CUALQUIER ACTIVO</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          Acciones · ETFs · Cripto · Materias Primas
        </h2>
        <p style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>
          Escribe el símbolo del activo que quieres analizar — AAPL, BTC, GLD, EUR/USD, lo que sea.
        </p>
        <div style={{ display: "flex", gap: 10, maxWidth: 500, margin: "0 auto", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Ej: AAPL, TSLA, BTC, GLD, EUR/USD..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadChart(input)}
            style={{
              flex: 1, minWidth: 200,
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "14px 18px",
              color: C.text, fontFamily: "'IBM Plex Mono'", fontSize: 15,
              outline: "none", letterSpacing: 1,
            }}
          />
          <button
            onClick={() => loadChart(input)}
            style={{
              background: C.gold, color: "#000", border: "none",
              padding: "14px 28px", borderRadius: 8, cursor: "pointer",
              fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700,
            }}
          >
            Ver Chart →
          </button>
        </div>
      </div>

      {/* Chart area */}
      {activeSymbol ? (
        <div>
          {/* Interval selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.muted, marginRight: 8 }}>INTERVALO:</span>
            {intervals.map(iv => (
              <button key={iv.v} onClick={() => setActiveInterval(iv.v)} style={{
                padding: "6px 14px", borderRadius: 5,
                border: `1px solid ${activeInterval === iv.v ? C.gold : C.border}`,
                background: activeInterval === iv.v ? C.goldBg : "none",
                color: activeInterval === iv.v ? C.gold : C.muted,
                fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>{iv.l}</button>
            ))}
          </div>

          {/* Chart */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "#09091a", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 14, fontWeight: 700, color: C.gold }}>{activeSymbol}</div>
              <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.muted }}>Powered by TradingView · Tiempo real</div>
            </div>
            <div ref={chartRef} style={{ width: "100%", minHeight: 560 }} />
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 32px", background: C.card, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <p style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
            Escribe el símbolo arriba y presiona <strong style={{ color: C.gold }}>Ver Chart</strong> para cargar la gráfica en tiempo real.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            {["SPY","QQQ","AAPL","NVDA","TSLA","BTC","GLD"].map(s => (
              <button key={s} onClick={() => { setInput(s); loadChart(s); }} style={{
                background: C.goldBg, border: `1px solid ${C.gold}40`, color: C.gold,
                padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600,
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Snapshot Card Component ───────────────────────────────────────
function SnapshotCard({ stocks }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState("dark");

  const gainers = stocks.filter(s => s.c > 0).length;
  const pct = Math.round(gainers / stocks.length * 100);
  const sentiment = pct >= 70 ? "ALCISTA 🟢" : pct >= 40 ? "NEUTRAL ⚪" : "BAJISTA 🔴";
  const topMover = [...stocks].sort((a,b) => Math.abs(b.c) - Math.abs(a.c))[0];
  const date = new Date().toLocaleDateString("es-DO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const generateCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1080;
    canvas.width = W;
    canvas.height = H;

    const isDark = style === "dark";
    const bg      = isDark ? "#07080f" : "#f4f5f8";
    const card    = isDark ? "#0d0f1e" : "#ffffff";
    const border  = isDark ? "#1a1e35" : "#e0e4ef";
    const gold    = "#c8a84b";
    const textCol = isDark ? "#dde1f5" : "#1a1d2e";
    const subCol  = isDark ? "#8890b5" : "#555e7a";
    const green   = "#00d68f";
    const red     = "#ff4466";

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Top accent line
    ctx.fillStyle = gold;
    ctx.fillRect(0, 0, W, 6);

    // Header
    ctx.fillStyle = gold;
    ctx.font = "bold 72px Georgia, serif";
    ctx.fillText("FinanzaDR", 60, 100);

    ctx.fillStyle = subCol;
    ctx.font = "28px 'Courier New', monospace";
    ctx.fillText("MARKET SNAPSHOT · " + date.toUpperCase(), 60, 145);

    // Divider
    ctx.fillStyle = border;
    ctx.fillRect(60, 165, W - 120, 2);

    // Sentiment
    ctx.fillStyle = textCol;
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillText("SENTIMIENTO:", 60, 220);
    ctx.fillStyle = pct >= 70 ? green : pct >= 40 ? gold : red;
    ctx.font = "bold 52px Georgia, serif";
    ctx.fillText(sentiment, 60, 285);

    ctx.fillStyle = subCol;
    ctx.font = "26px 'Courier New', monospace";
    ctx.fillText(`${gainers} de ${stocks.length} activos en verde — ${pct}% positivo`, 60, 330);

    // Divider
    ctx.fillStyle = border;
    ctx.fillRect(60, 355, W - 120, 2);

    // Stock grid — 4 columns
    const cols = 4;
    const cellW = (W - 120) / cols;
    const startY = 390;

    stocks.forEach((st, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 60 + col * cellW;
      const y = startY + row * 160;

      // Card bg
      ctx.fillStyle = card;
      roundRect(ctx, x + 8, y, cellW - 16, 140, 12);
      ctx.fill();

      // Left border
      ctx.fillStyle = st.c >= 0 ? green : red;
      ctx.fillRect(x + 8, y, 4, 140);

      // Symbol
      ctx.fillStyle = gold;
      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.fillText(st.s, x + 22, y + 38);

      // Name
      ctx.fillStyle = subCol;
      ctx.font = "18px 'Courier New', monospace";
      const name = st.n.length > 12 ? st.n.substring(0, 12) + "..." : st.n;
      ctx.fillText(name, x + 22, y + 65);

      // Price
      ctx.fillStyle = textCol;
      ctx.font = "bold 30px 'Courier New', monospace";
      const price = st.p >= 1000 ? st.p.toLocaleString("en-US", { maximumFractionDigits: 0 }) : st.p.toFixed(2);
      ctx.fillText(price, x + 22, y + 105);

      // Change
      ctx.fillStyle = st.c >= 0 ? green : red;
      ctx.font = "bold 22px 'Courier New', monospace";
      ctx.fillText(`${st.c >= 0 ? "▲" : "▼"} ${Math.abs(st.c)}%`, x + 22, y + 132);
    });

    // Top Mover
    const tmY = startY + Math.ceil(stocks.length / cols) * 160 + 20;
    ctx.fillStyle = border;
    ctx.fillRect(60, tmY, W - 120, 2);

    ctx.fillStyle = subCol;
    ctx.font = "26px 'Courier New', monospace";
    ctx.fillText("TOP MOVER DEL DÍA:", 60, tmY + 48);
    ctx.fillStyle = gold;
    ctx.font = "bold 48px Georgia, serif";
    ctx.fillText(`${topMover.s} — ${topMover.c >= 0 ? "▲" : "▼"} ${Math.abs(topMover.c)}%`, 60, tmY + 105);

    // Footer
    ctx.fillStyle = border;
    ctx.fillRect(60, H - 100, W - 120, 2);
    ctx.fillStyle = gold;
    ctx.font = "bold 32px 'Courier New', monospace";
    ctx.fillText("finanzadr.com", 60, H - 55);
    ctx.fillStyle = subCol;
    ctx.font = "22px 'Courier New', monospace";
    ctx.fillText("Wall Street en tu idioma · Educación financiera para latinos", W - 60, H - 55);
    ctx.textAlign = "right";
    ctx.fillText("Wall Street en tu idioma · No constituye asesoría de inversión", W - 60, H - 55);
    ctx.textAlign = "left";
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  useEffect(() => { generateCanvas(); }, [stocks, style]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `finanzadr-snapshot-${new Date().toISOString().split("T")[0]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const shareOnX = () => {
    const gainers = stocks.filter(s => s.c > 0).length;
    const text = `📊 Market Snapshot — ${date}\n\n${stocks.slice(0,4).map(s => `${s.s}: ${s.c >= 0 ? "▲" : "▼"}${Math.abs(s.c)}%`).join(" | ")}\n\nSentimiento: ${sentiment} (${pct}%)\n\n#WallStreet #Inversiones #FinanzasDR\n\nfinanzadr.com`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyImage = async () => {
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        downloadImage();
      }
    });
  };

  return (
    <div>
      {/* Style toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["dark", "light"].map(s => (
          <button key={s} onClick={() => setStyle(s)} style={{
            padding: "9px 20px", borderRadius: 8,
            border: `1px solid ${style === s ? C.gold : C.border}`,
            background: style === s ? C.goldBg : "none",
            color: style === s ? C.gold : C.muted,
            fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {s === "dark" ? "🌙 Oscuro" : "☀️ Claro"}
          </button>
        ))}
      </div>

      {/* Canvas preview */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20, overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: 8, display: "block" }} />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={downloadImage} style={{
          background: C.gold, color: "#000", border: "none",
          padding: "13px 24px", borderRadius: 8, cursor: "pointer",
          fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ⬇️ Descargar PNG
        </button>
        <button onClick={copyImage} style={{
          background: copied ? C.green : "none",
          color: copied ? "#000" : C.gold,
          border: `1px solid ${copied ? C.green : C.gold}`,
          padding: "13px 24px", borderRadius: 8, cursor: "pointer",
          fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {copied ? "✅ ¡Copiado!" : "📋 Copiar Imagen"}
        </button>
        <button onClick={shareOnX} style={{
          background: "#000", color: "#fff",
          border: "1px solid #333",
          padding: "13px 24px", borderRadius: 8, cursor: "pointer",
          fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          𝕏 Compartir en X
        </button>
      </div>

      <p style={{ fontSize: 12, color: C.muted, fontFamily: "'IBM Plex Mono'", marginTop: 12 }}>
        💡 Descarga la imagen y súbela a Instagram, TikTok o X para generar tráfico a finanzadr.com
      </p>
    </div>
  );
}
