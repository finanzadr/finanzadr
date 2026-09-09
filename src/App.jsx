import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Link, Outlet, useOutletContext, useSearchParams, useLocation } from "react-router-dom";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";

// Modelo de instrumento. Separa simbolo, nombre del producto que realmente
// cotiza, tipo de activo, referencia subyacente, moneda y mercado.
// SPY, QQQ, DIA, IWM y GLD son ETFs: llamarlos "S&P 500", "Dow Jones" u "Oro"
// hacia pasar el precio del ETF por el nivel del indice o del metal — el
// resumen de cierre llego a publicar el precio de DIA como nivel del Dow.
// `corto` es la referencia en lenguaje llano para titulares; no sustituye a
// `tipoActivo` en la ficha del instrumento.
// p y c arrancan en null a proposito: hasta que responde /api/precios no hay
// dato real, y una cifra semilla renderizada durante un segundo se lee como
// cotizacion verdadera. Ese era el origen de los precios que "cambiaban solos"
// al terminar de cargar la pagina.
const INSTRUMENTOS = [
  { s: "SPY",     n: "SPDR S&P 500 ETF Trust",                  corto: "S&P 500",                    tipoActivo: "ETF",          referencia: "Sigue el índice S&P 500",                                     moneda: "USD", mercado: "NYSE Arca", p: null, c: null },
  { s: "QQQ",     n: "Invesco QQQ Trust",                       corto: "NASDAQ 100",                 tipoActivo: "ETF",          referencia: "Sigue el índice NASDAQ 100",                                  moneda: "USD", mercado: "NASDAQ",    p: null, c: null },
  { s: "DIA",     n: "SPDR Dow Jones Industrial Average ETF",   corto: "Dow Jones",                  tipoActivo: "ETF",          referencia: "Sigue el índice Dow Jones Industrial Average",                moneda: "USD", mercado: "NYSE Arca", p: null, c: null },
  { s: "IWM",     n: "iShares Russell 2000 ETF",                corto: "Russell 2000",               tipoActivo: "ETF",          referencia: "Sigue el índice Russell 2000, de empresas pequeñas de EE.UU.", moneda: "USD", mercado: "NYSE Arca", p: null, c: null },
  { s: "GLD",     n: "SPDR Gold Shares",                        corto: "Oro",                        tipoActivo: "ETF",          referencia: "Respaldado por oro físico; su precio no es la onza de oro",   moneda: "USD", mercado: "NYSE Arca", p: null, c: null },
  { s: "TLT",     n: "iShares 20+ Year Treasury Bond ETF",      corto: "Bonos del Tesoro a 20+ años", tipoActivo: "ETF",         referencia: "Cesta de bonos del Tesoro de EE.UU. a más de 20 años",        moneda: "USD", mercado: "NASDAQ",    p: null, c: null },
  { s: "XLU",     n: "Utilities Select Sector SPDR Fund",       corto: "Sector Utilities",           tipoActivo: "ETF",          referencia: "Empresas de servicios públicos del S&P 500",                  moneda: "USD", mercado: "NYSE Arca", p: null, c: null },
  { s: "BTC-USD", n: "Bitcoin",                                 corto: "Bitcoin",                    tipoActivo: "Criptomoneda", referencia: "Cotización BTC/USDT en Binance, sin horario de cierre",       moneda: "USD", mercado: "Cripto · 24/7", p: null, c: null },
];;const NOTICIAS = [
  { titulo: "S&P 500 cierra en máximo histórico mientras mercados celebran pausa de la Fed", resumen: "El S&P 500 alcanzó un nuevo récord cerrando por encima de 5,800 puntos este viernes, impulsado por datos de empleo más fuertes de lo esperado. La Reserva Federal señaló que mantendría las tasas sin cambios hasta tener mayor claridad sobre la inflación.", fuente: "Reuters", tiempo: "Hace 1 hora", categoria: "Mercados" },
  { titulo: "NVIDIA supera los $1,000 por acción por primera vez en su historia", resumen: "Las acciones de NVIDIA cruzaron la barrera de los $1,000 por primera vez impulsadas por una demanda récord de chips para inteligencia artificial. La compañía reportó ingresos trimestrales de $44 mil millones, un 78% más que el año anterior.", fuente: "Bloomberg", tiempo: "Hace 3 horas", categoria: "Acciones" },
  { titulo: "El oro alcanza nuevos máximos históricos ante la incertidumbre geopolítica global", resumen: "El precio del oro superó los $3,400 por onza este mes, estableciendo un nuevo récord histórico. Los inversores buscan refugio en metales preciosos ante las tensiones geopolíticas y el debilitamiento del dólar.", fuente: "WSJ", tiempo: "Hace 5 horas", categoria: "Materias Primas" },
  { titulo: "Bitcoin consolida por encima de los $90,000 con creciente adopción institucional", resumen: "Bitcoin mantiene su posición por encima de los $90,000 respaldado por compras institucionales y la aprobación de nuevos ETFs en mercados europeos y asiáticos.", fuente: "CNBC", tiempo: "Hace 7 horas", categoria: "Cripto" },
  { titulo: "Los bonos del Tesoro a 10 años suben ante señales de desaceleración económica", resumen: "El rendimiento del bono del Tesoro a 10 años cayó al 4.2% mientras los inversores buscan activos más seguros. Los datos de manufactura mostraron una contracción por segundo mes consecutivo.", fuente: "Financial Times", tiempo: "Hace 9 horas", categoria: "Bonos" },
  { titulo: "Dow Jones supera los 42,000 puntos impulsado por sector financiero y salud", resumen: "El Dow Jones Industrial Average superó los 42,000 puntos esta semana, liderado por fuertes ganancias en el sector financiero y de salud.", fuente: "MarketWatch", tiempo: "Hace 11 horas", categoria: "Mercados" },
];const ARTICULOS = [
  { tipo: "pasos", titulo: "Cómo abrir tu primera cuenta de inversión en EE.UU. siendo inmigrante", nivel: "Principiante", tema: "Cuentas y brokers", extracto: "No necesitas ser ciudadano ni tener SSN para invertir en Wall Street. Con un ITIN y tu pasaporte puedes abrir tu cuenta esta misma semana.", intro: "Uno de los mitos más grandes que detiene a los inmigrantes latinos es pensar que hay que ser ciudadano o residente legal permanente para invertir en la bolsa de EE.UU. No es cierto. No necesitas un Social Security Number (SSN) — con un ITIN (Individual Taxpayer Identification Number) y tu pasaporte puedes abrir una cuenta de inversión legalmente, sin importar tu estatus migratorio.", pasos: [
      { titulo: "Consigue tu ITIN si no tienes SSN", texto: "Si no calificas para un SSN, solicita un ITIN con el formulario W-7 del IRS. Es un número de identificación fiscal que te permite invertir y declarar impuestos sin ser ciudadano. Puedes tramitarlo tú mismo o con ayuda de un Acceptance Agent certificado por el IRS." },
      { titulo: "Elige tu broker según tu experiencia", texto: "Si eres principiante, Robinhood o Webull tienen las apps más simples y sin comisiones para abrir tu primera cuenta. Si vives fuera de EE.UU. y buscas más flexibilidad, Interactive Brokers acepta clientes internacionales y da acceso a mercados globales." },
      { titulo: "Verifica tu identidad", texto: "Todos los brokers te van a pedir tu pasaporte vigente y un comprobante de dirección (recibo de servicios, estado de cuenta bancario o contrato de renta) para cumplir con las regulaciones KYC (Know Your Customer)." },
      { titulo: "Conecta tu cuenta bancaria en EE.UU.", texto: "Necesitas una cuenta bancaria en Estados Unidos para transferir fondos. Si aún no tienes una, bancos como Chase o Bank of America, o cuentas digitales como Chime, aceptan ITIN para abrir una cuenta básica." },
      { titulo: "Haz tu primer depósito y compra tu primer ETF", texto: "Con $1 dólar ya puedes empezar. Deposita desde tu cuenta bancaria y compra tu primer ETF, como VOO (S&P 500), para tener exposición diversificada a las 500 empresas más grandes de EE.UU. desde el primer día." },
    ], cierre: "No dejes que la falta de papeles perfectos te detenga. Miles de inmigrantes ya invierten legalmente en Wall Street con un ITIN y un pasaporte — el sistema está diseñado para que puedas participar, solo falta que des el primer paso.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["inmigrantes", "ITIN", "primeros pasos"] },
  { tipo: "stats", titulo: "Qué es el S&P 500 y por qué deberías empezar ahí", nivel: "Principiante", tema: "Acciones y ETFs", extracto: "500 empresas, un solo clic. Así es como los principiantes más listos empiezan a invertir en Wall Street sin tener que escoger acciones individuales.", intro: "El S&P 500 es el índice bursátil más seguido del mundo: agrupa a las 500 empresas más grandes que cotizan en Estados Unidos, desde Apple y Microsoft hasta Coca-Cola y JPMorgan. Cuando compras un ETF que sigue el S&P 500 (como VOO o SPY), en una sola compra te conviertes en dueño de una pequeña parte de las 500 compañías más importantes del país — sin tener que investigar ni elegir acciones individuales.", stats: [
      { valor: "10%", label: "Retorno anual histórico promedio" },
      { valor: "500", label: "Empresas más grandes de EE.UU." },
      { valor: "94", label: "Años de historia del índice" },
    ], razones: [
      { titulo: "Diversificación automática", texto: "En vez de apostar tu dinero a una sola empresa, tu inversión se reparte entre las 500 compañías más grandes de EE.UU. Si una cae, las otras 499 amortiguan el golpe." },
      { titulo: "94 años de historial con 10% de retorno anual", texto: "Desde su creación en 1928, el S&P 500 ha entregado un retorno promedio del 10% anual, incluyendo guerras, recesiones y crisis financieras. El tiempo en el mercado importa más que el momento perfecto para entrar." },
      { titulo: "No necesitas ser un experto", texto: "No hace falta leer balances financieros ni seguir noticias de empresas todos los días. El índice se ajusta solo: las empresas que crecen ganan más peso, y las que caen salen del índice." },
    ], cierre: "La estrategia que mejor funciona con el S&P 500 se llama dollar-cost averaging (DCA): invertir una cantidad fija cada mes, sin importar si el mercado sube o baja. Así compras más acciones cuando los precios están bajos y menos cuando están altos, sin tener que adivinar el momento perfecto — y con el tiempo, esa disciplina simple suele superar a quienes intentan predecir el mercado.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["S&P 500", "ETF", "principiantes"] },
  { tipo: "tabla", titulo: "Acciones vs ETFs vs Fondos Mutuos: cuál te conviene", nivel: "Principiante", tema: "Acciones y ETFs", extracto: "Los tres términos se confunden todo el tiempo, pero no son lo mismo. Aquí la diferencia explicada en una tabla, sin tecnicismos.", intro: "Es normal confundir estos tres términos cuando estás empezando: acciones individuales, ETFs y fondos mutuos son formas distintas de poner tu dinero en el mercado, cada una con sus propias reglas de juego. Entender la diferencia te ayuda a elegir la que mejor se ajusta a tu nivel de experiencia y tolerancia al riesgo.", tabla: {
      columnas: ["Acciones Individuales", "ETFs", "Fondos Mutuos"],
      filas: [
        { label: "Diversificación instantánea", valores: [false, true, true] },
        { label: "Comisiones bajas", valores: [true, true, false] },
        { label: "Se compra en cualquier momento del día", valores: [true, true, false] },
        { label: "Potencial de ganancia explosiva", valores: [true, false, false] },
        { label: "Se compra directo por tu cuenta (sin intermediario)", valores: [true, true, false] },
        { label: "Ideal para principiantes", valores: [false, true, false] },
      ],
    }, explicaciones: [
      { titulo: "Acciones Individuales", ventaja: { titulo: "Ganancia explosiva posible", texto: "Si eliges bien y compras temprano, una sola acción puede multiplicar tu inversión varias veces — así se hicieron las grandes fortunas con Amazon, Apple o Nvidia." }, desventaja: { titulo: "Todo depende de una empresa", texto: "Si esa empresa quiebra o tiene un mal trimestre, tu inversión cae con ella. No hay red de seguridad." } },
      { titulo: "ETFs", ventaja: { titulo: "Diversificación instantánea, bajo costo y fácil de comprar", texto: "Con una sola compra tienes exposición a cientos de empresas, con comisiones mínimas (algunas de 0.03% anual), y se compran igual que una acción, en cualquier momento del día de mercado." }, desventaja: { titulo: "No hay ganancias explosivas de una sola empresa", texto: "Como tu dinero está repartido entre muchas compañías, ninguna por sí sola puede disparar el valor de tu inversión de la noche a la mañana." } },
      { titulo: "Fondos Mutuos", texto: "Son parecidos a los ETFs — también diversifican tu dinero entre muchas empresas — pero se compran directo con la empresa administradora del fondo (no en tu app de broker), su precio se actualiza solo una vez al final del día de mercado, y generalmente cobran comisiones más altas que un ETF equivalente." },
    ], cierre: "Para principiantes, los ETFs son la mejor opción: diversificación, bajo costo y simplicidad. Las acciones individuales tienen sentido cuando ya tengas más experiencia y puedas investigar empresas a fondo. Y los fondos mutuos, generalmente, solo valen la pena si tu empleador los ofrece dentro de un plan 401(k) — ahí la elección ya está hecha por ti.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["acciones", "ETFs", "fondos mutuos"] },
  { tipo: "pasos", titulo: "Qué es un ETF y cómo funciona", nivel: "Principiante", tema: "Acciones y ETFs", extracto: "Descubre qué son los ETFs, por qué son la herramienta favorita de quien empieza a invertir, y cómo comprar tu primero paso a paso.", intro: "Si alguna vez escuchaste a alguien decir \"compré SPY\" o \"invierto en QQQ\", están hablando de ETFs — probablemente la herramienta de inversión más importante para alguien que está empezando, y una de las menos explicadas en español. Un ETF (Exchange-Traded Fund, o fondo cotizado en bolsa) es una \"canasta\" que contiene muchas acciones o activos diferentes, empaquetados en un solo producto que tú compras como si fuera una sola acción. Por ejemplo, cuando compras una acción de SPY, en realidad estás comprando un pedacito de las 500 empresas más grandes de Estados Unidos al mismo tiempo.", pasos: [
      { titulo: "¿Qué es un ETF?", texto: "Un ETF (Exchange-Traded Fund, o fondo cotizado en bolsa) es una \"canasta\" que contiene muchas acciones o activos diferentes, empaquetados en un solo producto que tú compras como si fuera una sola acción. Por ejemplo, cuando compras una acción de SPY, en realidad estás comprando un pedacito de las 500 empresas más grandes de Estados Unidos al mismo tiempo." },
      { titulo: "Por qué la diversificación importa", texto: "En vez de apostar todo tu dinero a que una sola empresa le vaya bien, tu dinero se reparte entre cientos de empresas a la vez. Si una empresa le va mal, las otras pueden compensarlo. Esto reduce mucho el riesgo comparado con comprar acciones individuales, especialmente cuando estás empezando." },
      { titulo: "Tipos comunes de ETFs", texto: "De índice amplio (como SPY o VOO, que siguen el S&P 500), sectoriales (enfocados en una industria específica, como QQQ para tecnología), de bonos (como TLT, más conservador), e internacionales (que invierten fuera de Estados Unidos)." },
      { titulo: "Cómo comprar tu primer ETF", texto: "Abre una cuenta en un broker (Robinhood o Tastytrade son opciones accesibles), busca el símbolo del ETF que te interesa, decide cuánto invertir (muchos brokers permiten comprar fracciones), y compra pensando en el largo plazo, no en especular día a día." },
      { titulo: "Lo que un ETF no te garantiza", texto: "Ningún ETF está libre de riesgo — si el mercado completo baja, tu ETF también baja, porque está compuesto por ese mismo mercado. Si ya sabes qué es un ETF y quieres comparar ETFs contra acciones individuales o fondos mutuos en detalle, tenemos una guía dedicada a esa comparación." },
    ], cierre: "Los ETFs no son una fórmula mágica, pero sí una de las formas más accesibles y razonables de empezar a invertir sin necesitar ser experto en analizar empresas individuales. Con estos cinco pasos ya tienes lo esencial para dar el primer paso con confianza.", nota: "Este contenido es educativo e informativo. No constituye asesoría financiera personalizada. Considera hablar con un asesor financiero certificado antes de tomar decisiones de inversión.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["ETF", "Principiantes", "Diversificación"] },
  { tipo: "herramientas", titulo: "Cómo leer el Heat Map y el Sentimiento del Mercado", nivel: "Intermedio", tema: "Herramientas", extracto: "Dos herramientas gratis que ya tienes en FinanzaDR te dicen en segundos cómo está el mercado hoy — aquí cómo interpretarlas.", intro: "No hace falta pagar por un terminal de Bloomberg para saber cómo está el mercado hoy. En FinanzaDR ya tienes dos herramientas gratuitas, disponibles ahora mismo en el menú, que leídas juntas te dan una foto rápida y clara del estado general de Wall Street: el Heat Map y el índice de Sentimiento.", herramientas: [
      { icono: "🔲", nombre: "Heat Map", ruta: "/heatmap", cta: "Ver Heat Map en vivo", descripcion: "El Heat Map muestra el S&P 500 completo como un mosaico de bloques de colores, actualizado en vivo.", puntos: [
          { titulo: "El tamaño del bloque = importancia", texto: "Cada bloque representa una empresa. Mientras más grande es el bloque, mayor es su capitalización de mercado (market cap) — por eso Apple o Microsoft ocupan mucho más espacio que una empresa pequeña." },
          { titulo: "El color = si sube o baja", texto: "Verde significa que la acción subió hoy, rojo significa que bajó. No hay ambigüedad: el color te dice la dirección de un vistazo." },
          { titulo: "La intensidad del color = magnitud del movimiento", texto: "Un verde brillante o un rojo intenso indica un movimiento fuerte de varios puntos porcentuales; un tono pálido indica un movimiento pequeño." },
        ], tip: "Cómo leerlo: fíjate primero en los bloques más grandes. Si los gigantes como Apple, Microsoft o Nvidia están en rojo intenso, es probable que todo el mercado esté teniendo un mal día, sin importar lo que hagan las empresas pequeñas." },
      { icono: "🪙", nombre: "Sentimiento del Mercado", ruta: "/sentimiento", cta: "Ver Sentimiento en vivo", descripcion: "El índice de Sentimiento resume en un solo número, de 0 a 100, el estado emocional del mercado.", puntos: [
          { titulo: "Número bajo = miedo", texto: "Cuando el índice cae hacia 0, significa que los inversores están vendiendo por pánico. Históricamente, estos momentos de miedo extremo han sido algunas de las mejores oportunidades de compra a largo plazo." },
          { titulo: "Número alto = codicia", texto: "Cuando el índice sube hacia 100, significa que todos quieren comprar y el optimismo está por las nubes. Es momento de tener más cautela, no de perseguir subidas con dinero que no puedes permitirte perder." },
        ], tip: "Como dice el dicho de Warren Buffett: sé temeroso cuando otros son codiciosos, y codicioso cuando otros son temerosos. El índice de Sentimiento te dice exactamente en cuál de los dos extremos está el mercado hoy." },
    ], cierre: "Usadas juntas, estas dos herramientas te dan el pulso del mercado en menos de un minuto: el Heat Map te muestra qué está pasando ahora mismo, empresa por empresa, y el Sentimiento te dice si esa reacción es miedo pasajero o codicia peligrosa. Revísalas antes de tomar cualquier decisión de compra o venta importante.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["heat map", "sentimiento", "herramientas"] },
  { tipo: "simulador", titulo: "Interés compuesto explicado con ejemplos reales", nivel: "Principiante", tema: "Largo plazo y retiro", extracto: "Einstein lo llamó la octava maravilla del mundo. Así es como $200 al mes pueden convertirse en más de un millón de dólares — o en menos de la mitad, dependiendo de cuándo empieces.", intro: "El interés compuesto es el motor detrás de casi cualquier fortuna construida a largo plazo. La idea es simple pero poderosa: no solo ganas intereses sobre tu dinero original, también ganas intereses sobre los intereses que ya generaste. Cada año, la base sobre la que creces es más grande — por eso el crecimiento se acelera con el tiempo, en vez de ser una línea recta.", ejemplo: {
      titulo: "$1,000 invertidos al 10% anual, sin aportes adicionales:",
      filas: [
        { periodo: "Año 1", valor: "$1,100" },
        { periodo: "Año 2", valor: "$1,210" },
        { periodo: "Año 10", valor: "~$2,594" },
        { periodo: "Año 30", valor: "~$17,449" },
      ],
    }, comparacion: {
      titulo: "Por qué empezar joven importa más que cuánto inviertes",
      casos: [
        { edad: "Empezando a los 25 años", aporte: "$200/mes", resultado: "~$1,275,000", detalle: "a los 65 años, con 40 años de crecimiento compuesto" },
        { edad: "Empezando a los 35 años", aporte: "$200/mes", resultado: "~$452,000", detalle: "a los 65 años — menos de la mitad, por perder solo 10 años" },
      ],
    }, cierre: "Mueve los sliders del simulador de abajo y compruébalo tú mismo: entre más joven empieces, menos dinero necesitas aportar cada mes para llegar al mismo destino. El tiempo, no el monto, es el ingrediente más importante del interés compuesto.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["interés compuesto", "calculadora", "estrategia"] },
  { tipo: "errores", titulo: "Errores comunes de principiantes al invertir (y cómo evitarlos)", nivel: "Principiante", tema: "Primeros pasos", extracto: "El 80% de los inversores primerizos repiten los mismos 6 errores. Identifícalos antes de que te cuesten dinero.", intro: "Invertir no es solo cuestión de elegir los activos correctos — la mayoría de las pérdidas de los principiantes no vienen de una mala elección de inversión, sino de errores de comportamiento que se repiten una y otra vez. Reconocerlos es el primer paso para evitarlos.", errores: [
      { titulo: "Intentar adivinar cuándo comprar y vender (market timing)", texto: "Ni los profesionales que se dedican a esto de tiempo completo aciertan consistentemente el momento perfecto para entrar o salir del mercado. Intentarlo casi siempre te cuesta más de lo que ganas — la estrategia que funciona es invertir de forma constante, sin importar el momento." },
      { titulo: "Invertir dinero que vas a necesitar pronto", texto: "El mercado sube y baja en el corto plazo. Solo invierte el dinero que no vas a necesitar en los próximos 3 a 5 años como mínimo, para no verte obligado a vender en un mal momento." },
      { titulo: "No diversificar", texto: "Poner todo tu dinero en una sola acción, por muy sólida que parezca, es una apuesta. Ni las empresas más grandes están garantizadas — repartir tu inversión entre muchas empresas reduce el riesgo sin sacrificar el potencial de crecimiento." },
      { titulo: "Vender en pánico cuando el mercado cae", texto: "Las caídas del mercado son temporales — históricamente, siempre se ha recuperado. Vender durante una caída convierte una pérdida temporal en una pérdida permanente." },
      { titulo: "No empezar por miedo a no saber lo suficiente", texto: "Nadie empieza sabiéndolo todo. Empezar con poco dinero mientras aprendes es mucho mejor que esperar el momento en que te sientas \"listo\" — ese momento casi nunca llega, y mientras tanto pierdes años de crecimiento compuesto." },
      { titulo: "Revisar tu portafolio obsesivamente", texto: "Ver tu cuenta todos los días aumenta la ansiedad y la tentación de reaccionar a movimientos que no importan a largo plazo. Para inversiones a largo plazo, revisar tu portafolio una vez al mes es más que suficiente." },
    ], cierre: "Cometer uno de estos errores no te descalifica como inversionista — todos los grandes inversionistas empezaron sin saberlo todo. La diferencia entre quienes tienen éxito a largo plazo y quienes no está en reconocer estos patrones y corregirlos antes de que le cuesten caro a tu patrimonio.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["errores", "principiantes", "psicología"] },
  { tipo: "tabla", titulo: "Roth IRA vs Traditional IRA: cuál te conviene abrir", nivel: "Intermedio", tema: "Largo plazo y retiro", extracto: "Las dos cuentas de retiro más comunes en Estados Unidos funcionan muy diferente en cuanto a impuestos. Aquí la diferencia explicada simple, para que elijas con más claridad.", intro: "Si trabajas en Estados Unidos y quieres ahorrar para el retiro por tu cuenta (más allá del 401k de tu trabajo, si lo tienes), un IRA (Individual Retirement Account, o cuenta de retiro individual) es una de las herramientas más accesibles. La gran pregunta es cuál abrir: Roth o Traditional — la diferencia no está en dónde inviertes tu dinero, sino en cuándo pagas impuestos sobre él.", tabla: {
      columnas: ["Roth IRA", "Traditional IRA"],
      filas: [
        { label: "Contribuyes con dinero después de haber pagado impuestos", valores: [true, false] },
        { label: "Reduce tu ingreso imponible este mismo año (deducible)", valores: [false, true] },
        { label: "Los retiros en la jubilación están libres de impuestos", valores: [true, false] },
        { label: "Tiene límite de ingresos para poder contribuir", valores: [true, false] },
        { label: "Te obliga a retirar dinero a partir de cierta edad (RMD)", valores: [false, true] },
      ],
    }, explicaciones: [
      { titulo: "Roth IRA", ventaja: { titulo: "Lo que ganas", texto: "Pagas impuestos ahora sobre el dinero que aportas, pero todo lo que ese dinero genere y retires en la jubilación es 100% libre de impuestos — incluyendo décadas de crecimiento. Tampoco te obliga a retirar el dinero a una edad específica, así que puede seguir creciendo el tiempo que quieras." }, desventaja: { titulo: "Lo que sacrificas", texto: "Existe un límite de ingresos anuales: si ganas por encima de cierto monto (que cambia cada año), no puedes contribuir directamente a un Roth IRA. Además, no reduces tus impuestos de este año." } },
      { titulo: "Traditional IRA", ventaja: { titulo: "Lo que ganas", texto: "El dinero que aportas puede reducir tu ingreso imponible de este año (dependiendo de tu situación), dándote un beneficio fiscal inmediato. No tiene límite de ingresos para poder contribuir." }, desventaja: { titulo: "Lo que sacrificas", texto: "Pagarás impuestos sobre el dinero cuando lo retires en la jubilación, incluyendo todo lo que haya crecido con los años. Además, a partir de cierta edad (actualmente 73 años), estás obligado a empezar a retirar un monto mínimo cada año, quieras o no." } },
    ], cierre: "No hay una respuesta única de \"cuál es mejor\" — depende de si crees que pagarás más impuestos ahora o en el futuro, y de si calificas por tus ingresos. Una regla general que mucha gente usa: si esperas ganar más en el futuro de lo que ganas hoy (por ejemplo, estás empezando tu carrera), un Roth puede convenir más. Si estás en tu mejor momento de ingresos y esperas ganar menos en la jubilación, un Traditional puede ahorrarte más impuestos ahora. Esto depende de tu situación específica — vale la pena revisarlo con un profesional de impuestos.", nota: "Este contenido es educativo e informativo, no constituye asesoría fiscal ni financiera personalizada. Los límites de ingresos, montos de contribución y reglas de RMD cambian anualmente. Consulta a un contador (CPA) o asesor financiero certificado para tu situación específica.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["IRA", "Retiro", "Impuestos", "Principiantes"] },
];

const ARTICULOS_OPCIONES = [
  { tipo: "estrategia", id: "covered-call", nombre: "Covered Call", sesgo: "neutral", nivel: "básico",
    extracto: "La estrategia de opciones más común para generar ingreso extra sobre acciones que ya tienes, a cambio de limitar tu ganancia máxima.",
    queEs: "Un Covered Call combina dos posiciones: tienes 100 acciones de una empresa, y vendes una opción Call sobre esas mismas acciones, cobrando una prima de inmediato. Se llama 'covered' (cubierta) porque ya posees las acciones que respaldan la operación — si te asignan (te obligan a vender), simplemente entregas acciones que ya tenías, sin necesidad de comprarlas en el mercado a un precio desfavorable.",
    legs: [
      { accion: "compra", tipo: "acciones", nota: "100 acciones del subyacente — ya en tu portafolio, o compradas específicamente para esta estrategia" },
      { accion: "venta", tipo: "call", nota: "1 contrato Call, generalmente vendido a 30-45 días de vencimiento, con strike por encima del precio actual de la acción" },
    ],
    maxGanancia: "(Precio strike − precio de compra de la acción) + prima cobrada. Tu ganancia queda limitada una vez el precio supera el strike, aunque la acción siga subiendo.",
    maxPerdida: "(Precio de compra de la acción − prima cobrada), si la acción cae a cero. El riesgo de la caída es prácticamente el mismo que tener las acciones sin cobertura, solo reducido levemente por la prima recibida.",
    puntoEquilibrio: "Precio de compra de la acción menos la prima cobrada por la Call.",
    cuandoUsarla: "Se usa cuando tienes una opinión neutral a moderadamente alcista sobre una acción que ya posees — no esperas que suba de forma explosiva en el corto plazo, pero tampoco quieres venderla. Es una forma común de generar ingreso mensual extra sobre un portafolio existente, muy usada por inversionistas de largo plazo con acciones 'aburridas' y estables.",
    ejemplo: "Supongamos que compraste 100 acciones de una empresa a $100 cada una ($10,000 total). Vendes una Call con strike $110 a 30-45 días, cobrando una prima de $3 por acción ($300 total). Tu punto de equilibrio baja a $97 (los $100 que pagaste, menos los $3 de prima). Si la acción cierra en $110 o más al vencimiento, te asignan: vendes tus acciones a $110, quedándote con una ganancia total de $1,300 ($1,000 de la subida de la acción + $300 de la prima) — esa es tu ganancia máxima, sin importar cuánto más haya subido la acción. Si la acción se queda entre $97 y $110, conservas las acciones y te quedas con la prima como ingreso extra. Si cae por debajo de $97, empiezas a perder dinero, aunque $3 menos de lo que hubieras perdido sin la estrategia.",
    riesgos: "El riesgo principal no es 'perder más de lo normal' — es el costo de oportunidad: si la acción sube muchísimo más allá de tu strike, dejas esa ganancia extra sobre la mesa, porque estás obligado a vender al precio pactado. También sigues expuesto a la caída del precio de la acción casi en su totalidad, con la prima como único colchón. Además, necesitas aprobación de tu broker para operar opciones (incluso las estrategias 'cubiertas' requieren cierto nivel de autorización).",
    payoffPoints: [
      { precio: 70, ganancia: -2700 }, { precio: 80, ganancia: -1700 }, { precio: 90, ganancia: -700 }, { precio: 97, ganancia: 0 },
      { precio: 100, ganancia: 300 }, { precio: 110, ganancia: 1300 }, { precio: 120, ganancia: 1300 }, { precio: 130, ganancia: 1300 }, { precio: 140, ganancia: 1300 },
    ],
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Covered Call", "Ingreso", "Básico"],
    nota: "Este contenido es educativo e informativo. Operar opciones conlleva riesgos significativos y requiere aprobación previa de tu broker. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar opciones." },
  { tipo: "estrategia", id: "naked-put", nombre: "Naked Put (Put al Descubierto)", sesgo: "alcista", nivel: "avanzado",
    extracto: "Vender una opción Put sin tener el efectivo completo reservado, apostando a que la acción se mantendrá por encima de un precio determinado. Alto riesgo, no recomendada para principiantes.",
    queEs: "En un Naked Put, vendes una opción Put sin reservar el efectivo completo necesario para comprar las acciones si te asignan — dependes del margen de tu cuenta como respaldo, en vez de tener el dinero completo apartado. Esto la diferencia de un 'Cash-Secured Put', donde sí reservas el 100% del efectivo necesario y el riesgo es más controlado. Cobras la prima de inmediato, apostando a que el precio de la acción se mantendrá por encima de tu strike.",
    legs: [
      { accion: "venta", tipo: "put", nota: "1 contrato Put, generalmente vendido a 30-45 días de vencimiento, con strike por debajo del precio actual de la acción — SIN reservar el efectivo completo, usando margen de la cuenta" },
    ],
    maxGanancia: "Limitada a la prima cobrada — en nuestro ejemplo, $250. Esta es tu ganancia máxima si la acción cierra igual o por encima del strike al vencimiento.",
    maxPerdida: "(Precio strike − prima cobrada) × 100, si la acción cae a cero — en nuestro ejemplo, hasta $9,250. Es una de las pérdidas potenciales más grandes entre las estrategias básicas de opciones, porque el límite inferior real es cero.",
    puntoEquilibrio: "Precio strike menos la prima cobrada — en nuestro ejemplo, $92.50.",
    cuandoUsarla: "Se usa cuando tienes una opinión neutral a moderadamente alcista sobre una acción, y estás dispuesto a comprarla al precio strike si cae — pero sin tener necesariamente el efectivo completo reservado, confiando en el margen de tu cuenta. Algunos operadores la usan para 'entrar' a una acción que quieren poseer a un precio más bajo que el actual, cobrando la prima mientras esperan.",
    ejemplo: "Una acción cotiza a $100. Vendes un Put con strike $95 a 30-45 días, cobrando una prima de $2.50 por acción ($250 total por contrato). Tu punto de equilibrio es $92.50. Si la acción cierra en $95 o más al vencimiento, el Put expira sin valor y te quedas con los $250 completos de ganancia. Si cae por debajo de $95, te asignan: estás obligado a comprar 100 acciones a $95 cada una ($9,500), sin importar cuánto haya caído el precio real de mercado. Si la acción se desploma a $40, por ejemplo, tu pérdida sería de aproximadamente $5,250 en ese momento.",
    riesgos: "Esta es una de las estrategias de opciones con mayor riesgo real para un principiante. Como no reservaste el efectivo completo, tu broker puede emitir una 'llamada de margen' (margin call) si la acción cae fuerte, exigiéndote depositar más dinero de inmediato o cerrando la posición de forma forzada, posiblemente en el peor momento. La pérdida potencial es mucho mayor que en un Covered Call, y requiere el nivel más alto de autorización de opciones en la mayoría de brokers. La variante 'Cash-Secured Put' (con el efectivo completo reservado) es considerablemente más segura y suele ser el punto de entrada recomendado antes de intentar esta versión.",
    payoffPoints: [
      { precio: 50, ganancia: -4250 }, { precio: 60, ganancia: -3250 }, { precio: 70, ganancia: -2250 }, { precio: 80, ganancia: -1250 },
      { precio: 90, ganancia: -250 }, { precio: 92.5, ganancia: 0 }, { precio: 95, ganancia: 250 }, { precio: 100, ganancia: 250 }, { precio: 110, ganancia: 250 }, { precio: 140, ganancia: 250 },
    ],
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Naked Put", "Avanzado", "Riesgo Alto"],
    nota: "Este contenido es educativo e informativo. El Naked Put es una estrategia de alto riesgo que puede generar pérdidas significativas y requiere aprobación de nivel avanzado de tu broker. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
  { tipo: "estrategia", id: "put-credit-spread", nombre: "Put Credit Spread (Spread de Crédito con Puts)", sesgo: "alcista", nivel: "intermedio",
    extracto: "Una versión más controlada del Naked Put: vendes una Put y compras otra Put más barata como protección, limitando tu riesgo máximo desde el inicio.",
    queEs: "Un Put Credit Spread combina dos opciones Put: vendes una Put con un strike más alto (cobrando una prima mayor) y compras simultáneamente otra Put con un strike más bajo (pagando una prima menor) como protección. La diferencia entre ambas primas es tu ganancia neta ('crédito') recibida de inmediato. A diferencia del Naked Put, tu pérdida máxima queda limitada y definida desde el momento en que abres la posición — ya sabes exactamente cuánto puedes perder en el peor escenario.",
    legs: [
      { accion: "venta", tipo: "put", nota: "Strike más alto (ej. $95) — la que genera la mayor prima cobrada" },
      { accion: "compra", tipo: "put", nota: "Strike más bajo (ej. $90) — actúa como 'seguro', limitando tu pérdida máxima" },
    ],
    maxGanancia: "Limitada al crédito neto recibido (la diferencia entre ambas primas) — en nuestro ejemplo, $150. La obtienes completa si la acción cierra igual o por encima del strike vendido ($95) al vencimiento.",
    maxPerdida: "(Diferencia entre ambos strikes − crédito neto recibido) × 100 — en nuestro ejemplo, $350. Esta es tu pérdida máxima absoluta, sin importar cuánto más caiga la acción por debajo de $90, gracias a la Put comprada como protección.",
    puntoEquilibrio: "Strike vendido menos el crédito neto recibido — en nuestro ejemplo, $93.50.",
    cuandoUsarla: "Se usa cuando tienes una opinión neutral a moderadamente alcista, similar al Naked Put, pero prefieres conocer y limitar tu riesgo máximo desde el inicio en vez de exponerte a una pérdida potencialmente mucho mayor. Es una forma común de 'vender opciones' con un perfil de riesgo mucho más controlado, y generalmente requiere menos nivel de autorización de tu broker que un Naked Put.",
    ejemplo: "Una acción cotiza a $100. Vendes una Put con strike $95 cobrando $3.00 por acción ($300), y compras una Put con strike $90 pagando $1.50 por acción ($150). Tu crédito neto es $150 ($300 − $150). Tu punto de equilibrio es $93.50. Si la acción cierra en $95 o más, ambas Puts expiran sin valor y te quedas con los $150 completos. Si cae a $90 o menos, tu pérdida queda topada en $350 ($500 de diferencia entre strikes, menos los $150 de crédito recibido) — sin importar si la acción cae a $80 o a $20, tu pérdida máxima sigue siendo $350.",
    riesgos: "Aunque el riesgo está limitado (a diferencia del Naked Put), sigue siendo una pérdida real y puede ocurrir con relativa frecuencia si subestimas la volatilidad de la acción. Requiere gestionar dos contratos en vez de uno, lo cual implica el doble de comisiones y algo más de complejidad de seguimiento. También sigue requiriendo aprobación de opciones de tu broker, aunque generalmente de un nivel intermedio, no el más alto.",
    payoffPoints: [
      { precio: 80, ganancia: -350 }, { precio: 85, ganancia: -350 }, { precio: 90, ganancia: -350 }, { precio: 93.5, ganancia: 0 },
      { precio: 95, ganancia: 150 }, { precio: 100, ganancia: 150 }, { precio: 110, ganancia: 150 }, { precio: 130, ganancia: 150 },
    ],
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Credit Spread", "Intermedio", "Riesgo Limitado"],
    nota: "Este contenido es educativo e informativo. Los spreads de opciones requieren aprobación de tu broker y conllevan riesgos, aunque limitados y conocidos desde el inicio. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
  { tipo: "estrategia", id: "call-credit-spread", nombre: "Call Credit Spread (Spread de Crédito con Calls)", sesgo: "bajista", nivel: "intermedio",
    extracto: "El espejo bajista del Put Credit Spread: vendes una Call y compras otra Call más cara como protección, apostando a que la acción NO subirá más allá de cierto punto.",
    queEs: "Un Call Credit Spread combina dos opciones Call: vendes una Call con un strike más bajo (cobrando una prima mayor) y compras simultáneamente otra Call con un strike más alto (pagando una prima menor) como protección. La diferencia entre ambas primas es tu crédito neto recibido de inmediato. Tu pérdida máxima queda limitada y conocida desde el momento en que abres la posición, sin importar cuánto suba la acción.",
    legs: [
      { accion: "venta", tipo: "call", nota: "Strike más bajo (ej. $105) — la que genera la mayor prima cobrada" },
      { accion: "compra", tipo: "call", nota: "Strike más alto (ej. $110) — actúa como 'seguro', limitando tu pérdida máxima" },
    ],
    maxGanancia: "Limitada al crédito neto recibido (la diferencia entre ambas primas) — en nuestro ejemplo, $150. La obtienes completa si la acción cierra igual o por debajo del strike vendido ($105) al vencimiento.",
    maxPerdida: "(Diferencia entre ambos strikes − crédito neto recibido) × 100 — en nuestro ejemplo, $350. Esta es tu pérdida máxima absoluta, sin importar cuánto más suba la acción por encima de $110, gracias a la Call comprada como protección.",
    puntoEquilibrio: "Strike vendido más el crédito neto recibido — en nuestro ejemplo, $106.50.",
    cuandoUsarla: "Se usa cuando tienes una opinión neutral a moderadamente bajista — no necesariamente esperas que la acción se desplome, solo que no suba más allá de cierto nivel en el corto plazo. Es la forma más común de 'apostar a la baja' con riesgo limitado y conocido, sin necesitar vender la acción en corto (short selling), que tiene sus propios riesgos aún mayores.",
    ejemplo: "Una acción cotiza a $100. Vendes una Call con strike $105 cobrando $3.00 por acción ($300), y compras una Call con strike $110 pagando $1.50 por acción ($150). Tu crédito neto es $150. Tu punto de equilibrio es $106.50. Si la acción cierra en $105 o menos, ambas Calls expiran sin valor y te quedas con los $150 completos. Si sube a $110 o más, tu pérdida queda topada en $350 — sin importar si la acción sube a $115 o a $200, tu pérdida máxima sigue siendo $350.",
    riesgos: "El riesgo principal es equivocarse en la dirección: si la acción sube con fuerza (por ejemplo, tras un buen reporte de resultados), tocas tu pérdida máxima rápidamente. Requiere gestionar dos contratos, con el doble de comisiones. También conviene recordar que las acciones tienden a subir más frecuentemente que bajar en el largo plazo, así que esta estrategia suele usarse con una tesis específica de corto plazo, no como apuesta general.",
    payoffPoints: [
      { precio: 80, ganancia: 150 }, { precio: 90, ganancia: 150 }, { precio: 100, ganancia: 150 }, { precio: 105, ganancia: 150 },
      { precio: 106.5, ganancia: 0 }, { precio: 110, ganancia: -350 }, { precio: 120, ganancia: -350 }, { precio: 140, ganancia: -350 },
    ],
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Credit Spread", "Intermedio", "Bajista"],
    nota: "Este contenido es educativo e informativo. Los spreads de opciones requieren aprobación de tu broker y conllevan riesgos, aunque limitados y conocidos desde el inicio. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
  { tipo: "estrategia", id: "short-strangle", nombre: "Short Strangle (Estrangulamiento Vendido)", sesgo: "neutral", nivel: "avanzado",
    extracto: "La estrategia 'madre' del Iron Condor: vendes una Put y una Call al mismo tiempo, sin ninguna protección, apostando a que la acción se mantendrá en un rango. Riesgo muy elevado en ambas direcciones.",
    queEs: "Un Short Strangle combina un Naked Put (que ya conoces) y su espejo, una Call vendida sin cobertura, al mismo tiempo sobre la misma acción. Vendes una Put con strike por debajo del precio actual, y una Call con strike por encima — cobrando dos primas de inmediato. Ganas si la acción se queda dentro de ese rango entre ambos strikes al vencimiento. Es esencialmente la versión 'sin protección' de lo que luego se convierte en un Iron Condor al agregarle alas de protección.",
    legs: [
      { accion: "venta", tipo: "put", nota: "Strike por debajo del precio actual (ej. $90) — sin protección, como el Naked Put" },
      { accion: "venta", tipo: "call", nota: "Strike por encima del precio actual (ej. $110) — sin protección, como una Call al descubierto" },
    ],
    maxGanancia: "Limitada a la suma de ambas primas cobradas — en nuestro ejemplo, $400. La obtienes completa si la acción cierra entre $90 y $110 al vencimiento (ambas opciones expiran sin valor).",
    maxPerdida: "Del lado de la Call: teóricamente ilimitada, ya que no hay techo para cuánto puede subir una acción. Del lado de la Put: grande pero limitada a que la acción caiga a cero — en nuestro ejemplo, hasta $8,600. Es una de las estrategias con mayor riesgo real de todo el Opcionario, precisamente porque combina los riesgos del Naked Put y de una Call sin cobertura al mismo tiempo.",
    puntoEquilibrio: "Dos puntos de equilibrio: el strike de la Put menos el crédito total recibido (ej. $86), y el strike de la Call más el crédito total recibido (ej. $114).",
    cuandoUsarla: "Se usa cuando esperas que una acción se mantenga dentro de un rango específico, sin movimientos fuertes en ninguna dirección — típicamente en periodos de baja volatilidad esperada. Requiere el nivel más alto de autorización de opciones en prácticamente todos los brokers, precisamente por el riesgo ilimitado del lado de la Call.",
    ejemplo: "Una acción cotiza a $100. Vendes una Put con strike $90 cobrando $2.00 ($200), y una Call con strike $110 cobrando $2.00 ($200). Tu crédito total es $400. Tus puntos de equilibrio son $86 y $114. Si la acción cierra entre $90 y $110, te quedas con los $400 completos. Si sube a $130, por ejemplo, tu pérdida del lado de la Call ya supera los $1,600 y sigue creciendo mientras la acción siga subiendo — sin límite. Si cae a $70, tu pérdida del lado de la Put sería de aproximadamente $1,600 en ese momento.",
    riesgos: "Esta es, junto al Naked Put, de las estrategias de mayor riesgo real en este Opcionario — con el agravante de que el lado de la Call no tiene límite superior de pérdida en absoluto. Requiere una cuenta con margen sustancial, vigilancia constante, y está pensada para operadores experimentados que entienden bien la gestión de riesgo. Es precisamente esta falta de protección la que resuelve la siguiente estrategia que vamos a ver: el Iron Condor.",
    payoffPoints: [
      { precio: 60, ganancia: -2600 }, { precio: 70, ganancia: -1600 }, { precio: 80, ganancia: -600 }, { precio: 86, ganancia: 0 },
      { precio: 90, ganancia: 400 }, { precio: 100, ganancia: 400 }, { precio: 110, ganancia: 400 }, { precio: 114, ganancia: 0 },
      { precio: 120, ganancia: -600 }, { precio: 130, ganancia: -1600 }, { precio: 140, ganancia: -2600 },
    ],
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Short Strangle", "Avanzado", "Riesgo Ilimitado"],
    nota: "Este contenido es educativo e informativo. El Short Strangle incluye una pata sin cobertura con riesgo teóricamente ilimitado y requiere el nivel más alto de autorización de tu broker. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
  { tipo: "estrategia", id: "iron-condor", nombre: "Iron Condor", sesgo: "neutral", nivel: "avanzado",
    extracto: "El Short Strangle, pero con las dos alas de protección de los credit spreads agregadas. Riesgo limitado y conocido en ambas direcciones — probablemente la estrategia más popular entre traders de opciones experimentados.",
    queEs: "Un Iron Condor combina 4 opciones a la vez: es un Short Strangle (Put vendida + Call vendida) al que le agregas dos 'alas' de protección — una Put comprada con strike más bajo, y una Call comprada con strike más alto. En esencia, es un Put Credit Spread y un Call Credit Spread abiertos al mismo tiempo sobre la misma acción. A diferencia del Short Strangle, tu pérdida máxima queda limitada y conocida en ambas direcciones desde el momento en que abres la posición — resolviendo exactamente el problema de riesgo ilimitado del Short Strangle.",
    legs: [
      { accion: "compra", tipo: "put", nota: "Ala protectora inferior (ej. $85) — limita tu pérdida máxima del lado de la baja" },
      { accion: "venta", tipo: "put", nota: "Strike vendido inferior (ej. $90) — genera la prima principal de este lado" },
      { accion: "venta", tipo: "call", nota: "Strike vendido superior (ej. $110) — genera la prima principal de este lado" },
      { accion: "compra", tipo: "call", nota: "Ala protectora superior (ej. $115) — limita tu pérdida máxima del lado de la subida" },
    ],
    maxGanancia: "Limitada al crédito neto total recibido de las 4 patas — en nuestro ejemplo, $250. La obtienes completa si la acción cierra entre $90 y $110 (los dos strikes vendidos) al vencimiento.",
    maxPerdida: "Limitada al ancho de cualquiera de las dos alas menos el crédito recibido — en nuestro ejemplo, $250 ($500 de ancho de ala − $250 de crédito). A diferencia del Short Strangle, este es un número fijo y conocido, sin importar cuánto suba o baje la acción más allá de las alas.",
    puntoEquilibrio: "Dos puntos: strike de Put vendida menos crédito recibido (ej. $87.50), y strike de Call vendida más crédito recibido (ej. $112.50).",
    cuandoUsarla: "Se usa en el mismo escenario que el Short Strangle — esperas que la acción se mantenga en un rango — pero cuando prefieres saber y limitar tu pérdida máxima exacta desde el inicio, en vez de exponerte al riesgo ilimitado del lado de la Call. Es una de las estrategias favoritas de traders de opciones más experimentados precisamente por esta relación de riesgo conocido, aunque a cambio la ganancia máxima también es menor que en un Short Strangle equivalente.",
    ejemplo: "Una acción cotiza a $100. Vendes una Put $90 y compras una Put $85 (Put Credit Spread, crédito $150), y vendes una Call $110 y compras una Call $115 (Call Credit Spread, crédito $100). Tu crédito total es $250. Tus puntos de equilibrio son $87.50 y $112.50. Si la acción cierra entre $90 y $110, te quedas con los $250 completos. Si sube a $130 o cae a $60, tu pérdida máxima sigue siendo $250 en cualquiera de los dos casos — nunca más que eso, gracias a las alas de protección.",
    riesgos: "Aunque el riesgo es limitado y conocido (a diferencia del Short Strangle), gestionar 4 contratos distintos implica más comisiones y más complejidad de seguimiento. La ganancia máxima suele ser más modesta en proporción al capital en riesgo, comparada con estrategias más simples. Requiere aprobación de nivel avanzado de tu broker, y entender bien las 4 patas antes de operar — un error al armar la posición puede desbalancear la protección que se busca.",
    payoffPoints: [
      { precio: 60, ganancia: -250 }, { precio: 80, ganancia: -250 }, { precio: 85, ganancia: -250 }, { precio: 87.5, ganancia: 0 },
      { precio: 90, ganancia: 250 }, { precio: 100, ganancia: 250 }, { precio: 110, ganancia: 250 }, { precio: 112.5, ganancia: 0 },
      { precio: 115, ganancia: -250 }, { precio: 130, ganancia: -250 }, { precio: 140, ganancia: -250 },
    ],
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Iron Condor", "Avanzado", "Riesgo Limitado"],
    nota: "Este contenido es educativo e informativo. El Iron Condor requiere aprobación de nivel avanzado de tu broker y gestionar 4 contratos simultáneamente. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
];

const CONSEJOS = [
  { icono: "🎯", nivel: "Principiante", consejo: "Empieza con ETFs, no acciones individuales", detalle: "Un ETF del S&P 500 te da exposición a 500 empresas con una sola compra." },
  { icono: "📅", nivel: "Principiante", consejo: "Invierte una cantidad fija cada mes", detalle: "La estrategia DCA consiste en invertir la misma cantidad cada mes." },
  { icono: "⏳", nivel: "Principiante", consejo: "Piensa en años, no en días", detalle: "Los inversores exitosos mantienen su estrategia por años." },
  { icono: "🏦", nivel: "Principiante", consejo: "Abre una cuenta en Fidelity o Interactive Brokers", detalle: "Ambas plataformas aceptan clientes de Latinoamérica sin comisiones." },
];

const BROKERS = [
  { name: "Robinhood", initial: "R", nivel: "Principiante", desc: "Sin comisiones y la app más simple para abrir tu primera cuenta de inversión en EE.UU.", cta: "Abrir cuenta", url: "https://join.robinhood.com/juliocr-f91f36" },
  { name: "Webull", initial: "W", nivel: "Principiante", desc: "Sin comisiones, gráficas profesionales y datos en tiempo real gratis desde el día uno.", cta: "Abrir cuenta", url: "https://webull.com" },
  { name: "Tastytrade", initial: "T", nivel: "Intermedio", desc: "La plataforma preferida para operar opciones y futuros, con herramientas de análisis avanzadas.", cta: "Abrir cuenta", url: "https://open.tastytrade.com/signup/?referralCode=6TNXH2EVQ8" },
  { name: "Interactive Brokers", initial: "IB", nivel: "Avanzado", desc: "Acceso a mercados globales y acepta clientes de República Dominicana y toda Latinoamérica.", cta: "Abrir cuenta", url: "https://interactivebrokers.com" },
  { name: "Wise", initial: "W", nivel: "Remesas", desc: "Envía dinero a Latinoamérica con tasas de cambio reales y comisiones bajas y transparentes.", cta: "Enviar remesa", url: "https://wise.com" },
  { name: "Remitly", initial: "R", nivel: "Remesas", desc: "Remesas rápidas y seguras a República Dominicana y toda Latinoamérica, con tu primer envío gratis.", cta: "Enviar remesa", url: "https://remitly.com" },
];

const formatHora = (iso) => {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const formatTiempoRelativo = (iso) => {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return "justo ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas}h`;
  return `hace ${Math.floor(horas / 24)}d`;
};

// Convierte Markdown básico (**negritas** y *itálica*) en nodos React, sin
// usar dangerouslySetInnerHTML — el texto viene de una respuesta de Claude,
// así que se parsea a elementos en vez de inyectar HTML crudo.
const renderTextoConNegritas = (texto) => {
  const partes = String(texto).split(/(\*\*[^*]+\*\*)/g);
  return partes.flatMap((parte, i) => {
    const mNegrita = parte.match(/^\*\*([^*]+)\*\*$/);
    if (mNegrita) return [<strong key={`b${i}`}>{mNegrita[1]}</strong>];
    return parte.split(/(\*[^*]+\*)/g).map((sub, j) => {
      const mItalica = sub.match(/^\*([^*]+)\*$/);
      return mItalica ? <em key={`i${i}-${j}`}>{mItalica[1]}</em> : sub;
    });
  });
};

// Familias tipograficas. Dos, no mas: Inter para interfaz, lectura y cifras;
// Source Serif 4 reservada a la marca y a titulares editoriales puntuales.
// Las cifras tabulares se activan globalmente en index.css.
const F = { sans: "'Inter',system-ui,-apple-system,'Segoe UI',sans-serif", serif: "'Source Serif 4',Georgia,serif" };

// Tokens de color. Contraste verificado contra WCAG 2.2 AA sobre bg y card.
// OJO: gold es decorativo y NO cumple para texto pequeno en tema claro
// (2.46:1 sobre el fondo). Para texto dorado usar siempre goldText.
const DARK = { bg: "#0B111A", card: "#101823", surfaceAlt: "#161F2C", border: "#253041", gold: "#D6B365", goldText: "#D6B365", goldBg: "#D6B36518", green: "#4ADE80", greenBg: "#4ADE8018", red: "#FB7185", redBg: "#FB718518", text: "#E8EDF5", muted: "#7E8B9D", sub: "#AAB6C6", navBg: "#101823", tickerBg: "#0B111A", hover: "#1B2534", focus: "#D6B365" };
const LIGHT = { bg: "#F7F8FA", card: "#FFFFFF", surfaceAlt: "#EEF1F5", border: "#DCE1E8", gold: "#C49A3A", goldText: "#8A6A1F", goldBg: "#C49A3A1F", green: "#15803D", greenBg: "#15803D14", red: "#B91C1C", redBg: "#B91C1C14", text: "#14213D", muted: "#68717F", sub: "#526071", navBg: "#FFFFFF", tickerBg: "#FFFFFF", hover: "#EEF1F5", focus: "#14213D" };

// Tema inicial: preferencia guardada > preferencia del sistema > claro.
function temaInicial() {
  try {
    const guardado = localStorage.getItem("finanzadr-tema");
    if (guardado === "dark") return true;
    if (guardado === "light") return false;
  } catch { /* localStorage bloqueado: modo privado o cookies desactivadas */ }
  if (typeof window !== "undefined" && window.matchMedia) return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return false;
}

// Cinco secciones de primer nivel. `rutas` lista todas las rutas que pertenecen
// a la seccion, para resaltarla aunque el usuario este en una pagina hija.
// Ninguna ruta desaparece: las que salen del nav viven en la subnavegacion o
// en el pie, y todas conservan su URL original.
const SECCIONES = [
  { to: "/", icon: "inicio", label: "Inicio", rutas: ["/"], hijos: [] },
  { to: "/aprende", icon: "aprende", label: "Aprende", rutas: ["/aprende", "/opciones"],
    hijos: [["/aprende", "Guías"], ["/opciones", "Opcionario"]] },
  { to: "/noticias", icon: "actualidad", label: "Actualidad", rutas: ["/noticias", "/apertura", "/briefing", "/contenido-diario"],
    hijos: [["/noticias", "Noticias"], ["/apertura", "Apertura"], ["/briefing", "Cierre"], ["/contenido-diario", "Contenido diario"]] },
  { to: "/mercados", icon: "mercados", label: "Mercados", rutas: ["/mercados", "/heatmap", "/sentimiento"],
    hijos: [["/mercados", "Cotizaciones"], ["/mercados?view=charts", "Gráficos"], ["/heatmap", "Mapa de calor"], ["/sentimiento", "Sentimiento cripto"]] },
  { to: "/calculadora", icon: "herramientas", label: "Herramientas", rutas: ["/calculadora", "/brokers", "/compartir"],
    hijos: [["/calculadora", "Calculadora"], ["/brokers", "Brokers y remesas"], ["/compartir", "Resumen para compartir"]] },
];


// Sistema de iconos. Sustituye a los emojis usados como iconografia funcional:
// un emoji se renderiza distinto en cada plataforma, no hereda currentColor y
// los lectores de pantalla lo anuncian por su nombre Unicode.
// Trazos de 24x24 sobre rejilla, stroke 1.75, sin relleno.
const ICON_PATHS = {
  inicio: "M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  aprende: "M4 5.5A1.5 1.5 0 0 1 5.5 4H19v13H5.5A1.5 1.5 0 0 0 4 18.5zM4 18.5A1.5 1.5 0 0 0 5.5 20H19v-3",
  actualidad: "M4 5h11v14H5a1 1 0 0 1-1-1zM15 9h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-4M7 8h5M7 11h5M7 14h3",
  mercados: "M4 20V10M9 20V4M14 20v-7M19 20V7",
  herramientas: "M14.5 3.5a4.5 4.5 0 0 0 5.9 5.9L21 10l-9 9-3-3 9-9zM7.5 13.5 4 17a2.1 2.1 0 0 0 3 3l3.5-3.5",
  resumen: "M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3.5 6.8 12 13l8.5-6.2",
  sol: "M12 4V2M12 22v-2M4 12H2M22 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  luna: "M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2z",
  candado: "M6 11h12v9H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11",
  documento: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  aviso: "M12 3.5 22 20H2zM12 10v4M12 17.2v.1",
  externo: "M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  buscar: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16.2 16.2 21 21",
  menu: "M4 7h16M4 12h16M4 17h16",
  cerrar: "M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5",
  chevron: "M9 5l7 7-7 7",
};

// `titulo` da nombre accesible al icono. Sin el, el SVG queda aria-hidden y se
// asume que el texto adyacente ya describe el control (WAI-ARIA, imagen decorativa).
function Icon({ name, size = 20, titulo, style }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden={titulo ? undefined : "true"} role={titulo ? "img" : undefined} focusable="false" style={{ flexShrink: 0, display: "block", ...style }}>
      {titulo ? <title>{titulo}</title> : null}
      <path d={d} />
    </svg>
  );
}

// --- Fechas de mercado -----------------------------------------------------
// Toda fecha u hora de sesion se calcula en la zona horaria de Nueva York con
// Intl, que aplica el cambio de horario de verano por si solo. No usar
// desplazamientos fijos (-4/-5) ni la zona del navegador: el lector puede
// estar en Santo Domingo, Madrid o California y la sesion es la misma.
const TZ_MERCADO = "America/New_York";
const fmtFechaSesion = (d) => new Intl.DateTimeFormat("es-DO", { timeZone: TZ_MERCADO, weekday: "long", day: "numeric", month: "long" }).format(new Date(d));
const fmtHoraET = (d) => new Intl.DateTimeFormat("es-DO", { timeZone: TZ_MERCADO, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(d));
// Clave YYYY-MM-DD del dia de mercado, para comparar si dos momentos caen en
// la misma sesion sin arrastrar la hora.
const claveDiaMercado = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ_MERCADO, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));

// --- Estado de la sesion ---------------------------------------------------
// Derivado del reloj de Nueva York, no del proveedor: Finnhub no dice en que
// fase esta el mercado. Por eso se etiqueta siempre como "horario regular de
// NYSE" y se advierte que NO contempla feriados — un 4 de julio esto dira
// "sesion regular" aunque la bolsa este cerrada.
// DEPENDENCIA: un calendario de feriados (o el endpoint de market status de
// Finnhub) permitiria afirmarlo sin ese matiz.
const APERTURA_MIN = 9 * 60 + 30;
const CIERRE_MIN = 16 * 60;
const PREAPERTURA_MIN = 4 * 60;
const POSTCIERRE_MIN = 20 * 60;

function estadoSesion(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: TZ_MERCADO, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(ahora);
  const { weekday, hour, minute } = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  // Intl con hour12:false devuelve "24" para la medianoche en algunas
  // implementaciones; normalizarlo evita un minuto fantasma fuera de rango.
  const minutos = (hour === "24" ? 0 : +hour) * 60 + +minute;
  const finDeSemana = weekday === "Sat" || weekday === "Sun";

  if (finDeSemana) return { clave: "fin-de-semana", etiqueta: "Mercado cerrado (fin de semana)" };
  if (minutos < PREAPERTURA_MIN) return { clave: "cerrado", etiqueta: "Mercado cerrado" };
  if (minutos < APERTURA_MIN) return { clave: "preapertura", etiqueta: "Preapertura" };
  if (minutos < CIERRE_MIN) return { clave: "regular", etiqueta: "Sesión regular" };
  if (minutos < POSTCIERRE_MIN) return { clave: "fuera-de-horario", etiqueta: "Fuera de horario" };
  return { clave: "cerrado", etiqueta: "Mercado cerrado" };
}

// Un dato se considera atrasado cuando su hora de cotizacion tiene mas de 15
// minutos y el mercado esta en sesion regular. Fuera de sesion no es atraso:
// es, correctamente, el ultimo precio negociado.
const DATO_ATRASADO_MS = 15 * 60 * 1000;

// --- Formato de cifras -----------------------------------------------------
// Sin dato valido devuelven null: quien llama decide si pinta una raya, un
// esqueleto o un estado vacio. Nunca se sustituye por un cero ni por un
// valor de ejemplo.
const fmtPrecio = (p) => p == null ? null : p >= 1000 ? p.toLocaleString("en-US", { maximumFractionDigits: 0 }) : p.toFixed(2);
const fmtVar = (c) => c == null ? null : `${c >= 0 ? "+" : "−"}${Math.abs(c).toFixed(2)}%`;

// Variacion porcentual: signo, flecha y texto alternativo ademas del color,
// porque el color no puede ser el unico portador del dato (WCAG 1.4.1).
function Variacion({ c, size = 14 }) {
  const { C } = useOutletContext();
  if (c == null) return <span style={{ fontSize: size, color: C.muted }}>Sin dato</span>;
  const pos = c >= 0;
  return (
    <span style={{ fontSize: size, fontWeight: 600, color: pos ? C.green : C.red, whiteSpace: "nowrap" }}>
      <span aria-hidden="true">{pos ? "▲" : "▼"} </span>{fmtVar(c)}
      <span className="sr-only">{pos ? " al alza" : " a la baja"}</span>
    </span>
  );
}

// Boton de accion unico para toda la interfaz. Como Link cuando el destino es
// una ruta interna, como <a> para destinos externos y como <button> cuando
// dispara una accion. Altura minima 48px (criterio del proyecto: 44px).
function Boton({ to, href, onClick, variante = "primario", ancho, children, ...resto }) {
  const { C } = useOutletContext();
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, padding: "0 22px", borderRadius: 10, fontFamily: F.sans, fontSize: 15, fontWeight: 600, textDecoration: "none", cursor: "pointer", border: "1px solid transparent", width: ancho || "auto" };
  const estilo = variante === "primario"
    ? { ...base, background: C.text, color: C.bg }
    : { ...base, background: C.card, color: C.text, borderColor: C.border };
  if (to) return <Link to={to} style={estilo} {...resto}>{children}</Link>;
  if (href) return <a href={href} style={estilo} {...resto}>{children}</a>;
  return <button type="button" onClick={onClick} style={estilo} {...resto}>{children}</button>;
}

// Cabecera de bloque de portada: H2, descripcion opcional y enlace de salida
// a la seccion completa. Todo alineado a la izquierda.
function BloqueSeccion({ id, titulo, descripcion, enlace, children }) {
  const { C } = useOutletContext();
  return (
    <section aria-labelledby={id} style={{ marginTop: 64 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ maxWidth: "58ch" }}>
          <h2 id={id} style={{ fontFamily: F.serif, fontSize: 30, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>{titulo}</h2>
          {descripcion && <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6, marginTop: 8 }}>{descripcion}</p>}
        </div>
        {enlace && <Link to={enlace[0]} style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 600, color: C.goldText, textDecoration: "underline" }}>{enlace[1]}</Link>}
      </div>
      {children}
    </section>
  );
}

// Tiempo de lectura calculado, no declarado a mano: recorre todos los campos
// de texto del articulo (esten anidados donde esten) y divide entre 200
// palabras por minuto. Si el articulo crece, el dato crece con el.
function tiempoLectura(post) {
  let palabras = 0;
  const contar = (v) => {
    if (typeof v === "string") palabras += v.trim().split(/\s+/).filter(Boolean).length;
    else if (Array.isArray(v)) v.forEach(contar);
    else if (v && typeof v === "object") Object.values(v).forEach(contar);
  };
  contar(post);
  return Math.max(2, Math.round(palabras / 200));
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function useDocumentMeta(title, description) {
  useEffect(() => {
    document.title = title;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);
    }
  }, [title, description]);
}

export default function FinanzasDR() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<InicioPage />} />
          <Route path="mercados" element={<MercadosPage />} />
          <Route path="heatmap" element={<HeatmapPage />} />
          <Route path="sentimiento" element={<SentimientoPage />} />
          <Route path="noticias" element={<NoticiasPage />} />
          <Route path="briefing" element={<BriefingPage />} />
          <Route path="apertura" element={<AperturaPage />} />
          <Route path="contenido-diario" element={<ContenidoDiarioPage />} />
          <Route path="aprende" element={<AprendePage />} />
          <Route path="opciones" element={<OpcionesPage />} />
          <Route path="brokers" element={<BrokersPage />} />
          <Route path="calculadora" element={<CalculadoraPage />} />
          <Route path="compartir" element={<CompartirPage />} />
          <Route path="newsletter" element={<NewsletterPage />} />
          <Route path="privacidad" element={<PrivacidadPage />} />
          <Route path="terminos" element={<TerminosPage />} />
          <Route path="aviso" element={<AvisoPage />} />
          <Route path="monitoreo" element={<MonitoreoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  const [stocks, setStocks] = useState(INSTRUMENTOS);
  const [dark, setDark] = useState(temaInicial);
  const [realLoading, setRealLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [realErr, setRealErr] = useState(null);
  const [noticias, setNoticias] = useState(NOTICIAS);
  const [noticiasLoading, setNoticiasLoading] = useState(false);
  const [noticiasRD, setNoticiasRD] = useState([]);
  const [noticiasRDLoading, setNoticiasRDLoading] = useState(false);

  useEffect(() => { try { localStorage.setItem("finanzadr-tema", dark ? "dark" : "light"); } catch { /* almacenamiento no disponible */ } }, [dark]);

  const C = dark ? DARK : LIGHT;

  const fetchNoticias = async () => {
    setNoticiasLoading(true);
    try {
      const res = await fetch("/api/noticias");
      const data = await res.json();
      if (data && data.length > 0) {
        // Sin categoría fiable no se inventa una: antes todo lo desconocido
        // se etiquetaba "Mercados", lo que dejaba la etiqueta sin significado.
        setNoticias(data.slice(0,15).map(n => ({
          titulo: n.headline,
          resumen: n.summary ? n.summary.slice(0,240) + "…" : "Sin resumen disponible.",
          fuente: n.source || "Finnhub",
          categoria: categoriaNoticia(n.category),
          datetime: n.datetime ? n.datetime * 1000 : null,
          url: n.url,
        })));
      }
    } catch(e) {}
    setNoticiasLoading(false);
  };

  const fetchRealPrices = async () => {
    setRealLoading(true);
    try {
      const res = await fetch("/api/precios");
      const data = await res.json();
      const porSimbolo = Object.fromEntries(data.map(p => [p.simbolo, p]));
      // La identidad del instrumento (nombre, tipo de activo, referencia,
      // moneda) la manda el modelo local; de la API solo se toman precio y
      // variacion. Si un simbolo llega sin precio se conserva la entrada
      // anterior: se mantiene el ultimo dato valido en vez de vaciarlo.
      // Actualizacion funcional porque esta funcion tambien corre desde un
      // setInterval creado una sola vez, con `stocks` congelado en su closure.
      setStocks(prev => prev.map(st => {
        const p = porSimbolo[st.s];
        return p && p.precio != null
          ? { ...st, p: p.precio, c: p.cambioPct, abs: p.cambioAbs ?? null, horaCotizacion: p.horaCotizacion ?? null }
          : st;
      }));
      setLastUpdate(new Date().toISOString());
    } catch(e) { setRealErr("No se pudo conectar."); }
    setRealLoading(false);
  };

  const fetchNoticiasRD = async () => {
    setNoticiasRDLoading(true);
    try {
      const res = await fetch("/api/noticias-rd");
      const data = await res.json();
      if (data?.items?.length > 0) setNoticiasRD(data.items);
    } catch(e) {}
    setNoticiasRDLoading(false);
  };

  useEffect(() => { fetchNoticias(); }, []);
  useEffect(() => { fetchNoticiasRD(); }, []);
  useEffect(() => { fetchRealPrices(); const t = setInterval(fetchRealPrices, 60000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,600;0,8..60,700;1,8..60,600&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
      @keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      html,body,#root { width:100%; min-height:100vh; margin:0; padding:0; }
      .ticker-track { display:flex; animation:ticker 70s linear infinite; white-space:nowrap; }
      .ticker-track:hover { animation-play-state:paused; }
      .fade-in { animation:fadeIn 0.4s ease forwards; }
      .live-dot { animation:pulse-dot 1.5s ease-in-out infinite; display:inline-block; }
      .skeleton-pulse { animation:skeleton-pulse 1.4s ease-in-out infinite; }
      * { box-sizing:border-box; margin:0; padding:0; transition:background 0.3s,color 0.2s,border-color 0.2s; }
      
      .card-hover { transition:all 0.2s; }
      .card-hover:hover { transform:translateY(-2px); }
      .market-item { transition:all 0.15s; border-radius:6px; }
      .market-item:hover { text-decoration:underline; }
      .saltar-contenido:focus { left:16px !important; }
      .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
      /* Foco visible en todo control interactivo (WCAG 2.4.7). currentColor
         para que funcione en ambos temas sin recalcular el token. */
      a:focus-visible, button:focus-visible, input:focus-visible, [tabindex]:focus-visible { outline:2px solid currentColor; outline-offset:3px; border-radius:4px; }
      .portada-h1 { font-size:52px; }
      .portada-hero { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,0.85fr); gap:40px; align-items:start; }
      .portada-grid-3 { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:24px; }
      .portada-grid-2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:32px; }
      .portada-grid-panorama { display:grid; grid-template-columns:minmax(0,1.4fr) minmax(0,1fr); gap:24px; align-items:start; }
      /* Tabla y fichas son la misma informacion en dos formas: por debajo de
         768px la tabla desaparece y aparecen las fichas apiladas. */
      .mercados-fichas { display:none !important; }
      .tv-contenedor { height:560px; }
      .heatmap-contenedor { width:100%; height:600px; }
      @media (max-width:768px) {
        .mercados-tabla { display:none !important; }
        .mercados-fichas { display:flex !important; }
        .tv-contenedor { height:420px; }
        .heatmap-contenedor { height:420px; }
      }
      .tarjeta-enlace { transition:transform 0.2s, border-color 0.2s; }
      .tarjeta-enlace:hover { transform:translateY(-2px); }
      @media (prefers-reduced-motion:reduce) {
        *, .ticker-track, .fade-in, .live-dot, .skeleton-pulse, .tarjeta-enlace { animation:none !important; transition:none !important; }
      }
      @media (max-width:1024px) {
        .portada-grid-panorama { grid-template-columns:1fr; }
      }
      @media (max-width:900px) {
        .portada-hero { grid-template-columns:1fr; gap:28px; }
        .portada-grid-3 { grid-template-columns:repeat(2,minmax(0,1fr)); }
        .portada-grid-2 { grid-template-columns:1fr; gap:24px; }
      }
      @media (max-width:640px) {
        .portada-grid-3 { grid-template-columns:1fr; }
        .portada-h1 { font-size:34px; }
      }
      @media (max-width:900px) {
        .nav-principal { display:none !important; }
        .boton-menu { display:flex !important; }

        .pie-grid { grid-template-columns:1fr 1fr !important; }
      }
      /* Por debajo de 560px la marca y el CTA no caben juntos: el boton se
         queda solo con el icono, que conserva su nombre accesible. */
      @media (max-width:560px) {
        .cta-texto { display:none; }
        .cta-resumen { padding:0 !important; width:44px; justify-content:center; }
      }
      @media (max-width:768px) {
        .main-padding { padding:20px 16px !important; }
        .pie-grid { grid-template-columns:1fr !important; gap:24px !important; }
        .hero-grid { flex-direction:column !important; }
        .hero-stocks { display:grid !important; grid-template-columns:1fr 1fr !important; width:100% !important; }
        .toggle-text { display:none !important; }
        .nav-scroll { overflow-x:auto !important; scrollbar-width:none !important; }
        .nav-scroll::-webkit-scrollbar { display:none !important; }
        .summary-grid { grid-template-columns:1fr !important; }
        .calc-grid { grid-template-columns:1fr !important; }
        .sentiment-grid { grid-template-columns:1fr !important; }
        .hero-text h1 { font-size:26px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  const { pathname, search } = useLocation();
  // El menu guarda la ruta en la que se abrio, no un booleano: al navegar, la
  // ruta cambia y el menu queda cerrado por derivacion. Evita sincronizar
  // estado dentro de un efecto.
  const [menuEn, setMenuEn] = useState(null);
  const menuAbierto = menuEn === pathname;
  const seccionActiva = SECCIONES.find(sec => sec.rutas.includes(pathname));

  const outletCtx = { stocks, C, dark, setDark, lastUpdate, realLoading, realErr, fetchRealPrices, noticias, noticiasLoading, fetchNoticias, noticiasRD, noticiasRDLoading, fetchNoticiasRD };

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, color:C.text, fontFamily:F.sans, display:"flex", flexDirection:"column" }}>

      {/* Primer elemento focalizable: permite saltar la navegacion (WCAG 2.4.1). */}
      <a href="#contenido" className="saltar-contenido" style={{ position:"absolute", left:-9999, top:8, zIndex:200, background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 16px", fontSize:14, fontWeight:600, textDecoration:"none" }}>Saltar al contenido</a>

      {/* FRANJA DE COTIZACIONES — secundaria, con desplazamiento manual en movil */}
      <div className="franja-ticker nav-scroll" style={{ background:C.tickerBg, borderBottom:`1px solid ${C.border}`, overflowX:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", minWidth:"max-content", gap:2, maxWidth:1240, margin:"0 auto", padding:"0 24px", width:"100%" }}>
          {stocks.map((st,i) => (
            <Link key={i} to={`/mercados?symbol=${encodeURIComponent(st.s)}`} className="market-item"
              style={{ padding:"7px 12px", display:"flex", alignItems:"center", gap:8, textDecoration:"none", color:"inherit", whiteSpace:"nowrap" }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.text }}>{st.s}</span>
              {/* Hasta que /api/precios responde no hay precio: se dice, en
                  vez de pintar una cifra de ejemplo que luego cambia sola. */}
              {st.p == null ? (
                <span style={{ fontSize:11, color:C.muted }}>Sin dato</span>
              ) : (
                <>
                  <span style={{ fontSize:11, color:C.sub }}>{fmtPrecio(st.p)}</span>
                  {/* Signo y flecha ademas del color: el color no puede ser el
                      unico portador de la informacion (WCAG 1.4.1). */}
                  <span style={{ fontSize:11, fontWeight:600, color:st.c>=0?C.green:C.red }}>
                    <span aria-hidden="true">{st.c>=0?"▲":"▼"} </span>{fmtVar(st.c)}
                  </span>
                </>
              )}
            </Link>
          ))}
          <span style={{ fontSize:11, color:C.muted, marginLeft:"auto", paddingLeft:16, whiteSpace:"nowrap" }}>
            {lastUpdate ? `Consultado ${fmtHoraET(lastUpdate)} ET` : "NYSE · NASDAQ"}
          </span>
        </div>
      </div>

      {/* CABECERA COMPACTA — 72px */}
      <header style={{ borderBottom:`1px solid ${C.border}`, background:C.navBg, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ height:72, maxWidth:1240, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <Link to="/" style={{ textDecoration:"none", display:"flex", flexDirection:"column", gap:1, minWidth:0 }}>
            <span style={{ fontFamily:F.serif, fontSize:24, fontWeight:700, color:C.text, lineHeight:1.1 }}>FinanzaDR</span>
            <span style={{ fontSize:12, color:C.sub, whiteSpace:"nowrap" }}>Wall Street en tu idioma</span>
          </Link>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Link to="/newsletter" className="cta-resumen"
              style={{ display:"flex", alignItems:"center", gap:8, minHeight:44, padding:"0 18px", borderRadius:10, background:C.text, color:C.bg, fontSize:14, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap" }}>
              <Icon name="resumen" size={18} titulo="Recibir resumen" /><span className="cta-texto">Recibir resumen</span>
            </Link>
            <button onClick={() => setDark(d=>!d)} aria-pressed={dark}
              style={{ width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:10, border:`1px solid ${C.border}`, background:C.card, color:C.text, cursor:"pointer" }}>
              <Icon name={dark?"sol":"luna"} size={20} titulo={dark?"Cambiar a tema claro":"Cambiar a tema oscuro"} />
            </button>
            <button className="boton-menu" onClick={() => setMenuEn(menuAbierto ? null : pathname)} aria-expanded={menuAbierto} aria-controls="menu-movil"
              style={{ display:"none", width:44, height:44, alignItems:"center", justifyContent:"center", borderRadius:10, border:`1px solid ${C.border}`, background:C.card, color:C.text, cursor:"pointer" }}>
              <Icon name={menuAbierto?"cerrar":"menu"} size={20} titulo={menuAbierto?"Cerrar menú":"Abrir menú"} />
            </button>
          </div>
        </div>
      </header>

      {/* NAVEGACION PRINCIPAL — cinco secciones */}
      <nav aria-label="Navegación principal" className="nav-principal" style={{ borderBottom:`1px solid ${C.border}`, background:C.navBg }}>
        <div className="nav-scroll" style={{ maxWidth:1240, margin:"0 auto", padding:"0 24px", display:"flex", gap:4, overflowX:"auto" }}>
          {SECCIONES.map((sec) => {
            const activa = sec.rutas.includes(pathname);
            return (
              <Link key={sec.to} to={sec.to} aria-current={activa ? "page" : undefined}
                style={{ display:"flex", alignItems:"center", gap:8, minHeight:44, padding:"0 14px", fontSize:14, fontWeight:activa?600:500, whiteSpace:"nowrap", textDecoration:"none", color:activa?C.text:C.sub, borderBottom:activa?`2px solid ${C.gold}`:"2px solid transparent" }}>
                <Icon name={sec.icon} size={18} />{sec.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* SUBNAVEGACION DE SECCION — solo cuando la seccion activa tiene hijos */}
      {seccionActiva && seccionActiva.hijos.length > 0 && (
        <nav aria-label={`Secciones de ${seccionActiva.label}`} style={{ borderBottom:`1px solid ${C.border}`, background:C.surfaceAlt }}>
          <div className="nav-scroll" style={{ maxWidth:1240, margin:"0 auto", padding:"0 24px", display:"flex", gap:4, overflowX:"auto" }}>
            {seccionActiva.hijos.map(([to,label]) => {
              const activa = to === pathname + (search || "") || (to === pathname && !search);
              return (
                <Link key={to} to={to} aria-current={activa ? "page" : undefined}
                  style={{ display:"flex", alignItems:"center", minHeight:44, padding:"0 12px", fontSize:13, fontWeight:activa?600:400, whiteSpace:"nowrap", textDecoration:"none", color:activa?C.goldText:C.sub, borderBottom:activa?`2px solid ${C.gold}`:"2px solid transparent" }}>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* MENU MOVIL */}
      {menuAbierto && (
        <div id="menu-movil" style={{ borderBottom:`1px solid ${C.border}`, background:C.card, padding:"8px 16px 16px" }}>
          {SECCIONES.map((sec) => (
            <div key={sec.to} style={{ padding:"4px 0" }}>
              <Link to={sec.to} onClick={() => setMenuEn(null)}
                style={{ display:"flex", alignItems:"center", gap:10, minHeight:44, fontSize:15, fontWeight:600, color:C.text, textDecoration:"none" }}>
                <Icon name={sec.icon} size={18} />{sec.label}
              </Link>
              {sec.hijos.length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", paddingLeft:28 }}>
                  {sec.hijos.map(([to,label]) => (
                    <Link key={to} to={to} onClick={() => setMenuEn(null)}
                      style={{ display:"flex", alignItems:"center", minHeight:44, fontSize:14, color:C.sub, textDecoration:"none" }}>{label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <main id="contenido" style={{ flex:1, width:"100%", maxWidth:1240, margin:"0 auto", padding:"32px 24px" }} className="main-padding">
        <Outlet context={outletCtx} />
      </main>

      {/* PIE UNICO — sustituye al footer + barra fija superpuesta */}
      <footer style={{ borderTop:`1px solid ${C.border}`, background:C.surfaceAlt, marginTop:64 }}>
        <div style={{ maxWidth:1240, margin:"0 auto", padding:"48px 24px 32px" }}>
          <div className="pie-grid" style={{ display:"grid", gridTemplateColumns:"1.4fr repeat(3, 1fr)", gap:32, alignItems:"start" }}>

            <div>
              <div style={{ fontFamily:F.serif, fontSize:20, fontWeight:700, color:C.text }}>FinanzaDR</div>
              <p style={{ fontSize:14, color:C.sub, lineHeight:1.6, margin:"8px 0 0", maxWidth:320 }}>
                Educación financiera y contexto de mercado en español, para latinos que quieren aprender a invertir.
              </p>
              <p style={{ fontSize:13, color:C.muted, margin:"16px 0 0" }}>
                Editado por Julio, dominicano residente en Massachusetts.
              </p>
              <a href="mailto:finanzasDR.oficial@gmail.com" style={{ display:"inline-flex", alignItems:"center", minHeight:44, marginTop:4, fontSize:14, color:C.goldText, textDecoration:"underline", wordBreak:"break-word" }}>finanzasDR.oficial@gmail.com</a>
            </div>

            {[
              ["Aprende", [["/aprende","Guías"],["/opciones","Opcionario"]]],
              ["Actualidad", [["/noticias","Noticias"],["/apertura","Apertura"],["/briefing","Cierre"],["/contenido-diario","Contenido diario"]]],
              ["Mercados y herramientas", [["/mercados","Cotizaciones"],["/heatmap","Mapa de calor"],["/sentimiento","Sentimiento cripto"],["/calculadora","Calculadora"],["/brokers","Brokers y remesas"],["/compartir","Resumen para compartir"]]],
            ].map(([titulo,enlaces]) => (
              <div key={titulo}>
                <h2 style={{ fontSize:13, fontWeight:700, color:C.text, letterSpacing:0.4, textTransform:"uppercase", marginBottom:12 }}>{titulo}</h2>
                <ul role="list" style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {enlaces.map(([to,label]) => (
                    <li key={to}><Link to={to} style={{ display:"inline-flex", alignItems:"center", minHeight:44, fontSize:14, color:C.sub, textDecoration:"none" }}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ marginTop:40, paddingTop:24, borderTop:`1px solid ${C.border}`, display:"flex", flexWrap:"wrap", gap:16, justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ fontSize:13, color:C.muted }}>
              FinanzaDR © 2026 · Contenido educativo, no constituye asesoría de inversión.
            </p>
            <ul role="list" style={{ display:"flex", flexWrap:"wrap", gap:20 }}>
              {[["/privacidad","Privacidad"],["/terminos","Términos"],["/aviso","Aviso legal"]].map(([to,label]) => (
                <li key={to}><Link to={to} style={{ display:"inline-flex", alignItems:"center", minHeight:44, fontSize:13, color:C.sub, textDecoration:"none" }}>{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ===========================================================================
// PORTADA
// ===========================================================================

// Estado del dato de mercado. Distingue la hora de consulta de la hora de
// cotizacion: /api/precios devuelve precio y variacion, pero no la marca de
// tiempo del quote ni el estado de sesion, asi que aqui solo se puede afirmar
// cuando lo consultamos nosotros — nunca "en tiempo real".
// DEPENDENCIA PENDIENTE (fase Mercados): ampliar /api/precios con el campo `t`
// de Finnhub y el estado de sesion (preapertura / regular / fuera de horario /
// cierre) para poder etiquetar cada instrumento con su propia actualidad.
function EstadoDato() {
  const { C, stocks, lastUpdate, realLoading, realErr, fetchRealPrices } = useOutletContext();
  const hayDato = stocks.some((st) => st.p != null);

  if (!hayDato) {
    return (
      <div role="status" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13, color: C.sub }}>
        <span>{realLoading ? "Consultando cotizaciones…" : "No hay cotizaciones disponibles ahora mismo."}</span>
        {!realLoading && (
          <button type="button" onClick={fetchRealPrices} style={{ minHeight: 44, padding: "0 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontFamily: F.sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Reintentar</button>
        )}
      </div>
    );
  }

  return (
    // C.sub y no C.muted: este texto tambien se pinta sobre surfaceAlt, donde
    // muted se queda en 4.16:1 y no llega al 4.5:1 exigido para texto normal.
    <p role="status" style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
      Datos de Finnhub{lastUpdate ? `, consultados a las ${fmtHoraET(lastUpdate)} (hora de Nueva York)` : ""}.
      {realLoading ? " Actualizando…" : ""}
      {realErr ? " La última actualización falló: se muestra el último dato válido." : ""}
    </p>
  );
}

// Ficha compacta de instrumento para el panel del encabezado.
function FilaInstrumento({ st, borde }) {
  const { C } = useOutletContext();
  return (
    <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "12px 0", borderTop: borde ? `1px solid ${C.border}` : "none" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <Link to={`/mercados?symbol=${encodeURIComponent(st.s)}`} style={{ fontSize: 14, fontWeight: 700, color: C.text, textDecoration: "none" }}>{st.s}</Link>
          <span style={{ fontSize: 12, color: C.muted }}>{st.tipoActivo}</span>
        </div>
        <div style={{ fontSize: 13, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.corto}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
          {st.p == null ? <span style={{ color: C.muted, fontWeight: 400 }}>—</span> : `${fmtPrecio(st.p)} ${st.moneda}`}
        </div>
        <Variacion c={st.c} size={13} />
      </div>
    </li>
  );
}

// A. Presentacion. En escritorio, propuesta + panel de panorama; en movil el
// panel cae debajo del mensaje y las acciones (orden natural del DOM).
function PortadaHero() {
  const { C, stocks } = useOutletContext();
  return (
    <section className="portada-hero" aria-labelledby="portada-titulo">
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", color: C.goldText, marginBottom: 16 }}>Wall Street en tu idioma</p>
        <h1 id="portada-titulo" className="portada-h1" style={{ fontFamily: F.serif, fontWeight: 700, color: C.text, lineHeight: 1.1, letterSpacing: -0.5 }}>
          Entiende Wall Street.<br />Invierte con más criterio.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.65, color: C.sub, margin: "20px 0 28px", maxWidth: "62ch" }}>
          Guías en español, contexto del mercado y herramientas para latinos que quieren aprender a invertir.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Boton to="/aprende">Aprender desde cero</Boton>
          <Boton to="/mercados" variante="secundario">Ver el mercado</Boton>
        </div>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 24, maxWidth: "62ch" }}>
          Contenido educativo. FinanzaDR no es asesor de inversiones y no recomienda comprar ni vender ningún activo.
        </p>
      </div>

      <aside aria-labelledby="panel-panorama" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h2 id="panel-panorama" style={{ fontSize: 15, fontWeight: 700, color: C.text }}>El mercado hoy</h2>
          <Link to="/mercados" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 13, fontWeight: 600, color: C.goldText, textDecoration: "underline" }}>Ver todo</Link>
        </div>
        <ul role="list" style={{ listStyle: "none", margin: "4px 0 0" }}>
          {stocks.slice(0, 4).map((st, i) => <FilaInstrumento key={st.s} st={st} borde={i > 0} />)}
        </ul>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}><EstadoDato /></div>
      </aside>
    </section>
  );
}

// B. Ruta para principiantes: tres pasos que enlazan a contenido que ya existe.
const RUTA_PASOS = [
  { to: "/aprende?articulo=3", titulo: "Entiende qué son las acciones y los ETFs", texto: "Qué compras exactamente cuando compras un ETF, y por qué es el punto de partida más común." },
  { to: "/brokers", titulo: "Conoce los requisitos y compara brokers", texto: "Qué documentos piden, qué cobran y a qué perfil de inversor atiende cada uno." },
  { to: "/calculadora", titulo: "Explora el interés compuesto", texto: "Simula cómo crece un aporte mensual sostenido en el tiempo, con tus propias cifras." },
];

function RutaPrincipiantes() {
  const { C } = useOutletContext();
  return (
    <BloqueSeccion id="ruta-principiantes" titulo="Si empiezas desde cero, empieza aquí" descripcion="Tres pasos en orden. Cada uno lleva a una guía o a una herramienta que ya está publicada." enlace={["/aprende", "Ver todas las guías"]}>
      <ol className="portada-grid-3" style={{ listStyle: "none" }}>
        {RUTA_PASOS.map((paso, i) => (
          <li key={paso.to} style={{ display: "flex" }}>
            <Link to={paso.to} className="tarjeta-enlace" style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px", textDecoration: "none" }}>
              <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: C.goldBg, color: C.goldText, fontSize: 14, fontWeight: 700 }}>{i + 1}</span>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: C.text, lineHeight: 1.35 }}><span className="sr-only">{`Paso ${i + 1}: `}</span>{paso.titulo}</h3>
              <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{paso.texto}</p>
            </Link>
          </li>
        ))}
      </ol>
    </BloqueSeccion>
  );
}

// C. Actualidad destacada. Toma la ultima edicion disponible de Apertura o de
// Cierre y deja claro a que sesion corresponde: si la mas reciente no es de
// hoy, se dice, en vez de presentarla como la del dia.
const EDICIONES = [
  { url: "/api/briefing?soloCache=true", to: "/briefing", etiqueta: "Cierre de mercado" },
  { url: "/api/apertura?soloCache=true", to: "/apertura", etiqueta: "Apertura de mercado" },
];

// Primera frase de un parrafo, para las tres claves de lectura rapida.
const primeraFrase = (texto) => {
  const limpio = (texto || "").trim();
  const corte = limpio.search(/[.:;]\s/);
  return corte > 40 ? limpio.slice(0, corte + 1) : limpio;
};

function ActualidadDestacada() {
  const { C } = useOutletContext();
  const [estado, setEstado] = useState("loading");
  const [edicion, setEdicion] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 8000);

    const cargar = async (fuente) => {
      try {
        const res = await fetch(fuente.url, { signal: controlador.signal });
        const body = await res.json();
        if (!res.ok || body.disponible === false || !body.resumen) return null;
        return { ...fuente, data: body };
      } catch {
        return null;
      }
    };

    Promise.all(EDICIONES.map(cargar))
      .then((candidatos) => {
        if (cancelado) return;
        const disponibles = candidatos.filter(Boolean).sort((a, b) => new Date(b.data.generadoEn) - new Date(a.data.generadoEn));
        if (disponibles.length === 0) { setEstado("vacio"); return; }
        const elegida = disponibles[0];
        const parrafos = (elegida.data.resumen || "").split(/\n+/).map((p) => p.trim()).filter(Boolean);
        const [titulo, ...cuerpo] = parrafos;
        setEdicion({
          etiqueta: elegida.etiqueta,
          to: elegida.to,
          titulo,
          claves: cuerpo.slice(0, 3).map(primeraFrase),
          generadoEn: elegida.data.generadoEn,
          deHoy: claveDiaMercado(elegida.data.generadoEn) === claveDiaMercado(Date.now()),
        });
        setEstado("listo");
      })
      .catch(() => { if (!cancelado) setEstado("vacio"); })
      .finally(() => clearTimeout(temporizador));

    return () => { cancelado = true; clearTimeout(temporizador); controlador.abort(); };
  }, []);

  const marco = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px" };

  return (
    <BloqueSeccion id="actualidad" titulo="La sesión, explicada" descripcion="Un resumen de apertura o de cierre por jornada, con la cadena de causas y lo que significa para quien está empezando." enlace={["/noticias", "Ver toda la actualidad"]}>
      {estado === "loading" && <div className="skeleton-pulse" style={{ ...marco, height: 220 }} aria-hidden="true" />}

      {estado === "vacio" && (
        <div style={marco}>
          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65 }}>Todavía no hay una edición publicada. Los resúmenes de apertura y de cierre se publican en días de mercado.</p>
          <div style={{ marginTop: 16 }}><Boton to="/noticias" variante="secundario">Ver las noticias del día</Boton></div>
        </div>
      )}

      {estado === "listo" && (
        <article style={marco}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ background: C.goldBg, color: C.goldText, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{edicion.etiqueta}</span>
            <span style={{ fontSize: 13, color: C.muted }}>Sesión del {fmtFechaSesion(edicion.generadoEn)} · publicado a las {fmtHoraET(edicion.generadoEn)} (hora de Nueva York)</span>
          </div>

          {!edicion.deHoy && (
            <p role="status" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: C.sub, lineHeight: 1.55, marginBottom: 16 }}>
              Es la última edición disponible y corresponde a otra jornada. La de hoy aún no se ha publicado.
            </p>
          )}

          {edicion.titulo && <h3 style={{ fontFamily: F.serif, fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 16 }}>{renderTextoConNegritas(edicion.titulo)}</h3>}

          {edicion.claves.length > 0 && (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {edicion.claves.map((clave, i) => (
                <li key={i} style={{ display: "flex", gap: 12, fontSize: 16, color: C.sub, lineHeight: 1.6 }}>
                  <span aria-hidden="true" style={{ color: C.goldText, fontWeight: 700 }}>—</span>
                  <span>{renderTextoConNegritas(clave)}</span>
                </li>
              ))}
            </ul>
          )}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Boton to={edicion.to} variante="secundario">Leer el análisis completo</Boton>
            <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, maxWidth: "48ch" }}>Redactado por un modelo de lenguaje a partir de las cotizaciones y noticias del día, con publicación automática.</span>
          </div>
        </article>
      )}
    </BloqueSeccion>
  );
}

// Indicador distinto del balance de activos, y de otro mercado: mide el animo
// del mercado cripto, no el de Wall Street. Se explica antes de mostrarse y no
// se traduce a una señal de compra o de venta.
const CLASIFICACION_FNG = { "Extreme Fear": "Miedo extremo", "Fear": "Miedo", "Neutral": "Neutral", "Greed": "Codicia", "Extreme Greed": "Codicia extrema" };

function MiedoCodiciaCripto() {
  const { C } = useOutletContext();
  const [estado, setEstado] = useState("loading");
  const [dato, setDato] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const controlador = new AbortController();
    fetch("https://api.alternative.me/fng/?limit=1", { signal: controlador.signal })
      .then((r) => r.json())
      .then((d) => {
        if (cancelado) return;
        const item = d && d.data && d.data[0];
        if (!item) { setEstado("error"); return; }
        setDato({ valor: Number(item.value), clasificacion: CLASIFICACION_FNG[item.value_classification] || item.value_classification, fecha: Number(item.timestamp) * 1000 });
        setEstado("listo");
      })
      .catch(() => { if (!cancelado) setEstado("error"); });
    return () => { cancelado = true; controlador.abort(); };
  }, []);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Miedo y codicia cripto</h3>
      {estado === "loading" && <p style={{ fontSize: 14, color: C.sub }}>Consultando el indicador…</p>}
      {estado === "error" && <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.55 }}>No se pudo consultar el indicador de Alternative.me.</p>}
      {estado === "listo" && (
        <>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{dato.valor} <span style={{ fontSize: 15, fontWeight: 600, color: C.sub }}>· {dato.clasificacion}</span></p>
          <div aria-hidden="true" style={{ background: C.surfaceAlt, borderRadius: 999, height: 6, marginTop: 10 }}>
            <div style={{ background: C.goldText, borderRadius: 999, height: 6, width: `${Math.min(100, Math.max(0, dato.valor))}%` }} />
          </div>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginTop: 10 }}>
            Escala de 0 a 100 que publica Alternative.me con datos del mercado de criptomonedas, no de la bolsa estadounidense. Dato del {fmtFechaSesion(dato.fecha)}. No es una señal de compra ni de venta.
          </p>
          <Link to="/sentimiento" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 600, color: C.goldText, textDecoration: "underline" }}>Cómo se lee este indicador</Link>
        </>
      )}
    </div>
  );
}

// D. Panorama del mercado. Tabla con simbolo, tipo, moneda y variacion, mas
// tres fichas de contexto que no se estiran a la altura de la tabla.
function PanoramaMercado() {
  const { C, stocks } = useOutletContext();
  const conDato = stocks.filter((st) => st.c != null);
  const destacado = conDato.length ? [...conDato].sort((a, b) => Math.abs(b.c) - Math.abs(a.c))[0] : null;
  const enVerde = conDato.filter((st) => st.c > 0).length;

  const celda = { padding: "12px 16px", borderTop: `1px solid ${C.border}` };
  const celdaNum = { ...celda, textAlign: "right", whiteSpace: "nowrap" };
  const cabecera = { padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "left" };
  const ficha = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px" };

  return (
    <BloqueSeccion id="panorama" titulo="Panorama del mercado" descripcion="Los ocho instrumentos que seguimos a diario. El detalle, los gráficos y el mapa de calor están en Mercados." enlace={["/mercados", "Ver todas las cotizaciones"]}>
      <div className="portada-grid-panorama">
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <caption className="sr-only">Instrumentos que sigue FinanzaDR, con su precio y su variación en la sesión</caption>
              <thead>
                <tr>
                  <th scope="col" style={cabecera}>Instrumento</th>
                  <th scope="col" style={{ ...cabecera, textAlign: "right" }}>Precio</th>
                  <th scope="col" style={{ ...cabecera, textAlign: "right" }}>Variación</th>
                </tr>
              </thead>
              <tbody>
                {stocks.slice(0, 6).map((st) => (
                  <tr key={st.s}>
                    <th scope="row" style={{ ...celda, textAlign: "left", fontWeight: 400 }}>
                      <Link to={`/mercados?symbol=${encodeURIComponent(st.s)}`} style={{ fontSize: 15, fontWeight: 700, color: C.text, textDecoration: "none" }}>{st.s}</Link>
                      <span style={{ marginLeft: 8, fontSize: 12, color: C.muted }}>{st.tipoActivo}</span>
                      <span style={{ display: "block", fontSize: 14, color: C.sub, lineHeight: 1.45 }}>{st.corto}</span>
                    </th>
                    <td style={celdaNum}>
                      {st.p == null
                        ? <span style={{ color: C.muted }}>—</span>
                        : <><span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{fmtPrecio(st.p)}</span> <span style={{ fontSize: 13, color: C.muted }}>{st.moneda}</span></>}
                    </td>
                    <td style={celdaNum}><Variacion c={st.c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, background: C.surfaceAlt }}><EstadoDato /></div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignSelf: "start" }}>
          <div style={ficha}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Mayor variación de la sesión</h3>
            {destacado ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{destacado.s}</span>
                  <Variacion c={destacado.c} size={17} />
                </div>
                <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.55, marginTop: 6 }}>{destacado.n} · {destacado.tipoActivo}</p>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginTop: 8 }}>{destacado.referencia}.</p>
              </>
            ) : <p style={{ fontSize: 14, color: C.sub }}>Sin datos suficientes ahora mismo.</p>}
          </div>

          <div style={ficha}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Balance de activos seguidos</h3>
            {conDato.length ? (
              <>
                <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{enVerde} de {conDato.length} en positivo</p>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginTop: 8 }}>
                  Cuenta cuántos de los instrumentos de esta lista suben en la sesión en curso. Es una foto de estos {conDato.length} activos, no del mercado completo ni del ánimo de los inversores.
                </p>
              </>
            ) : <p style={{ fontSize: 14, color: C.sub }}>Sin datos suficientes ahora mismo.</p>}
          </div>

          <MiedoCodiciaCripto />
        </div>
      </div>
    </BloqueSeccion>
  );
}

// E. Guias destacadas. Nivel y tema salen del propio articulo; el tiempo de
// lectura se calcula sobre su texto. Los titulos no se recortan.
const HOME_GUIAS_INDICES = [0, 3, 7];

function GuiasDestacadas() {
  const { C } = useOutletContext();
  return (
    <BloqueSeccion id="guias" titulo="Guías para empezar" descripcion="Explicaciones en español, sin jerga, sobre lo que conviene entender antes de invertir." enlace={["/aprende", "Ver la biblioteca"]}>
      <ul role="list" className="portada-grid-3" style={{ listStyle: "none" }}>
        {HOME_GUIAS_INDICES.map((idx) => {
          const post = ARTICULOS[idx];
          if (!post) return null;
          return (
            <li key={idx} style={{ display: "flex" }}>
              <Link to={`/aprende?articulo=${idx}`} className="tarjeta-enlace" style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px", textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13, color: C.muted }}>
                  <span style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 999, padding: "3px 10px", fontWeight: 600, color: C.sub }}>{post.nivel}</span>
                  <span>{post.tema}</span>
                  <span aria-hidden="true">·</span>
                  <span>{tiempoLectura(post)} min de lectura</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{post.titulo}</h3>
                <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{post.extracto}</p>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.goldText, marginTop: "auto", paddingTop: 6 }}>Leer la guía →</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </BloqueSeccion>
  );
}

// F. Herramientas, presentadas por lo que resuelven.
const HERRAMIENTAS_PORTADA = [
  { to: "/calculadora", icono: "herramientas", titulo: "Calculadora de interés compuesto", texto: "Pon tu aporte mensual, el plazo y la tasa que asumes, y mira cuánto del resultado viene de lo aportado y cuánto del rendimiento." },
  { to: "/brokers", icono: "documento", titulo: "Brokers y remesas", texto: "Compara requisitos, comisiones y perfil de uso antes de abrir una cuenta, con la fecha en que revisamos cada ficha." },
  { to: "/heatmap", icono: "mercados", titulo: "Mapa de calor del mercado", texto: "Ve en una sola pantalla qué sectores empujan al mercado y cuáles lo frenan en la sesión." },
];

function HerramientasPortada() {
  const { C } = useOutletContext();
  return (
    <BloqueSeccion id="herramientas" titulo="Herramientas" descripcion="Gratuitas y sin registro. Cada una resuelve una pregunta concreta.">
      <ul role="list" className="portada-grid-3" style={{ listStyle: "none" }}>
        {HERRAMIENTAS_PORTADA.map((h) => (
          <li key={h.to} style={{ display: "flex" }}>
            <Link to={h.to} className="tarjeta-enlace" style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px", textDecoration: "none" }}>
              <span style={{ color: C.goldText }}><Icon name={h.icono} size={24} /></span>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{h.titulo}</h3>
              <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{h.texto}</p>
            </Link>
          </li>
        ))}
      </ul>
    </BloqueSeccion>
  );
}

// G. Autor y metodo. Sin fotografia: en el repositorio no hay ninguna imagen
// de la que conste autorizacion, asi que la marca personal es tipografica.
// Las fuentes que se listan son exactamente las que consume el sitio.
const FUENTES_METODO = [
  "Las cotizaciones vienen de Finnhub y se consultan desde el servidor de FinanzaDR, nunca desde tu navegador.",
  "Los gráficos y el mapa de calor son widgets de TradingView, con su propia atribución y sus limitaciones.",
  "El índice de miedo y codicia cripto lo publica Alternative.me y mide el mercado de criptomonedas.",
  "Los resúmenes de apertura y de cierre los redacta un modelo de lenguaje a partir de esos datos y se publican de forma automática, identificados como tales.",
  "Las guías son editoriales, llevan fecha y se corrigen cuando cambia la información en la que se apoyan.",
];

function AutorYMetodo() {
  const { C } = useOutletContext();
  return (
    <BloqueSeccion id="autor" titulo="Quién está detrás y cómo se hace">
      <div className="portada-grid-2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 32px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <span aria-hidden="true" style={{ width: 56, height: 56, borderRadius: "50%", background: C.goldBg, border: `1px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.goldText, flexShrink: 0 }}>J</span>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Julio</h3>
              <p style={{ fontSize: 14, color: C.sub }}>Dominicano residente en Massachusetts</p>
            </div>
          </div>
          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, maxWidth: "62ch" }}>
            Cuando empecé a invertir en Wall Street, nadie me explicaba nada en español: todo estaba en inglés y lleno de jerga, y me tomó años entender lo básico a punta de prueba y error. Escribo FinanzaDR para que otro latino no tenga que repetir ese camino.
          </p>
          <a href="mailto:finanzasDR.oficial@gmail.com" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, marginTop: 12, fontSize: 15, color: C.goldText, textDecoration: "underline", wordBreak: "break-word" }}>finanzasDR.oficial@gmail.com</a>
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>De dónde salen los datos</h3>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {FUENTES_METODO.map((linea, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 15, color: C.sub, lineHeight: 1.6 }}>
                <span aria-hidden="true" style={{ color: C.goldText }}>—</span><span>{linea}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </BloqueSeccion>
  );
}

// H. Newsletter. Promesa concreta, baja explicita y enlace a privacidad; sin
// numero de suscriptores ni testimonios, que no constan en ninguna parte.
function NewsletterPortada() {
  const { C } = useOutletContext();
  return (
    <BloqueSeccion id="newsletter" titulo="Recibe el resumen semanal">
      <div className="portada-grid-2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 32px", alignItems: "start" }}>
        <div>
          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, maxWidth: "62ch" }}>
            Un correo por semana con lo que movió al mercado, la guía nueva si la hay y el contexto para entenderla. En español y sin jerga.
          </p>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 12 }}>
            Puedes darte de baja desde cualquier envío. Tu correo se gestiona con MailerLite y solo se usa para este boletín; los detalles están en la <Link to="/privacidad" style={{ color: C.goldText, textDecoration: "underline" }}>política de privacidad</Link>.
          </p>
        </div>
        <div><NewsletterForm /></div>
      </div>
    </BloqueSeccion>
  );
}

