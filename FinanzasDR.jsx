import { useState, useEffect } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ── Datos base Wall Street ───────────────────────────────────────
const WS_STOCKS = [
  { s: "SPX",  n: "S&P 500",    p: 5284.22, c:  0.43 },
  { s: "DJI",  n: "Dow Jones",  p: 39127.14,c: -0.12 },
  { s: "NDX",  n: "NASDAQ",     p: 16460.88,c:  0.71 },
  { s: "AAPL", n: "Apple",      p: 189.43,  c:  1.24 },
  { s: "NVDA", n: "NVIDIA",     p: 875.32,  c:  2.11 },
  { s: "TSLA", n: "Tesla",      p: 245.67,  c: -0.89 },
  { s: "MSFT", n: "Microsoft",  p: 415.22,  c:  0.55 },
  { s: "AMZN", n: "Amazon",     p: 182.45,  c:  0.32 },
  { s: "GOOG", n: "Alphabet",   p: 174.12,  c:  0.67 },
  { s: "META", n: "Meta",       p: 508.90,  c:  1.02 },
];

// ── Claude API ───────────────────────────────────────────────────
async function fetchAIContent(topic) {
  const prompts = {
    ws:   `Busca las noticias MÁS RECIENTES de Wall Street y mercados financieros de EE.UU. de hoy mayo 2026. Devuelve SOLO un array JSON válido (sin backticks ni texto extra) con exactamente 4 objetos: [{"titulo":"...","resumen":"párrafo de 2-3 oraciones...","fuente":"Bloomberg/Reuters/CNBC/WSJ","tiempo":"Hace X horas","categoria":"Mercados/Acciones/Fed/Cripto"}]`,
    blog: `Escribe 3 artículos educativos sobre cómo invertir en Wall Street para principiantes hispanohablantes en mayo 2026. Incluye datos reales, cómo abrir cuentas, qué son los ETFs, S&P 500, etc. Devuelve SOLO array JSON válido (sin backticks): [{"titulo":"...","extracto":"resumen de 1 oración...","contenido":"guía detallada de 200+ palabras con pasos concretos","autor":"Equipo FinanzasDR","fecha":"Mayo 2026","tags":["tag1","tag2","tag3"]}]`,
    inicio: `Da 4 consejos clave para alguien que quiere invertir en Wall Street por primera vez desde Latinoamérica en 2026. Plataformas recomendadas, cuánto dinero mínimo, riesgos. Devuelve SOLO array JSON válido (sin backticks): [{"consejo":"...","detalle":"2-3 oraciones explicando...","icono":"emoji relevante","nivel":"Principiante/Intermedio"}]`,
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompts[topic] }],
    }),
  });

  const data = await res.json();
  const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  const clean = text.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(clean);
}

// ── Alpha Vantage ────────────────────────────────────────────────
const AV_KEY = "CQLDESNZYV63A8TL";
const AV_SYMBOLS = [
  { s:"SPY",  n:"S&P 500 ETF"  },
  { s:"DIA",  n:"Dow Jones ETF"},
  { s:"QQQ",  n:"NASDAQ ETF"   },
  { s:"AAPL", n:"Apple"        },
  { s:"NVDA", n:"NVIDIA"       },
  { s:"TSLA", n:"Tesla"        },
  { s:"MSFT", n:"Microsoft"    },
  { s:"AMZN", n:"Amazon"       },
  { s:"GOOG", n:"Alphabet"     },
  { s:"META", n:"Meta"         },
];

