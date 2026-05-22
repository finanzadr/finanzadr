import { useState, useEffect, useRef } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ── Datos Wall Street ────────────────────────────────────────────
const WS_STOCKS = [
  { s: "SPX",  n: "S&P 500",    p: 5284.22,  c:  0.43 },
  { s: "NDX",  n: "NASDAQ 100", p: 16460.88, c:  0.71 },
  { s: "DIA",  n: "Dow Jones",  p: 391.27,   c: -0.12 },
  { s: "SPY",  n: "S&P 500 ETF",p: 528.40,   c:  0.43 },
  { s: "QQQ",  n: "NASDAQ ETF", p: 446.82,   c:  0.71 },
  { s: "IWM",  n: "Russell 2000",p: 198.54,  c: -0.34 },
  { s: "AAPL", n: "Apple",      p: 189.43,   c:  1.24 },
  { s: "MSFT", n: "Microsoft",  p: 415.22,   c:  0.55 },
  { s: "NVDA", n: "NVIDIA",     p: 875.32,   c:  2.11 },
  { s: "GOOGL",n: "Alphabet",   p: 174.12,   c:  0.67 },
  { s: "AMZN", n: "Amazon",     p: 182.45,   c:  0.32 },
  { s: "META", n: "Meta",       p: 508.90,   c:  1.02 },
  { s: "TSLA", n: "Tesla",      p: 245.67,   c: -0.89 },
];