function InicioPage() {
  useDocumentMeta(
    "FinanzaDR — Entiende Wall Street, invierte con más criterio",
    "Guías en español, contexto del mercado y herramientas para latinos que quieren aprender a invertir."
  );
  return (
    <div className="fade-in">
      <PortadaHero />
      <RutaPrincipiantes />
      <ActualidadDestacada />
      <PanoramaMercado />
      <GuiasDestacadas />
      <HerramientasPortada />
      <AutorYMetodo />
      <NewsletterPortada />
    </div>
  );
}

// ===========================================================================
// MERCADOS
// ===========================================================================

// Cabecera de estado: separa las tres horas que antes se confundian en una
// sola etiqueta de "tiempo real" — el estado de la sesion (derivado del reloj
// de Nueva York), la hora del dato mas reciente que nos dio el proveedor y la
// hora en que nosotros consultamos.
function EstadoMercado({ sesion }) {
  const { C, stocks, lastUpdate, realLoading, realErr } = useOutletContext();
  const horas = stocks.map((st) => st.horaCotizacion).filter(Boolean);
  const horaDato = horas.length ? Math.max(...horas) : null;
  // Solo es "atrasado" durante la sesion regular: fuera de ella, el ultimo
  // precio negociado es el dato correcto, no un dato viejo. Se compara contra
  // lastUpdate (el instante de nuestra ultima consulta, que ya esta en estado)
  // y no contra Date.now(), que haria impuro el render.
  const atrasado = horaDato != null && lastUpdate != null && sesion.clave === "regular"
    && new Date(lastUpdate).getTime() - horaDato > DATO_ATRASADO_MS;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, fontSize: 14, color: C.sub }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 999, padding: "5px 14px", fontWeight: 600, color: C.text }}>
        {sesion.etiqueta}
      </span>
      <span>
        {horaDato
          ? `Último dato del proveedor: ${fmtHoraET(horaDato)}`
          : "El proveedor no informa la hora de la cotización"}
        {lastUpdate ? ` · consultado a las ${fmtHoraET(lastUpdate)}` : ""} (hora de Nueva York)
      </span>
      {atrasado && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 999, padding: "5px 12px", color: C.sub }}>
          Datos con retraso respecto a la sesión en curso
        </span>
      )}
      {realLoading && <span role="status" style={{ color: C.muted }}>Actualizando…</span>}
      {realErr && !realLoading && <span role="status" style={{ color: C.muted }}>La última actualización falló: se muestra el último dato válido.</span>}
    </div>
  );
}