async function fetchRealPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${AV_KEY}`;
  const res  = await fetch(url);
  const data = await res.json();
  const q    = data["Global Quote"];
  if (!q || !q["05. price"]) return null;
  return {
    s: symbol,
    n: AV_SYMBOLS.find(x => x.s === symbol)?.n || symbol,
    p: parseFloat(q["05. price"]),
    c: parseFloat(q["10. change percent"]?.replace("%","") || 0),
  };
}

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clr = (c) => c >= 0 ? "#00d68f" : "#ff4466";
const arr = (c) => c >= 0 ? "▲" : "▼";

const C = {
  bg: "#07080f", card: "#0d0f1e", border: "#1a1e35",
  gold: "#c8a84b", goldBg: "#c8a84b18",
  green: "#00d68f", red: "#ff4466",
  text: "#dde1f5", muted: "#484e72", sub: "#8890b5",
  blue: "#4a9eff",
};

// ── Componente principal ─────────────────────────────────────────
export default function FinanzasDR() {
  const [tab, setTab]     = useState("inicio");
  const [stocks, setStocks] = useState(WS_STOCKS);
  const [content, setContent] = useState({ ws: [], blog: [], inicio: [] });
  const [loading, setLoading] = useState({ ws: false, blog: false, inicio: false });
  const [err, setErr]     = useState({ ws: null, blog: null, inicio: null });
  const [expanded, setExpanded] = useState(null);
  const [realLoading, setRealLoading] = useState(false);
  const [realErr, setRealErr]         = useState(null);
  const [lastUpdate, setLastUpdate]   = useState(null);

  // Cargar precios reales
  const loadRealPrices = async () => {
    setRealLoading(true);
    setRealErr(null);
    try {
      const results = [];
      for (const sym of AV_SYMBOLS) {
        const data = await fetchRealPrice(sym.s);
        if (data) results.push(data);
        await new Promise(r => setTimeout(r, 300));
      }
      if (results.length > 0) {
        setStocks(results);
        setLastUpdate(new Date().toLocaleTimeString("es-DO"));
      }
    } catch(e) {
      setRealErr("No se pudo conectar. Mostrando precios de referencia.");
    }
    setRealLoading(false);
  };

  // Fonts y estilos globales
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
      body { background:${C.bg}; }
      ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:${C.bg}} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
      .nav-btn { transition: color 0.2s, border-color 0.2s; }
      .nav-btn:hover { color: #c8a84b !important; }
      .ai-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
      .card-hover { transition: all 0.2s; }
      .card-hover:hover { border-color: #c8a84b44 !important; transform: translateY(-2px); }
      .broker-card:hover { border-color: #c8a84b !important; background: #c8a84b10 !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  // Fluctuación de precios
  useEffect(() => {
    const t = setInterval(() => {
      setStocks(prev => prev.map(s => ({ ...s, p: +(s.p * (1 + (Math.random() - 0.499) * 0.0007)).toFixed(2) })));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const loadContent = async (topic) => {
    setLoading(p => ({ ...p, [topic]: true }));
    setErr(p => ({ ...p, [topic]: null }));
    try {
      const data = await fetchAIContent(topic);
      setContent(p => ({ ...p, [topic]: data }));
    } catch (e) {
      setErr(p => ({ ...p, [topic]: "Error al cargar. Verifica tu conexión e intenta de nuevo." }));
    }
    setLoading(p => ({ ...p, [topic]: false }));
  };

  const tabs = [
    ["inicio",     "🚀 Empieza Aquí"],
    ["mercados",   "📊 Mercados"],
    ["ws",         "📰 Noticias"],
    ["blog",       "📚 Aprende"],
    ["calc",       "🧮 Calculadora"],
    ["newsletter", "📧 Newsletter"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Ticker ──────────────────────────────────── */}
      <div style={{ background: "#0a0b16", borderBottom: `1px solid ${C.border}`, height: 36, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ background: C.gold, color: "#000", fontFamily: "'IBM Plex Mono'", fontSize: 10, fontWeight: 700, padding: "0 14px", height: "100%", display: "flex", alignItems: "center", flexShrink: 0, letterSpacing: 1 }}>
          EN VIVO
        </div>
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
        <div style={{ padding: "0 16px", fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, flexShrink: 0 }}>
          WALL STREET
        </div>
      </div>

      {/* ── Header ──────────────────────────────────── */}
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, color: C.gold, letterSpacing: "-0.5px", lineHeight: 1 }}>
            FinanzasDR
          </div>
              <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.muted, marginTop: 4, letterSpacing: 2 }}>
            APRENDE A INVERTIR EN WALL STREET · PARA LATINOS
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: C.gold, marginTop: 6, fontStyle: "italic", opacity: 0.85 }}>
            "Wall Street en tu idioma"
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted }}>
            {new Date().toLocaleDateString("es-DO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.green, marginTop: 2 }}>
            ● NYSE/NASDAQ EN VIVO
          </div>
        </div>
      </header>

      {/* ── Nav ─────────────────────────────────────── */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 32px", background: "#09091a", overflowX: "auto" }}>
        {tabs.map(([id, label]) => (
          <button key={id} className="nav-btn" onClick={() => setTab(id)} style={{
            padding: "14px 22px", border: "none", background: "none", cursor: "pointer",
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
            color: tab === id ? C.gold : C.muted,
            borderBottom: tab === id ? `2px solid ${C.gold}` : "2px solid transparent",
          }}>
            {label}
          </button>
        ))}
      </nav>

      {/* ── Contenido ───────────────────────────────── */}
      <main style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── EMPIEZA AQUÍ ── */}
        {tab === "inicio" && (
          <div className="fade-in">
            {/* Hero */}
            <div style={{ background: `linear-gradient(135deg, #0f1228, #130f2a)`, border: `1px solid ${C.gold}30`, borderRadius: 16, padding: "40px 40px", marginBottom: 32, textAlign: "center" }}>
              <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.gold, letterSpacing: 3, marginBottom: 12 }}>PARA PRINCIPIANTES</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 14, lineHeight: 1.3 }}>
                Invierte en Wall Street<br />
                <span style={{ color: C.gold }}>sin importar dónde vives</span>
              </h1>
              <p style={{ fontSize: 15, color: C.sub, maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.8 }}>
                Apple, Amazon, NVIDIA — estas empresas están disponibles para cualquier latino. Te enseñamos cómo desde cero, paso a paso.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <AIButton onClick={() => loadContent("inicio")} loading={loading.inicio} label="Ver consejos con IA" />
                <button onClick={() => setTab("calc")} style={{
                  background: "none", border: `1px solid ${C.border}`, color: C.sub,
                  padding: "11px 22px", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600,
                }}>
                  🧮 Calcular mi inversión
                </button>
              </div>
            </div>

            {/* Consejos IA */}
            {err.inicio && <ErrBanner msg={err.inicio} />}
            {loading.inicio && <Loader text="Consultando las mejores estrategias para principiantes..." />}
            {!loading.inicio && content.inicio.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
                {content.inicio.map((item, i) => (
                  <div key={i} className="card-hover" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 20px" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icono}</div>
                    <div style={{ background: C.goldBg, color: C.gold, display: "inline-block", padding: "2px 10px", borderRadius: 4, fontSize: 10, fontFamily: "'IBM Plex Mono'", marginBottom: 10 }}>{item.nivel}</div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>{item.consejo}</h3>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{item.detalle}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Brokers recomendados */}
            <SectionTitle>¿Dónde abrir tu cuenta?</SectionTitle>
            <p style={{ fontSize: 13, color: C.sub, marginTop: 4, marginBottom: 20 }}>Plataformas que aceptan clientes latinoamericanos</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 32 }}>
              {[
                { name: "Robinhood",            emoji: "🟢", nivel: "Principiante", detalle: "Sin comisiones, muy fácil de usar. Ideal para empezar." },
                { name: "Fidelity",             emoji: "🔵", nivel: "Intermedio",   detalle: "Sin comisiones, más herramientas. Muy confiable." },
                { name: "Interactive Brokers",  emoji: "🌐", nivel: "Avanzado",     detalle: "Acepta directamente clientes de RD y Latinoamérica." },
                { name: "Charles Schwab",       emoji: "🏦", nivel: "Intermedio",   detalle: "Sólido para ETFs y fondos indexados a largo plazo." },
              ].map((b, i) => (
                <div key={i} className="card-hover broker-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 16px", cursor: "default", transition: "all 0.2s" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{b.emoji}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{b.name}</div>
                  <div style={{ background: C.goldBg, color: C.gold, display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: "'IBM Plex Mono'", marginBottom: 8 }}>{b.nivel}</div>
                  <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{b.detalle}</p>
                </div>
              ))}
            </div>

            {/* Pasos */}
            <SectionTitle>Tu camino en 4 pasos</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 14, marginTop: 20 }}>
              {[
                { n: "01", t: "Elige una plataforma", d: "Robinhood o Fidelity si eres principiante. Interactive Brokers si vives fuera de EE.UU." },
                { n: "02", t: "Abre tu cuenta", d: "Necesitas pasaporte, dirección y un método de pago internacional. El proceso es 100% online." },
                { n: "03", t: "Empieza con ETFs", d: "El S&P 500 (SPY o VOO) es el mejor inicio. 500 empresas, un solo producto, bajo riesgo." },
                { n: "04", t: "Invierte consistente", d: "Más importante que el monto es la consistencia. $50/mes durante 20 años supera $10,000 de golpe." },
              ].map((s, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 18px" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: `${C.gold}40`, marginBottom: 10 }}>{s.n}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 8 }}>{s.t}</div>
                  <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MERCADOS ── */}
        {tab === "mercados" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <SectionTitle>Mercados Wall Street</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {lastUpdate && <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.green }}>✓ Actualizado {lastUpdate}</span>}
                {realErr   && <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.red }}>⚠ {realErr}</span>}
                <AIButton onClick={loadRealPrices} loading={realLoading} label="🔴 Precios Reales" />
              </div>
            </div>
            <Label>── Índices & Acciones EE.UU. {realLoading ? "— Cargando precios reales..." : lastUpdate ? "— Alpha Vantage" : "— Precios de referencia"}</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 32 }}>
              {stocks.map(st => <StockCard key={st.s} st={st} />)}
            </div>

            {/* Qué significan los índices */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 28px" }}>
              <Label>── ¿Qué es cada índice?</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 16 }}>
                {[
                  { s: "S&P 500", d: "Las 500 empresas más grandes de EE.UU. El mejor indicador de la economía americana. Históricamente sube ~10% al año." },
                  { s: "Dow Jones", d: "Las 30 empresas industriales más importantes. Es el índice más antiguo y conocido de Wall Street." },
                  { s: "NASDAQ", d: "Dominado por tecnología. Apple, Microsoft, Amazon, Google. Más volátil pero con mayor potencial de crecimiento." },
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

        {/* ── NOTICIAS ── */}
        {tab === "ws" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
              <div>
                <SectionTitle>Noticias Wall Street</SectionTitle>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>Últimas noticias de los mercados financieros con IA en tiempo real</p>
              </div>
              <AIButton onClick={() => loadContent("ws")} loading={loading.ws} label="Cargar noticias con IA" />
            </div>
            {err.ws && <ErrBanner msg={err.ws} />}
            {loading.ws && <Loader text="Consultando Bloomberg, Reuters y CNBC..." />}
            {!loading.ws && content.ws.length > 0 && (
              <div style={{ display: "grid", gap: 16 }}>
                {content.ws.map((item, i) => <NewsCard key={i} item={item} />)}
              </div>
            )}
            {!loading.ws && content.ws.length === 0 && !err.ws && (
              <EmptyState icon="📰" text="Pulsa el botón para cargar las últimas noticias de Wall Street con búsqueda web en tiempo real." />
            )}
          </div>
        )}

        {/* ── APRENDE ── */}
        {tab === "blog" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
              <div>
                <SectionTitle>Aprende a Invertir</SectionTitle>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>Guías y análisis generados con IA para inversores principiantes e intermedios</p>
              </div>
              <AIButton onClick={() => loadContent("blog")} loading={loading.blog} label="Generar guías con IA" />
            </div>
            {err.blog && <ErrBanner msg={err.blog} />}
            {loading.blog && <Loader text="Redactando guías de inversión para principiantes..." />}
            {!loading.blog && content.blog.length > 0 && (
              <div style={{ display: "grid", gap: 24 }}>
                {content.blog.map((post, i) => (
                  <BlogCard key={i} post={post} open={expanded === i} onToggle={() => setExpanded(expanded === i ? null : i)} />
                ))}
              </div>
            )}
            {!loading.blog && content.blog.length === 0 && !err.blog && (
              <EmptyState icon="📚" text="Genera guías completas sobre cómo invertir en Wall Street, ETFs, S&P 500, acciones individuales y más." />
            )}
          </div>
        )}

        {/* ── CALCULADORA ── */}
        {tab === "calc" && (
          <div className="fade-in">
            <CompoundCalc />
          </div>
        )}

        {/* ── NEWSLETTER ── */}
        {tab === "newsletter" && (
          <div className="fade-in">
            <div style={{ background:"linear-gradient(135deg,#0f1228,#130f2a)", border:"1px solid rgba(200,168,75,0.3)", borderRadius:16, padding:"40px", marginBottom:32, textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📈</div>
              <div style={{ fontFamily:"IBM Plex Mono,monospace", fontSize:11, color:"#c8a84b", letterSpacing:3, marginBottom:12 }}>GRATIS · CADA SEMANA</div>
              <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:32, fontWeight:800, color:"#dde1f5", marginBottom:14, lineHeight:1.3 }}>Lo más importante de Wall Street en tu idioma</h1>
              <p style={{ fontSize:15, color:"#8890b5", maxWidth:480, margin:"0 auto 32px", lineHeight:1.8 }}>Cada semana un resumen claro de los mercados para inversores latinos.</p>
              <div style={{ maxWidth:480, margin:"0 auto" }}><NewsletterForm /></div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "20px 32px", textAlign: "center", fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, marginTop: 40 }}>
        FinanzasDR © 2026 · Educación financiera para latinos · No constituye asesoría de inversión · Powered by Claude AI
      </footer>
    </div>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>
      {children}
    </h2>
  );
}

