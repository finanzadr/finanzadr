import { useState, useEffect, useRef } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const FINNHUB_KEY = "d88c1mhr01qq4342hla0d88c1mhr01qq4342hlag";

const WS_STOCKS = [
  { s: "SPY",     n: "S&P 500",       p: 528.40,  c:  0.43, icon: "📊" },
  { s: "QQQ",     n: "NASDAQ",        p: 446.82,  c:  0.71, icon: "💻" },
  { s: "DIA",     n: "Dow Jones",     p: 391.27,  c: -0.12, icon: "🏦" },
  { s: "IWM",     n: "Russell 2000",  p: 198.54,  c: -0.34, icon: "📈" },
  { s: "GLD",     n: "Oro",           p: 224.80,  c:  0.38, icon: "🥇" },
  { s: "TLT",     n: "Bonos T. 20Y",  p: 88.45,   c: -0.22, icon: "📋" },
  { s: "XLU",     n: "Utilities",     p: 71.20,   c:  0.15, icon: "⚡" },
  { s: "BTC-USD", n: "Bitcoin",       p: 94500.00,c:  1.45, icon: "₿"  },
];const NOTICIAS = [
  { titulo: "S&P 500 cierra en máximo histórico mientras mercados celebran pausa de la Fed", resumen: "El S&P 500 alcanzó un nuevo récord cerrando por encima de 5,800 puntos este viernes, impulsado por datos de empleo más fuertes de lo esperado. La Reserva Federal señaló que mantendría las tasas sin cambios hasta tener mayor claridad sobre la inflación.", fuente: "Reuters", tiempo: "Hace 1 hora", categoria: "Mercados" },
  { titulo: "NVIDIA supera los $1,000 por acción por primera vez en su historia", resumen: "Las acciones de NVIDIA cruzaron la barrera de los $1,000 por primera vez impulsadas por una demanda récord de chips para inteligencia artificial. La compañía reportó ingresos trimestrales de $44 mil millones, un 78% más que el año anterior.", fuente: "Bloomberg", tiempo: "Hace 3 horas", categoria: "Acciones" },
  { titulo: "El oro alcanza nuevos máximos históricos ante la incertidumbre geopolítica global", resumen: "El precio del oro superó los $3,400 por onza este mes, estableciendo un nuevo récord histórico. Los inversores buscan refugio en metales preciosos ante las tensiones geopolíticas y el debilitamiento del dólar.", fuente: "WSJ", tiempo: "Hace 5 horas", categoria: "Materias Primas" },
  { titulo: "Bitcoin consolida por encima de los $90,000 con creciente adopción institucional", resumen: "Bitcoin mantiene su posición por encima de los $90,000 respaldado por compras institucionales y la aprobación de nuevos ETFs en mercados europeos y asiáticos.", fuente: "CNBC", tiempo: "Hace 7 horas", categoria: "Cripto" },
  { titulo: "Los bonos del Tesoro a 10 años suben ante señales de desaceleración económica", resumen: "El rendimiento del bono del Tesoro a 10 años cayó al 4.2% mientras los inversores buscan activos más seguros. Los datos de manufactura mostraron una contracción por segundo mes consecutivo.", fuente: "Financial Times", tiempo: "Hace 9 horas", categoria: "Bonos" },
  { titulo: "Dow Jones supera los 42,000 puntos impulsado por sector financiero y salud", resumen: "El Dow Jones Industrial Average superó los 42,000 puntos esta semana, liderado por fuertes ganancias en el sector financiero y de salud.", fuente: "MarketWatch", tiempo: "Hace 11 horas", categoria: "Mercados" },
];const GUIAS = [
  { titulo: "Cómo abrir tu primera cuenta de inversión desde Latinoamérica", extracto: "Guía paso a paso para abrir una cuenta en Fidelity o Interactive Brokers desde cualquier país de América Latina.", contenido: "Invertir en Wall Street desde Latinoamérica es más fácil de lo que piensas.\n\nPASO 1: ELIGE TU PLATAFORMA\nPara principiantes recomendamos Fidelity o Interactive Brokers. Ambas aceptan clientes internacionales y no cobran comisiones.\n\nPASO 2: DOCUMENTOS NECESARIOS\nNecesitas tu pasaporte vigente, comprobante de domicilio y un número de teléfono. Todo el proceso es 100% online.\n\nPASO 3: ABRE LA CUENTA\nEntra a fidelity.com o interactivebrokers.com, selecciona Open an Account y elige Individual Brokerage Account.\n\nPASO 4: DEPOSITA TU PRIMER DINERO\nPuedes depositar desde $1 dólar usando transferencia bancaria o servicios como Wise o Remitly.\n\nPASO 5: COMPRA TU PRIMER ETF\nPara empezar, compra VOO (Vanguard S&P 500 ETF). Con un solo producto tienes exposición a las 500 empresas más grandes de EE.UU.", autor: "Equipo FinanzaDR", fecha: "Mayo 2026", tags: ["principiantes", "brokers", "ETF"] },
  { titulo: "¿Qué es el S&P 500 y por qué es la mejor inversión para principiantes?", extracto: "El S&P 500 ha generado un retorno promedio del 10% anual durante los últimos 50 años.", contenido: "El S&P 500 es el índice bursátil más importante del mundo. Incluye las 500 empresas más grandes de Estados Unidos.\n\nEn los últimos 50 años, el S&P 500 ha generado un retorno promedio del 10% anual.\n\nLos ETFs más populares son:\n- VOO (Vanguard): costo de solo 0.03% anual\n- SPY (SPDR): el más antiguo y líquido\n- IVV (iShares): otra excelente opción\n\nLA ESTRATEGIA GANADORA: DCA\nInvertir una cantidad fija cada mes sin importar si el mercado sube o baja.", autor: "Equipo FinanzaDR", fecha: "Mayo 2026", tags: ["S&P 500", "ETF", "estrategia"] },
  { titulo: "Los 5 errores más comunes al invertir por primera vez", extracto: "El 80% de los inversores principiantes cometen estos errores.", contenido: "ERROR 1: ESPERAR EL MOMENTO PERFECTO\nNo existe el momento perfecto. El tiempo en el mercado siempre supera al timing.\n\nERROR 2: PONER TODO EN UNA SOLA ACCIÓN\nLos ETFs como el S&P 500 te dan diversificación automática.\n\nERROR 3: VENDER CUANDO EL MERCADO CAE\nEl mercado siempre ha subido a largo plazo.\n\nERROR 4: INVERTIR DINERO QUE PUEDES NECESITAR\nSolo invierte dinero que no vas a necesitar en los próximos 5 años.\n\nERROR 5: NO EMPEZAR POR MIEDO\nEl dinero que no inviertes pierde valor cada año por la inflación.", autor: "Equipo FinanzaDR", fecha: "Mayo 2026", tags: ["errores", "principiantes", "estrategia"] },
];

const CONSEJOS = [
  { icono: "🎯", nivel: "Principiante", consejo: "Empieza con ETFs, no acciones individuales", detalle: "Un ETF del S&P 500 te da exposición a 500 empresas con una sola compra." },
  { icono: "📅", nivel: "Principiante", consejo: "Invierte una cantidad fija cada mes", detalle: "La estrategia DCA consiste en invertir la misma cantidad cada mes." },
  { icono: "⏳", nivel: "Principiante", consejo: "Piensa en años, no en días", detalle: "Los inversores exitosos mantienen su estrategia por años." },
  { icono: "🏦", nivel: "Principiante", consejo: "Abre una cuenta en Fidelity o Interactive Brokers", detalle: "Ambas plataformas aceptan clientes de Latinoamérica sin comisiones." },
];