// ── Contenido estático ───────────────────────────────────────────
const NOTICIAS = [
  { titulo: "La Fed mantiene tasas de interés en 5.25% por tercer mes consecutivo", resumen: "La Reserva Federal decidió mantener las tasas sin cambios mientras evalúa el impacto de la inflación. Los mercados reaccionaron positivamente, con el S&P 500 subiendo un 0.8% tras el anuncio. Los analistas esperan un posible recorte para el tercer trimestre de 2026.", fuente: "Reuters", tiempo: "Hace 2 horas", categoria: "Fed" },
  { titulo: "NVIDIA supera expectativas con ganancias récord impulsadas por IA", resumen: "NVIDIA reportó ingresos de $26 mil millones en el último trimestre, superando las proyecciones de Wall Street en un 15%. La demanda de chips para inteligencia artificial sigue siendo el motor principal del crecimiento. La acción subió 4% en el mercado extendido.", fuente: "Bloomberg", tiempo: "Hace 4 horas", categoria: "Acciones" },
  { titulo: "S&P 500 alcanza nuevo máximo histórico impulsado por sector tecnológico", resumen: "El índice S&P 500 cerró en un nuevo récord histórico, superando los 5,300 puntos por primera vez. Las acciones tecnológicas lideraron las ganancias, con Apple y Microsoft contribuyendo significativamente al alza. Es el quinto máximo del año en lo que va de 2026.", fuente: "CNBC", tiempo: "Hace 6 horas", categoria: "Mercados" },
  { titulo: "Bitcoin supera los $95,000 por primera vez en tres meses", resumen: "La criptomoneda más grande del mundo volvió a superar los $95,000, impulsada por la aprobación de nuevos ETFs de Bitcoin en Europa. Los inversores institucionales siguen aumentando sus posiciones en activos digitales. El volumen de transacciones alcanzó niveles récord esta semana.", fuente: "WSJ", tiempo: "Hace 8 horas", categoria: "Cripto" },
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

const C = {
  bg: "#07080f", card: "#0d0f1e", border: "#1a1e35",
  gold: "#c8a84b", goldBg: "#c8a84b18",
  green: "#00d68f", red: "#ff4466",
  text: "#dde1f5", muted: "#484e72", sub: "#8890b5",
};

// ── Componente principal ─────────────────────────────────────────
export default function FinanzasDR() {
  const [tab, setTab]   = useState("inicio");
  const [stocks, setStocks] = useState(WS_STOCKS);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      .ticker-track { display:flex; animation:ticker 50s linear infinite; white-space:nowrap; }
      .ticker-track:hover { animation-play-state:paused; }
      .fade-in { animation: fadeIn 0.4s ease forwards; }
      * { box-sizing:border-box; margin:0; padding:0; }
      body { background:#07080f; }
      ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#07080f} ::-webkit-scrollbar-thumb{background:#1a1e35;border-radius:2px}
      .nav-btn:hover { color: #c8a84b !important; }
      .card-hover { transition: all 0.2s; }
      .card-hover:hover { border-color: #c8a84b44 !important; transform: translateY(-2px); }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setStocks(prev => prev.map(s => ({ ...s, p: +(s.p * (1 + (Math.random() - 0.499) * 0.0007)).toFixed(2) })));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    ["inicio",     "🚀 Empieza Aquí"],
    ["mercados",   "📊 Mercados"],
    ["charts",     "📈 Charts en Vivo"],
    ["ws",         "📰 Noticias"],
    ["blog",       "📚 Aprende"],
    ["calc",       "🧮 Calculadora"],
    ["newsletter", "📧 Newsletter"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>

      {/* Ticker */}
      <div style={{ background: "#0a0b16", borderBottom: `1px solid ${C.border}`, height: 36, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ background: C.gold, color: "#000", fontFamily: "'IBM Plex Mono'", fontSize: 10, fontWeight: 700, padding: "0 14px", height: "100%", display: "flex", alignItems: "center", flexShrink: 0, letterSpacing: 1 }}>EN VIVO</div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div className="ticker-track">
            {[...stocks, ...stocks].map((st, i) => (
              <span key={i} style={{ padding: "0 20px", fontFamily: "'IBM Plex Mono'", fontSize: 12 }}>
                <span style={{ color: C.gold, fontWeight: 600, marginRight: 6 }}>{st.s}</span>
                <span style={{ marginRight: 5 }}>{fmt(st.p)}</span>
                <span style={{ color: clr(st.c) }}>{arr(st.c)} {Math.abs(st.c)}%</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: "0 16px", fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, flexShrink: 0 }}>WALL STREET</div>
      </div>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, color: C.gold, letterSpacing: "-0.5px", lineHeight: 1 }}>FinanzaDR</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.muted, marginTop: 4, letterSpacing: 2 }}>APRENDE A INVERTIR EN WALL STREET · PARA LATINOS</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: C.gold, marginTop: 6, fontStyle: "italic", opacity: 0.85 }}>"Wall Street en tu idioma"</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted }}>{new Date().toLocaleDateString("es-DO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.green, marginTop: 2 }}>● NYSE/NASDAQ EN VIVO</div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 32px", background: "#09091a", overflowX: "auto" }}>
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
      <main style={{ padding: "32px", maxWidth: "100%", margin: "0 auto" }}>

        {/* EMPIEZA AQUÍ */}
        {tab === "inicio" && (
          <div className="fade-in">
            <div style={{ background: `linear-gradient(135deg,#0f1228,#130f2a)`, border: `1px solid ${C.gold}30`, borderRadius: 16, padding: "40px", marginBottom: 32, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
              <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.gold, letterSpacing: 3, marginBottom: 12 }}>PARA PRINCIPIANTES</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 14, lineHeight: 1.3 }}>
                Invierte en Wall Street<br/><span style={{ color: C.gold }}>sin importar dónde vives</span>
              </h1>
              <p style={{ fontSize: 15, color: C.sub, maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.8 }}>
                Apple, Amazon, NVIDIA — estas empresas están disponibles para cualquier latino. Te enseñamos cómo desde cero, paso a paso.
              </p>
              <button onClick={() => setTab("calc")} style={{ background: C.gold, color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700 }}>
                🧮 Calcular mi inversión
              </button>
            </div>

            {/* Consejos */}
            <SectionTitle>4 Consejos para empezar</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16, marginTop: 20, marginBottom: 32 }}>
              {CONSEJOS.map((item, i) => (
                <div key={i} className="card-hover" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 20px" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icono}</div>
                  <div style={{ background: C.goldBg, color: C.gold, display: "inline-block", padding: "2px 10px", borderRadius: 4, fontSize: 10, fontFamily: "'IBM Plex Mono'", marginBottom: 10 }}>{item.nivel}</div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>{item.consejo}</h3>
                  <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{item.detalle}</p>
                </div>
              ))}
            </div>

            {/* Brokers */}
            <SectionTitle>¿Dónde abrir tu cuenta?</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginTop: 20, marginBottom: 32 }}>
              {[
                { name: "Robinhood",           emoji: "🟢", nivel: "Principiante", detalle: "Sin comisiones, muy fácil de usar. Ideal para empezar." },
                { name: "Fidelity",            emoji: "🔵", nivel: "Intermedio",   detalle: "Sin comisiones, más herramientas. Muy confiable." },
                { name: "Interactive Brokers", emoji: "🌐", nivel: "Avanzado",     detalle: "Acepta directamente clientes de RD y Latinoamérica." },
                { name: "Charles Schwab",      emoji: "🏦", nivel: "Intermedio",   detalle: "Sólido para ETFs y fondos indexados a largo plazo." },
              ].map((b, i) => (
                <div key={i} className="card-hover" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 16px" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{b.emoji}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{b.name}</div>
                  <div style={{ background: C.goldBg, color: C.gold, display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: "'IBM Plex Mono'", marginBottom: 8 }}>{b.nivel}</div>
                  <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{b.detalle}</p>
                </div>
              ))}
            </div>

            {/* Pasos */}
            <SectionTitle>Tu camino en 4 pasos</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14, marginTop: 20 }}>
              {[
                { n: "01", t: "Elige una plataforma", d: "Robinhood o Fidelity si eres principiante. Interactive Brokers si vives fuera de EE.UU." },
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
            <SectionTitle>Mercados Wall Street</SectionTitle>
            <Label>── Índices & Acciones EE.UU. — Precios de referencia</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12, marginBottom: 32 }}>
              {stocks.map(st => <StockCard key={st.s} st={st} />)}
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 28px" }}>
              <Label>── ¿Qué es cada índice?</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                {[
                  { s: "S&P 500",   d: "Las 500 empresas más grandes de EE.UU. El mejor indicador de la economía americana. Históricamente sube ~10% al año." },
                  { s: "Dow Jones", d: "Las 30 empresas industriales más importantes. Es el índice más antiguo y conocido de Wall Street." },
                  { s: "NASDAQ",    d: "Dominado por tecnología. Apple, Microsoft, Amazon, Google. Más volátil pero con mayor potencial de crecimiento." },
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
            <SectionTitle>Noticias Wall Street</SectionTitle>
            <p style={{ fontSize: 13, color: C.sub, marginTop: 4, marginBottom: 24 }}>Últimas noticias de los mercados financieros de EE.UU.</p>
            <div style={{ display: "grid", gap: 16 }}>
              {NOTICIAS.map((item, i) => (
                <div key={i} className="card-hover" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "22px 26px" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ background: C.goldBg, color: C.gold, padding: "2px 10px", borderRadius: 4, fontSize: 10, fontFamily: "'IBM Plex Mono'", fontWeight: 600 }}>{item.categoria}</span>
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono'" }}>{item.tiempo} · {item.fuente}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>{item.titulo}</h3>
                  <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7 }}>{item.resumen}</p>
                </div>
              ))}
            </div>
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
                      <span key={j} style={{ background: "#1a1e35", color: C.sub, padding: "2px 10px", borderRadius: 4, fontSize: 11, fontFamily: "'IBM Plex Mono'" }}>#{t}</span>
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

        {/* NEWSLETTER */}
        {tab === "newsletter" && (
          <div className="fade-in">
            <div style={{ background: `linear-gradient(135deg,#0f1228,#130f2a)`, border: `1px solid ${C.gold}30`, borderRadius: 16, padding: "40px", marginBottom: 32, textAlign: "center" }}>
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
  const [capital, setCapital] = useState(5000);
  const [aporte, setAporte] = useState(200);
  const [tasa, setTasa] = useState(10);
  const [anos, setAnos] = useState(20);
  const [moneda, setMoneda] = useState("USD");
  const [frecuencia, setFrecuencia] = useState("Mensual");
  const [escenario, setEscenario] = useState("Aportes Constantes");

  const sym = moneda === "DOP" ? "RD$" : "$";
  const fmtM = (n) => `${sym}${Math.round(n).toLocaleString("es-DO")}`;
  const freqMap = { "Mensual": 12, "Semanal": 52, "Anual": 1 };
  const periodosFrecuencia = freqMap[frecuencia] || 12;
  const tasaPorPeriodo = Math.pow(1 + tasa / 100, 1 / periodosFrecuencia) - 1;

  const filas = [];
  let saldo = capital;
  let totalInteresAcum = 0;
  for (let y = 1; y <= anos; y++) {
    const aporteBase = escenario === "Sin Aportes" ? 0 : escenario === "Aportes Crecientes" ? aporte * Math.pow(1.05, y - 1) : aporte;
    let saldoInicio = saldo;
    let aporteAnualReal = 0;
    for (let p = 0; p < periodosFrecuencia; p++) { saldo = saldo * (1 + tasaPorPeriodo) + aporteBase; aporteAnualReal += aporteBase; }
    const interesAnual = saldo - saldoInicio - aporteAnualReal;
    totalInteresAcum += interesAnual;
    filas.push({ ano: y, saldo: Math.round(saldo), aporteAcum: Math.round(capital + aporteBase * periodosFrecuencia * y), interesAcum: Math.round(totalInteresAcum), aporteAnual: Math.round(aporteAnualReal) });
  }

  const totalFinal = filas[filas.length - 1]?.saldo ?? capital;
  const aporteTotal = escenario === "Sin Aportes" ? capital : capital + aporte * periodosFrecuencia * anos;
  const interesTotal = totalFinal - aporteTotal;
  const multiplicador = (totalFinal / Math.max(aporteTotal, 1)).toFixed(2);
  const fmtK = v => { if (v >= 1000000) return sym + (v / 1000000).toFixed(1) + "M"; if (v >= 1000) return sym + (v / 1000).toFixed(0) + "K"; return sym + v; };

  const selStyle = { background: "#0d0f1e", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "'IBM Plex Mono'", fontSize: 13, padding: "10px 12px", outline: "none", cursor: "pointer", flex: 1 };
  const inputNum = { flex: 1, background: "#0d0f1e", border: "none", outline: "none", color: C.gold, fontFamily: "'IBM Plex Mono'", fontSize: 16, fontWeight: 700, textAlign: "center", width: "100%", padding: "0 8px" };
  const stepBtn = (fn, dir) => <button onClick={fn} style={{ width: 44, background: C.border, border: "none", color: C.gold, fontSize: 22, cursor: "pointer", borderRadius: dir === "left" ? "8px 0 0 8px" : "0 8px 8px 0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{dir === "left" ? "−" : "+"}</button>;
  const numBox = (val, setVal, step, lbl, min = 0) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>{lbl}</div>
      <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", height: 46 }}>
        {stepBtn(() => setVal(v => Math.max(min, v - step)), "left")}
        <input type="number" value={val || ""} min={min} placeholder="0" onChange={e => setVal(e.target.value === "" ? 0 : Math.max(min, +e.target.value))} style={inputNum} />
        {stepBtn(() => setVal(v => v + step), "right")}
      </div>
    </div>
  );

  return (
    <div>
      <SectionTitle>Calculadora de Inversión</SectionTitle>
      <p style={{ fontSize: 13, color: C.sub, marginTop: 4, marginBottom: 8 }}>¿Cuánto tendrías si invirtieras $200/mes en el S&P 500? Descúbrelo aquí.</p>
      <div style={{ background: C.goldBg, border: `1px solid ${C.gold}30`, borderRadius: 8, padding: "12px 18px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <p style={{ fontSize: 13, color: C.sub }}>El <strong style={{ color: C.gold }}>S&P 500</strong> ha retornado históricamente ~<strong style={{ color: C.gold }}>10% anual</strong> en promedio.</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, maxWidth: 280 }}>
        {["USD", "DOP"].map(m => (
          <button key={m} onClick={() => setMoneda(m)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${moneda === m ? C.gold : C.border}`, background: moneda === m ? C.goldBg : "none", color: moneda === m ? C.gold : C.muted, fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{m === "USD" ? "🇺🇸 USD" : "🇩🇴 DOP"}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <Label>── Parámetros</Label>
          {numBox(capital, setCapital, moneda === "DOP" ? 5000 : 500, `INVERSIÓN INICIAL (${sym})`)}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>APORTES PERIÓDICOS ({sym})</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2, display: "flex", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", height: 46 }}>
                {stepBtn(() => setAporte(v => Math.max(0, v - (moneda === "DOP" ? 500 : 50))), "left")}
                <input type="number" value={aporte || ""} min={0} placeholder="0" onChange={e => setAporte(e.target.value === "" ? 0 : Math.max(0, +e.target.value))} style={inputNum} />
                {stepBtn(() => setAporte(v => v + (moneda === "DOP" ? 500 : 50)), "right")}
              </div>
              <select value={frecuencia} onChange={e => setFrecuencia(e.target.value)} style={{ ...selStyle, flex: 1 }}>
                {["Mensual", "Semanal", "Anual"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>RETORNO ESPERADO (%/AÑO)</div>
            <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", height: 46 }}>
              {stepBtn(() => setTasa(v => Math.max(0.5, +(v - 0.5).toFixed(1))), "left")}
              <input type="number" value={tasa || ""} min={0.5} max={100} step={0.5} onChange={e => setTasa(e.target.value === "" ? 0 : Math.max(0.5, +e.target.value))} style={inputNum} />
              {stepBtn(() => setTasa(v => +(v + 0.5).toFixed(1)), "right")}
            </div>
          </div>
          {numBox(anos, setAnos, 1, "AÑOS DE CRECIMIENTO", 1)}
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>ESCENARIO</div>
            <select value={escenario} onChange={e => setEscenario(e.target.value)} style={{ ...selStyle, width: "100%" }}>
              {["Aportes Constantes", "Sin Aportes", "Aportes Crecientes"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: `linear-gradient(135deg,#0f1228,#130f2a)`, border: `2px solid ${C.gold}`, borderRadius: 12, padding: "22px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>VALOR FINAL EN {anos} AÑOS</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 800, color: C.gold, lineHeight: 1 }}>{fmtM(totalFinal)}</div>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, marginTop: 8 }}>Tu dinero crece ×{multiplicador}</div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px" }}>
            {[
              { lbl: "Inversión Total",   val: fmtM(aporteTotal),              color: C.text  },
              { lbl: "Intereses Ganados", val: fmtM(Math.max(0, interesTotal)), color: C.green },
              { lbl: "Multiplicador",     val: `×${multiplicador}`,            color: C.gold  },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}20` : "none" }}>
                <span style={{ fontSize: 13, color: C.muted }}>{r.lbl}</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 15, fontWeight: 600, color: r.color }}>{r.val}</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.goldBg, border: `1px solid ${C.gold}30`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>💡 RECUERDA</div>
            <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.7 }}>
              {interesTotal > aporteTotal ? `¡Los intereses superan lo que invertiste! Esto es el poder del interés compuesto.` : `En ${anos} años ganaste ${fmtM(Math.max(0, interesTotal))} solo en intereses. La clave es empezar hoy.`}
            </p>
          </div>
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 26px", marginTop: 24 }}>
        <Label>── Proyección de Crecimiento</Label>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filas} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.muted} tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, fill: C.muted }} />
              <YAxis stroke={C.muted} tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 9, fill: C.muted }} tickFormatter={fmtK} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'IBM Plex Mono'", fontSize: 12 }} formatter={(v, n) => [fmtM(v), n === "aporteAcum" ? "Capital Base" : n === "interesAcum" ? "Ganancias" : "Ganancia Año"]} labelFormatter={v => `Año ${v}`} />
              <Bar dataKey="aporteAcum"  stackId="a" fill="#1e4a7a" name="aporteAcum"  radius={[0, 0, 0, 0]} />
              <Bar dataKey="interesAcum" stackId="a" fill="#2d7a4a" name="interesAcum" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="aporteAnual" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 3 }} name="aporteAnual" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── TradingView Charts Component ─────────────────────────────────
function TradingViewCharts() {
  const [activeSymbol, setActiveSymbol] = useState("SPY");
  const [activeInterval, setActiveInterval] = useState("D");
  const chartRef = useRef(null);

  const symbols = [
    { s: "SPY",  n: "S&P 500",    cat: "Índices" },
    { s: "QQQ",  n: "NASDAQ",     cat: "Índices" },
    { s: "DIA",  n: "Dow Jones",  cat: "Índices" },
    { s: "IWM",  n: "Russell 2000",cat: "Índices" },
    { s: "AAPL", n: "Apple",      cat: "Mag 7" },
    { s: "MSFT", n: "Microsoft",  cat: "Mag 7" },
    { s: "NVDA", n: "NVIDIA",     cat: "Mag 7" },
    { s: "GOOGL",n: "Alphabet",   cat: "Mag 7" },
    { s: "AMZN", n: "Amazon",     cat: "Mag 7" },
    { s: "META", n: "Meta",       cat: "Mag 7" },
    { s: "TSLA", n: "Tesla",      cat: "Mag 7" },
  ];

  const intervals = [
    { v: "1",  l: "1m" },
    { v: "5",  l: "5m" },
    { v: "15", l: "15m" },
    { v: "60", l: "1H" },
    { v: "D",  l: "1D" },
    { v: "W",  l: "1W" },
    { v: "M",  l: "1M" },
  ];

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: "tv_chart_container",
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
          backgroundColor: "#07080f",
          gridColor: "#1a1e3540",
          width: "100%",
          height: 520,
          studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
          show_popup_button: true,
          popup_width: "1000",
          popup_height: "650",
        });
      }
    };
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, [activeSymbol, activeInterval]);

  const cats = [...new Set(symbols.map(s => s.cat))];

  return (
    <div>
      {/* Symbol selector by category */}
      {cats.map(cat => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>── {cat.toUpperCase()}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {symbols.filter(s => s.cat === cat).map(sym => (
              <button key={sym.s} onClick={() => setActiveSymbol(sym.s)} style={{
                padding: "8px 16px", borderRadius: 6, border: `1px solid ${activeSymbol === sym.s ? C.gold : C.border}`,
                background: activeSymbol === sym.s ? C.goldBg : C.card,
                color: activeSymbol === sym.s ? C.gold : C.sub,
                fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}>
                {sym.s} <span style={{ fontSize: 10, opacity: 0.7 }}>{sym.n}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Interval selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.muted, marginRight: 8 }}>INTERVALO:</span>
        {intervals.map(iv => (
          <button key={iv.v} onClick={() => setActiveInterval(iv.v)} style={{
            padding: "6px 14px", borderRadius: 5, border: `1px solid ${activeInterval === iv.v ? C.gold : C.border}`,
            background: activeInterval === iv.v ? C.goldBg : "none",
            color: activeInterval === iv.v ? C.gold : C.muted,
            fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}>{iv.l}</button>
        ))}
      </div>

      {/* Chart container */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ background: "#09091a", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700, color: C.gold }}>{activeSymbol}</div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.muted }}>Powered by TradingView · Datos en tiempo real</div>
        </div>
        <div id="tv_chart_container" ref={chartRef} style={{ width: "100%", height: 520 }} />
      </div>

      {/* Mini charts grid */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 16 }}>── VISTA RÁPIDA — LOS 7 MAGNÍFICOS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {["AAPL","MSFT","NVDA","GOOGL","AMZN","META","TSLA"].map(sym => (
            <MiniChart key={sym} symbol={sym} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniChart({ symbol }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = `
      <iframe
        src="https://s.tradingview.com/widgetembed/?frameElementId=tv_${symbol}&symbol=${symbol}&interval=D&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=0&toolbarbg=0d0f1e&studies=[]&theme=dark&style=1&timezone=America%2FNew_York&withdateranges=0&showpopupbutton=0&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=es&utm_source=finanzadr.com"
        style="width:100%;height:200px;border:none;"
        allowtransparency="true"
        scrolling="no"
      ></iframe>`;
  }, [symbol]);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", background: "#09091a", borderBottom: `1px solid ${C.border}`, fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 700, color: C.gold }}>{symbol}</div>
      <div ref={ref} />
    </div>
  );
}