function Label({ children, style: s }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14, ...s }}>
      {children}
    </div>
  );
}

function StockCard({ st }) {
  const pos = st.c >= 0;
  return (
    <div className="card-hover" style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "14px 16px", borderLeft: `3px solid ${pos ? C.green : C.red}`, cursor: "default",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600, color: C.gold }}>{st.s}</span>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: clr(st.c) }}>{arr(st.c)} {Math.abs(st.c)}%</span>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{st.n}</div>
      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 20, fontWeight: 600, color: C.text }}>{fmt(st.p)}</div>
    </div>
  );
}

function NewsCard({ item }) {
  return (
    <div className="card-hover" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "22px 26px" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ background: C.goldBg, color: C.gold, padding: "2px 10px", borderRadius: 4, fontSize: 10, fontFamily: "'IBM Plex Mono'", fontWeight: 600 }}>
          {item.categoria}
        </span>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono'" }}>
          {item.tiempo} · {item.fuente}
        </span>
      </div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>
        {item.titulo}
      </h3>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7 }}>{item.resumen}</p>
    </div>
  );
}

function BlogCard({ post, open, onToggle }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "26px 30px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {(post.tags || []).map((t, i) => (
          <span key={i} style={{ background: "#1a1e35", color: C.sub, padding: "2px 10px", borderRadius: 4, fontSize: 11, fontFamily: "'IBM Plex Mono'" }}>
            #{t}
          </span>
        ))}
      </div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, marginBottom: 8, lineHeight: 1.35, color: C.text }}>
        {post.titulo}
      </h3>
      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, marginBottom: 14 }}>
        {post.autor} · {post.fecha}
      </div>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.75 }}>
        {open ? post.contenido : post.extracto}
      </p>
      <button onClick={onToggle} style={{
        marginTop: 18, background: "none", border: `1px solid ${C.gold}`,
        color: C.gold, padding: "9px 22px", borderRadius: 5, cursor: "pointer",
        fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600, transition: "all 0.2s",
      }}>
        {open ? "← Ver menos" : "Leer guía completa →"}
      </button>
    </div>
  );
}