const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clr = (c) => c >= 0 ? "#00d68f" : "#ff4466";
const arr = (c) => c >= 0 ? "▲" : "▼";

const DARK = { bg: "#07080f", card: "#0d0f1e", border: "#1a1e35", gold: "#c8a84b", goldBg: "#c8a84b18", green: "#00d68f", red: "#ff4466", text: "#dde1f5", muted: "#484e72", sub: "#8890b5", navBg: "#09091a", tickerBg: "#0a0b16" };
const LIGHT = { bg: "#f4f5f8", card: "#ffffff", border: "#e0e4ef", gold: "#b8860b", goldBg: "#b8860b15", green: "#00875a", red: "#d93025", text: "#1a1d2e", muted: "#8891a8", sub: "#555e7a", navBg: "#ffffff", tickerBg: "#1a1d2e" };

let C = { ...DARK };export default function FinanzasDR() {
  const [tab, setTab] = useState("inicio");
  const [stocks, setStocks] = useState(WS_STOCKS);
  const [expanded, setExpanded] = useState(null);
  const [dark, setDark] = useState(true);
  const [realLoading, setRealLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [realErr, setRealErr] = useState(null);
  const [noticias, setNoticias] = useState(NOTICIAS);
  const [noticiasLoading, setNoticiasLoading] = useState(false);

  C = dark ? DARK : LIGHT;

  const fetchNoticias = async () => {
    setNoticiasLoading(true);
    try {
      const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const cats = { "earnings":"Ganancias","ipo":"IPO","merger":"Fusiones","crypto":"Cripto","forex":"Divisas","economy":"Economía","general":"Mercados" };
        setNoticias(data.slice(0,10).map(n => ({ titulo: n.headline, resumen: n.summary?.slice(0,240)+"..." || "Sin resumen.", fuente: n.source||"Finnhub", tiempo: (() => { const m=Math.floor((Date.now()/1000-n.datetime)/60); return m<60?`Hace ${m} min`:m<1440?`Hace ${Math.floor(m/60)}h`:`Hace ${Math.floor(m/1440)} días`; })(), categoria: cats[n.category]||"Mercados", url: n.url })));
      }
    } catch(e) {}
    setNoticiasLoading(false);
  };

  const fetchRealPrices = async () => {
    setRealLoading(true);
    try {
      const updated = await Promise.all(WS_STOCKS.map(async st => {
        try {
          const symbol = st.s === "BTC-USD" ? "BINANCE:BTCUSDT" : st.s;
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
          const data = await res.json();
          if (data.c && data.c > 0) return { ...st, p: data.c, c: +(data.dp ?? ((data.c-data.pc)/data.pc*100)).toFixed(2) };
          return st;
        } catch { return st; }
      }));
      setStocks(updated);
      setLastUpdate(new Date().toLocaleTimeString("es-DO"));
    } catch(e) { setRealErr("No se pudo conectar."); }
    setRealLoading(false);
  };

  useEffect(() => { fetchNoticias(); }, []);
  useEffect(() => { fetchRealPrices(); const t = setInterval(fetchRealPrices, 60000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
      html,body,#root { width:100%; min-height:100vh; margin:0; padding:0; }
      .ticker-track { display:flex; animation:ticker 70s linear infinite; white-space:nowrap; }
      .ticker-track:hover { animation-play-state:paused; }
      .fade-in { animation:fadeIn 0.4s ease forwards; }
      .live-dot { animation:pulse-dot 1.5s ease-in-out infinite; display:inline-block; }
      * { box-sizing:border-box; margin:0; padding:0; transition:background 0.3s,color 0.2s,border-color 0.2s; }
      .nav-btn:hover { color:#c8a84b !important; }
      .card-hover { transition:all 0.2s; }
      .card-hover:hover { border-color:#c8a84b44 !important; transform:translateY(-2px); }
      .market-item { transition:all 0.15s; border-radius:6px; }
      .market-item:hover { background:rgba(200,168,75,0.08) !important; transform:translateY(-1px); }
      @media (max-width:768px) {
        .main-padding { padding:16px !important; }
        .hero-grid { flex-direction:column !important; }
        .hero-stocks { display:grid !important; grid-template-columns:1fr 1fr !important; width:100% !important; }
        .toggle-text { display:none !important; }
        .nav-scroll { overflow-x:auto !important; scrollbar-width:none !important; }
        .nav-scroll::-webkit-scrollbar { display:none !important; }
        .pulse-grid { grid-template-columns:repeat(2,1fr) !important; }
        .summary-grid { grid-template-columns:1fr !important; }
        .calc-grid { grid-template-columns:1fr !important; }
        .hero-text h1 { font-size:26px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  const tabs = [
    ["inicio","🚀 Empieza Aquí"],["mercados","📊 Mercados"],["charts","📈 Charts en Vivo"],
    ["ws","📰 Noticias"],["blog","📚 Aprende"],["calc","🧮 Calculadora"],
    ["snapshot","📸 Compartir"],["newsletter","📧 Newsletter"],
  ];

  return (
    <div style={{ minHeight:"100vh", width:"100vw", maxWidth:"100%", background:C.bg, color:C.text, fontFamily:"'Inter',sans-serif", overflowX:"hidden" }}>

      {/* MARKET BAR */}
      <div style={{ background:"#050609", borderBottom:"1px solid #1a1e35", overflowX:"auto" }} className="nav-scroll">
        <div style={{ display:"flex", alignItems:"stretch", minWidth:"max-content" }}>
          <div style={{ background:C.gold, color:"#000", fontFamily:"'IBM Plex Mono'", fontSize:10, fontWeight:800, padding:"0 16px", display:"flex", alignItems:"center", gap:6, flexShrink:0, letterSpacing:1 }}>
            <span className="live-dot" style={{ width:6, height:6, borderRadius:"50%", background:"#000", display:"inline-block" }} />
            LIVE
          </div>
          {stocks.map((st,i) => (
            <div key={i} className="market-item" onClick={() => setTab("mercados")}
              style={{ padding:"8px 18px", display:"flex", alignItems:"center", cursor:"pointer", borderRight:"1px solid #1a1e3530" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, fontWeight:700, color:C.gold }}>{st.s}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:"#8890b5" }}>{st.n}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:12, fontWeight:700, color:"#fff" }}>
                    {st.p >= 1000 ? st.p.toLocaleString("en-US",{maximumFractionDigits:0}) : st.p.toFixed(2)}
                  </span>
                  <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, fontWeight:600, color:st.c>=0?"#00d68f":"#ff4466" }}>
                    {st.c>=0?"▲":"▼"} {Math.abs(st.c)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ padding:"0 16px", display:"flex", alignItems:"center", marginLeft:"auto", flexShrink:0 }}>
            <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:"#484e72" }}>{lastUpdate ? `✓ ${lastUpdate}` : "NYSE · NASDAQ"}</span>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header style={{ borderBottom:`1px solid ${C.border}`, padding:"20px 32px", background:C.bg, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:800, color:C.gold }}>FinanzaDR</div>
          <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:C.muted, marginTop:4, letterSpacing:2 }}>APRENDE A INVERTIR EN WALL STREET · PARA LATINOS</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, color:C.gold, marginTop:6, fontStyle:"italic" }}>"Wall Street en tu idioma"</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:C.muted }}>{new Date().toLocaleDateString("es-DO",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
          <button onClick={() => setDark(d=>!d)} style={{ background:dark?"#1a1e35":"#f0f2f8", border:`1px solid ${C.border}`, borderRadius:50, padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:18 }}>{dark?"☀️":"🌙"}</span>
            <span className="toggle-text" style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, fontWeight:600, color:C.text }}>{dark?"Modo Claro":"Modo Oscuro"}</span>
          </button>
        </div>
      </header>

      {/* NAV */}
      <nav className="nav-scroll" style={{ borderBottom:`1px solid ${C.border}`, display:"flex", padding:"0 32px", background:C.navBg, overflowX:"auto" }}>
        {tabs.map(([id,label]) => (
          <button key={id} className="nav-btn" onClick={() => setTab(id)} style={{ padding:"14px 18px", border:"none", background:"none", cursor:"pointer", fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, whiteSpace:"nowrap", color:tab===id?C.gold:C.muted, borderBottom:tab===id?`2px solid ${C.gold}`:"2px solid transparent" }}>{label}</button>
        ))}
      </nav>

      <main style={{ padding:"32px", maxWidth:"100%", margin:"0 auto" }} className="main-padding">{tab === "inicio" && (
          <div className="fade-in">
            <div style={{ background:dark?"linear-gradient(135deg,#07080f 0%,#0d0f1e 40%,#0f1228 100%)":"linear-gradient(135deg,#eef0f8 0%,#e8eaf5 100%)", border:`1px solid ${C.gold}25`, borderRadius:20, padding:"48px 40px 40px", marginBottom:24, borderTop:`3px solid ${C.gold}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:32 }} className="hero-grid">
                <div style={{ maxWidth:540 }} className="hero-text">
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                    <span className="live-dot" style={{ width:8, height:8, borderRadius:"50%", background:"#00d68f", display:"inline-block" }} />
                    <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:"#00d68f", letterSpacing:3, fontWeight:700 }}>MERCADOS EN VIVO</span>
                  </div>
                  <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:44, fontWeight:800, color:C.text, marginBottom:8, lineHeight:1.15 }}>
                    Wall Street.<br/><span style={{ color:C.gold }}>En tu idioma.</span>
                  </h1>
                  <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:C.muted, letterSpacing:2, marginBottom:16 }}>INSTITUTIONAL-GRADE MARKET INTELLIGENCE</p>
                  <p style={{ fontSize:15, color:C.sub, lineHeight:1.8, marginBottom:28, maxWidth:460 }}>Precios en tiempo real, charts profesionales y educación financiera para latinos que quieren invertir en Wall Street.</p>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <button onClick={() => setTab("mercados")} style={{ background:C.gold, color:"#000", border:"none", padding:"13px 26px", borderRadius:8, cursor:"pointer", fontFamily:"'IBM Plex Mono'", fontSize:12, fontWeight:800 }}>📊 Explorar Mercados</button>
                    <button onClick={() => setTab("charts")} style={{ background:dark?"rgba(200,168,75,0.1)":"rgba(200,168,75,0.15)", border:`1px solid ${C.gold}60`, color:C.gold, padding:"13px 26px", borderRadius:8, cursor:"pointer", fontFamily:"'IBM Plex Mono'", fontSize:12, fontWeight:700 }}>📈 Charts en Vivo</button>
                  </div>
                  <div style={{ display:"flex", gap:24, marginTop:28, paddingTop:24, borderTop:`1px solid ${C.border}`, flexWrap:"wrap" }}>
                    {[{n:"8",l:"Activos en Vivo"},{n:"∞",l:"Charts Disponibles"},{n:"24/7",l:"Datos en Tiempo Real"},{n:"$0",l:"Costo Total"}].map((s,i) => (
                      <div key={i}>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800, color:C.gold }}>{s.n}</div>
                        <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:C.muted, letterSpacing:1, marginTop:2 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, minWidth:280 }} className="hero-stocks">
                  {stocks.slice(0,4).map(st => (
                    <div key={st.s} className="market-item" onClick={() => setTab("mercados")}
                      style={{ background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)", borderRadius:10, padding:"14px 16px", border:`1px solid ${st.c>=0?"#00d68f22":"#ff446622"}`, cursor:"pointer", borderLeft:`3px solid ${st.c>=0?"#00d68f":"#ff4466"}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, fontWeight:800, color:C.gold }}>{st.s}</span>
                        <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:st.c>=0?"#00d68f":"#ff4466", fontWeight:700 }}>{st.c>=0?"▲":"▼"}{Math.abs(st.c)}%</span>
                      </div>
                      <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:C.muted, marginBottom:6 }}>{st.n}</div>
                      <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:18, fontWeight:800, color:C.text }}>{st.p>=1000?st.p.toLocaleString("en-US",{maximumFractionDigits:0}):st.p.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MARKET PULSE */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <Label style={{ margin:0 }}>── MARKET PULSE · EN VIVO</Label>
                {lastUpdate && <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:C.green }}>✓ {lastUpdate}</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }} className="pulse-grid">
                {stocks.map(st => (
                  <div key={st.s} className="card-hover" onClick={() => setTab("charts")}
                    style={{ background:C.card, border:`1px solid ${st.c>=0?C.green+"33":C.red+"33"}`, borderLeft:`3px solid ${clr(st.c)}`, borderRadius:8, padding:"12px 14px", cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:12, fontWeight:700, color:C.gold }}>{st.s}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:clr(st.c) }}>{arr(st.c)}{Math.abs(st.c)}%</span>
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>{st.n}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:17, fontWeight:700, color:C.text }}>{fmt(st.p)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:28 }} className="summary-grid">
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 22px" }}>
                <Label style={{ margin:"0 0 12px 0" }}>── SENTIMIENTO HOY</Label>
                {(() => {
                  const gainers = stocks.filter(s=>s.c>0).length;
                  const pct = Math.round(gainers/stocks.length*100);
                  const sentiment = pct>=70?"Alcista 🟢":pct>=40?"Neutral ⚪":"Bajista 🔴";
                  const color = pct>=70?C.green:pct>=40?C.gold:C.red;
                  return (<div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800, color, marginBottom:8 }}>{sentiment}</div>
                    <div style={{ background:C.border, borderRadius:99, height:6, marginBottom:8 }}>
                      <div style={{ background:color, borderRadius:99, height:6, width:`${pct}%`, transition:"width 0.5s" }} />
                    </div>
                    <p style={{ fontSize:12, color:C.sub }}>{gainers} de {stocks.length} activos en verde — {pct}% positivo</p>
                  </div>);
                })()}
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 22px" }}>
                <Label style={{ margin:"0 0 12px 0" }}>── TOP MOVER</Label>
                {(() => {
                  const top = [...stocks].sort((a,b)=>Math.abs(b.c)-Math.abs(a.c))[0];
                  return (<div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:22, fontWeight:800, color:C.gold }}>{top.s}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:20, fontWeight:700, color:clr(top.c) }}>{arr(top.c)}{Math.abs(top.c)}%</span>
                    </div>
                    <div style={{ fontSize:13, color:C.sub, marginBottom:6 }}>{top.n}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:16, color:C.text, fontWeight:700 }}>{fmt(top.p)}</div>
                  </div>);
                })()}
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 22px" }}>
                <Label style={{ margin:"0 0 12px 0" }}>── ACCESO RÁPIDO</Label>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[{icon:"📈",label:"Charts en Vivo",tab:"charts"},{icon:"📰",label:"Noticias Wall St.",tab:"ws"},{icon:"🧮",label:"Calculadora",tab:"calc"},{icon:"📧",label:"Newsletter Gratis",tab:"newsletter"}].map((a,i) => (
                    <button key={i} onClick={() => setTab(a.tab)} style={{ background:C.goldBg, border:`1px solid ${C.gold}30`, borderRadius:7, padding:"9px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:16 }}>{a.icon}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:12, fontWeight:600, color:C.gold }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <SectionTitle>¿Dónde abrir tu cuenta?</SectionTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginTop:16, marginBottom:28 }}>
              {[{name:"Robinhood",emoji:"🟢",nivel:"Principiante",detalle:"Sin comisiones, muy fácil de usar."},{name:"Webull",emoji:"🔵",nivel:"Principiante",detalle:"Sin comisiones, más herramientas."},{name:"Moomoo",emoji:"🟠",nivel:"Intermedio",detalle:"Datos en tiempo real profesionales."},{name:"Tastytrade",emoji:"🟣",nivel:"Intermedio",detalle:"Especializado en opciones y futuros."},{name:"Interactive Brokers",emoji:"🌐",nivel:"Avanzado",detalle:"Acepta clientes de RD y Latinoamérica."}].map((b,i) => (
                <div key={i} className="card-hover" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 14px" }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{b.emoji}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:12, fontWeight:700, color:C.text, marginBottom:4 }}>{b.name}</div>
                  <div style={{ background:C.goldBg, color:C.gold, display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontFamily:"'IBM Plex Mono'", marginBottom:8 }}>{b.nivel}</div>
                  <p style={{ fontSize:11, color:C.sub, lineHeight:1.6 }}>{b.detalle}</p>
                </div>
              ))}
            </div>

            <SectionTitle>Tu camino en 4 pasos</SectionTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14, marginTop:16 }}>
              {[{n:"01",t:"Elige una plataforma",d:"Robinhood o Webull si eres principiante. Interactive Brokers si vives fuera de EE.UU."},{n:"02",t:"Abre tu cuenta",d:"Necesitas pasaporte, dirección y un método de pago. 100% online."},{n:"03",t:"Empieza con ETFs",d:"El S&P 500 (VOO o SPY) es el mejor inicio. 500 empresas, un solo producto."},{n:"04",t:"Invierte consistente",d:"$50/mes durante 20 años supera $10,000 de golpe."}].map((s,i) => (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 18px" }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:800, color:`${C.gold}40`, marginBottom:10 }}>{s.n}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:13, fontWeight:700, color:C.gold, marginBottom:8 }}>{s.t}</div>
                  <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}{tab === "mercados" && (
          <div className="fade-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:12 }}>
              <SectionTitle>Mercados Wall Street</SectionTitle>
              <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                {lastUpdate && <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:C.green }}>✓ {lastUpdate}</span>}
                <button onClick={fetchRealPrices} disabled={realLoading} style={{ background:realLoading?C.border:C.gold, color:realLoading?C.muted:"#000", border:"none", padding:"9px 18px", borderRadius:6, cursor:realLoading?"not-allowed":"pointer", fontFamily:"'IBM Plex Mono'", fontSize:11, fontWeight:700 }}>
                  {realLoading?"⏳ Cargando...":"🔴 Actualizar Precios"}
                </button>
              </div>
            </div>
            <Label>── Precios en tiempo real · Powered by Finnhub</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:12, marginBottom:32 }}>
              {stocks.map(st => <StockCard key={st.s} st={st} />)}
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"24px 28px" }}>
              <Label>── ¿Qué es cada activo?</Label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
                {[{s:"SPY",d:"ETF que replica el S&P 500 — las 500 empresas más grandes de EE.UU."},{s:"QQQ",d:"ETF del NASDAQ 100 — dominado por tecnología."},{s:"DIA",d:"ETF del Dow Jones — las 30 empresas más importantes de EE.UU."},{s:"IWM",d:"ETF del Russell 2000 — 2,000 empresas pequeñas de EE.UU."},{s:"TLT",d:"ETF de bonos del Tesoro a 20+ años."},{s:"XLU",d:"ETF del sector Utilities — estable en mercados volátiles."},{s:"GLD",d:"ETF del oro — activo refugio por excelencia."},{s:"BTC-USD",d:"Bitcoin — la criptomoneda más importante del mundo."}].map((x,i) => (
                  <div key={i} style={{ borderLeft:`3px solid ${C.gold}`, paddingLeft:16 }}>
                    <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:13, fontWeight:700, color:C.gold, marginBottom:6 }}>{x.s}</div>
                    <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>{x.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "ws" && (
          <div className="fade-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
              <div>
                <SectionTitle>Noticias Wall Street</SectionTitle>
                <p style={{ fontSize:13, color:C.sub, marginTop:4 }}>{noticiasLoading?"Cargando noticias...":"Noticias reales de hoy · Powered by Finnhub"}</p>
              </div>
              <button onClick={fetchNoticias} disabled={noticiasLoading} style={{ background:noticiasLoading?C.border:C.gold, color:noticiasLoading?C.muted:"#000", border:"none", padding:"9px 18px", borderRadius:6, cursor:noticiasLoading?"not-allowed":"pointer", fontFamily:"'IBM Plex Mono'", fontSize:11, fontWeight:700 }}>
                {noticiasLoading?"⏳ Cargando...":"🔄 Actualizar"}
              </button>
            </div>
            {noticiasLoading ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
                <div style={{ fontSize:36, marginBottom:14 }}>⚙️</div>
                <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:13 }}>Cargando noticias...</div>
              </div>
            ) : (
              <div style={{ display:"grid", gap:14 }}>
                {noticias.map((item,i) => (
                  <div key={i} onClick={() => item.url && window.open(item.url,"_blank")}
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 24px", cursor:item.url?"pointer":"default", transition:"border-color 0.2s" }}
                    onMouseEnter={e => { if(item.url) e.currentTarget.style.borderColor=C.gold+"66"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ background:C.goldBg, color:C.gold, padding:"2px 10px", borderRadius:4, fontSize:10, fontFamily:"'IBM Plex Mono'", fontWeight:600 }}>{item.categoria}</span>
                        <span style={{ fontSize:11, color:C.muted, fontFamily:"'IBM Plex Mono'" }}>{item.tiempo} · {item.fuente}</span>
                      </div>
                      {item.url && <span style={{ fontSize:11, color:C.gold, fontFamily:"'IBM Plex Mono'", fontWeight:600 }}>↗</span>}
                    </div>
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:C.text, marginBottom:8, lineHeight:1.4 }}>{item.titulo}</h3>
                    <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>{item.resumen}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "blog" && (
          <div className="fade-in">
            <SectionTitle>Aprende a Invertir</SectionTitle>
            <p style={{ fontSize:13, color:C.sub, marginTop:4, marginBottom:24 }}>Guías completas para inversores principiantes e intermedios</p>
            <div style={{ display:"grid", gap:24 }}>
              {GUIAS.map((post,i) => (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"26px 30px" }}>
                  <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                    {post.tags.map((t,j) => <span key={j} style={{ background:C.border, color:C.sub, padding:"2px 10px", borderRadius:4, fontSize:11, fontFamily:"'IBM Plex Mono'" }}>#{t}</span>)}
                  </div>
                  <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800, marginBottom:8, lineHeight:1.35, color:C.text }}>{post.titulo}</h3>
                  <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:C.muted, marginBottom:14 }}>{post.autor} · {post.fecha}</div>
                  <p style={{ fontSize:14, color:C.sub, lineHeight:1.75, whiteSpace:"pre-line" }}>{expanded===i?post.contenido:post.extracto}</p>
                  <button onClick={() => setExpanded(expanded===i?null:i)} style={{ marginTop:18, background:"none", border:`1px solid ${C.gold}`, color:C.gold, padding:"9px 22px", borderRadius:5, cursor:"pointer", fontFamily:"'IBM Plex Mono'", fontSize:12, fontWeight:600 }}>
                    {expanded===i?"← Ver menos":"Leer guía completa →"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "calc" && <div className="fade-in"><CompoundCalc /></div>}
        {tab === "charts" && (
          <div className="fade-in">
            <SectionTitle>Charts en Vivo</SectionTitle>
            <p style={{ fontSize:13, color:C.sub, marginTop:4, marginBottom:24 }}>Gráficas en tiempo real powered by TradingView</p>
            <TradingViewCharts />
          </div>
        )}
        {tab === "snapshot" && (
          <div className="fade-in">
            <SectionTitle>📸 Market Snapshot</SectionTitle>
            <p style={{ fontSize:13, color:C.sub, marginTop:4, marginBottom:24 }}>Genera una card visual del mercado lista para compartir.</p>
            <SnapshotCard stocks={stocks} />
          </div>
        )}
        {tab === "newsletter" && (
          <div className="fade-in">
            <div style={{ background:dark?"linear-gradient(135deg,#0f1228,#130f2a)":"linear-gradient(135deg,#eef0f8,#e8eaf5)", border:`1px solid ${C.gold}30`, borderRadius:16, padding:"40px", marginBottom:32, textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📈</div>
              <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:C.gold, letterSpacing:3, marginBottom:12 }}>GRATIS · CADA SEMANA</div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:800, color:C.text, marginBottom:14, lineHeight:1.3 }}>Lo más importante de<br/><span style={{ color:C.gold }}>Wall Street en tu idioma</span></h1>
              <p style={{ fontSize:15, color:C.sub, maxWidth:480, margin:"0 auto 32px", lineHeight:1.8 }}>Cada semana te enviamos un resumen claro de lo que pasó en los mercados.</p>
              <div style={{ maxWidth:480, margin:"0 auto" }}><NewsletterForm /></div>
            </div>
          </div>
        )}
      </main>
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:"20px 32px", textAlign:"center", fontFamily:"'IBM Plex Mono'", fontSize:11, color:C.muted, marginTop:40 }}>
       FinanzaDR © 2026 · Todos los derechos reservados · No constituye asesoría de inversión
      </footer>
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#050609",borderTop:"1px solid #1a1e35",padding:"12px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,zIndex:99}}>
        <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:"#484e72"}}>FinanzaDR © 2026 · Wall Street en tu idioma · 🇩🇴</div>
        <div style={{display:"flex",gap:16}}>
          {[["🔒 Privacidad","privacidad"],["📋 Términos","terminos"],["⚠️ Aviso","aviso"]].map(([l,t],i)=>(<span key={i} onClick={()=>setTab(t)} style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:"#c8a84b",cursor:"pointer"}}>{l}</span>))}
        </div>
      </div>
      </footer>
    </div>
  );
}function SectionTitle({ children }) {
  return <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:800, color:C.text, marginBottom:4 }}>{children}</h2>;
}