// Ficha de instrumento para movil. Misma informacion que una fila de la
// tabla, apilada; se alternan por CSS y solo una de las dos esta en el arbol
// visible a la vez.
function FichaMercado({ st, sesion }) {
  const { C } = useOutletContext();
  const hayDato = st.p != null;
  return (
    <li>
      <Link to={`/mercados?view=charts&symbol=${encodeURIComponent(st.s)}`} className="tarjeta-enlace"
        style={{ display: "block", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", textDecoration: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{st.s}</span>
          <span style={{ fontSize: 17, fontWeight: 600, color: hayDato ? C.text : C.muted }}>
            {hayDato ? `${fmtPrecio(st.p)} ${st.moneda}` : "—"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: 4 }}>
          <span style={{ fontSize: 14, color: C.sub }}>{st.corto} · {st.tipoActivo}</span>
          <span style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            {st.abs != null && <span style={{ fontSize: 13, color: C.muted }}>{st.abs >= 0 ? "+" : "−"}{Math.abs(st.abs).toFixed(2)}</span>}
            <Variacion c={st.c} size={14} />
          </span>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
          {st.tipoActivo === "Criptomoneda"
            ? "Cotiza 24/7"
            : st.horaCotizacion ? `Dato de las ${fmtHoraET(st.horaCotizacion)} ET` : sesion.etiqueta}
        </div>
      </Link>
    </li>
  );
}

function FilaMercado({ st }) {
  const { C } = useOutletContext();
  const hayDato = st.p != null;
  const celda = { padding: "14px 16px", borderTop: `1px solid ${C.border}`, verticalAlign: "top" };
  const celdaNum = { ...celda, textAlign: "right", whiteSpace: "nowrap" };
  return (
    <tr>
      <th scope="row" style={{ ...celda, textAlign: "left", fontWeight: 400 }}>
        <Link to={`/mercados?view=charts&symbol=${encodeURIComponent(st.s)}`} style={{ color: C.text, textDecoration: "none", fontSize: 16, fontWeight: 700 }}>
          {st.s}
        </Link>
        <span style={{ display: "block", fontSize: 14, color: C.sub, lineHeight: 1.45 }}>{st.n}</span>
      </th>
      <td style={celda}>
        <span style={{ display: "inline-block", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 999, padding: "2px 10px", fontSize: 13, color: C.sub }}>{st.tipoActivo}</span>
      </td>
      <td style={celdaNum}>
        {hayDato
          ? <><span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{fmtPrecio(st.p)}</span> <span style={{ fontSize: 13, color: C.muted }}>{st.moneda}</span></>
          : <span style={{ color: C.muted }}>—</span>}
      </td>
      <td style={celdaNum}><Variacion c={st.c} /></td>
      <td style={celdaNum}>
        {st.abs == null
          ? <span style={{ color: C.muted }}>—</span>
          : <span style={{ fontSize: 14, color: C.sub }}>{st.abs >= 0 ? "+" : "−"}{Math.abs(st.abs).toFixed(2)} {st.moneda}</span>}
      </td>
      <td style={{ ...celda, textAlign: "right", fontSize: 13, color: C.muted, whiteSpace: "nowrap" }}>
        {st.tipoActivo === "Criptomoneda"
          ? "24/7"
          : st.horaCotizacion ? `${fmtHoraET(st.horaCotizacion)} ET` : "Sin hora"}
      </td>
    </tr>
  );
}

// Esqueleto mientras no ha llegado la primera respuesta: ocupa el mismo alto
// que la tabla real para que la pagina no salte al cargar.
function EsqueletoMercados() {
  const { C } = useOutletContext();
  return (
    <div aria-hidden="true" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-pulse" style={{ height: 44, borderRadius: 8, background: C.surfaceAlt, marginBottom: i === 5 ? 0 : 12 }} />
      ))}
    </div>
  );
}