function AIButton({ onClick, loading, label }) {
  return (
    <button className="ai-btn" onClick={onClick} disabled={loading} style={{
      background: loading ? C.border : C.gold, color: loading ? C.muted : "#000",
      border: "none", padding: "11px 22px", borderRadius: 6,
      cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 700,
      display: "flex", alignItems: "center", gap: 8, flexShrink: 0, transition: "all 0.2s",
    }}>
      {loading ? "⏳ Cargando..." : `⚡ ${label}`}
    </button>
  );
}

function Loader({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>⚙️</div>
      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13 }}>{text}</div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 32px", background: C.card, border: `1px dashed ${C.border}`, borderRadius: 8 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <p style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, color: C.muted, lineHeight: 1.8, maxWidth: 420, margin: "0 auto" }}>
        {text}
      </p>
    </div>
  );
}

function ErrBanner({ msg }) {
  return (
    <div style={{ background: "#ff446615", border: `1px solid ${C.red}`, borderRadius: 6, padding: "12px 18px", marginBottom: 16, color: C.red, fontFamily: "'IBM Plex Mono'", fontSize: 12 }}>
      ⚠️ {msg}
    </div>
  );
}

// ── Calculadora de Inversión ─────────────────────────────────────
function CompoundCalc() {
  const [capital,    setCapital]    = useState(5000);
  const [aporte,     setAporte]     = useState(200);
  const [tasa,       setTasa]       = useState(10);
  const [anos,       setAnos]       = useState(20);
  const [moneda,     setMoneda]     = useState("USD");
  const [frecuencia, setFrecuencia] = useState("Mensual");
  const [escenario,  setEscenario]  = useState("Aportes Constantes");

  const sym = moneda === "DOP" ? "RD$" : "$";
  const fmtM = (n) => `${sym}${Math.round(n).toLocaleString("es-DO")}`;

  const freqMap = { "Mensual": 12, "Semanal": 52, "Anual": 1 };
  const periodosFrecuencia = freqMap[frecuencia] || 12;
  const tasaPorPeriodo = Math.pow(1 + tasa / 100, 1 / periodosFrecuencia) - 1;

  const filas = [];
  let saldo = capital;
  let totalInteresAcum = 0;
  for (let y = 1; y <= anos; y++) {
    const aporteBase = escenario === "Sin Aportes" ? 0
      : escenario === "Aportes Crecientes" ? aporte * Math.pow(1.05, y - 1)
      : aporte;
    let saldoInicio = saldo;
    let aporteAnualReal = 0;
    for (let p = 0; p < periodosFrecuencia; p++) {
      saldo = saldo * (1 + tasaPorPeriodo) + aporteBase;
      aporteAnualReal += aporteBase;
    }
    const interesAnual = saldo - saldoInicio - aporteAnualReal;
    totalInteresAcum += interesAnual;
    const capitalTotal = capital + aporteBase * periodosFrecuencia * y;
    filas.push({
      ano: y, saldo: Math.round(saldo),
      capitalBase: Math.round(saldoInicio),
      aporteBase: Math.round(aporteAnualReal),
      aporteTotal: Math.round(aporteBase * periodosFrecuencia * y),
      capitalTotal: Math.round(capitalTotal),
      retorno: (interesAnual / saldoInicio * 100).toFixed(2),
      ganancia: Math.round(interesAnual),
      interesAcum: Math.round(totalInteresAcum),
      aporteAcum: Math.round(capital + aporteBase * periodosFrecuencia * y),
      aporteAnual: Math.round(aporteAnualReal),
    });
  }

  const totalFinal   = filas[filas.length - 1]?.saldo ?? capital;
  const aporteTotal  = escenario === "Sin Aportes" ? capital : capital + aporte * periodosFrecuencia * anos;
  const interesTotal = totalFinal - aporteTotal;
  const multiplicador = (totalFinal / Math.max(aporteTotal, 1)).toFixed(2);

  const selStyle = {
    background: "#0d0f1e", border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, fontFamily: "'IBM Plex Mono'", fontSize: 13, padding: "10px 12px",
    outline: "none", cursor: "pointer", flex: 1,
  };
  const inputNum = {
    flex: 1, background: "#0d0f1e", border: "none", outline: "none",
    color: C.gold, fontFamily: "'IBM Plex Mono'", fontSize: 16,
    fontWeight: 700, textAlign: "center", width: "100%", padding: "0 8px",
  };
  const stepBtn = (fn, dir) => (
    <button onClick={fn} style={{
      width: 44, background: C.border, border: "none", color: C.gold,
      fontSize: 22, cursor: "pointer",
      borderRadius: dir === "left" ? "8px 0 0 8px" : "0 8px 8px 0",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>{dir === "left" ? "−" : "+"}</button>
  );
  const numBox = (val, setVal, step, lbl, min = 0) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>{lbl}</div>
      <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", height: 46 }}>
        {stepBtn(() => setVal(v => Math.max(min, v - step)), "left")}
        <input type="number" value={val || ""} min={min} placeholder="0"
          onChange={e => setVal(e.target.value === "" ? 0 : Math.max(min, +e.target.value))}
          onBlur={e => { if (e.target.value === "") setVal(min); }}
          style={inputNum} />
        {stepBtn(() => setVal(v => v + step), "right")}
      </div>
    </div>
  );

  const fmtK = v => {
    if (v >= 1000000) return sym + (v / 1000000).toFixed(1) + "M";
    if (v >= 1000)    return sym + (v / 1000).toFixed(0) + "K";
    return sym + v;
  };

  return (
    <div>
      <SectionTitle>Calculadora de Inversión</SectionTitle>
      <p style={{ fontSize: 13, color: C.sub, marginTop: 4, marginBottom: 8 }}>
        ¿Cuánto tendrías si hubieras invertido $200/mes en el S&P 500 hace 20 años? Descúbrelo aquí.
      </p>

      {/* Tip S&P 500 */}
      <div style={{ background: C.goldBg, border: `1px solid ${C.gold}30`, borderRadius: 8, padding: "12px 18px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <p style={{ fontSize: 13, color: C.sub }}>
          El <strong style={{ color: C.gold }}>S&P 500</strong> ha retornado históricamente ~<strong style={{ color: C.gold }}>10% anual</strong> en promedio. Úsalo como referencia.
        </p>
      </div>

      {/* Moneda */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, maxWidth: 280 }}>
        {["USD", "DOP"].map(m => (
          <button key={m} onClick={() => setMoneda(m)} style={{
            flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${moneda === m ? C.gold : C.border}`,
            background: moneda === m ? C.goldBg : "none", color: moneda === m ? C.gold : C.muted,
            fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>{m === "USD" ? "🇺🇸 USD" : "🇩🇴 DOP"}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Inputs */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <Label>── Parámetros</Label>
          {numBox(capital, setCapital, moneda === "DOP" ? 5000 : 500, `INVERSIÓN INICIAL (${sym})`)}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>APORTES PERIÓDICOS ({sym})</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2, display: "flex", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", height: 46 }}>
                {stepBtn(() => setAporte(v => Math.max(0, v - (moneda === "DOP" ? 500 : 50))), "left")}
                <input type="number" value={aporte || ""} min={0} placeholder="0"
                  onChange={e => setAporte(e.target.value === "" ? 0 : Math.max(0, +e.target.value))}
                  style={inputNum} />
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
              <input type="number" value={tasa || ""} min={0.5} max={100} step={0.5}
                onChange={e => setTasa(e.target.value === "" ? 0 : Math.max(0.5, +e.target.value))}
                style={inputNum} />
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

        {/* Resultados */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: `linear-gradient(135deg,#0f1228,#130f2a)`, border: `2px solid ${C.gold}`, borderRadius: 12, padding: "22px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>VALOR FINAL EN {anos} AÑOS</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 800, color: C.gold, lineHeight: 1 }}>{fmtM(totalFinal)}</div>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted, marginTop: 8 }}>Tu dinero crece ×{multiplicador}</div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px" }}>
            {[
              { lbl: "Inversión Total",   val: fmtM(aporteTotal),                      color: C.text  },
              { lbl: "Intereses Ganados", val: fmtM(Math.max(0, interesTotal)),         color: C.green },
              { lbl: "Multiplicador",     val: `×${multiplicador}`,                    color: C.gold  },
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
              {interesTotal > aporteTotal
                ? `¡Los intereses superan lo que invertiste! Esto es el poder del interés compuesto.`
                : `En ${anos} años ganaste ${fmtM(Math.max(0, interesTotal))} solo en intereses. La clave es empezar hoy.`}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfica */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 26px", marginTop: 24 }}>
        <Label>── Proyección de Crecimiento</Label>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filas} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.muted} tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, fill: C.muted }} />
              <YAxis stroke={C.muted} tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 9, fill: C.muted }} tickFormatter={fmtK} />
              <Tooltip
                contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'IBM Plex Mono'", fontSize: 12 }}
                formatter={(v, n) => [fmtM(v), n === "aporteAcum" ? "Capital Base" : n === "interesAcum" ? "Ganancias" : "Ganancia Año"]}
                labelFormatter={v => `Año ${v}`}
              />
              <Bar dataKey="aporteAcum"  stackId="a" fill="#1e4a7a" name="aporteAcum"  radius={[0, 0, 0, 0]} />
              <Bar dataKey="interesAcum" stackId="a" fill="#2d7a4a" name="interesAcum" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="aporteAnual" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 3 }} name="aporteAnual" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
          {[["#1e4a7a", "Capital Base"], ["#2d7a4a", "Ganancias Acum."], [C.gold, "Ganancia Año"]].map(([col, lbl]) => (
            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: col }} />
              <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: C.muted }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 26px", marginTop: 20, overflowX: "auto" }}>
        <Label>── Año por año</Label>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'IBM Plex Mono'", fontSize: 12, minWidth: 600 }}>
          <thead>
            <tr style={{ background: "#ffffff08", borderBottom: `1px solid ${C.border}` }}>
              {["Año", "Aportado", "Intereses", "Valor Final"].map((h, i) => (
                <th key={i} style={{ padding: "10px 12px", fontWeight: 500, textAlign: i === 0 ? "left" : "right", color: C.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}20`, background: i % 2 === 0 ? "transparent" : "#ffffff03" }}>
                <td style={{ padding: "11px 12px", color: C.gold }}>{f.ano}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.muted }}>{fmtM(f.aporteAcum)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.green }}>{fmtM(f.interesAcum)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: C.text, fontWeight: 700 }}>{fmtM(f.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Newsletter Form (MailerLite) ─────────────────────────────────
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
    <div style={{ background:"#00d68f15", border:"1px solid #00d68f", borderRadius:12, padding:"28px 24px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#00d68f", marginBottom:8 }}>¡Ya estás suscrito!</div>
      <p style={{ fontSize:14, color:C.sub, lineHeight:1.7 }}>Revisa tu correo para confirmar. El próximo lunes recibes tu primer resumen de Wall Street.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
        <input type="email" placeholder="tu@email.com" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ flex:1, minWidth:200, background:"#0d0f1e", border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 18px", color:C.text, fontFamily:"'Inter',sans-serif", fontSize:15, outline:"none" }}
        />
        <button onClick={handleSubmit} disabled={status==="loading"} style={{ background:C.gold, color:"#000", border:"none", padding:"14px 24px", borderRadius:8, cursor:"pointer", fontFamily:"'IBM Plex Mono'", fontSize:13, fontWeight:700, whiteSpace:"nowrap" }}>
          {status==="loading" ? "⏳ Enviando..." : "Suscribirse gratis →"}
        </button>
      </div>
      {status==="error" && <p style={{ fontSize:12, color:C.red, fontFamily:"'IBM Plex Mono'" }}>⚠️ Ingresa un email válido</p>}
      <p style={{ fontSize:11, color:C.muted, fontFamily:"'IBM Plex Mono'", marginTop:8 }}>Sin spam · Te puedes dar de baja cuando quieras</p>
    </div>
  );
}