function Label({ children, style: s }) {
  return <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:C.gold, letterSpacing:2, textTransform:"uppercase", marginBottom:14, ...s }}>{children}</div>;
}

function StockCard({ st }) {
  const pos = st.c >= 0;
  return (
    <div className="card-hover" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px", borderLeft:`3px solid ${pos?C.green:C.red}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:12, fontWeight:600, color:C.gold }}>{st.s}</span>
        <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:clr(st.c) }}>{arr(st.c)} {Math.abs(st.c)}%</span>
      </div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>{st.n}</div>
      <div style={{ fontFamily:"'IBM Plex Mono'", fontSize:20, fontWeight:600, color:C.text }}>{fmt(st.p)}</div>
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
        method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`fields[email]=${encodeURIComponent(email)}&ml-submit=1&anticsrf=true`,
      });
    } catch(e) {}
    setStatus("success"); setEmail("");
  };
  if (status === "success") return (
    <div style={{ background:"#00d68f15", border:"1px solid #00d68f", borderRadius:12, padding:"28px 24px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#00d68f", marginBottom:8 }}>¡Ya estás suscrito!</div>
      <p style={{ fontSize:14, color:C.sub }}>Revisa tu correo para confirmar.</p>
    </div>
  );
  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
        <input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          style={{ flex:1, minWidth:200, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 18px", color:C.text, fontFamily:"'Inter',sans-serif", fontSize:15, outline:"none" }} />
        <button onClick={handleSubmit} disabled={status==="loading"} style={{ background:C.gold, color:"#000", border:"none", padding:"14px 24px", borderRadius:8, cursor:"pointer", fontFamily:"'IBM Plex Mono'", fontSize:13, fontWeight:700 }}>
          {status==="loading"?"⏳ Enviando...":"Suscribirse →"}
        </button>
      </div>
      {status==="error" && <p style={{ fontSize:12, color:C.red }}>⚠️ Ingresa un email válido</p>}
    </div>
  );
}