const FILTROS_TIPO = ["Todos", "ETF", "Criptomoneda"];

function TablaMercados({ sesion }) {
  const { C, stocks, realLoading, realErr, fetchRealPrices } = useOutletContext();
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("Todos");

  const termino = busqueda.trim().toLowerCase();
  const visibles = stocks.filter((st) => {
    const coincideTipo = tipo === "Todos" || st.tipoActivo === tipo;
    const coincideTexto = !termino || st.s.toLowerCase().includes(termino) || st.n.toLowerCase().includes(termino) || st.corto.toLowerCase().includes(termino);
    return coincideTipo && coincideTexto;
  });

  const hayAlgunDato = stocks.some((st) => st.p != null);
  const cabecera = { padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "left" };
  const cabeceraNum = { ...cabecera, textAlign: "right" };

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="buscar-instrumento" style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Buscar instrumento</label>
            <input id="buscar-instrumento" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Símbolo o nombre"
              style={{ minHeight: 44, minWidth: 240, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 14px", color: C.text, fontFamily: F.sans, fontSize: 15 }} />
          </div>
          <div role="group" aria-label="Filtrar por tipo de activo" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FILTROS_TIPO.map((t) => {
              const activo = tipo === t;
              return (
                <button key={t} type="button" onClick={() => setTipo(t)} aria-pressed={activo}
                  style={{ minHeight: 44, padding: "0 16px", borderRadius: 10, border: `1px solid ${activo ? C.text : C.border}`, background: activo ? C.text : C.card, color: activo ? C.bg : C.text, fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  {t === "Criptomoneda" ? "Cripto" : t}
                </button>
              );
            })}
          </div>
        </div>
        <button type="button" onClick={fetchRealPrices} disabled={realLoading}
          style={{ minHeight: 44, padding: "0 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: realLoading ? C.muted : C.text, fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: realLoading ? "progress" : "pointer" }}>
          {realLoading ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {!hayAlgunDato && realLoading && <EsqueletoMercados />}

      {!hayAlgunDato && !realLoading && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 32px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>No hay cotizaciones disponibles</h2>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: "62ch" }}>
            {realErr
              ? "No se pudo conectar con el proveedor de datos. Puedes intentarlo de nuevo; el resto del sitio sigue funcionando."
              : "Todavía no hemos recibido precios del proveedor."}
          </p>
          <div style={{ marginTop: 16 }}><Boton onClick={fetchRealPrices} variante="secundario">Reintentar</Boton></div>
        </div>
      )}

      {hayAlgunDato && visibles.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 32px" }}>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>Ningún instrumento coincide con la búsqueda. Seguimos ocho instrumentos; prueba con SPY, QQQ o BTC-USD.</p>
        </div>
      )}

      {hayAlgunDato && visibles.length > 0 && (
        <>
          {/* Tabla en escritorio, fichas en movil: la misma informacion, la
              forma que cada ancho puede leer. Se alternan por CSS. */}
          <div className="mercados-tabla" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <caption className="sr-only">Cotizaciones de los instrumentos que sigue FinanzaDR</caption>
                <thead>
                  <tr>
                    <th scope="col" style={cabecera}>Instrumento</th>
                    <th scope="col" style={cabecera}>Tipo</th>
                    <th scope="col" style={cabeceraNum}>Precio</th>
                    <th scope="col" style={cabeceraNum}>Variación</th>
                    <th scope="col" style={cabeceraNum}>Variación absoluta</th>
                    <th scope="col" style={cabeceraNum}>Hora del dato</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((st) => <FilaMercado key={st.s} st={st} />)}
                </tbody>
              </table>
            </div>
          </div>

          <ul role="list" className="mercados-fichas" style={{ listStyle: "none", display: "none", flexDirection: "column", gap: 12 }}>
            {visibles.map((st) => <FichaMercado key={st.s} st={st} sesion={sesion} />)}
          </ul>
        </>
      )}
    </>
  );
}

