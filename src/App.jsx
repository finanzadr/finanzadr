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
    <button onClick={fn} style={{ width: 40, background: "#1a1e35", border: "none", color: C.gold, fontSize: 20, cursor: "pointer", borderRadius: dir === "left" ? "8px 0 0 8px" : "0 8px 8px 0", flexShrink: 0 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Modelo</label>
              <select value={modelo} onChange={e => setModelo(e.target.value)} style={selStyle}>
                {["Lineal","Exponencial"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Escenario</label>
              <select value={escenario} onChange={e => setEscenario(e.target.value)} style={selStyle}>
                {["Aportes Constantes","Sin Aportes","Aportes Crecientes"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Valor Final highlight */}
          <div style={{ background: `linear-gradient(135deg,#0f1228,#130f2a)`, border: `2px solid ${C.gold}`, borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
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
      </div>

      {/* Tabla año por año */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'IBM Plex Mono'", fontSize: 12, minWidth: 700 }}>
          <thead>
            <tr style={{ background: "#ffffff08", borderBottom: `1px solid ${C.border}` }}>
              {["Año","Capital Base","Aporte Base","Aporte Total","Capital Total","Retorno","Ganancia","Ganancia Acum.","Valor Final"].map((h,i) => (
                <th key={i} style={{ padding: "10px 12px", fontWeight: 500, textAlign: i===0?"left":"right", color: C.muted, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}20`, background: i%2===0?"transparent":"#ffffff03" }}>
                <td style={{ padding:"10px 12px", color: C.gold }}>{f.ano}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color: C.text }}>{fmtM(f.capitalBase)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color: C.muted }}>{fmtM(f.aporteBase)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color: C.muted }}>{fmtM(f.aporteAcum)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color: C.text, fontWeight:700 }}>{fmtM(f.capitalBase + f.aporteBase)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color: f.retorno>=0?C.green:C.red }}>{fmtPct(f.retorno)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color: C.sub }}>{fmtM(f.ganancia)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color: C.sub }}>{fmtM(f.interesAcum)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", color: C.gold, fontWeight:700 }}>{fmtM(f.saldo)}</td>
              </tr>
            ))}
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
          backgroundColor: "#07080f",
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
              background: "#07080f", border: `1px solid ${C.border}`,
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