function CompoundCalc() {
  const [capital, setCapital] = useState(10000);
  const [aporte, setAporte] = useState(200);
  const [tasa, setTasa] = useState(10);
  const [anos, setAnos] = useState(15);
  const [moneda, setMoneda] = useState("USD");
  const [frecuencia, setFrecuencia] = useState("Mensual");
  const [capitaliz, setCapitaliz] = useState("Anual");
  const [vistaTabla, setVistaTabla] = useState("Anual");
  const sym = moneda==="DOP"?"RD$":"$";
  const fmtPct = (n) => `${(+n).toFixed(2)}%`;
  const fmtM = (n) => `${sym}${(+n).toLocaleString("es-DO",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const freqMap = {"Mensual":12,"Semanal":52,"Anual":1};
  const periodos = freqMap[frecuencia]||12;
  const tasaPeriodo = Math.pow(1+tasa/100,1/periodos)-1;
  const filas = [];
  let saldo = capital, totalInteresAcum = 0;
  for (let y=1;y<=anos;y++) {
    let saldoInicio=saldo, aporteAnualReal=0;
    for (let p=0;p<periodos;p++) { saldo=saldo*(1+tasaPeriodo)+aporte; aporteAnualReal+=aporte; }
    const interesAnual=saldo-saldoInicio-aporteAnualReal;
    totalInteresAcum+=interesAnual;
    filas.push({ano:y,saldo,capitalBase:saldoInicio,aporteBase:aporteAnualReal,aporteAcum:capital+aporte*periodos*y,interesAcum:totalInteresAcum,ganancia:interesAnual});
  }
  const totalFinal=filas[filas.length-1]?.saldo??capital;
  const aporteTotal=capital+aporte*periodos*anos;
  const interesTotal=totalFinal-aporteTotal;
  const gananciaPct=aporteTotal>0?(interesTotal/aporteTotal*100):0;
  const fmtK=v=>v>=1e6?sym+(v/1e6).toFixed(1)+"M":v>=1000?sym+(v/1000).toFixed(0)+"K":sym+Math.round(v);
  const inputStyle={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontFamily:"'IBM Plex Mono'",fontSize:15,fontWeight:600,outline:"none"};
  const labelStyle={fontSize:13,color:C.sub,marginBottom:6,display:"block"};
  const selStyle={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontFamily:"'IBM Plex Mono'",fontSize:13,outline:"none",cursor:"pointer"};
  const stepBtn=(fn,dir)=>(<button onClick={fn} style={{width:40,background:C.border,border:"none",color:C.gold,fontSize:20,cursor:"pointer",borderRadius:dir==="left"?"8px 0 0 8px":"0 8px 8px 0",flexShrink:0}}>{dir==="left"?"−":"+"}</button>);
  const numInput=(val,setVal,step,min=0)=>(<div style={{display:"flex",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",height:42}}>{stepBtn(()=>setVal(v=>Math.max(min,+(v-step).toFixed(2))),"left")}<input type="number" value={val||""} min={min} onChange={e=>setVal(e.target.value===""?0:Math.max(min,+e.target.value))} style={{flex:1,background:C.card,border:"none",outline:"none",color:C.gold,fontFamily:"'IBM Plex Mono'",fontSize:15,fontWeight:700,textAlign:"center"}}/>{stepBtn(()=>setVal(v=>+(v+step).toFixed(2)),"right")}</div>);
  return (
    <div>
      <SectionTitle>Calculadora de Inversión</SectionTitle>
      <p style={{fontSize:13,color:C.sub,marginTop:4,marginBottom:20}}>El S&P 500 ha retornado ~10% anual históricamente.</p>
      <div style={{display:"flex",gap:8,marginBottom:24,maxWidth:260}}>
        {["USD","DOP"].map(m=>(<button key={m} onClick={()=>setMoneda(m)} style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${moneda===m?C.gold:C.border}`,background:moneda===m?C.goldBg:"none",color:moneda===m?C.gold:C.muted,fontFamily:"'IBM Plex Mono'",fontSize:13,fontWeight:600,cursor:"pointer"}}>{m==="USD"?"🇺🇸 USD":"🇩🇴 DOP"}</button>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"start"}} className="calc-grid">
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"24px"}}>
          <div style={{marginBottom:18}}><label style={labelStyle}>Inversión Inicial ({sym})</label>{numInput(capital,setCapital,1000)}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
            <div><label style={labelStyle}>Aportes ({sym})</label>{numInput(aporte,setAporte,50)}</div>
            <div><label style={labelStyle}>Frecuencia</label><select value={frecuencia} onChange={e=>setFrecuencia(e.target.value)} style={selStyle}>{["Mensual","Semanal","Anual"].map(o=><option key={o}>{o}</option>)}</select></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
            <div><label style={labelStyle}>Retorno Esperado (%)</label>{numInput(tasa,setTasa,0.5,0.1)}</div>
            <div><label style={labelStyle}>Capitalización</label><select value={capitaliz} onChange={e=>setCapitaliz(e.target.value)} style={selStyle}>{["Anual","Mensual","Trimestral","Semestral"].map(o=><option key={o}>{o}</option>)}</select></div>
          </div>
          <div style={{marginBottom:18}}><label style={labelStyle}>Años de Crecimiento</label>{numInput(anos,setAnos,1,1)}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:`linear-gradient(135deg,${C.card},${C.bg})`,border:`2px solid ${C.gold}`,borderRadius:12,padding:"20px 24px",textAlign:"center"}}>
            <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:C.gold,letterSpacing:2,marginBottom:6}}>VALOR FINAL EN {anos} AÑOS</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:800,color:C.gold}}>{fmtM(totalFinal)}</div>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
            {[{lbl:"Inversión Total",val:fmtM(aporteTotal),color:C.text},{lbl:"Capital % del Final",val:fmtPct(aporteTotal/totalFinal*100),color:C.muted},{lbl:"Aporte Total",val:fmtM(aporte*periodos*anos),color:C.sub},{lbl:"Ganancia Total",val:fmtM(Math.max(0,interesTotal)),color:C.green},{lbl:"Ganancia Porcentual",val:fmtPct(Math.max(0,gananciaPct)),color:C.green}].map((r,i,arr)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 20px",borderBottom:i<arr.length-1?`1px solid ${C.border}20`:"none"}}><span style={{fontSize:13,color:C.muted}}>{r.lbl}</span><span style={{fontFamily:"'IBM Plex Mono'",fontSize:15,fontWeight:700,color:r.color}}>{r.val}</span></div>))}
          </div>
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"24px",marginTop:24}}>
        <Label>── Proyección de Crecimiento</Label>
        <div style={{width:"100%",height:300}}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filas} margin={{top:10,right:30,left:10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="ano" stroke={C.muted} tick={{fontFamily:"'IBM Plex Mono'",fontSize:10,fill:C.muted}}/>
              <YAxis stroke={C.muted} tick={{fontFamily:"'IBM Plex Mono'",fontSize:9,fill:C.muted}} tickFormatter={(v)=>v>=1000000?"$"+(v/1000000).toFixed(1)+"M":v>=1000?"$"+(v/1000).toFixed(0)+"K":"$"+Math.round(v)}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontFamily:"'IBM Plex Mono'",fontSize:12}} labelFormatter={v=>`Año ${v}`} formatter={(v,n)=>["$"+Math.round(v).toLocaleString(),n==="aporteAcum"?"Capital Base":n==="interesAcum"?"Ganancias Acum.":n==="ganancia"?"Ganancia Año":n]}/>
              <Legend wrapperStyle={{fontFamily:"'IBM Plex Mono'",fontSize:11,paddingTop:12}}/>
              <Bar dataKey="aporteAcum" stackId="a" fill="#1e4a7a" name="Capital Base"/>
              <Bar dataKey="interesAcum" stackId="a" fill="#2d7a4a" name="Ganancias Acum." radius={[4,4,0,0]}/>
              <Line type="monotone" dataKey="ganancia" stroke={C.gold} strokeWidth={2.5} dot={{fill:C.gold,r:3}} name="Ganancia Año"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,margin:"24px 0 12px"}}>
        <span style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:vistaTabla==="Anual"?C.gold:C.muted}}>Anual</span>
        <div onClick={()=>setVistaTabla(v=>v==="Anual"?"Mensual":"Anual")} style={{width:44,height:24,borderRadius:12,cursor:"pointer",position:"relative",background:vistaTabla==="Mensual"?C.gold:C.border,transition:"background 0.25s"}}>
          <div style={{position:"absolute",top:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.25s",left:vistaTabla==="Mensual"?23:3}}/>
        </div>
        <span style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:vistaTabla==="Mensual"?C.gold:C.muted}}>Mensual</span>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'IBM Plex Mono'",fontSize:12,minWidth:700}}>
          <thead><tr style={{background:C.card,borderBottom:`1px solid ${C.border}`}}>{[vistaTabla==="Mensual"?"Mes":"Año","Capital Base","Aporte","Capital Total","Ganancia","% Ganancia","Ganancia Acum.","Valor Final"].map((h,i)=>(<th key={i} style={{padding:"10px 12px",fontWeight:500,textAlign:i===0?"left":"right",color:C.muted,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
          <tbody>
            {vistaTabla==="Anual"?filas.map((f,i)=>(<tr key={i} style={{borderBottom:`1px solid ${C.border}20`,background:i%2===0?"transparent":"#ffffff03"}}>
              <td style={{padding:"10px 12px",color:C.gold}}>Año {f.ano}</td>
              <td style={{padding:"10px 12px",textAlign:"right",color:C.text}}>{fmtM(f.capitalBase)}</td>
              <td style={{padding:"10px 12px",textAlign:"right",color:C.muted}}>{fmtM(f.aporteBase)}</td><td style={{padding:"10px 12px",textAlign:"right",color:C.text}}>{fmtM(f.capitalBase+f.aporteBase)}</td>
              <td style={{padding:"10px 12px",textAlign:"right",color:C.green}}>{fmtM(f.ganancia)}</td><td style={{padding:"10px 12px",textAlign:"right",color:C.gold}}>{f.capitalBase>0?(f.ganancia/(f.capitalBase+f.aporteBase)*100).toFixed(2)+"%":"0%"}</td>
              <td style={{padding:"10px 12px",textAlign:"right",color:C.sub}}>{fmtM(f.interesAcum)}</td>
              <td style={{padding:"10px 12px",textAlign:"right",color:C.gold,fontWeight:700}}>{fmtM(f.saldo)}</td>
            </tr>)):(() => {
              const rows=[];let saldoM=capital,interesAcumM=0,aporteAcumM=capital;
              const tasaM=Math.pow(1+tasa/100,1/12)-1;
              for(let m=1;m<=anos*12;m++){const prev=saldoM;saldoM=saldoM*(1+tasaM)+aporte;const g=saldoM-prev-aporte;interesAcumM+=g;aporteAcumM+=aporte;
                rows.push(<tr key={m} style={{borderBottom:`1px solid ${C.border}15`,background:m%2===0?"transparent":"#ffffff02"}}>
                  <td style={{padding:"8px 12px",color:C.gold}}>Mes {m}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.text}}>{fmtM(prev)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.muted}}>{fmtM(aporte)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.muted}}>{fmtM(aporteAcumM)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.green}}>{fmtM(g)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.muted}}>{((g/(prev+aporte))*100).toFixed(2)+"%"}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.sub}}>{fmtM(interesAcumM)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right",color:C.gold,fontWeight:700}}>{fmtM(saldoM)}</td>
                </tr>);}return rows;})()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TradingViewCharts() {
  const [input, setInput] = useState("");
  const [activeSymbol, setActiveSymbol] = useState("");
  const [activeInterval, setActiveInterval] = useState("D");
  const chartRef = useRef(null);
  const intervals = [{v:"1",l:"1m"},{v:"5",l:"5m"},{v:"15",l:"15m"},{v:"60",l:"1H"},{v:"D",l:"1D"},{v:"W",l:"1W"},{v:"M",l:"1M"}];
  const loadChart = (sym) => { const s=sym.trim().toUpperCase(); if(!s) return; setActiveSymbol(s); };
  useEffect(() => {
    if (!activeSymbol||!chartRef.current) return;
    chartRef.current.innerHTML="";
    const container=document.createElement("div");
    container.id="tv_chart_main";
    chartRef.current.appendChild(container);
    const script=document.createElement("script");
    script.src="https://s3.tradingview.com/tv.js";
    script.async=true;
    script.onload=()=>{ if(window.TradingView) new window.TradingView.widget({container_id:"tv_chart_main",symbol:activeSymbol,interval:activeInterval,timezone:"America/New_York",theme:"dark",style:"1",locale:"es",toolbar_bg:"#0d0f1e",enable_publishing:false,hide_top_toolbar:false,save_image:false,backgroundColor:C.bg,gridColor:"#1a1e3540",width:"100%",height:560,studies:["RSI@tv-basicstudies","MACD@tv-basicstudies"],show_popup_button:true}); };
    document.head.appendChild(script);
    return ()=>{ if(script.parentNode) script.parentNode.removeChild(script); };
  },[activeSymbol,activeInterval]);
  return (
    <div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"28px 32px",marginBottom:24,textAlign:"center"}}>
        <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:C.gold,letterSpacing:3,marginBottom:12}}>BUSCA CUALQUIER ACTIVO</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:800,color:C.text,marginBottom:8}}>Acciones · ETFs · Cripto · Materias Primas</h2>
        <p style={{fontSize:13,color:C.sub,marginBottom:24}}>Escribe el símbolo del activo — AAPL, BTC, GLD, EUR/USD.</p>
        <div style={{display:"flex",gap:10,maxWidth:500,margin:"0 auto",flexWrap:"wrap"}}>
          <input type="text" placeholder="Ej: AAPL, TSLA, BTC, GLD..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadChart(input)}
            style={{flex:1,minWidth:200,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 18px",color:C.text,fontFamily:"'IBM Plex Mono'",fontSize:15,outline:"none"}}/>
          <button onClick={()=>loadChart(input)} style={{background:C.gold,color:"#000",border:"none",padding:"14px 28px",borderRadius:8,cursor:"pointer",fontFamily:"'IBM Plex Mono'",fontSize:13,fontWeight:700}}>Ver Chart →</button>
        </div>
      </div>
      {activeSymbol ? (
        <div>
          <div style={{display:"flex",gap:6,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:C.muted,marginRight:8}}>INTERVALO:</span>
            {intervals.map(iv=>(<button key={iv.v} onClick={()=>setActiveInterval(iv.v)} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${activeInterval===iv.v?C.gold:C.border}`,background:activeInterval===iv.v?C.goldBg:"none",color:activeInterval===iv.v?C.gold:C.muted,fontFamily:"'IBM Plex Mono'",fontSize:11,fontWeight:600,cursor:"pointer"}}>{iv.l}</button>))}
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{background:"#09091a",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"'IBM Plex Mono'",fontSize:14,fontWeight:700,color:C.gold}}>{activeSymbol}</div>
              <div style={{fontFamily:"'IBM Plex Mono'",fontSize:10,color:C.muted}}>Powered by TradingView</div>
            </div>
            <div ref={chartRef} style={{width:"100%",minHeight:560}}/>
          </div>
        </div>
      ) : (
        <div style={{textAlign:"center",padding:"60px 32px",background:C.card,border:`1px dashed ${C.border}`,borderRadius:12}}>
          <div style={{fontSize:48,marginBottom:16}}>📊</div>
          <p style={{fontFamily:"'IBM Plex Mono'",fontSize:13,color:C.muted,lineHeight:1.8}}>Escribe el símbolo arriba y presiona <strong style={{color:C.gold}}>Ver Chart</strong></p>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:20,flexWrap:"wrap"}}>
            {["SPY","QQQ","AAPL","NVDA","TSLA","BTC","GLD"].map(s=>(<button key={s} onClick={()=>{setInput(s);loadChart(s);}} style={{background:C.goldBg,border:`1px solid ${C.gold}40`,color:C.gold,padding:"6px 14px",borderRadius:6,cursor:"pointer",fontFamily:"'IBM Plex Mono'",fontSize:12,fontWeight:600}}>{s}</button>))}
          </div>
        </div>
      )}
    </div>
  );
}

function SnapshotCard({ stocks }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [cardTheme, setCardTheme] = useState("dark");
  const gainers = stocks.filter(s=>s.c>0).length;
  const pct = Math.round(gainers/stocks.length*100);
  const sentiment = pct>=70?"ALCISTA 🟢":pct>=40?"NEUTRAL ⚪":"BAJISTA 🔴";
  const topMover = [...stocks].sort((a,b)=>Math.abs(b.c)-Math.abs(a.c))[0];
  const date = new Date().toLocaleDateString("es-DO",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const generateCanvas = () => {
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); const W=1080,H=1080;
    canvas.width=W; canvas.height=H;
    const isDark=cardTheme==="dark";
    const bg=isDark?"#07080f":"#f4f5f8",card=isDark?"#0d0f1e":"#ffffff",border=isDark?"#1a1e35":"#e0e4ef",gold="#c8a84b",textCol=isDark?"#dde1f5":"#1a1d2e",subCol=isDark?"#8890b5":"#555e7a",green="#00d68f",red="#ff4466";
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ctx.fillStyle=gold; ctx.fillRect(0,0,W,6);
    ctx.fillStyle=gold; ctx.font="bold 72px Georgia,serif"; ctx.fillText("FinanzaDR",60,100);
    ctx.fillStyle=subCol; ctx.font="28px 'Courier New',monospace"; ctx.fillText("MARKET SNAPSHOT · "+date.toUpperCase(),60,145);
    ctx.fillStyle=border; ctx.fillRect(60,165,W-120,2);
    ctx.fillStyle=pct>=70?green:pct>=40?gold:red; ctx.font="bold 52px Georgia,serif"; ctx.fillText(sentiment,60,250);
    ctx.fillStyle=subCol; ctx.font="26px 'Courier New',monospace"; ctx.fillText(`${gainers} de ${stocks.length} activos en verde — ${pct}% positivo`,60,295);
    ctx.fillStyle=border; ctx.fillRect(60,320,W-120,2);
    const cols=4,cellW=(W-120)/cols,startY=350;
    stocks.forEach((st,i)=>{
      const col=i%cols,row=Math.floor(i/cols),x=60+col*cellW,y=startY+row*160;
      ctx.fillStyle=card;
      ctx.beginPath();ctx.moveTo(x+8+12,y);ctx.lineTo(x+cellW-8-12,y);ctx.quadraticCurveTo(x+cellW-8,y,x+cellW-8,y+12);ctx.lineTo(x+cellW-8,y+140-12);ctx.quadraticCurveTo(x+cellW-8,y+140,x+cellW-8-12,y+140);ctx.lineTo(x+8+12,y+140);ctx.quadraticCurveTo(x+8,y+140,x+8,y+140-12);ctx.lineTo(x+8,y+12);ctx.quadraticCurveTo(x+8,y,x+8+12,y);ctx.closePath();ctx.fill();
      ctx.fillStyle=st.c>=0?green:red; ctx.fillRect(x+8,y,4,140);
      ctx.fillStyle=gold; ctx.font="bold 28px 'Courier New',monospace"; ctx.fillText(st.s,x+22,y+38);
      ctx.fillStyle=subCol; ctx.font="18px 'Courier New',monospace"; ctx.fillText(st.n.length>12?st.n.slice(0,12)+"...":st.n,x+22,y+65);
      ctx.fillStyle=textCol; ctx.font="bold 30px 'Courier New',monospace"; ctx.fillText(st.p>=1000?Math.round(st.p).toLocaleString():st.p.toFixed(2),x+22,y+105);
      ctx.fillStyle=st.c>=0?green:red; ctx.font="bold 22px 'Courier New',monospace"; ctx.fillText(`${st.c>=0?"▲":"▼"} ${Math.abs(st.c)}%`,x+22,y+132);
    });
    const tmY=startY+Math.ceil(stocks.length/cols)*160+20;
    ctx.fillStyle=border; ctx.fillRect(60,tmY,W-120,2);
    ctx.fillStyle=subCol; ctx.font="26px 'Courier New',monospace"; ctx.fillText("TOP MOVER:",60,tmY+46);
    ctx.fillStyle=gold; ctx.font="bold 48px Georgia,serif"; ctx.fillText(`${topMover.s} — ${topMover.c>=0?"▲":"▼"} ${Math.abs(topMover.c)}%`,60,tmY+105);
    ctx.fillStyle=border; ctx.fillRect(60,H-90,W-120,2);
    ctx.fillStyle=gold; ctx.font="bold 32px 'Courier New',monospace"; ctx.fillText("finanzadr.com",60,H-45);
    ctx.fillStyle=subCol; ctx.font="22px 'Courier New',monospace"; ctx.textAlign="right"; ctx.fillText("Wall Street en tu idioma",W-60,H-45); ctx.textAlign="left";
  };
  useEffect(()=>{ generateCanvas(); },[stocks,cardTheme]);
  const downloadImage=()=>{ const canvas=canvasRef.current,link=document.createElement("a"); link.download=`finanzadr-snapshot-${new Date().toISOString().split("T")[0]}.png`; link.href=canvas.toDataURL("image/png"); link.click(); };
  const shareOnX=()=>{ const text=`📊 Market Snapshot\n\n${stocks.slice(0,4).map(s=>`${s.s}: ${s.c>=0?"▲":"▼"}${Math.abs(s.c)}%`).join(" | ")}\n\nSentimiento: ${sentiment} (${pct}%)\n\n#WallStreet #Inversiones #FinanzaDR\nfinanzadr.com`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,"_blank"); };
  const copyImage=async()=>{ const canvas=canvasRef.current; canvas.toBlob(async blob=>{ try{ await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]); setCopied(true); setTimeout(()=>setCopied(false),2000); }catch{ downloadImage(); } }); };
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["dark","light"].map(s=>(<button key={s} onClick={()=>setCardTheme(s)} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${cardTheme===s?C.gold:C.border}`,background:cardTheme===s?C.goldBg:"none",color:cardTheme===s?C.gold:C.muted,fontFamily:"'IBM Plex Mono'",fontSize:12,fontWeight:600,cursor:"pointer"}}>{s==="dark"?"🌙 Oscuro":"☀️ Claro"}</button>))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:20,overflow:"hidden"}}>
        <canvas ref={canvasRef} style={{width:"100%",height:"auto",borderRadius:8,display:"block"}}/>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <button onClick={downloadImage} style={{background:C.gold,color:"#000",border:"none",padding:"13px 24px",borderRadius:8,cursor:"pointer",fontFamily:"'IBM Plex Mono'",fontSize:13,fontWeight:700}}>⬇️ Descargar PNG</button>
        <button onClick={copyImage} style={{background:copied?C.green:"none",color:copied?"#000":C.gold,border:`1px solid ${copied?C.green:C.gold}`,padding:"13px 24px",borderRadius:8,cursor:"pointer",fontFamily:"'IBM Plex Mono'",fontSize:13,fontWeight:700}}>{copied?"✅ ¡Copiado!":"📋 Copiar Imagen"}</button>
        <button onClick={shareOnX} style={{background:"#000",color:"#fff",border:"1px solid #333",padding:"13px 24px",borderRadius:8,cursor:"pointer",fontFamily:"'IBM Plex Mono'",fontSize:13,fontWeight:700}}>𝕏 Compartir en X</button>
      </div>
    </div>
  );
}





