// Glosario alimentado por el propio modelo de instrumentos: antes era una
// lista aparte, escrita a mano, que podia contradecir a la tabla.
function GlosarioInstrumentos() {
  const { C, stocks } = useOutletContext();
  return (
    <section aria-labelledby="glosario" style={{ marginTop: 48 }}>
      <h2 id="glosario" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 16 }}>Qué es cada instrumento</h2>
      <ul role="list" className="portada-grid-2" style={{ listStyle: "none" }}>
        {stocks.map((st) => (
          <li key={st.s} style={{ borderLeft: `2px solid ${C.border}`, paddingLeft: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{st.s} · <span style={{ fontWeight: 400, color: C.sub }}>{st.n}</span></h3>
            <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, marginTop: 4 }}>{st.referencia}. Cotiza en {st.mercado}, en {st.moneda}.</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MercadosPage() {
  useDocumentMeta(
    "Mercados — FinanzaDR",
    "Cotizaciones de los ETFs e instrumentos que seguimos, con su tipo de activo, la hora del dato y gráficos en español."
  );
  const { C } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  // Vista y simbolo se DERIVAN de la URL, no son estado local sembrado por
  // ella. Antes el parametro solo servia de semilla inicial, asi que pulsar
  // una fila de la tabla (o un simbolo del ticker estando ya en esta pagina)
  // cambiaba la URL pero no la vista: el componente no se vuelve a montar.
  // Derivandolo, la pagina siempre muestra lo que dice su direccion, y esa
  // direccion se puede copiar y compartir.
  const simboloUrl = searchParams.get("symbol");
  const vista = searchParams.get("view") === "charts" || simboloUrl ? "charts" : "tabla";
  const sesion = estadoSesion();

  const cambiarVista = (nueva) => {
    // Al volver a la tabla se limpia el simbolo: el enlace dejaria de
    // corresponder a lo que se esta viendo.
    setSearchParams(nueva === "charts" ? { view: "charts" } : {}, { replace: true });
  };

  const abrirSimbolo = (simbolo) => {
    const parametros = { view: "charts", symbol: simbolo };
    const intervalo = searchParams.get("interval");
    if (intervalo) parametros.interval = intervalo;
    setSearchParams(parametros);
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Mercados</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6, margin: "8px 0 20px", maxWidth: "62ch" }}>
        Los ocho instrumentos que seguimos a diario, con su tipo de activo y la hora del dato. Los gráficos abren cualquier símbolo.
      </p>

      <div style={{ marginBottom: 24 }}><EstadoMercado sesion={sesion} /></div>

      <div role="group" aria-label="Forma de ver el mercado" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[["tabla", "Cotizaciones"], ["charts", "Gráficos"]].map(([clave, etiqueta]) => {
          const activa = vista === clave;
          return (
            <button key={clave} type="button" onClick={() => cambiarVista(clave)} aria-pressed={activa}
              style={{ minHeight: 44, padding: "0 18px", borderRadius: 10, border: `1px solid ${activa ? C.text : C.border}`, background: activa ? C.text : C.card, color: activa ? C.bg : C.text, fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {etiqueta}
            </button>
          );
        })}
      </div>

      {vista === "tabla" ? (
        <>
          <TablaMercados sesion={sesion} />
          <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, marginTop: 16, maxWidth: "72ch" }}>
            Cotizaciones de Finnhub. El estado de la sesión se calcula con el horario regular de NYSE (9:30 a 16:00, hora de Nueva York) y no contempla feriados; Bitcoin cotiza sin horario de cierre.
          </p>
          <GlosarioInstrumentos />
        </>
      ) : (
        /* key por simbolo: al abrir otro instrumento desde el ticker estando ya
           en esta vista, el componente se remonta y el campo de busqueda vuelve a
           mostrar el simbolo que se esta viendo. */
        <TradingViewCharts key={simboloUrl || "sin-simbolo"} simbolo={simboloUrl || ""} onSimbolo={abrirSimbolo} intervalo={searchParams.get("interval")} />
      )}
    </div>
  );
}

// ===========================================================================
// ACTUALIDAD
// ===========================================================================

// Categorias tal como las nombra Finnhub. Lo que no esta en el mapa no recibe
// etiqueta: antes todo lo desconocido caia en "Mercados", que convertia la
// categoria en ruido.
const CATEGORIAS_NOTICIA = {
  earnings: "Resultados",
  ipo: "Salidas a bolsa",
  merger: "Fusiones",
  crypto: "Cripto",
  forex: "Divisas",
  economy: "Economía",
  "top news": "Portada",
  general: null,
};

const categoriaNoticia = (bruta) => {
  const clave = (bruta || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(CATEGORIAS_NOTICIA, clave) ? CATEGORIAS_NOTICIA[clave] : null;
};

// Tarjeta de noticia. Es un <article> con un enlace real, no un <div> con
// onClick: lo anterior no se podia alcanzar ni activar con el teclado.
function TarjetaNoticia({ titulo, resumen, fuente, categoria, fecha, url, procedencia }) {
  const { C } = useOutletContext();
  // Las fechas del RSS dominicano son texto de la fuente y no siempre se
  // pueden parsear: sin esta comprobación, toISOString lanzaría y tumbaría la
  // página entera por una entradilla mal formada.
  const instante = fecha ? new Date(fecha) : null;
  const fechaValida = instante !== null && !Number.isNaN(instante.getTime());
  return (
    <li>
      <article style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", height: "100%" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, fontSize: 13, color: C.muted, marginBottom: 10 }}>
          {categoria && (
            <span style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 999, padding: "3px 10px", fontWeight: 600, color: C.sub }}>{categoria}</span>
          )}
          <span style={{ color: C.sub }}>{fuente}</span>
          {fechaValida && <><span aria-hidden="true">·</span><time dateTime={instante.toISOString()}>{formatTiempoRelativo(instante)}</time></>}
        </div>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: 8 }}>
          {url
            ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "none" }}>{titulo}</a>
            : titulo}
        </h3>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{resumen}</p>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginTop: 12 }}>
          {procedencia}
          {url && <> · <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: C.goldText }}>Leer el artículo original<span className="sr-only"> (se abre en una pestaña nueva)</span></a></>}
        </p>
      </article>
    </li>
  );
}

function NoticiasPage() {
  useDocumentMeta(
    "Noticias — FinanzaDR",
    "Lo que pasa en Wall Street y en República Dominicana, resumido en español y con enlace a la fuente original."
  );
  const { C, noticias, noticiasLoading, fetchNoticias, noticiasRD, noticiasRDLoading, fetchNoticiasRD } = useOutletContext();

  // /api/noticias-es reescribe en español las noticias relevantes con un
  // modelo de lenguaje. Se pide solo desde esta pagina (no desde Layout) para
  // no gastar una llamada por cada visita a cualquier ruta del sitio.
  const [estadoEs, setEstadoEs] = useState("loading");
  const [noticiasEs, setNoticiasEs] = useState([]);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/noticias-es")
      .then((res) => res.json())
      .then((body) => {
        if (cancelado) return;
        if (!body || body.disponible === false || !Array.isArray(body.items) || body.items.length === 0) {
          setEstadoEs("sin-traduccion");
          return;
        }
        setNoticiasEs(body.items);
        setEstadoEs("listo");
      })
      .catch(() => { if (!cancelado) setEstadoEs("sin-traduccion"); });
    return () => { cancelado = true; };
  }, []);

  const encabezado = (titulo, descripcion, alActualizar, cargando) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
      <div style={{ maxWidth: "62ch" }}>
        <h2 style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>{titulo}</h2>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginTop: 6 }}>{descripcion}</p>
      </div>
      <button type="button" onClick={alActualizar} disabled={cargando}
        style={{ minHeight: 44, padding: "0 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: cargando ? C.muted : C.text, fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: cargando ? "progress" : "pointer" }}>
        {cargando ? "Actualizando…" : "Actualizar"}
      </button>
    </div>
  );

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Noticias</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6, margin: "8px 0 40px", maxWidth: "62ch" }}>
        Lo que mueve a Wall Street y lo que se publica en República Dominicana, con la fuente y el enlace al artículo original siempre a la vista.
      </p>

      <section aria-labelledby="noticias-ws">
        <div id="noticias-ws">
          {encabezado(
            "Wall Street",
            estadoEs === "listo"
              ? "Resúmenes en español elaborados por FinanzaDR a partir de artículos publicados en inglés. Se actualizan cada pocos minutos y se muestran los más relevantes de la jornada."
              : "Titulares de Finnhub. En este momento no hay versión en español disponible, así que se muestran tal como los publica la fuente.",
            fetchNoticias,
            noticiasLoading
          )}
        </div>

        {estadoEs === "loading" && (
          <ul role="list" style={{ listStyle: "none", display: "grid", gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <li key={i} className="skeleton-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, height: 150 }} />
            ))}
          </ul>
        )}

        {estadoEs === "listo" && (
          <ul role="list" style={{ listStyle: "none", display: "grid", gap: 16 }}>
            {noticiasEs.map((n, i) => (
              <TarjetaNoticia key={i}
                titulo={n.titulo}
                resumen={n.resumen}
                fuente={n.fuente}
                categoria={categoriaNoticia(n.categoria)}
                fecha={n.datetime ? n.datetime * 1000 : null}
                url={n.url}
                procedencia="Resumen en español de FinanzaDR; el artículo original está en inglés" />
            ))}
          </ul>
        )}

        {estadoEs === "sin-traduccion" && (
          noticiasLoading ? (
            <ul role="list" style={{ listStyle: "none", display: "grid", gap: 16 }}>
              {[0, 1, 2].map((i) => (
                <li key={i} className="skeleton-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, height: 150 }} />
              ))}
            </ul>
          ) : noticias.length === 0 ? (
            <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>No hay noticias disponibles ahora mismo.</p>
          ) : (
            <ul role="list" style={{ listStyle: "none", display: "grid", gap: 16 }}>
              {noticias.slice(0, 8).map((n, i) => (
                <TarjetaNoticia key={i}
                  titulo={n.titulo}
                  resumen={n.resumen}
                  fuente={n.fuente}
                  categoria={n.categoria}
                  fecha={null}
                  url={n.url}
                  procedencia="Titular y resumen en inglés, tal como los publica la fuente" />
              ))}
            </ul>
          )
        )}
      </section>

      <section aria-labelledby="noticias-rd" style={{ marginTop: 64 }}>
        <div id="noticias-rd">
          {encabezado(
            "República Dominicana",
            "Portada económica de El Dinero y Diario Libre, leída de sus canales RSS. Se guarda en caché unos quince minutos, así que puede ir por detrás de sus portadas.",
            fetchNoticiasRD,
            noticiasRDLoading
          )}
        </div>

        {noticiasRDLoading && (
          <ul role="list" style={{ listStyle: "none", display: "grid", gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <li key={i} className="skeleton-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, height: 150 }} />
            ))}
          </ul>
        )}

        {!noticiasRDLoading && noticiasRD.length === 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 28px" }}>
            <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>No se pudieron leer los canales de El Dinero y Diario Libre en este momento.</p>
            <div style={{ marginTop: 16 }}><Boton onClick={fetchNoticiasRD} variante="secundario">Reintentar</Boton></div>
          </div>
        )}

        {!noticiasRDLoading && noticiasRD.length > 0 && (
          <ul role="list" style={{ listStyle: "none", display: "grid", gap: 16 }}>
            {noticiasRD.map((n, i) => (
              <TarjetaNoticia key={i}
                titulo={n.titulo}
                resumen={n.resumen}
                fuente={n.fuente}
                categoria={null}
                fecha={n.fecha || null}
                url={n.url}
                procedencia="Entradilla del canal RSS de la fuente" />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Ficha del instrumento citado en una edición. Los datos vienen del payload
// del agente, que desde el arreglo de identificación financiera ya distingue
// el ETF de su índice de referencia.
function BriefingStockCard({ p }) {
  const { C } = useOutletContext();
  const disponible = p.precio != null;
  return (
    <li style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.simbolo}</span>
        <Variacion c={disponible ? p.cambioPct : null} size={13} />
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>{p.corto || p.nombre}{p.tipoActivo ? ` · ${p.tipoActivo}` : ""}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: disponible ? C.text : C.muted, marginTop: 6 }}>
        {disponible ? `${fmtPrecio(p.precio)} ${p.moneda || "USD"}` : "Sin dato"}
      </div>
    </li>
  );
}

// Plantilla compartida de las ediciones diarias (/apertura y /briefing).
// Antes eran dos páginas casi idénticas copiadas una de otra, cada una con su
// propia idea de cómo fechar y firmar lo publicado.
//
// Sobre la autoría: se dice exactamente lo que ocurre — lo redacta un modelo
// de lenguaje y el cron lo publica sin que nadie lo lea antes. No se afirma
// revisión humana, ni se ofrece historial de ediciones: el blob guarda solo la
// última, así que no hay datos con los que sostenerlo.
function EdicionDiaria({ endpoint, etiqueta, tituloGenerico, descripcionMeta, textoCargando }) {
  const { C } = useOutletContext();
  useDocumentMeta(`${tituloGenerico} — FinanzaDR`, descripcionMeta);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);
  // El estado se deriva de lo que hay: sin datos ni error, seguimos cargando.
  // Fijarlo dentro del efecto encadenaria un render extra en cada montaje.
  const estado = error ? "error" : data ? "listo" : "loading";

  const reintentar = () => { setData(null); setError(null); setIntento((n) => n + 1); };

  useEffect(() => {
    let cancelado = false;
    fetch(endpoint)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "No se pudo obtener la edición.");
        return body;
      })
      // Si la edición corresponde a la jornada de hoy se decide aquí, no en el
      // render: comparar contra el reloj durante el render lo haría impuro.
      .then((body) => {
        if (cancelado) return;
        setData({ ...body, deHoy: claveDiaMercado(body.generadoEn) === claveDiaMercado(Date.now()) });
      })
      .catch((err) => { if (!cancelado) setError(err.message); });
    return () => { cancelado = true; };
  }, [endpoint, intento]);

  if (estado === "loading") {
    return (
      <div className="fade-in">
        <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{tituloGenerico}</h1>
        <p role="status" style={{ fontSize: 16, color: C.sub, marginTop: 12 }}>{textoCargando}</p>
        <div className="skeleton-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, height: 320, marginTop: 24 }} aria-hidden="true" />
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="fade-in">
        <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{tituloGenerico}</h1>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px", marginTop: 24 }}>
          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6, maxWidth: "62ch" }}>
            No se pudo cargar la edición en este momento. {error}
          </p>
          <div style={{ marginTop: 16 }}><Boton onClick={reintentar} variante="secundario">Reintentar</Boton></div>
        </div>
      </div>
    );
  }

  const parrafos = (data.resumen || "").split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const [titular, ...cuerpo] = parrafos;
  const claves = cuerpo.slice(0, 3).map(primeraFrase);
  const precios = Array.isArray(data.precios) ? data.precios : [];

  return (
    <article className="fade-in">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ background: C.goldBg, color: C.goldText, borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>{etiqueta}</span>
        <span style={{ fontSize: 14, color: C.sub }}>
          Sesión del {fmtFechaSesion(data.generadoEn)} · publicado a las {fmtHoraET(data.generadoEn)} (hora de Nueva York)
        </span>
      </div>

      <h1 style={{ fontFamily: F.serif, fontSize: 40, fontWeight: 700, color: C.text, lineHeight: 1.2, maxWidth: "20ch" }}>
        {titular ? renderTextoConNegritas(titular) : tituloGenerico}
      </h1>

      {!data.deHoy && (
        <p role="status" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 15, color: C.sub, lineHeight: 1.55, marginTop: 20, maxWidth: "72ch" }}>
          Esta es la última edición disponible y corresponde a otra jornada. La de hoy aún no se ha publicado.
        </p>
      )}

      {claves.length > 0 && (
        <section aria-labelledby="lo-esencial" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 26px", marginTop: 28 }}>
          <h2 id="lo-esencial" style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>Lo esencial</h2>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {claves.map((clave, i) => (
              <li key={i} style={{ display: "flex", gap: 12, fontSize: 16, color: C.sub, lineHeight: 1.6 }}>
                <span aria-hidden="true" style={{ color: C.goldText, fontWeight: 700 }}>—</span>
                <span>{renderTextoConNegritas(clave)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ancho de lectura: 18px y ~65-75 caracteres por linea. */}
      <div style={{ marginTop: 32, maxWidth: "68ch" }}>
        {cuerpo.map((p, i) => (
          <p key={i} style={{ fontSize: 18, lineHeight: 1.65, color: C.text, marginBottom: i === cuerpo.length - 1 ? 0 : 20 }}>
            {renderTextoConNegritas(p)}
          </p>
        ))}
      </div>

      {precios.length > 0 && (
        <section aria-labelledby="instrumentos" style={{ marginTop: 48 }}>
          <h2 id="instrumentos" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>Instrumentos de esta edición</h2>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginBottom: 16, maxWidth: "72ch" }}>
            Son los datos con los que se redactó el texto. La mayoría son ETFs que siguen a un índice: su precio no es el nivel del índice.
          </p>
          <ul role="list" className="portada-grid-3" style={{ listStyle: "none" }}>
            {precios.map((p) => <BriefingStockCard key={p.simbolo} p={p} />)}
          </ul>
          <p style={{ marginTop: 16 }}>
            <Link to="/mercados" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15, fontWeight: 600, color: C.goldText, textDecoration: "underline" }}>Ver todas las cotizaciones</Link>
          </p>
        </section>
      )}

      <section aria-labelledby="metodo-edicion" style={{ marginTop: 48, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 26px" }}>
        <h2 id="metodo-edicion" style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Cómo se elaboró esta edición</h2>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.65, maxWidth: "72ch" }}>
          La redacta un modelo de lenguaje a partir de las cotizaciones de Finnhub, las noticias del día y el calendario de resultados, siguiendo la línea editorial de FinanzaDR. Se publica de forma automática, sin revisión humana previa a la publicación. Es contenido educativo: no es asesoría de inversión ni una recomendación de comprar o vender.
        </p>
      </section>
    </article>
  );
}

function BriefingPage() {
  return (
    <EdicionDiaria
      endpoint="/api/briefing"
      etiqueta="Cierre de mercado"
      tituloGenerico="Resumen de cierre"
      descripcionMeta="Cómo cerró Wall Street y por qué, explicado en español para quien está empezando a invertir."
      textoCargando="Cargando el resumen de cierre…"
    />
  );
}

function AperturaPage() {
  return (
    <EdicionDiaria
      endpoint="/api/apertura"
      etiqueta="Apertura de mercado"
      tituloGenerico="Resumen de apertura"
      descripcionMeta="Qué se espera de la sesión de hoy en Wall Street: contexto, resultados y noticias de la madrugada, en español."
      textoCargando="Cargando el resumen de apertura…"
    />
  );
}

function CopyButton({ texto }) {
  const { C } = useOutletContext();
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };
  return (
    <button onClick={copiar} style={{ background:copiado?C.green:"none", border:`1px solid ${copiado?C.green:C.gold}`, color:copiado?"#000":C.gold, padding:"7px 16px", borderRadius:6, cursor:"pointer", fontFamily:F.sans, fontSize:11, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>
      {copiado ? "Copiado ✓" : "📋 Copiar"}
    </button>
  );
}

function ContenidoDiarioPage() {
  useDocumentMeta("Contenido Diario para Redes — FinanzaDR", "Guiones listos para compartir el análisis financiero del día en tus redes sociales.");
  const { C } = useOutletContext();
  const [searchParams] = useSearchParams();
  const [fuenteView, setFuenteView] = useState(searchParams.get("fuente") === "apertura" ? "apertura" : "cierre");
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    const url = fuenteView === "apertura" ? "/api/contenido?fuente=apertura" : "/api/contenido";
    fetch(url)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "No se pudo generar el contenido.");
        return body;
      })
      .then((body) => { if (!cancelled) { setData(body); setStatus("ready"); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setStatus("error"); } });
    return () => { cancelled = true; };
  }, [fuenteView]);

  const hashtagsTexto = status === "ready" ? (data.instagram.hashtags || []).join(" ") : "";
  const instagramCompleto = status === "ready" ? `${data.instagram.caption}\n\n${hashtagsTexto}` : "";

  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
        <SectionTitle>📱 Contenido Diario</SectionTitle>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {["cierre","apertura"].map(v => (
            <button key={v} onClick={() => setFuenteView(v)} style={{ padding:"9px 18px", borderRadius:6, border:`1px solid ${fuenteView===v?C.gold:C.border}`, background:fuenteView===v?C.goldBg:"none", color:fuenteView===v?C.gold:C.muted, fontFamily:F.sans, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {v==="cierre"?"🌇 Cierre":"🌅 Apertura"}
            </button>
          ))}
        </div>
      </div>

      {status === "loading" && (
        <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
          <div style={{ fontSize:36, marginBottom:16 }}>⏳</div>
          <div style={{ fontFamily:F.sans, fontSize:13 }}>Generando el contenido del día...</div>
        </div>
      )}

      {status === "error" && (
        <div style={{ background:C.card, border:`1px solid ${C.red}40`, borderRadius:12, padding:"24px 28px", marginTop:16 }}>
          <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>No se pudo generar el contenido en este momento. {error}</p>
        </div>
      )}

      {status === "ready" && (
        <>
          <p style={{ fontFamily:F.sans, fontSize:11, color:C.green, marginTop:4, marginBottom:28 }}>
            ✓ Actualizado hoy a las {formatHora(data.generadoEn)}
          </p>

          <Label>── 🎬 TikTok / Reels (60 seg)</Label>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"24px 28px", marginBottom:32 }}>
            <p style={{ fontFamily:F.sans, fontSize:15, lineHeight:1.9, color:C.text, marginBottom:20, whiteSpace:"pre-wrap" }}>{data.tiktok.guion}</p>
            <CopyButton texto={data.tiktok.guion} />
          </div>

          <Label>── 🧵 Hilo de X</Label>
          <div style={{ display:"grid", gap:12, marginBottom:32 }}>
            {data.hiloX.map((tweet, i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 22px", borderLeft:`3px solid ${C.gold}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                <p style={{ fontFamily:F.sans, fontSize:14, lineHeight:1.7, color:C.text, flex:1, margin:0 }}>{tweet}</p>
                <CopyButton texto={tweet} />
              </div>
            ))}
          </div>

          <Label>── 📸 Instagram</Label>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"24px 28px", marginBottom:32 }}>
            <p style={{ fontFamily:F.sans, fontSize:15, lineHeight:1.9, color:C.text, marginBottom:16, whiteSpace:"pre-wrap" }}>{data.instagram.caption}</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
              {data.instagram.hashtags.map((h, i) => (
                <span key={i} style={{ background:C.goldBg, color:C.gold, padding:"4px 12px", borderRadius:4, fontSize:12, fontFamily:F.sans }}>{h}</span>
              ))}
            </div>
            <CopyButton texto={instagramCompleto} />
          </div>
        </>
      )}
    </div>
  );
}

function extraerFilas(datos) {
  if (Array.isArray(datos)) return datos;
  if (datos && Array.isArray(datos.data)) return datos.data;
  return [];
}

// Celda vacía (string vacío, null o undefined) se muestra como "Directo" —
// aplica sobre todo a referrerHostname (tráfico sin referrer = directo), pero
// se hace genérico para cualquier columna en cualquier tabla.
function formatCelda(valor) {
  if (valor === null || valor === undefined || valor === "") return "Directo";
  return String(valor);
}

function TablaSimple({ filas }) {
  const { C } = useOutletContext();
  if (!filas.length) return <p style={{ fontSize:13, color:C.sub }}>Sin datos disponibles.</p>;
  const columnas = Object.keys(filas[0]);
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr>
            {columnas.map(col => (
              <th key={col} style={{ textAlign:"left", padding:"10px 16px", fontFamily:F.sans, fontSize:11, color:C.gold, borderBottom:`1px solid ${C.border}` }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i}>
              {columnas.map(col => (
                <td key={col} style={{ padding:"10px 16px", fontSize:13, color:C.text, borderBottom: i===filas.length-1 ? "none" : `1px solid ${C.border}` }}>{formatCelda(fila[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonitoreoReporte({ password }) {
  const { C } = useOutletContext();
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/monitoreo", { headers: { "x-monitoreo-password": password } })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "No se pudo generar el reporte de monitoreo.");
        return body;
      })
      .then((body) => { if (!cancelled) { setData(body); setStatus("ready"); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setStatus("error"); } });
    return () => { cancelled = true; };
  }, [password]);

  if (status === "loading") {
    return (
      <div className="fade-in" style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
        <div style={{ fontSize:36, marginBottom:16 }}>⏳</div>
        <div style={{ fontFamily:F.sans, fontSize:13 }}>Generando el reporte de monitoreo...</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="fade-in">
        <SectionTitle>📊 Monitoreo</SectionTitle>
        <div style={{ background:C.card, border:`1px solid ${C.red}40`, borderRadius:12, padding:"24px 28px", marginTop:16 }}>
          <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>No se pudo generar el reporte en este momento. {error}</p>
        </div>
      </div>
    );
  }

  const filasPaginas = extraerFilas(data.datosCrudos?.paginas);
  const filasFuentes = extraerFilas(data.datosCrudos?.fuentes);

  return (
    <div className="fade-in">
      <SectionTitle>📊 Monitoreo</SectionTitle>
      <p style={{ fontFamily:F.sans, fontSize:11, color:C.green, marginTop:4, marginBottom:24 }}>
        ✓ Generado hoy a las {formatHora(data.generadoEn)}
      </p>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"28px 32px", marginBottom:32 }}>
        <p style={{ fontFamily:F.sans, fontSize:15, lineHeight:1.9, color:C.text, margin:0, whiteSpace:"pre-wrap" }}>{renderTextoConNegritas(data.resumen)}</p>
      </div>

      <Label>── Páginas más visitadas</Label>
      <div style={{ marginTop:10, marginBottom:32 }}><TablaSimple filas={filasPaginas} /></div>

      <Label>── Fuentes de tráfico</Label>
      <div style={{ marginTop:10 }}><TablaSimple filas={filasFuentes} /></div>
    </div>
  );
}

function MonitoreoPage() {
  useDocumentMeta("Monitoreo — FinanzaDR");
  const { C } = useOutletContext();
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [errorAuth, setErrorAuth] = useState(false);

  const handleSubmit = async () => {
    if (!password || verificando) return;
    setVerificando(true);
    setErrorAuth(false);
    try {
      const res = await fetch("/api/verificar-monitoreo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json();
      if (body.valido) setAutenticado(true);
      else { setErrorAuth(true); setPassword(""); }
    } catch (e) {
      setErrorAuth(true);
    } finally {
      setVerificando(false);
    }
  };

  if (autenticado) return <MonitoreoReporte password={password} />;

  return (
    <div className="fade-in" style={{ maxWidth:400, margin:"60px auto 0", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
      <SectionTitle>Monitoreo</SectionTitle>
      <p style={{ fontSize:13, color:C.sub, margin:"8px 0 24px" }}>Esta sección es privada. Ingresa la contraseña para continuar.</p>
      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        <input type="password" placeholder="Contraseña" value={password}
          onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 18px", color:C.text, fontFamily:F.sans, fontSize:15, outline:"none" }} />
        <button onClick={handleSubmit} disabled={verificando || !password}
          style={{ background:C.gold, color:"#000", border:"none", padding:"14px 24px", borderRadius:8, cursor:"pointer", fontFamily:F.sans, fontSize:13, fontWeight:700, opacity: verificando||!password?0.6:1 }}>
          {verificando ? "⏳..." : "Entrar"}
        </button>
      </div>
      {errorAuth && <p style={{ fontSize:12, color:C.red }}>⚠️ Contraseña incorrecta</p>}
    </div>
  );
}

function AprendePage() {
  useDocumentMeta("Aprende a Invertir Desde Cero — FinanzaDR", "Guías claras en español sobre ETFs, acciones, cuentas de retiro y más, para quien está empezando a invertir.");
  const { C } = useOutletContext();
  const [searchParams] = useSearchParams();
  const articuloParam = parseInt(searchParams.get("articulo"), 10);
  const articuloInicial = Number.isInteger(articuloParam) && articuloParam >= 0 && articuloParam < ARTICULOS.length ? articuloParam : 0;
  const [expanded, setExpanded] = useState(articuloInicial);
  const articuloRefs = useRef([]);

  useEffect(() => {
    if (searchParams.get("articulo") !== null && articuloRefs.current[articuloInicial]) {
      articuloRefs.current[articuloInicial].scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }, []);

  return (
    <div className="fade-in">
      <SectionTitle>Aprende a Invertir</SectionTitle>
      <p style={{ fontSize:13, color:C.sub, marginTop:4, marginBottom:24 }}>Guías completas para inversores principiantes e intermedios</p>
      <div style={{ display:"grid", gap:24 }}>
        {ARTICULOS.map((post,i) => (
          <div key={i} ref={el => articuloRefs.current[i] = el} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"26px 30px" }}>
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {post.tags.map((t,j) => <span key={j} style={{ background:C.border, color:C.sub, padding:"2px 10px", borderRadius:4, fontSize:11, fontFamily:F.sans }}>#{t}</span>)}
            </div>
            <h3 style={{ fontFamily:F.serif, fontSize:22, fontWeight:800, marginBottom:8, lineHeight:1.35, color:C.text }}>{post.titulo}</h3>
            <div style={{ fontFamily:F.sans, fontSize:11, color:C.muted, marginBottom:14 }}>{post.autor} · {post.fecha}</div>
            {expanded===i ? (
              post.tipo==="stats" ? <ArticuloStats post={post} />
              : post.tipo==="tabla" ? <ArticuloTabla post={post} />
              : post.tipo==="herramientas" ? <ArticuloHerramientas post={post} />
              : post.tipo==="simulador" ? <ArticuloSimulador post={post} />
              : post.tipo==="errores" ? <ArticuloErrores post={post} />
              : <ArticuloPasos post={post} />
            ) : (
              <p style={{ fontSize:14, color:C.sub, lineHeight:1.75 }}>{post.extracto}</p>
            )}
            <button onClick={() => setExpanded(expanded===i?null:i)} style={{ marginTop:18, background:"none", border:`1px solid ${C.gold}`, color:C.gold, padding:"9px 22px", borderRadius:5, cursor:"pointer", fontFamily:F.sans, fontSize:12, fontWeight:600 }}>
             {expanded===i?"Ver menos":"Leer guia completa"}
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginTop:28, background:C.goldBg, border:`1px solid ${C.gold}40`, borderRadius:8, padding:"20px 24px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:24 }}>🎯</span>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ fontFamily:F.serif, fontSize:16, fontWeight:800, color:C.text, marginBottom:4 }}>¿Ya dominas lo básico?</div>
          <p style={{ fontSize:13, color:C.sub, lineHeight:1.6 }}>Explora el Opcionario, nuestra guía en crecimiento de estrategias de opciones explicadas paso a paso.</p>
        </div>
        <Link to="/opciones" style={{ background:"none", border:`1px solid ${C.gold}`, color:C.gold, padding:"9px 20px", borderRadius:5, cursor:"pointer", fontFamily:F.sans, fontSize:12, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap" }}>Ver Opcionario</Link>
      </div>
    </div>
  );
}

function ArticuloPasos({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:14, color:C.sub, lineHeight:1.8, marginBottom:24 }}>{post.intro}</p>
      <div style={{ display:"grid", gap:18, marginBottom:24 }}>
        {post.pasos.map((paso,i) => (
          <div key={i} style={{ display:"flex", gap:18, alignItems:"flex-start" }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:C.goldBg, border:`2px solid ${C.gold}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:F.serif, fontSize:16, fontWeight:800, color:C.gold }}>
              {String(i+1).padStart(2,"0")}
            </div>
            <div style={{ paddingTop:4 }}>
              <div style={{ fontFamily:F.sans, fontSize:13, fontWeight:700, color:C.text, letterSpacing:0.5, marginBottom:6, textTransform:"uppercase" }}>{paso.titulo}</div>
              <p style={{ fontSize:14, color:C.sub, lineHeight:1.75 }}>{paso.texto}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px" }}>
        <p style={{ fontSize:14, color:C.text, lineHeight:1.75, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
      {post.nota && <p style={{ fontSize:11, color:C.muted, lineHeight:1.6, marginTop:16 }}>{post.nota}</p>}
    </div>
  );
}

function ArticuloStats({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:14, color:C.sub, lineHeight:1.8, marginBottom:24 }}>{post.intro}</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14, marginBottom:28 }}>
        {post.stats.map((s,i) => (
          <div key={i} style={{ background:C.goldBg, border:`1px solid ${C.gold}`, borderRadius:10, padding:"18px 14px", textAlign:"center" }}>
            <div style={{ fontFamily:F.serif, fontSize:32, fontWeight:800, color:C.gold, lineHeight:1.1, marginBottom:6 }}>{s.valor}</div>
            <div style={{ fontFamily:F.sans, fontSize:11, color:C.sub, lineHeight:1.5 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gap:18, marginBottom:24 }}>
        {post.razones.map((r,i) => (
          <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:C.gold, color:"#000", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:800, marginTop:2 }}>✓</div>
            <div>
              <div style={{ fontFamily:F.sans, fontSize:13, fontWeight:700, color:C.text, marginBottom:6 }}>{r.titulo}</div>
              <p style={{ fontSize:14, color:C.sub, lineHeight:1.75 }}>{r.texto}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px" }}>
        <p style={{ fontSize:14, color:C.text, lineHeight:1.75, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
    </div>
  );
}

function ArticuloTabla({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:14, color:C.sub, lineHeight:1.8, marginBottom:24 }}>{post.intro}</p>
      <div style={{ overflowX:"auto", marginBottom:28, border:`1px solid ${C.border}`, borderRadius:8 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:520 }}>
          <thead>
            <tr style={{ background:C.goldBg }}>
              <th style={{ textAlign:"left", padding:"12px 16px", fontFamily:F.sans, fontSize:11, color:C.sub, fontWeight:600 }}></th>
              {post.tabla.columnas.map((col,j) => (
                <th key={j} style={{ textAlign:"center", padding:"12px 12px", fontFamily:F.sans, fontSize:11, color:C.gold, fontWeight:700, letterSpacing:0.5 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {post.tabla.filas.map((fila,i) => (
              <tr key={i} style={{ borderTop:`1px solid ${C.border}` }}>
                <td style={{ padding:"12px 16px", fontSize:13, color:C.text }}>{fila.label}</td>
                {fila.valores.map((v,j) => (
                  <td key={j} style={{ textAlign:"center", padding:"12px 12px", fontSize:16, color:v?C.green:C.red }}>{v?"✓":"✗"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display:"grid", gap:18, marginBottom:24 }}>
        {post.explicaciones.map((e,i) => (
          <div key={i} style={{ background:C.goldBg, borderRadius:8, padding:"18px 20px" }}>
            <div style={{ fontFamily:F.serif, fontSize:16, fontWeight:800, color:C.text, marginBottom:12 }}>{e.titulo}</div>
            {e.ventaja && e.desventaja ? (
              <div style={{ display:"grid", gap:12 }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ color:C.green, fontSize:15, flexShrink:0 }}>✓</span>
                  <div>
                    <div style={{ fontFamily:F.sans, fontSize:12, fontWeight:700, color:C.text, marginBottom:4 }}>{e.ventaja.titulo}</div>
                    <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>{e.ventaja.texto}</p>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ color:C.red, fontSize:15, flexShrink:0 }}>✗</span>
                  <div>
                    <div style={{ fontFamily:F.sans, fontSize:12, fontWeight:700, color:C.text, marginBottom:4 }}>{e.desventaja.titulo}</div>
                    <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>{e.desventaja.texto}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>{e.texto}</p>
            )}
          </div>
        ))}
      </div>
      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px" }}>
        <p style={{ fontSize:14, color:C.text, lineHeight:1.75, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
      {post.nota && <p style={{ fontSize:11, color:C.muted, lineHeight:1.6, marginTop:16 }}>{post.nota}</p>}
    </div>
  );
}

function ArticuloHerramientas({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:14, color:C.sub, lineHeight:1.8, marginBottom:24 }}>{post.intro}</p>
      <div style={{ display:"grid", gap:20, marginBottom:24 }}>
        {post.herramientas.map((h,i) => (
          <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:24 }}>{h.icono}</span>
              <h4 style={{ fontFamily:F.serif, fontSize:18, fontWeight:800, color:C.text, flex:1 }}>{h.nombre}</h4>
              <Link to={h.ruta} style={{ background:C.gold, color:"#000", padding:"8px 16px", borderRadius:6, fontFamily:F.sans, fontSize:11, fontWeight:800, textDecoration:"none", whiteSpace:"nowrap" }}>{h.cta} →</Link>
            </div>
            <p style={{ fontSize:13, color:C.sub, lineHeight:1.7, marginBottom:16 }}>{h.descripcion}</p>
            <div style={{ display:"grid", gap:12, marginBottom:14 }}>
              {h.puntos.map((p,j) => (
                <div key={j} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ color:C.gold, fontSize:13, flexShrink:0, marginTop:2 }}>●</span>
                  <div>
                    <div style={{ fontFamily:F.sans, fontSize:12, fontWeight:700, color:C.text, marginBottom:3 }}>{p.titulo}</div>
                    <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>{p.texto}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:C.goldBg, borderRadius:6, padding:"12px 16px" }}>
              <p style={{ fontSize:12.5, color:C.text, lineHeight:1.65 }}>💡 {h.tip}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px" }}>
        <p style={{ fontSize:14, color:C.text, lineHeight:1.75, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
    </div>
  );
}

function ArticuloSimulador({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:14, color:C.sub, lineHeight:1.8, marginBottom:24 }}>{post.intro}</p>

      <Label>{post.ejemplo.titulo}</Label>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12, marginBottom:28 }}>
        {post.ejemplo.filas.map((f,i) => (
          <div key={i} style={{ background:C.goldBg, border:`1px solid ${C.gold}`, borderRadius:10, padding:"14px 10px", textAlign:"center" }}>
            <div style={{ fontFamily:F.sans, fontSize:10, color:C.sub, marginBottom:6 }}>{f.periodo}</div>
            <div style={{ fontFamily:F.serif, fontSize:20, fontWeight:800, color:C.gold }}>{f.valor}</div>
          </div>
        ))}
      </div>

      <Label>{post.comparacion.titulo}</Label>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14, marginBottom:28 }}>
        {post.comparacion.casos.map((c,i) => (
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px" }}>
            <div style={{ fontFamily:F.sans, fontSize:12, fontWeight:700, color:C.text, marginBottom:4 }}>{c.edad}</div>
            <div style={{ fontFamily:F.sans, fontSize:11, color:C.muted, marginBottom:10 }}>Aportando {c.aporte}</div>
            <div style={{ fontFamily:F.serif, fontSize:28, fontWeight:800, color:C.green, marginBottom:6 }}>{c.resultado}</div>
            <div style={{ fontSize:12, color:C.sub, lineHeight:1.6 }}>{c.detalle}</div>
          </div>
        ))}
      </div>

      <Label>── Simulador interactivo</Label>
      <SimuladorInteres />

      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px", marginTop:24 }}>
        <p style={{ fontSize:14, color:C.text, lineHeight:1.75, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
    </div>
  );
}

function SimuladorInteres() {
  const { C } = useOutletContext();
  const [capital, setCapital] = useState(1000);
  const [aporte, setAporte] = useState(200);
  const [tasa, setTasa] = useState(10);
  const [anos, setAnos] = useState(30);

  const tasaMensual = Math.pow(1+tasa/100, 1/12)-1;
  const filas = [];
  let saldo = capital;
  for (let y=1; y<=anos; y++) {
    for (let m=0; m<12; m++) saldo = saldo*(1+tasaMensual)+aporte;
    const aporteAcum = capital+aporte*12*y;
    filas.push({ ano:y, aporteAcum, interesAcum: Math.max(0, saldo-aporteAcum) });
  }
  const finalVal = filas.length ? filas[filas.length-1].aporteAcum+filas[filas.length-1].interesAcum : capital;
  const aporteTotal = capital+aporte*12*anos;
  const gananciaTotal = Math.max(0, finalVal-aporteTotal);

  const fmt$ = (n) => "$"+Math.round(n).toLocaleString("en-US");
  const fmtK = (v) => v>=1e6 ? "$"+(v/1e6).toFixed(1)+"M" : v>=1000 ? "$"+(v/1000).toFixed(0)+"K" : "$"+Math.round(v);

  const sliders = [
    { label:"Inversión Inicial", val:capital, set:setCapital, min:0, max:50000, step:500, fmt:fmt$ },
    { label:"Aporte Mensual", val:aporte, set:setAporte, min:0, max:2000, step:25, fmt:fmt$ },
    { label:"Retorno Esperado Anual", val:tasa, set:setTasa, min:1, max:15, step:0.5, fmt:(v)=>`${v}%` },
    { label:"Años de Crecimiento", val:anos, set:setAnos, min:1, max:40, step:1, fmt:(v)=>`${v} años` },
  ];

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"24px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }} className="calc-grid">
        {sliders.map((s,i) => (
          <div key={i}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, color:C.sub }}>{s.label}</span>
              <span style={{ fontFamily:F.sans, fontSize:13, fontWeight:700, color:C.gold }}>{s.fmt(s.val)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e=>s.set(+e.target.value)} style={{ width:"100%", accentColor:C.gold, cursor:"pointer" }} />
          </div>
        ))}
      </div>

      <div style={{ background:`linear-gradient(135deg,${C.card},${C.bg})`, border:`2px solid ${C.gold}`, borderRadius:12, padding:"20px 24px", textAlign:"center", marginBottom:16 }}>
        <div style={{ fontFamily:F.sans, fontSize:10, color:C.gold, letterSpacing:2, marginBottom:6 }}>VALOR FINAL EN {anos} AÑOS</div>
        <div style={{ fontFamily:F.serif, fontSize:34, fontWeight:800, color:C.gold }}>{fmt$(finalVal)}</div>
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:160, background:C.goldBg, borderRadius:8, padding:"12px 16px" }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Total Invertido</div>
          <div style={{ fontFamily:F.sans, fontSize:16, fontWeight:700, color:C.text }}>{fmt$(aporteTotal)}</div>
        </div>
        <div style={{ flex:1, minWidth:160, background:C.goldBg, borderRadius:8, padding:"12px 16px" }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Ganancia Generada</div>
          <div style={{ fontFamily:F.sans, fontSize:16, fontWeight:700, color:C.green }}>{fmt$(gananciaTotal)}</div>
        </div>
      </div>

      <div style={{ width:"100%", height:280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filas} margin={{ top:10, right:10, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="ano" stroke={C.muted} tick={{ fontFamily:F.sans, fontSize:10, fill:C.muted }} />
            <YAxis stroke={C.muted} tick={{ fontFamily:F.sans, fontSize:9, fill:C.muted }} tickFormatter={fmtK} />
            <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, fontFamily:F.sans, fontSize:12 }} labelFormatter={v=>`Año ${v}`} formatter={(v,n)=>[fmt$(v), n==="aporteAcum"?"Capital Invertido":"Ganancia Generada"]} />
            <Legend wrapperStyle={{ fontFamily:F.sans, fontSize:11, paddingTop:12 }} />
            <Bar dataKey="aporteAcum" stackId="a" fill="#1e4a7a" name="Capital Invertido" />
            <Bar dataKey="interesAcum" stackId="a" fill="#2d7a4a" name="Ganancia Generada" radius={[4,4,0,0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ArticuloErrores({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:14, color:C.sub, lineHeight:1.8, marginBottom:24 }}>{post.intro}</p>
      <div style={{ display:"grid", gap:14, marginBottom:24 }}>
        {post.errores.map((err,i) => (
          <div key={i} style={{ display:"flex", gap:16, alignItems:"flex-start", background:`${C.red}12`, border:`1px solid ${C.red}30`, borderRadius:10, padding:"16px 20px" }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:`${C.red}20`, border:`1px solid ${C.red}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17 }}>⚠️</div>
            <div>
              <div style={{ fontFamily:F.sans, fontSize:13, fontWeight:700, color:C.text, marginBottom:6 }}>{i+1}. {err.titulo}</div>
              <p style={{ fontSize:14, color:C.sub, lineHeight:1.75 }}>{err.texto}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px" }}>
        <p style={{ fontSize:14, color:C.text, lineHeight:1.75, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
    </div>
  );
}

const SESGO_COLOR = { alcista: "green", bajista: "red", neutral: "gold" };

function OpcionesPage() {
  useDocumentMeta("Opcionario: Estrategias de Opciones — FinanzaDR", "Estrategias de trading de opciones explicadas paso a paso, con ejemplos y diagramas de ganancia/pérdida.");
  const { C } = useOutletContext();
  const [expanded, setExpanded] = useState(null);
  const [filtroSesgo, setFiltroSesgo] = useState(null);
  const [filtroNivel, setFiltroNivel] = useState(null);
  const filtradas = ARTICULOS_OPCIONES.filter(post =>
    (!filtroSesgo || post.sesgo === filtroSesgo) &&
    (!filtroNivel || post.nivel === filtroNivel)
  );
  return (
    <div className="fade-in">
      <SectionTitle>Opcionario</SectionTitle>
      <p style={{ fontSize:13, color:C.sub, marginTop:4, marginBottom:24 }}>Estrategias de opciones explicadas paso a paso — contenido en crecimiento, empezando por las más comunes</p>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, color:C.sub, fontFamily:F.sans }}>Mostrando {filtradas.length} de {ARTICULOS_OPCIONES.length} estrategias</span>
        {(filtroSesgo || filtroNivel) && (
          <span onClick={() => { setFiltroSesgo(null); setFiltroNivel(null); }} style={{ fontSize:12, color:C.gold, fontFamily:F.sans, textDecoration:"underline", cursor:"pointer" }}>Limpiar filtros</span>
        )}
      </div>
      <div style={{ display:"grid", gap:24 }}>
        {filtradas.map((post) => (
          <div key={post.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"26px 30px" }}>
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <span onClick={(e) => { e.stopPropagation(); setFiltroSesgo(filtroSesgo===post.sesgo ? null : post.sesgo); }} style={{ background:filtroSesgo===post.sesgo ? C[SESGO_COLOR[post.sesgo]] : C.goldBg, color:filtroSesgo===post.sesgo ? C.bg : C[SESGO_COLOR[post.sesgo]], padding:"2px 10px", borderRadius:4, fontSize:10, fontFamily:F.sans, fontWeight:700, textTransform:"uppercase", cursor:"pointer" }}>{post.sesgo}</span>
              <span onClick={(e) => { e.stopPropagation(); setFiltroNivel(filtroNivel===post.nivel ? null : post.nivel); }} style={{ background:filtroNivel===post.nivel ? C.gold : C.border, color:filtroNivel===post.nivel ? C.bg : C.sub, padding:"2px 10px", borderRadius:4, fontSize:10, fontFamily:F.sans, fontWeight:700, textTransform:"uppercase", cursor:"pointer" }}>{post.nivel}</span>
              {post.tags.map((t,j) => <span key={j} style={{ background:C.border, color:C.sub, padding:"2px 10px", borderRadius:4, fontSize:11, fontFamily:F.sans }}>#{t}</span>)}
            </div>
            <h3 style={{ fontFamily:F.serif, fontSize:22, fontWeight:800, marginBottom:8, lineHeight:1.35, color:C.text }}>{post.nombre}</h3>
            <div style={{ fontFamily:F.sans, fontSize:11, color:C.muted, marginBottom:14 }}>{post.autor} · {post.fecha}</div>
            {expanded===post.id ? <ArticuloEstrategia post={post} /> : (
              <p style={{ fontSize:14, color:C.sub, lineHeight:1.75 }}>{post.extracto}</p>
            )}
            <button onClick={() => setExpanded(expanded===post.id?null:post.id)} style={{ marginTop:18, background:"none", border:`1px solid ${C.gold}`, color:C.gold, padding:"9px 22px", borderRadius:5, cursor:"pointer", fontFamily:F.sans, fontSize:12, fontWeight:600 }}>
             {expanded===post.id?"Ver menos":"Ver estrategia completa"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticuloEstrategia({ post }) {
  const { C } = useOutletContext();
  const fmt$ = (n) => (n<0?"-":"") + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
  return (
    <div>
      <p style={{ fontSize:14, color:C.sub, lineHeight:1.8, marginBottom:20 }}>{post.queEs}</p>

      <div style={{ fontFamily:F.sans, fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.5, marginBottom:8, textTransform:"uppercase" }}>Las patas de la operación</div>
      <div style={{ display:"grid", gap:10, marginBottom:24 }}>
        {post.legs.map((leg,i) => (
          <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 16px" }}>
            <span style={{ background:C.goldBg, color:C.gold, padding:"3px 10px", borderRadius:4, fontSize:11, fontFamily:F.sans, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>
              {leg.accion==="compra"?"+ ":"− "}{leg.tipo.toUpperCase()}
            </span>
            <p style={{ fontSize:13, color:C.sub, lineHeight:1.6 }}>{leg.nota}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gap:12, marginBottom:24 }}>
        <div style={{ borderLeft:`3px solid ${C.green}`, background:`${C.green}0f`, borderRadius:6, padding:"12px 18px" }}>
          <div style={{ fontFamily:F.sans, fontSize:11, fontWeight:700, color:C.green, marginBottom:4, textTransform:"uppercase" }}>Ganancia máxima</div>
          <p style={{ fontSize:13, color:C.sub, lineHeight:1.6 }}>{post.maxGanancia}</p>
        </div>
        <div style={{ borderLeft:`3px solid ${C.red}`, background:`${C.red}0f`, borderRadius:6, padding:"12px 18px" }}>
          <div style={{ fontFamily:F.sans, fontSize:11, fontWeight:700, color:C.red, marginBottom:4, textTransform:"uppercase" }}>Pérdida máxima</div>
          <p style={{ fontSize:13, color:C.sub, lineHeight:1.6 }}>{post.maxPerdida}</p>
        </div>
        <div style={{ borderLeft:`3px solid ${C.gold}`, background:C.goldBg, borderRadius:6, padding:"12px 18px" }}>
          <div style={{ fontFamily:F.sans, fontSize:11, fontWeight:700, color:C.gold, marginBottom:4, textTransform:"uppercase" }}>Punto de equilibrio</div>
          <p style={{ fontSize:13, color:C.sub, lineHeight:1.6 }}>{post.puntoEquilibrio}</p>
        </div>
      </div>

      <div style={{ fontFamily:F.sans, fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.5, marginBottom:8, textTransform:"uppercase" }}>Diagrama de ganancia/pérdida al vencimiento</div>
      <div style={{ position:"relative", height:260, marginBottom:8, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 8px 4px" }}>
        <div style={{ position:"absolute", top:14, right:16, fontFamily:F.sans, fontSize:10, color:C.green, fontWeight:700 }}>Ganancia ↑</div>
        <div style={{ position:"absolute", bottom:24, right:16, fontFamily:F.sans, fontSize:10, color:C.red, fontWeight:700 }}>Pérdida ↓</div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={post.payoffPoints} margin={{ top:10, right:10, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="precio" stroke={C.muted} tick={{ fontFamily:F.sans, fontSize:10, fill:C.muted }} tickFormatter={v=>"$"+v} />
            <YAxis stroke={C.muted} tick={{ fontFamily:F.sans, fontSize:9, fill:C.muted }} tickFormatter={fmt$} />
            <ReferenceLine y={0} stroke={C.muted} strokeDasharray="4 4" />
            <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, fontFamily:F.sans, fontSize:12 }}
              labelFormatter={v=>`Precio subyacente: $${v}`}
              formatter={(v)=>[<span style={{ color:v>=0?C.green:C.red, fontWeight:700 }}>{fmt$(v)}</span>, "Ganancia/Pérdida"]} />
            <Line type="linear" dataKey="ganancia" stroke={C.gold} strokeWidth={2} dot={{ r:3, fill:C.gold, strokeWidth:0 }} activeDot={{ r:5 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize:11, color:C.muted, lineHeight:1.6, marginBottom:24 }}>Puntos calculados al vencimiento de la opción, sin incluir comisiones. No refleja el valor de la posición antes del vencimiento.</p>

      <div style={{ fontFamily:F.sans, fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.5, marginBottom:8, textTransform:"uppercase" }}>Cuándo usarla</div>
      <p style={{ fontSize:14, color:C.sub, lineHeight:1.8, marginBottom:24 }}>{post.cuandoUsarla}</p>

      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px", marginBottom:24 }}>
        <div style={{ fontFamily:F.sans, fontSize:11, fontWeight:700, color:C.gold, marginBottom:6, textTransform:"uppercase" }}>Ejemplo numérico</div>
        <p style={{ fontSize:14, color:C.text, lineHeight:1.75 }}>{post.ejemplo}</p>
      </div>

      <div style={{ display:"flex", gap:16, alignItems:"flex-start", background:`${C.red}12`, border:`1px solid ${C.red}30`, borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:`${C.red}20`, border:`1px solid ${C.red}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17 }}>⚠️</div>
        <div>
          <div style={{ fontFamily:F.sans, fontSize:13, fontWeight:700, color:C.text, marginBottom:6, textTransform:"uppercase" }}>Riesgos</div>
          <p style={{ fontSize:14, color:C.sub, lineHeight:1.75 }}>{post.riesgos}</p>
        </div>
      </div>

      {post.nota && <p style={{ fontSize:11, color:C.muted, lineHeight:1.6 }}>{post.nota}</p>}
    </div>
  );
}

function BrokersPage() {
  useDocumentMeta("Brokers Recomendados — FinanzaDR", "Compara plataformas para invertir desde Estados Unidos, con guías para abrir tu cuenta.");
  const { C } = useOutletContext();
  return (
    <div className="fade-in">
      <SectionTitle>Brokers y Remesas para Latinos</SectionTitle>
      <p style={{ fontSize:13, color:C.sub, marginTop:4, marginBottom:24 }}>Las plataformas recomendadas para invertir en Wall Street y enviar dinero a Latinoamérica</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {BROKERS.map((b,i) => <BrokerCard key={i} b={b} />)}
      </div>
    </div>
  );
}

function CalculadoraPage() {
  useDocumentMeta("Calculadora de Interés Compuesto — FinanzaDR", "Simula cómo crece tu dinero invertido con el tiempo usando interés compuesto.");
  return <div className="fade-in"><CompoundCalc /></div>;
}

function CompartirPage() {
  useDocumentMeta("Comparte el Mercado de Hoy — FinanzaDR", "Genera una imagen con el resumen del mercado para compartir en tus redes.");
  const { stocks, C } = useOutletContext();
  const [searchParams] = useSearchParams();
  const [vista, setVista] = useState(searchParams.get("vista") === "cierre" ? "cierre" : "vivo");
  const [cierreStatus, setCierreStatus] = useState("loading");
  const [cierreStocks, setCierreStocks] = useState(null);
  const [cierreFecha, setCierreFecha] = useState(null);
  const [cierreError, setCierreError] = useState(null);

  useEffect(() => {
    if (vista !== "cierre") return;
    let cancelled = false;
    setCierreStatus("loading");
    setCierreError(null);
    fetch("/api/briefing")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "No se pudo obtener el cierre del mercado.");
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        const indices = (body.precios || [])
          .filter((p) => p.tipo === "ETFs de índice" && p.precio != null && p.cambioPct != null)
          .map((p) => ({ s: p.simbolo, n: p.nombre, corto: p.corto || p.nombre, tipoActivo: p.tipoActivo || "ETF", moneda: "USD", p: p.precio, c: p.cambioPct }));
        if (indices.length === 0) throw new Error("No hay datos de índices disponibles en el cierre guardado.");
        setCierreStocks(indices);
        setCierreFecha(new Date(body.generadoEn));
        setCierreStatus("ready");
      })
      .catch((err) => { if (!cancelled) { setCierreError(err.message); setCierreStatus("error"); } });
    return () => { cancelled = true; };
  }, [vista]);

  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
        <SectionTitle>📸 Market Snapshot</SectionTitle>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {["vivo","cierre"].map(v => (
            <button key={v} onClick={() => setVista(v)} style={{ padding:"9px 18px", borderRadius:6, border:`1px solid ${vista===v?C.gold:C.border}`, background:vista===v?C.goldBg:"none", color:vista===v?C.gold:C.muted, fontFamily:F.sans, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {v==="vivo"?"🔴 Vivo":"🌇 Cierre de Hoy"}
            </button>
          ))}
        </div>
      </div>
      <p style={{ fontSize:13, color:C.sub, marginTop:4, marginBottom:24 }}>Genera una card visual del mercado lista para compartir.</p>

      {vista === "vivo" && <SnapshotCard stocks={stocks} />}

      {vista === "cierre" && cierreStatus === "loading" && (
        <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
          <div style={{ fontSize:36, marginBottom:16 }}>⏳</div>
          <div style={{ fontFamily:F.sans, fontSize:13 }}>Cargando el cierre del mercado...</div>
        </div>
      )}

      {vista === "cierre" && cierreStatus === "error" && (
        <div style={{ background:C.card, border:`1px solid ${C.red}40`, borderRadius:12, padding:"24px 28px" }}>
          <p style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>No se pudo cargar el cierre del mercado. {cierreError}</p>
        </div>
      )}

      {vista === "cierre" && cierreStatus === "ready" && (
        <SnapshotCard stocks={cierreStocks} modo="cierre" fecha={cierreFecha} />
      )}
    </div>
  );
}

function NewsletterPage() {
  useDocumentMeta("Newsletter Gratis — FinanzaDR", "Recibe el análisis financiero diario directo en tu correo, gratis.");
  const { C, dark } = useOutletContext();
  return (
    <div className="fade-in">
      <div style={{ background:dark?"linear-gradient(135deg,#0f1228,#130f2a)":"linear-gradient(135deg,#eef0f8,#e8eaf5)", border:`1px solid ${C.gold}30`, borderRadius:16, padding:"40px", marginBottom:32, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>📈</div>
        <div style={{ fontFamily:F.sans, fontSize:11, color:C.gold, letterSpacing:3, marginBottom:12 }}>GRATIS · CADA SEMANA</div>
        <h1 style={{ fontFamily:F.serif, fontSize:32, fontWeight:800, color:C.text, marginBottom:14, lineHeight:1.3 }}>Lo más importante de<br/><span style={{ color:C.gold }}>Wall Street en tu idioma</span></h1>
        <p style={{ fontSize:15, color:C.sub, maxWidth:480, margin:"0 auto 32px", lineHeight:1.8 }}>Cada semana te enviamos un resumen claro de lo que pasó en los mercados.</p>
        <div style={{ maxWidth:480, margin:"0 auto" }}><NewsletterForm /></div>
      </div>
    </div>
  );
}

function LegalPage({ title, updated, sections }) {
  const { C } = useOutletContext();
  return (
    <div className="fade-in">
      <SectionTitle>{title}</SectionTitle>
      <p style={{ fontSize:12, color:C.muted, marginTop:4, marginBottom:24, fontFamily:F.sans }}>Última actualización: {updated}</p>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"28px 32px", display:"grid", gap:26 }}>
        {sections.map((s,i) => (
          <div key={i} style={{ borderTop:i>0?`1px solid ${C.border}`:"none", paddingTop:i>0?22:0 }}>
            <h3 style={{ fontFamily:F.serif, fontSize:17, fontWeight:800, color:C.text, marginBottom:10 }}>{s.titulo}</h3>
            <div style={{ display:"grid", gap:12 }}>
              {s.parrafos.map((p,j) => <p key={j} style={{ fontSize:14, color:C.sub, lineHeight:1.8 }}>{p}</p>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacidadPage() {
  useDocumentMeta("Política de Privacidad — FinanzaDR", "Cómo protegemos tu información en FinanzaDR.");
  return (
    <LegalPage title="Política de Privacidad" updated="26 de julio de 2026" sections={[
      { titulo: "Qué información recopilamos", parrafos: [
        "No recopilamos información personal identificable salvo la que tú decidas darnos voluntariamente, como tu correo al suscribirte al newsletter (gestionado a través de MailerLite).",
      ] },
      { titulo: "Analytics", parrafos: [
        "Usamos Vercel Analytics para medir visitas de forma agregada y anónima, sin cookies de seguimiento individual, únicamente para entender qué contenido es útil y mejorar el sitio.",
      ] },
      { titulo: "Cookies y publicidad", parrafos: [
        "Este sitio puede mostrar anuncios a través de Google AdSense. Terceros proveedores de anuncios, incluido Google, utilizan cookies para publicar anuncios basados en las visitas previas del usuario a este u otros sitios web. El uso de cookies publicitarias por parte de Google permite que Google y sus socios publiquen anuncios basados en las visitas realizadas por los usuarios a este sitio o a otros sitios web. Puedes inhabilitar la publicidad personalizada visitando Configuración de anuncios de Google (adssettings.google.com).",
      ] },
      { titulo: "Servicios de terceros", parrafos: [
        "El sitio integra servicios de terceros para mostrarte datos de mercado en tiempo real: Finnhub (precios y noticias), TradingView (charts y heat map) y Alternative.me (índice de sentimiento cripto). Cada uno de estos servicios tiene su propia política de privacidad independiente sobre los datos que procesan en tu navegador.",
      ] },
      { titulo: "Tus derechos", parrafos: [
        "Puedes solicitar la eliminación de tu correo de nuestra lista de newsletter en cualquier momento, usando el link de darse de baja en cualquier correo que recibas, o escribiéndonos directamente.",
      ] },
      { titulo: "Contacto", parrafos: [
        "Si tienes preguntas sobre esta política, puedes escribirnos a través de los canales de contacto listados en el sitio.",
      ] },
    ]} />
  );
}

function TerminosPage() {
  useDocumentMeta("Términos y Condiciones — FinanzaDR", "Condiciones de uso de FinanzaDR: propiedad intelectual, afiliados, suscripciones, derecho de desistimiento en la UE y ley aplicable.");
  return (
    <LegalPage title="Términos y Condiciones" updated="8 de septiembre de 2026" sections={[
      { titulo: "1. Quiénes somos y aceptación de los términos", parrafos: [
        "FinanzaDR (finanzadr.com) es un sitio de educación financiera operado por [RAZÓN SOCIAL], sociedad en proceso de constitución en [JURISDICCIÓN] (en adelante, el Operador, nosotros). Puedes contactarnos en cualquier momento en finanzasDR.oficial@gmail.com.",
        "Al acceder o utilizar el sitio aceptas quedar vinculado por estos Términos y Condiciones, por la Política de Privacidad y por el Aviso Legal, que forman parte integrante de este acuerdo. Si no estás de acuerdo con alguna parte, no utilices el sitio.",
      ] },
      { titulo: "2. Ámbito territorial y usuarios de la UE, EEE y Reino Unido", parrafos: [
        "El sitio es accesible desde cualquier país, pero está dirigido principalmente a personas de habla hispana en América Latina, el Caribe y Estados Unidos. Si resides en la Unión Europea, el Espacio Económico Europeo, Suiza o el Reino Unido, te aplican protecciones adicionales que reconocemos expresamente en estos términos: el derecho de desistimiento de 14 días descrito más abajo, las garantías legales de conformidad y los derechos de protección de datos del Reglamento General de Protección de Datos (RGPD).",
        "Ninguna cláusula de este documento puede interpretarse en el sentido de limitar o excluir derechos que la ley de tu país de residencia te reconozca con carácter irrenunciable como consumidor.",
      ] },
      { titulo: "3. Elegibilidad y edad mínima", parrafos: [
        "Debes tener al menos 18 años para utilizar el sitio y, en particular, para contratar cualquier servicio de pago. El sitio no está dirigido a menores de edad y no recopilamos deliberadamente datos de personas menores de 16 años. Si aceptas estos términos en nombre de una entidad, declaras tener facultades suficientes para obligarla.",
      ] },
      { titulo: "4. Naturaleza educativa del servicio", parrafos: [
        "Todo el contenido del sitio —precios, noticias, guías, calculadoras, análisis, el Opcionario y los boletines— se ofrece con fines exclusivamente educativos e informativos. No constituye asesoría de inversión, fiscal, contable ni legal, ni una recomendación personalizada adaptada a tu situación. Consulta el Aviso Legal para el detalle de los riesgos.",
      ] },
      { titulo: "5. No somos un broker ni un asesor registrado", parrafos: [
        "El Operador no es un broker, agente de valores, asesor de inversión registrado, gestor de patrimonios ni intermediario financiero. No está registrado ni supervisado por la Superintendencia del Mercado de Valores de la República Dominicana, por la SEC o FINRA en Estados Unidos, ni por ninguna autoridad competente de la Unión Europea bajo la Directiva MiFID II.",
        "No ejecutamos operaciones, no custodiamos fondos y no gestionamos dinero de los usuarios. Únicamente enlazamos a plataformas de terceros (brokers, servicios de remesas) que utilizas bajo tu propia responsabilidad y cuyos términos y condiciones debes revisar por separado.",
      ] },
      { titulo: "6. Propiedad intelectual y licencia de uso", parrafos: [
        "Todo el contenido original del sitio —textos, guías, análisis, diseño, marca, logotipos y código— es propiedad del Operador o se utiliza con licencia, y está protegido por las leyes de propiedad intelectual aplicables y por los tratados internacionales, incluido el Convenio de Berna.",
        "Te concedemos una licencia limitada, personal, revocable, no exclusiva e intransferible para acceder al contenido y usarlo con fines personales y no comerciales. Puedes citar fragmentos breves con atribución y enlace a la fuente. Cualquier otro uso —reproducción total, traducción, redistribución, explotación comercial o utilización para entrenar modelos de inteligencia artificial— requiere nuestra autorización previa y por escrito.",
      ] },
      { titulo: "7. Conducta prohibida", parrafos: [
        "Te comprometes a no: (a) extraer datos del sitio mediante scraping, crawlers, bots o cualquier medio automatizado; (b) revender, redistribuir o poner a disposición de terceros los datos de mercado que se muestran en el sitio; (c) intentar acceder a áreas restringidas, endpoints internos o infraestructura del sitio; (d) sobrecargar deliberadamente los servidores o eludir los límites de uso; (e) suplantar identidades o falsear tu relación con el Operador; (f) utilizar el sitio para actividades ilícitas o para promocionar instrumentos financieros.",
        "Los datos de mercado se muestran al amparo de licencias de terceros que prohíben su redistribución. Su uso indebido puede generar responsabilidad frente a esos proveedores además de frente a nosotros, y da lugar a la revocación inmediata de tu licencia de uso.",
      ] },
      { titulo: "8. Contenido y datos de terceros", parrafos: [
        "El sitio integra datos y servicios de terceros: Finnhub (cotizaciones y noticias), TradingView (gráficos y mapa de calor), Alternative.me (índice de sentimiento cripto), MailerLite (boletín) y Vercel (alojamiento y analítica). Estos datos se ofrecen tal cual, pueden estar retrasados, incompletos o contener errores, y su disponibilidad depende de terceros sobre los que no tenemos control.",
        "No respaldamos, verificamos ni asumimos responsabilidad por el contenido de sitios externos enlazados desde FinanzaDR.",
      ] },
      { titulo: "9. Uso de las herramientas del sitio", parrafos: [
        "El uso de las herramientas del sitio —incluyendo la calculadora de interés compuesto, el Opcionario, los generadores de imágenes y los widgets de TradingView— es bajo tu propio riesgo. Las proyecciones son simulaciones matemáticas basadas en los supuestos que tú introduces: no son predicciones ni garantías de rendimiento, y no consideran impuestos, comisiones, inflación ni tu situación personal.",
      ] },
      { titulo: "10. Contenido de nivel avanzado (Opcionario)", parrafos: [
        "El Opcionario contiene contenido educativo sobre estrategias de opciones de distintos niveles de riesgo, incluyendo algunas con pérdida potencial elevada o ilimitada. Este contenido está dirigido a fines educativos únicamente y no sustituye la evaluación de tu propio perfil de riesgo ni la aprobación de tu broker para operar cada nivel de estrategia.",
      ] },
      { titulo: "11. Servicios de pago y suscripciones", parrafos: [
        "Podemos ofrecer, ahora o en el futuro, contenido, herramientas, cursos o suscripciones de pago. Cuando lo hagamos, el precio aplicable, la moneda, la periodicidad y las condiciones específicas se mostrarán con claridad antes de que confirmes la compra. El pago se procesará a través de un proveedor externo especializado; no almacenamos los datos completos de tu tarjeta.",
        "Los precios se indican con los impuestos aplicables cuando la ley lo exija. Para consumidores de la Unión Europea se aplicará el IVA correspondiente a su país de residencia, conforme al régimen europeo de servicios prestados por vía electrónica.",
        "Las suscripciones se renuevan automáticamente por periodos iguales salvo que las canceles antes de la fecha de renovación. Puedes cancelar en cualquier momento y conservarás el acceso hasta el final del periodo ya pagado, sin cargos posteriores. Cualquier cambio de precio se notificará con al menos 30 días de antelación y solo surtirá efecto en la renovación siguiente; podrás cancelar sin penalización antes de esa fecha.",
      ] },
      { titulo: "12. Derecho de desistimiento de 14 días (UE, EEE y Reino Unido)", parrafos: [
        "Si eres consumidor residente en la Unión Europea, el Espacio Económico Europeo o el Reino Unido, dispones de 14 días naturales desde la contratación para desistir de cualquier servicio de pago, sin necesidad de justificación y sin penalización, conforme a la Directiva 2011/83/UE sobre los derechos de los consumidores.",
        "Para ejercerlo basta con que nos comuniques tu decisión de forma inequívoca escribiendo a finanzasDR.oficial@gmail.com. Te reembolsaremos todos los pagos recibidos en un plazo máximo de 14 días desde que recibamos tu comunicación, utilizando el mismo medio de pago que empleaste, sin coste alguno para ti.",
        "Excepción por entrega inmediata: cuando el servicio consista en contenido digital que se pone a tu disposición de forma inmediata, al confirmar la compra se te pedirá que solicites expresamente el inicio inmediato de la prestación y que reconozcas que, una vez ejecutada por completo, pierdes el derecho de desistimiento (Art. 16.m de la Directiva 2011/83/UE). Si el contenido aún no se ha entregado, tu derecho de desistimiento se conserva íntegro.",
      ] },
      { titulo: "13. Reembolsos fuera de la Unión Europea", parrafos: [
        "Si resides fuera de la UE, el EEE o el Reino Unido, y salvo que la ley de tu país disponga otra cosa, los pagos por contenido digital ya entregado no son reembolsables. Evaluaremos de buena fe y caso por caso las solicitudes de reembolso motivadas por fallos técnicos imputables a nosotros, cobros duplicados o imposibilidad de acceder al servicio contratado.",
      ] },
      { titulo: "14. Afiliados, patrocinios y contenido comercial", parrafos: [
        "FinanzaDR participa en programas de afiliados de plataformas como Robinhood y Tastytrade, y puede incorporar en el futuro patrocinios, cursos y productos digitales propios o de terceros. Esto significa que podemos recibir una comisión si te registras o realizas una acción a través de nuestros enlaces, sin ningún costo adicional para ti.",
        "Todo contenido patrocinado o pagado se identificará como tal de forma visible, conforme a las guías de divulgación de la Comisión Federal de Comercio de Estados Unidos (16 CFR Parte 255) y a la normativa europea sobre prácticas comerciales desleales (Directiva 2005/29/CE).",
        "Esta compensación no influye en el contenido editorial ni en nuestras explicaciones: mantenemos el mismo estándar de honestidad en todo el sitio, uses o no nuestros enlaces. El sitio puede además mostrar publicidad de terceros; consulta la Política de Privacidad para conocer el tratamiento de datos asociado.",
      ] },
      { titulo: "15. Exclusión de garantías y limitación de responsabilidad", parrafos: [
        "El sitio se ofrece tal cual y según disponibilidad, sin garantías de exactitud, integridad, continuidad, ausencia de errores o adecuación a un fin concreto, en la máxima medida permitida por la ley aplicable.",
        "En ningún caso el Operador responderá por pérdidas de inversión, lucro cesante, pérdida de oportunidad, pérdida de datos ni por daños indirectos, incidentales o consecuenciales derivados del uso del sitio o de decisiones tomadas a partir de su contenido. Cuando exista un servicio de pago, nuestra responsabilidad total agregada se limitará al importe que hayas abonado en los 12 meses anteriores al hecho que la origine.",
        "Nada de lo anterior excluye ni limita nuestra responsabilidad por dolo, negligencia grave, fraude, muerte o daños personales, ni cualquier otra responsabilidad que no pueda excluirse o limitarse legalmente. Si resides en la UE, el EEE o el Reino Unido, tus derechos legales imperativos como consumidor permanecen intactos.",
      ] },
      { titulo: "16. Indemnización", parrafos: [
        "Aceptas mantener indemne al Operador, sus colaboradores y sus proveedores frente a cualquier reclamación, daño o gasto razonable (incluidos honorarios legales) derivado de tu uso indebido del sitio, del incumplimiento de estos términos o de la vulneración de derechos de terceros. Esta obligación no aplica en la medida en que la reclamación se deba a nuestra propia culpa o negligencia.",
      ] },
      { titulo: "17. Ley aplicable y tribunales competentes", parrafos: [
        "Estos términos se rigen por las leyes de [JURISDICCIÓN], sin dar efecto a sus normas sobre conflicto de leyes, y los tribunales de [JURISDICCIÓN] serán competentes con carácter general.",
        "No obstante, si eres consumidor residente en la Unión Europea o el Espacio Económico Europeo, esta cláusula no te priva de la protección que te otorgan las disposiciones imperativas de la ley de tu país de residencia habitual, y podrás demandar y ser demandado ante los tribunales de tu domicilio conforme al Reglamento (UE) 1215/2012. Los consumidores del Reino Unido conservan el derecho equivalente bajo su normativa nacional.",
      ] },
      { titulo: "18. Resolución de disputas y plataforma ODR de la UE", parrafos: [
        "Antes de acudir a los tribunales te invitamos a escribirnos a finanzasDR.oficial@gmail.com para buscar una solución amistosa; responderemos en un plazo razonable.",
        "Si resides en la Unión Europea, puedes además recurrir a la plataforma de resolución de litigios en línea de la Comisión Europea, disponible en ec.europa.eu/consumers/odr, conforme a la Directiva 2013/11/UE. No estamos obligados ni nos hemos comprometido a someternos a un organismo concreto de resolución alternativa de litigios.",
      ] },
      { titulo: "19. Modificaciones de estos términos", parrafos: [
        "Podemos modificar estos términos para reflejar cambios legales, técnicos o de nuestro modelo de negocio. Los cambios menores o favorables al usuario surtirán efecto al publicarse, con una nueva fecha de última actualización.",
        "Los cambios sustanciales que afecten a tus derechos o a un servicio de pago ya contratado se notificarán con al menos 30 días de antelación, por correo electrónico si estás suscrito o mediante un aviso visible en el sitio. Si no los aceptas, podrás cancelar tu suscripción antes de su entrada en vigor sin penalización. El uso continuado del sitio después de esa fecha implica la aceptación de los nuevos términos.",
      ] },
      { titulo: "20. Divisibilidad, cesión y acuerdo completo", parrafos: [
        "Si alguna cláusula de estos términos se declara inválida o inejecutable, el resto conservará plena vigencia y la cláusula afectada se interpretará en el sentido más próximo posible a su finalidad original dentro de lo permitido por la ley. La falta de ejercicio de un derecho no supone su renuncia.",
        "No puedes ceder tus derechos u obligaciones bajo estos términos sin nuestro consentimiento previo. Nosotros podremos cederlos en el marco de una reorganización societaria o transmisión del negocio, notificándotelo previamente.",
      ] },
      { titulo: "21. Idioma y contacto", parrafos: [
        "Estos términos se redactan en español, que será la versión vinculante frente a cualquier traducción. Junto con la Política de Privacidad y el Aviso Legal constituyen el acuerdo completo entre tú y el Operador respecto del uso del sitio.",
        "Para cualquier consulta sobre estos términos escríbenos a finanzasDR.oficial@gmail.com.",
      ] },
    ]} />
  );
}

function AvisoPage() {
  useDocumentMeta("Aviso Legal — FinanzaDR", "Aviso legal y de riesgo de FinanzaDR. Contenido educativo, no asesoría financiera.");
  return (
    <LegalPage title="Aviso Legal" updated="26 de julio de 2026" sections={[
      { titulo: "No es asesoría de inversión", parrafos: [
        "FinanzaDR no constituye asesoría de inversión. Nada en este sitio debe interpretarse como una recomendación para comprar, vender o mantener ningún activo financiero.",
      ] },
      { titulo: "Riesgo general de inversión", parrafos: [
        "Invertir en acciones, ETFs y criptomonedas conlleva riesgo de pérdida, incluyendo la pérdida total del capital invertido. Los rendimientos pasados no garantizan resultados futuros.",
      ] },
      { titulo: "Riesgo específico de opciones", parrafos: [
        "Operar opciones conlleva riesgos adicionales y significativamente mayores a los de invertir en acciones o ETFs. Algunas estrategias descritas en el Opcionario (como Naked Put o Short Strangle) pueden generar pérdidas que superan la inversión inicial, incluyendo pérdidas potencialmente ilimitadas en ciertos casos. Estas estrategias requieren aprobación específica de tu broker y no son adecuadas para todos los inversionistas.",
      ] },
      { titulo: "Datos de mercado de terceros", parrafos: [
        "Los datos de mercado provienen de proveedores externos (Finnhub, TradingView, Alternative.me) y pueden tener retrasos, errores o interrupciones. No garantizamos su exactitud, integridad ni disponibilidad continua.",
      ] },
      { titulo: "Consulta profesional", parrafos: [
        "Antes de tomar decisiones financieras importantes, consulta a un asesor financiero, contable o legal calificado en tu jurisdicción.",
      ] },
    ]} />
  );
}

function NotFoundPage() {
  const { C } = useOutletContext();
  return (
    <div className="fade-in" style={{ textAlign:"center", padding:"80px 20px" }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🧭</div>
      <SectionTitle>Página no encontrada</SectionTitle>
      <p style={{ fontSize:14, color:C.sub, margin:"12px 0 28px" }}>La página que buscas no existe o fue movida.</p>
      <Link to="/" style={{ background:C.gold, color:"#000", padding:"12px 24px", borderRadius:8, fontFamily:F.sans, fontSize:12, fontWeight:800, textDecoration:"none", display:"inline-block" }}>Volver al inicio</Link>
    </div>
  );
}

// Titulo de pagina. Por defecto <h1>: cada ruta debe tener uno y solo uno
// (WCAG 1.3.1 / 2.4.6). Con nivel={2} sirve para una seccion secundaria.
function SectionTitle({ children, nivel = 1 }) {
  const { C } = useOutletContext();
  const H = nivel === 1 ? "h1" : "h2";
  return <H style={{ fontFamily:F.serif, fontSize:nivel === 1 ? 32 : 24, fontWeight:700, color:C.text, marginBottom:4, lineHeight:1.2 }}>{children}</H>;
}

function Label({ children, style: s }) {
  const { C } = useOutletContext();
  return <div style={{ fontFamily:F.sans, fontSize:10, color:C.gold, letterSpacing:2, textTransform:"uppercase", marginBottom:14, ...s }}>{children}</div>;
}

function BrokerCard({ b }) {
  const { C } = useOutletContext();
  return (
    <div className="card-hover" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"22px 20px", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:48, height:48, borderRadius:"50%", background:C.goldBg, border:`2px solid ${C.gold}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:F.serif, fontSize:18, fontWeight:800, color:C.gold }}>{b.initial}</div>
        <div>
          <div style={{ fontFamily:F.sans, fontSize:14, fontWeight:700, color:C.text }}>{b.name}</div>
          <div style={{ background:C.goldBg, color:C.gold, display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontFamily:F.sans, fontWeight:600, marginTop:4 }}>{b.nivel}</div>
        </div>
      </div>
      <p style={{ fontSize:13, color:C.sub, lineHeight:1.7, flex:1 }}>{b.desc}</p>
      <button onClick={() => window.open(b.url,"_blank","noopener,noreferrer")} style={{ background:C.gold, color:"#000", border:"none", padding:"11px 18px", borderRadius:7, cursor:"pointer", fontFamily:F.sans, fontSize:12, fontWeight:800, width:"100%" }}>{b.cta} →</button>
    </div>
  );
}
function NewsletterForm() {
  const { C } = useOutletContext();
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
      <div style={{ fontFamily:F.serif, fontSize:22, fontWeight:700, color:"#00d68f", marginBottom:8 }}>¡Ya estás suscrito!</div>
      <p style={{ fontSize:14, color:C.sub }}>Revisa tu correo para confirmar.</p>
    </div>
  );
  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
        <input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          style={{ flex:1, minWidth:200, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 18px", color:C.text, fontFamily:F.sans, fontSize:15, outline:"none" }} />
        <button onClick={handleSubmit} disabled={status==="loading"} style={{ background:C.gold, color:"#000", border:"none", padding:"14px 24px", borderRadius:8, cursor:"pointer", fontFamily:F.sans, fontSize:13, fontWeight:700 }}>
         {status==="loading"?"⏳ Enviando...":"Suscribirse"}
        </button>
      </div>
      {status==="error" && <p style={{ fontSize:12, color:C.red }}>⚠️ Ingresa un email válido</p>}
    </div>
  );
}

function CompoundCalc() {
  const { C } = useOutletContext();
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
  const inputStyle={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontFamily:F.sans,fontSize:15,fontWeight:600,outline:"none"};
  const labelStyle={fontSize:13,color:C.sub,marginBottom:6,display:"block"};
  const selStyle={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontFamily:F.sans,fontSize:13,outline:"none",cursor:"pointer"};
  const stepBtn=(fn,dir)=>(<button onClick={fn} style={{width:40,background:C.border,border:"none",color:C.gold,fontSize:20,cursor:"pointer",borderRadius:dir==="left"?"8px 0 0 8px":"0 8px 8px 0",flexShrink:0}}>{dir==="left"?"−":"+"}</button>);
  const numInput=(val,setVal,step,min=0)=>(<div style={{display:"flex",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",height:42}}>{stepBtn(()=>setVal(v=>Math.max(min,+(v-step).toFixed(2))),"left")}<input type="number" value={val||""} min={min} onChange={e=>setVal(e.target.value===""?0:Math.max(min,+e.target.value))} style={{flex:1,background:C.card,border:"none",outline:"none",color:C.gold,fontFamily:F.sans,fontSize:15,fontWeight:700,textAlign:"center"}}/>{stepBtn(()=>setVal(v=>+(v+step).toFixed(2)),"right")}</div>);
  return (
    <div>
      <SectionTitle>Calculadora de Inversión</SectionTitle>
      <p style={{fontSize:13,color:C.sub,marginTop:4,marginBottom:20}}>El S&P 500 ha retornado ~10% anual históricamente.</p>
      <div style={{display:"flex",gap:8,marginBottom:24,maxWidth:260}}>
        {["USD","DOP"].map(m=>(<button key={m} onClick={()=>setMoneda(m)} style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${moneda===m?C.gold:C.border}`,background:moneda===m?C.goldBg:"none",color:moneda===m?C.gold:C.muted,fontFamily:F.sans,fontSize:13,fontWeight:600,cursor:"pointer"}}>{m==="USD"?"🇺🇸 USD":"🇩🇴 DOP"}</button>))}
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
            <div style={{fontFamily:F.sans,fontSize:10,color:C.gold,letterSpacing:2,marginBottom:6}}>VALOR FINAL EN {anos} AÑOS</div>
            <div style={{fontFamily:F.serif,fontSize:36,fontWeight:800,color:C.gold}}>{fmtM(totalFinal)}</div>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
            {[{lbl:"Inversión Total",val:fmtM(aporteTotal),color:C.text},{lbl:"Capital % del Final",val:fmtPct(aporteTotal/totalFinal*100),color:C.muted},{lbl:"Aporte Total",val:fmtM(aporte*periodos*anos),color:C.sub},{lbl:"Ganancia Total",val:fmtM(Math.max(0,interesTotal)),color:C.green},{lbl:"Ganancia Porcentual",val:fmtPct(Math.max(0,gananciaPct)),color:C.green}].map((r,i,arr)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 20px",borderBottom:i<arr.length-1?`1px solid ${C.border}20`:"none"}}><span style={{fontSize:13,color:C.muted}}>{r.lbl}</span><span style={{fontFamily:F.sans,fontSize:15,fontWeight:700,color:r.color}}>{r.val}</span></div>))}
          </div>
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"24px",marginTop:24}}>
        <Label>── Proyección de Crecimiento</Label>
        <div style={{width:"100%",height:300}}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filas} margin={{top:10,right:30,left:10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="ano" stroke={C.muted} tick={{fontFamily:F.sans,fontSize:10,fill:C.muted}}/>
              <YAxis stroke={C.muted} tick={{fontFamily:F.sans,fontSize:9,fill:C.muted}} tickFormatter={(v)=>v>=1000000?"$"+(v/1000000).toFixed(1)+"M":v>=1000?"$"+(v/1000).toFixed(0)+"K":"$"+Math.round(v)}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontFamily:F.sans,fontSize:12}} labelFormatter={v=>`Año ${v}`} formatter={(v,n)=>["$"+Math.round(v).toLocaleString(),n==="aporteAcum"?"Capital Base":n==="interesAcum"?"Ganancias Acum.":n==="ganancia"?"Ganancia Año":n]}/>
              <Legend wrapperStyle={{fontFamily:F.sans,fontSize:11,paddingTop:12}}/>
              <Bar dataKey="aporteAcum" stackId="a" fill="#1e4a7a" name="Capital Base"/>
              <Bar dataKey="interesAcum" stackId="a" fill="#2d7a4a" name="Ganancias Acum." radius={[4,4,0,0]}/>
              <Line type="monotone" dataKey="ganancia" stroke={C.gold} strokeWidth={2.5} dot={{fill:C.gold,r:3}} name="Ganancia Año"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,margin:"24px 0 12px"}}>
        <span style={{fontFamily:F.sans,fontSize:12,color:vistaTabla==="Anual"?C.gold:C.muted}}>Anual</span>
        <div onClick={()=>setVistaTabla(v=>v==="Anual"?"Mensual":"Anual")} style={{width:44,height:24,borderRadius:12,cursor:"pointer",position:"relative",background:vistaTabla==="Mensual"?C.gold:C.border,transition:"background 0.25s"}}>
          <div style={{position:"absolute",top:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.25s",left:vistaTabla==="Mensual"?23:3}}/>
        </div>
        <span style={{fontFamily:F.sans,fontSize:12,color:vistaTabla==="Mensual"?C.gold:C.muted}}>Mensual</span>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F.sans,fontSize:12,minWidth:700}}>
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

// Gráficos de TradingView.
//
// Tres cosas cambian respecto a la versión anterior:
// 1. El widget hereda el tema del sitio. Antes iba fijo en "dark" con colores
//    en hexadecimal quemados, así que en tema claro aparecía un rectángulo
//    negro en medio de la página.
// 2. Desaparece nuestra fila de intervalos. El widget ya trae su propia barra
//    con intervalos, símbolo y herramientas: duplicarla obligaba además a
//    recrear el widget entero en cada clic. El intervalo inicial se siembra
//    desde la URL y a partir de ahí lo maneja el proveedor.
// 3. El símbolo entra por ?symbol=, de modo que el ticker, la portada y la
//    tabla abren el instrumento correspondiente en vez de una pantalla vacía.
//
// Sobre la actualidad del dato: el widget muestra lo que TradingView sirva
// para cada instrumento, que en muchos casos va con retraso y así lo etiqueta
// el propio gráfico. No lo afirmamos como tiempo real desde aquí.
const INTERVALOS_VALIDOS = ["1", "5", "15", "60", "D", "W", "M"];

function TradingViewCharts({ simbolo, onSimbolo, intervalo: intervaloUrl }) {
  const { C, dark, stocks } = useOutletContext();
  // Lo unico local es el texto que se esta escribiendo; el simbolo elegido
  // vive en la URL, que es lo que se comparte y lo que abre el ticker.
  const [input, setInput] = useState(simbolo || "");
  const intervalo = INTERVALOS_VALIDOS.includes(intervaloUrl) ? intervaloUrl : "D";
  const contenedorRef = useRef(null);

  const abrir = (valor) => {
    const limpio = (valor || "").trim().toUpperCase();
    if (!limpio) return;
    setInput(limpio);
    onSimbolo(limpio);
  };

  useEffect(() => {
    if (!simbolo || !contenedorRef.current) return;
    const anfitrion = contenedorRef.current;
    anfitrion.innerHTML = "";
    const caja = document.createElement("div");
    caja.id = "tv_chart_main";
    caja.style.height = "100%";
    anfitrion.appendChild(caja);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView) return;
      new window.TradingView.widget({
        container_id: "tv_chart_main",
        symbol: simbolo,
        interval: intervalo,
        timezone: "America/New_York",
        theme: dark ? "dark" : "light",
        style: "1",
        locale: "es",
        backgroundColor: C.card,
        enable_publishing: false,
        save_image: false,
        autosize: true,
      });
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      anfitrion.innerHTML = "";
    };
  }, [simbolo, intervalo, dark, C.card]);

  return (
    <div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
        <label htmlFor="buscar-simbolo" style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>
          Símbolo del instrumento
        </label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input id="buscar-simbolo" type="search" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") abrir(input); }}
            placeholder="AAPL, TSLA, BTCUSD, GLD…"
            style={{ flex: "1 1 240px", minHeight: 48, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0 14px", color: C.text, fontFamily: F.sans, fontSize: 15 }} />
          <Boton onClick={() => abrir(input)}>Ver gráfico</Boton>
        </div>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, marginTop: 12 }}>
          Acciones, ETFs, criptomonedas y divisas. Los que seguimos a diario:
        </p>
        <ul role="list" style={{ listStyle: "none", display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {stocks.map((st) => (
            <li key={st.s}>
              <button type="button" onClick={() => abrir(st.s)}
                style={{ minHeight: 44, padding: "0 14px", borderRadius: 999, border: `1px solid ${simbolo === st.s ? C.text : C.border}`, background: simbolo === st.s ? C.text : C.card, color: simbolo === st.s ? C.bg : C.text, fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {st.s}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {simbolo ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{simbolo}</h2>
            <span style={{ fontSize: 13, color: C.sub }}>Gráfico de TradingView</span>
          </div>
          {/* Altura en pixeles explicita por breakpoint (nunca 100%): el widget
              se dimensiona con autosize dentro de este contenedor. */}
          <div ref={contenedorRef} className="tv-contenedor" />
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 14, padding: "40px 32px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Elige un instrumento</h2>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, maxWidth: "62ch" }}>
            Escribe un símbolo o toca uno de los botones de arriba para abrir su gráfico.
          </p>
        </div>
      )}

      <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, marginTop: 16, maxWidth: "72ch" }}>
        Los gráficos los provee TradingView, con sus propias fuentes de datos y condiciones de uso. Según el instrumento y el mercado, la cotización del gráfico puede ir con retraso; el propio gráfico lo indica cuando así ocurre. No coincide necesariamente con la cotización de la tabla, que viene de Finnhub.
      </p>
    </div>
  );
}

// Widget de mapa de calor de TradingView. Hereda el tema del sitio (antes
// estaba fijo en "dark", así que en tema claro aparecía un bloque negro) y su
// alto se fija por breakpoint con una clase, nunca en porcentaje.
function HeatmapWidget() {
  const { dark } = useOutletContext();
  const contenedorRef = useRef(null);

  useEffect(() => {
    const anfitrion = contenedorRef.current;
    if (!anfitrion) return;
    anfitrion.innerHTML = "";

    const caja = document.createElement("div");
    caja.className = "tradingview-widget-container__widget";
    caja.style.width = "100%";
    caja.style.height = "100%";
    anfitrion.appendChild(caja);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "es",
      symbolUrl: "",
      colorTheme: dark ? "dark" : "light",
      hasTopBar: true,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "100%",
    });
    anfitrion.appendChild(script);

    return () => { anfitrion.innerHTML = ""; };
  }, [dark]);

  return <div ref={contenedorRef} className="tradingview-widget-container heatmap-contenedor" />;
}

function HeatmapPage() {
  useDocumentMeta(
    "Mapa de calor del mercado — FinanzaDR",
    "Qué sectores del S&P 500 suben y cuáles bajan en la sesión, con la explicación de cómo se lee el mapa."
  );
  const { C, stocks } = useOutletContext();
  const conDato = stocks.filter((st) => st.c != null);

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Mapa de calor del mercado</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6, margin: "8px 0 24px", maxWidth: "68ch" }}>
        Cada rectángulo es una empresa del S&P 500, agrupada por sector. Su <strong style={{ color: C.text }}>tamaño</strong> es la capitalización de mercado —cuánto vale la empresa entera— y su <strong style={{ color: C.text }}>color</strong>, cuánto sube o baja su acción en la sesión en curso: verde arriba, rojo abajo, y más intenso cuanto mayor es el movimiento.
      </p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 8, overflow: "hidden" }}>
        <HeatmapWidget />
      </div>

      <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, marginTop: 12, maxWidth: "72ch" }}>
        Universo: índice S&P 500. Periodo: la sesión en curso, según los datos del proveedor. Mapa de TradingView, con sus propias fuentes y condiciones de uso.
      </p>

      <section aria-labelledby="alternativa" style={{ marginTop: 48 }}>
        <h2 id="alternativa" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>Alternativa en texto</h2>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginBottom: 16, maxWidth: "72ch" }}>
          El mapa es una imagen interactiva del proveedor y su detalle por empresa no se puede leer con un lector de pantalla. Como equivalente parcial, esta es la variación de los instrumentos que seguimos, que incluyen el ETF del propio S&P 500 y el del sector Utilities. No sustituye al desglose sector por sector del mapa.
        </p>
        {conDato.length === 0 ? (
          <p style={{ fontSize: 15, color: C.sub }}>No hay cotizaciones disponibles ahora mismo.</p>
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <caption className="sr-only">Variación en la sesión de los instrumentos que sigue FinanzaDR</caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "left" }}>Instrumento</th>
                    <th scope="col" style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "right" }}>Variación</th>
                  </tr>
                </thead>
                <tbody>
                  {conDato.map((st) => (
                    <tr key={st.s}>
                      <th scope="row" style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, textAlign: "left", fontWeight: 400 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{st.s}</span>
                        <span style={{ display: "block", fontSize: 14, color: C.sub }}>{st.corto} · {st.tipoActivo}</span>
                      </th>
                      <td style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, textAlign: "right", whiteSpace: "nowrap" }}>
                        <Variacion c={st.c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// Clasificación tal como la publica Alternative.me, traducida.
const CLASIFICACION_FNG_LARGA = {
  "Extreme Fear": "Miedo extremo",
  "Fear": "Miedo",
  "Neutral": "Neutral",
  "Greed": "Codicia",
  "Extreme Greed": "Codicia extrema",
};

// Sentimiento.
//
// Lo que se quitó de esta página, a propósito:
// - El bloque "CONSEJO FINANZADR", que traducía el índice a instrucciones
//   ("buen momento para acumular", "considera tomar ganancias parciales").
//   Es una recomendación de inversión en un sitio que declara no darlas.
// - El "análisis de sentimiento IA" de titulares, que era un conteo de nueve
//   palabras en inglés sobre titulares en inglés. Ni era IA, ni medía nada
//   que se pudiera defender.
// Queda un solo indicador, nombrado por lo que es y con sus límites al lado.
function SentimientoPage() {
  useDocumentMeta(
    "Miedo y codicia cripto — FinanzaDR",
    "Qué mide el índice de miedo y codicia del mercado cripto, cómo se lee y qué no se puede concluir de él."
  );
  const { C, stocks } = useOutletContext();
  const [estado, setEstado] = useState("loading");
  const [serie, setSerie] = useState([]);

  useEffect(() => {
    let cancelado = false;
    const controlador = new AbortController();
    fetch("https://api.alternative.me/fng/?limit=7", { signal: controlador.signal })
      .then((r) => r.json())
      .then((d) => {
        if (cancelado) return;
        const datos = Array.isArray(d?.data) ? d.data : [];
        if (datos.length === 0) { setEstado("error"); return; }
        setSerie(datos.map((x) => ({
          valor: Number(x.value),
          clasificacion: CLASIFICACION_FNG_LARGA[x.value_classification] || x.value_classification,
          fecha: Number(x.timestamp) * 1000,
        })));
        setEstado("listo");
      })
      .catch(() => { if (!cancelado) setEstado("error"); });
    return () => { cancelado = true; controlador.abort(); };
  }, []);

  const hoy = serie[0];
  const conDato = stocks.filter((st) => st.c != null);
  const enVerde = conDato.filter((st) => st.c > 0).length;

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Miedo y codicia cripto</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, margin: "8px 0 32px", maxWidth: "68ch" }}>
        Es un índice de 0 a 100 que publica Alternative.me y resume el ánimo del mercado de <strong style={{ color: C.text }}>criptomonedas</strong>: 0 es miedo extremo y 100, codicia extrema. Lo calcula con la volatilidad, el volumen, las redes sociales y la dominancia de Bitcoin. No mide la bolsa estadounidense.
      </p>

      {estado === "loading" && <div className="skeleton-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, height: 220 }} aria-hidden="true" />}

      {estado === "error" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px" }}>
          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6 }}>No se pudo consultar el indicador de Alternative.me en este momento.</p>
        </div>
      )}

      {estado === "listo" && (
        <>
          <section aria-labelledby="valor-hoy" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "26px 30px" }}>
            <h2 id="valor-hoy" style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>Valor de hoy</h2>
            <p style={{ fontSize: 40, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>
              {hoy.valor}<span style={{ fontSize: 20, fontWeight: 500, color: C.sub }}> / 100 · {hoy.clasificacion}</span>
            </p>
            <div aria-hidden="true" style={{ background: C.surfaceAlt, borderRadius: 999, height: 8, marginTop: 16 }}>
              <div style={{ background: C.goldText, borderRadius: 999, height: 8, width: `${Math.min(100, Math.max(0, hoy.valor))}%` }} />
            </div>
            <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginTop: 8 }}>
              <span>0 · Miedo extremo</span><span>50 · Neutral</span><span>100 · Codicia extrema</span>
            </div>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>Dato del {fmtFechaSesion(hoy.fecha)}, publicado por Alternative.me.</p>
          </section>

          <section aria-labelledby="historico" style={{ marginTop: 40 }}>
            <h2 id="historico" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 16 }}>Últimos siete días</h2>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <caption className="sr-only">Valor diario del índice de miedo y codicia cripto en los últimos siete días</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "left" }}>Día</th>
                      <th scope="col" style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "right" }}>Valor</th>
                      <th scope="col" style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "left" }}>Clasificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serie.map((d) => (
                      <tr key={d.fecha}>
                        <th scope="row" style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, textAlign: "left", fontWeight: 400, fontSize: 15, color: C.sub }}>{fmtFechaSesion(d.fecha)}</th>
                        <td style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, textAlign: "right", fontSize: 15, fontWeight: 600, color: C.text }}>{d.valor}</td>
                        <td style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, fontSize: 15, color: C.sub }}>{d.clasificacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      <section aria-labelledby="limites" style={{ marginTop: 40, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 26px" }}>
        <h2 id="limites" style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Qué no dice este indicador</h2>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "No es una señal de compra ni de venta. Un valor bajo no significa que el precio vaya a subir, ni uno alto que vaya a caer.",
            "No mide la bolsa estadounidense. Para el mercado de acciones no publicamos un índice de sentimiento equivalente.",
            "Resume el ánimo de un mercado muy volátil y puede cambiar de clasificación de un día para otro.",
          ].map((linea, i) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: 15, color: C.sub, lineHeight: 1.6 }}>
              <span aria-hidden="true" style={{ color: C.goldText }}>—</span><span>{linea}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="balance" style={{ marginTop: 40 }}>
        <h2 id="balance" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>Balance de activos seguidos</h2>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.65, maxWidth: "72ch" }}>
          Es un indicador distinto y nuestro, no un índice de sentimiento: cuenta cuántos de los instrumentos que seguimos suben en la sesión en curso.
          {conDato.length > 0
            ? ` Ahora mismo, ${enVerde} de ${conDato.length}.`
            : " Ahora mismo no hay cotizaciones disponibles para calcularlo."}
          {" "}Son ocho instrumentos, no el mercado completo.
        </p>
        <p style={{ marginTop: 12 }}>
          <Link to="/mercados" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15, fontWeight: 600, color: C.goldText, textDecoration: "underline" }}>Ver las cotizaciones</Link>
        </p>
      </section>
    </div>
  );
}

function SnapshotCard({ stocks, modo = "vivo", fecha }) {
  const { C } = useOutletContext();
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [cardTheme, setCardTheme] = useState("dark");
  // Solo entran instrumentos con precio y variacion reales: una imagen que se
  // comparte no puede llevar cifras semilla.
  const conDato = stocks.filter(s => s.p != null && s.c != null);
  const gainers = conDato.filter(s=>s.c>0).length;
  const pct = conDato.length ? Math.round(gainers/conDato.length*100) : 0;
  const sentiment = pct>=70?"ALCISTA 🟢":pct>=40?"NEUTRAL ⚪":"BAJISTA 🔴";
  const topMover = conDato.length ? [...conDato].sort((a,b)=>Math.abs(b.c)-Math.abs(a.c))[0] : null;
  const date = (fecha || new Date()).toLocaleDateString("es-DO",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const etiqueta = modo==="cierre" ? `CIERRE DEL ${date.toUpperCase()}` : "MARKET SNAPSHOT · "+date.toUpperCase();
  const generateCanvas = () => {
    const canvas=canvasRef.current; if(!canvas || !conDato.length) return;
    const ctx=canvas.getContext("2d");
    // El alto del canvas se calcula a partir de cuántas filas de activos hay
    // (cols fijo en 4) — así una tarjeta con menos activos (ej. los 4 índices
    // del Cierre, 1 fila) no deja un hueco vacío abajo como pasaría con un
    // alto fijo pensado para 8 activos (2 filas).
    const W=1080,cols=4,cellW=(W-120)/cols,startY=350;
    const rows=Math.ceil(conDato.length/cols);
    const tmY=startY+rows*160+20;
    const H=tmY+390;
    canvas.width=W; canvas.height=H;
    const isDark=cardTheme==="dark";
    const bg=isDark?"#07080f":"#f4f5f8",card=isDark?"#0d0f1e":"#ffffff",border=isDark?"#1a1e35":"#e0e4ef",gold="#c8a84b",textCol=isDark?"#dde1f5":"#1a1d2e",subCol=isDark?"#8890b5":"#555e7a",green="#00d68f",red="#ff4466";
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ctx.fillStyle=gold; ctx.fillRect(0,0,W,6);
    ctx.fillStyle=gold; ctx.font="bold 72px Georgia,serif"; ctx.fillText("FinanzaDR",60,100);
    ctx.fillStyle=subCol; ctx.font="28px 'Courier New',monospace"; ctx.fillText(etiqueta,60,145);
    ctx.fillStyle=border; ctx.fillRect(60,165,W-120,2);
    ctx.fillStyle=pct>=70?green:pct>=40?gold:red; ctx.font="bold 52px Georgia,serif"; ctx.fillText(sentiment,60,250);
    ctx.fillStyle=subCol; ctx.font="26px 'Courier New',monospace"; ctx.fillText(`${gainers} de ${conDato.length} activos seguidos en verde — ${pct}% positivo`,60,295);
    ctx.fillStyle=border; ctx.fillRect(60,320,W-120,2);
    conDato.forEach((st,i)=>{
      const col=i%cols,row=Math.floor(i/cols),x=60+col*cellW,y=startY+row*160;
      ctx.fillStyle=card;
      ctx.beginPath();ctx.moveTo(x+8+12,y);ctx.lineTo(x+cellW-8-12,y);ctx.quadraticCurveTo(x+cellW-8,y,x+cellW-8,y+12);ctx.lineTo(x+cellW-8,y+140-12);ctx.quadraticCurveTo(x+cellW-8,y+140,x+cellW-8-12,y+140);ctx.lineTo(x+8+12,y+140);ctx.quadraticCurveTo(x+8,y+140,x+8,y+140-12);ctx.lineTo(x+8,y+12);ctx.quadraticCurveTo(x+8,y,x+8+12,y);ctx.closePath();ctx.fill();
      ctx.fillStyle=st.c>=0?green:red; ctx.fillRect(x+8,y,4,140);
      ctx.fillStyle=gold; ctx.font="bold 28px 'Courier New',monospace"; ctx.fillText(st.s,x+22,y+38);
      ctx.fillStyle=subCol; ctx.font="18px 'Courier New',monospace"; const etiquetaCorta=(st.corto||st.n); ctx.fillText(etiquetaCorta.length>16?etiquetaCorta.slice(0,16)+"…":etiquetaCorta,x+22,y+65);
      ctx.fillStyle=textCol; ctx.font="bold 30px 'Courier New',monospace"; ctx.fillText(st.p>=1000?Math.round(st.p).toLocaleString():st.p.toFixed(2),x+22,y+105);
      ctx.fillStyle=st.c>=0?green:red; ctx.font="bold 22px 'Courier New',monospace"; ctx.fillText(`${st.c>=0?"▲":"▼"} ${Math.abs(st.c)}%`,x+22,y+132);
    });
    ctx.fillStyle=border; ctx.fillRect(60,tmY,W-120,2);
    ctx.fillStyle=subCol; ctx.font="26px 'Courier New',monospace"; ctx.fillText("TOP MOVER:",60,tmY+46);
    ctx.fillStyle=gold; ctx.font="bold 48px Georgia,serif"; ctx.fillText(`${topMover.s} — ${topMover.c>=0?"▲":"▼"} ${Math.abs(topMover.c)}%`,60,tmY+105);
    ctx.fillStyle=border; ctx.fillRect(60,H-90,W-120,2);
    ctx.fillStyle=gold; ctx.font="bold 32px 'Courier New',monospace"; ctx.fillText("finanzadr.com",60,H-45);
    ctx.fillStyle=subCol; ctx.font="22px 'Courier New',monospace"; ctx.textAlign="right"; ctx.fillText("Wall Street en tu idioma",W-60,H-45); ctx.textAlign="left";
  };
  useEffect(()=>{ generateCanvas(); },[stocks,cardTheme,modo,fecha]);
  const downloadImage = async () => {
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob devolvió null")), "image/png");
      });
      const fileName = `finanzadr-snapshot-${new Date().toISOString().split("T")[0]}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }

      const link = document.createElement("a");
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("[downloadImage]", error);
      alert("No se pudo guardar la imagen. Mantén presionada la imagen y selecciona 'Guardar imagen'.");
    }
  };
  const shareOnX=()=>{ const text=`📊 Market Snapshot\n\n${stocks.slice(0,4).map(s=>`${s.s}: ${s.c>=0?"▲":"▼"}${Math.abs(s.c)}%`).join(" | ")}\n\nSentimiento: ${sentiment} (${pct}%)\n\n#WallStreet #Inversiones #FinanzaDR\nfinanzadr.com`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,"_blank"); };
  const copyImage = async () => {
    const canvas = canvasRef.current;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
              if (blob) resolve(blob);
              else reject(new Error("toBlob devolvió null"));
            }, "image/png");
          })
        })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[copyImage]", error);
      downloadImage();
    }
  };
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["dark","light"].map(s=>(<button key={s} onClick={()=>setCardTheme(s)} style={{padding:"9px 20px",borderRadius:8,border:`1px solid ${cardTheme===s?C.gold:C.border}`,background:cardTheme===s?C.goldBg:"none",color:cardTheme===s?C.gold:C.muted,fontFamily:F.sans,fontSize:12,fontWeight:600,cursor:"pointer"}}>{s==="dark"?"🌙 Oscuro":"☀️ Claro"}</button>))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:20,overflow:"hidden"}}>
        {conDato.length
          ? <canvas ref={canvasRef} style={{width:"100%",height:"auto",borderRadius:8,display:"block"}}/>
          : <p style={{fontSize:14,color:C.sub,lineHeight:1.6}}>Todavía no hay cotizaciones con las que generar la imagen. Vuelve a intentarlo cuando carguen los precios.</p>}
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <button onClick={downloadImage} style={{background:C.gold,color:"#000",border:"none",padding:"13px 24px",borderRadius:8,cursor:"pointer",fontFamily:F.sans,fontSize:13,fontWeight:700}}>⬇️ Guardar Imagen</button>
        <button onClick={copyImage} style={{background:copied?C.gold:"none",color:copied?"#000":C.gold,border:`1px solid ${C.gold}`,padding:"13px 24px",borderRadius:8,cursor:"pointer",fontFamily:F.sans,fontSize:13,fontWeight:700}}>{copied?"✅ ¡Copiado!":"📋 Copiar Imagen"}</button>
        <button onClick={shareOnX} style={{background:"#000",color:"#fff",border:"1px solid #333",padding:"13px 24px",borderRadius:8,cursor:"pointer",fontFamily:F.sans,fontSize:13,fontWeight:700}}>𝕏 Compartir en X</button>
      </div>
    </div>
  );
}
