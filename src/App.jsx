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
  { tipo: "pasos", titulo: "Cómo abrir tu primera cuenta de inversión en EE.UU. siendo inmigrante", slug: "abrir-cuenta-inversion-con-itin", nivel: "Principiante", tema: "Cuentas y brokers", extracto: "No necesitas ser ciudadano ni tener SSN para invertir en Wall Street. Con un ITIN y tu pasaporte puedes abrir cuenta en varios brokers: estos son los requisitos y los plazos reales.", intro: "Uno de los mitos más grandes que detiene a los inmigrantes latinos es pensar que hay que ser ciudadano o residente legal permanente para invertir en la bolsa de EE.UU. No es cierto: no hace falta un Social Security Number (SSN), y con un ITIN (Individual Taxpayer Identification Number) y tu pasaporte hay brokers que abren cuenta. Lo que sí cambia según tu situación es qué broker te acepta y qué formulario fiscal te corresponde, porque cada entidad fija su propia política y no todas admiten los mismos perfiles. Esta guía es educativa: antes de abrir una cuenta, confirma los requisitos con el broker y, si tu caso fiscal no es sencillo, con un profesional.", pasos: [
      { titulo: "Consigue tu ITIN si no tienes SSN", texto: "Si no calificas para un SSN, solicita un ITIN con el formulario W-7 del IRS. Es un número de identificación fiscal para quien tiene una obligación tributaria en EE.UU. y no puede obtener un SSN. Puedes tramitarlo por tu cuenta o con un Acceptance Agent certificado por el IRS. Cuenta con tiempo: el propio IRS pide esperar unas 7 semanas para recibir respuesta, y de 9 a 11 semanas si solicitas entre el 15 de enero y el 30 de abril o desde el extranjero. No es un trámite de una semana." },
      { titulo: "Elige tu broker y confirma que acepta tu caso", texto: "Entre los más usados por principiantes están Robinhood y Webull, por lo simple de sus apps; Interactive Brokers es el más habitual para quien vive fuera de EE.UU. Ahora bien, cada broker decide a quién acepta y con qué documentos: antes de empezar el trámite, verifica en su propia web si admite clientes con ITIN y tu situación de residencia. Las políticas cambian con el tiempo y no todas las cuentas están disponibles en todos los países." },
      { titulo: "Prepara los documentos de identidad", texto: "Los brokers están obligados a verificar quién eres (reglas KYC, Know Your Customer). Lo habitual es que pidan pasaporte vigente y un comprobante de dirección —recibo de servicios, estado de cuenta bancario o contrato de renta—, y también el formulario fiscal que corresponda a tu estatus: W-9 si eres residente fiscal en EE.UU., W-8BEN si no lo eres. La lista exacta la fija cada entidad." },
      { titulo: "Conecta una cuenta desde la que transferir", texto: "Para depositar necesitas una cuenta bancaria que tu broker admita, normalmente en EE.UU. Hay bancos y cuentas digitales que abren cuenta con ITIN, pero la política depende de la entidad, del producto y hasta del estado, y cambia con el tiempo: pregúntalo en el banco antes de darlo por hecho, en vez de guiarte por lo que le funcionó a otra persona." },
      { titulo: "Haz tu primer depósito y compra tu primer ETF", texto: "Cuánto necesitas depende del broker: si permite comprar fracciones de acción, puedes empezar con unos pocos dólares; si no, harán falta al menos el precio de una participación completa más lo que cobre por la operación. Un ETF que siga al S&P 500, como VOO, te da exposición a 500 grandes empresas estadounidenses en una sola compra. No es una recomendación de compra: es el ejemplo más común para explicar la idea de diversificar." },
    ], cierre: "Invertir con ITIN y pasaporte es posible y legal, y no depende de tener papeles perfectos. Lo que sí toca es hacer la tarea previa: confirmar que el broker acepta tu caso, tener claro qué formulario fiscal te corresponde y contar con los plazos del IRS si todavía no tienes el ITIN.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", revisadoEn: "Septiembre 2026", fuentes: [
      { texto: "IRS — Individual Taxpayer Identification Number (requisitos, formulario W-7 y plazos de tramitación)", url: "https://www.irs.gov/individuals/individual-taxpayer-identification-number" },
    ], tags: ["inmigrantes", "ITIN", "primeros pasos"] },
  { tipo: "stats", titulo: "Qué es el S&P 500 y por qué deberías empezar ahí", slug: "que-es-el-sp-500", nivel: "Principiante", tema: "Acciones y ETFs", extracto: "500 empresas, un solo clic. Así es como los principiantes más listos empiezan a invertir en Wall Street sin tener que escoger acciones individuales.", intro: "El S&P 500 es el índice bursátil más seguido del mundo: agrupa a las 500 empresas más grandes que cotizan en Estados Unidos, desde Apple y Microsoft hasta Coca-Cola y JPMorgan. Cuando compras un ETF que sigue el S&P 500 (como VOO o SPY), en una sola compra te conviertes en dueño de una pequeña parte de las 500 compañías más importantes del país — sin tener que investigar ni elegir acciones individuales.", stats: [
      { valor: "≈10%", label: "Retorno medio anual histórico, nominal y con dividendos reinvertidos" },
      { valor: "500", label: "Grandes empresas estadounidenses en el índice" },
      { valor: "1957", label: "Año en que nació el índice tal como lo conocemos" },
    ], razones: [
      { titulo: "Diversificación automática", texto: "En vez de apostar tu dinero a una sola empresa, tu inversión se reparte entre las 500 compañías más grandes de EE.UU. Si una cae, las otras 499 amortiguan el golpe." },
      { titulo: "Casi setenta años de historial, con un promedio cercano al 10% anual", texto: "S&P Dow Jones Indices lanzó el índice de 500 empresas en marzo de 1957, sobre índices anteriores más pequeños que se remontan a los años veinte. En ese recorrido, atravesando guerras, recesiones y crisis financieras, su retorno medio anual a largo plazo ronda el 10% en términos nominales —es decir, antes de descontar la inflación— y contando los dividendos reinvertidos. Es un promedio de décadas, no lo que rinde cada año: hay años de caídas fuertes, y rendimientos pasados no garantizan rendimientos futuros." },
      { titulo: "No necesitas ser un experto", texto: "No hace falta leer balances financieros ni seguir noticias de empresas todos los días. El índice se ajusta solo: las empresas que crecen ganan más peso, y las que caen salen del índice." },
    ], cierre: "La estrategia que mejor funciona con el S&P 500 se llama dollar-cost averaging (DCA): invertir una cantidad fija cada mes, sin importar si el mercado sube o baja. Así compras más acciones cuando los precios están bajos y menos cuando están altos, sin tener que adivinar el momento perfecto — y con el tiempo, esa disciplina simple suele superar a quienes intentan predecir el mercado.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", revisadoEn: "Septiembre 2026", fuentes: [
      { texto: "S&P Dow Jones Indices — historia del S&P 500 (lanzamiento en marzo de 1957 e índices predecesores)" },
    ], tags: ["S&P 500", "ETF", "principiantes"] },
  { tipo: "tabla", titulo: "Acciones vs ETFs vs Fondos Mutuos: cuál te conviene", slug: "acciones-etfs-o-fondos-mutuos", nivel: "Principiante", tema: "Acciones y ETFs", extracto: "Los tres términos se confunden todo el tiempo, pero no son lo mismo. Aquí la diferencia explicada en una tabla, sin tecnicismos.", intro: "Es normal confundir estos tres términos cuando estás empezando: acciones individuales, ETFs y fondos mutuos son formas distintas de poner tu dinero en el mercado, cada una con sus propias reglas de juego. Entender la diferencia te ayuda a elegir la que mejor se ajusta a tu nivel de experiencia y tolerancia al riesgo.", tabla: {
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
  { tipo: "pasos", titulo: "Qué es un ETF y cómo funciona", slug: "que-es-un-etf", nivel: "Principiante", tema: "Acciones y ETFs", extracto: "Descubre qué son los ETFs, por qué son la herramienta favorita de quien empieza a invertir, y cómo comprar tu primero paso a paso.", intro: "Si alguna vez escuchaste a alguien decir \"compré SPY\" o \"invierto en QQQ\", están hablando de ETFs — probablemente la herramienta de inversión más importante para alguien que está empezando, y una de las menos explicadas en español. Un ETF (Exchange-Traded Fund, o fondo cotizado en bolsa) es una \"canasta\" que contiene muchas acciones o activos diferentes, empaquetados en un solo producto que tú compras como si fuera una sola acción. Por ejemplo, cuando compras una acción de SPY, en realidad estás comprando un pedacito de las 500 empresas más grandes de Estados Unidos al mismo tiempo.", pasos: [
      { titulo: "¿Qué es un ETF?", texto: "Un ETF (Exchange-Traded Fund, o fondo cotizado en bolsa) es una \"canasta\" que contiene muchas acciones o activos diferentes, empaquetados en un solo producto que tú compras como si fuera una sola acción. Por ejemplo, cuando compras una acción de SPY, en realidad estás comprando un pedacito de las 500 empresas más grandes de Estados Unidos al mismo tiempo." },
      { titulo: "Por qué la diversificación importa", texto: "En vez de apostar todo tu dinero a que una sola empresa le vaya bien, tu dinero se reparte entre cientos de empresas a la vez. Si una empresa le va mal, las otras pueden compensarlo. Esto reduce mucho el riesgo comparado con comprar acciones individuales, especialmente cuando estás empezando." },
      { titulo: "Tipos comunes de ETFs", texto: "De índice amplio (como SPY o VOO, que siguen el S&P 500), sectoriales (enfocados en una industria específica, como QQQ para tecnología), de bonos (como TLT, más conservador), e internacionales (que invierten fuera de Estados Unidos)." },
      { titulo: "Cómo comprar tu primer ETF", texto: "Abre una cuenta en un broker (Robinhood o Tastytrade son opciones accesibles), busca el símbolo del ETF que te interesa, decide cuánto invertir (muchos brokers permiten comprar fracciones), y compra pensando en el largo plazo, no en especular día a día." },
      { titulo: "Lo que un ETF no te garantiza", texto: "Ningún ETF está libre de riesgo — si el mercado completo baja, tu ETF también baja, porque está compuesto por ese mismo mercado. Si ya sabes qué es un ETF y quieres comparar ETFs contra acciones individuales o fondos mutuos en detalle, tenemos una guía dedicada a esa comparación." },
    ], cierre: "Los ETFs no son una fórmula mágica, pero sí una de las formas más accesibles y razonables de empezar a invertir sin necesitar ser experto en analizar empresas individuales. Con estos cinco pasos ya tienes lo esencial para dar el primer paso con confianza.", nota: "Este contenido es educativo e informativo. No constituye asesoría financiera personalizada. Considera hablar con un asesor financiero certificado antes de tomar decisiones de inversión.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["ETF", "Principiantes", "Diversificación"] },
  { tipo: "herramientas", titulo: "Cómo leer el Heat Map y el Sentimiento del Mercado", slug: "leer-mapa-de-calor-y-sentimiento", nivel: "Intermedio", tema: "Herramientas", extracto: "Dos herramientas gratis que ya tienes en FinanzaDR te dicen en segundos cómo está el mercado hoy — aquí cómo interpretarlas.", intro: "No hace falta pagar por un terminal de Bloomberg para saber cómo está el mercado hoy. En FinanzaDR ya tienes dos herramientas gratuitas, disponibles ahora mismo en el menú, que leídas juntas te dan una foto rápida y clara del estado general de Wall Street: el Heat Map y el índice de Sentimiento.", herramientas: [
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
  { tipo: "simulador", titulo: "Interés compuesto explicado con ejemplos reales", slug: "interes-compuesto", nivel: "Principiante", tema: "Largo plazo y retiro", extracto: "Einstein lo llamó la octava maravilla del mundo. Así es como $200 al mes pueden convertirse en más de un millón de dólares — o en menos de la mitad, dependiendo de cuándo empieces.", intro: "El interés compuesto es el motor detrás de casi cualquier fortuna construida a largo plazo. La idea es simple pero poderosa: no solo ganas intereses sobre tu dinero original, también ganas intereses sobre los intereses que ya generaste. Cada año, la base sobre la que creces es más grande — por eso el crecimiento se acelera con el tiempo, en vez de ser una línea recta.", ejemplo: {
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
  { tipo: "errores", titulo: "Errores comunes de principiantes al invertir (y cómo evitarlos)", slug: "errores-comunes-al-empezar", nivel: "Principiante", tema: "Primeros pasos", extracto: "El 80% de los inversores primerizos repiten los mismos 6 errores. Identifícalos antes de que te cuesten dinero.", intro: "Invertir no es solo cuestión de elegir los activos correctos — la mayoría de las pérdidas de los principiantes no vienen de una mala elección de inversión, sino de errores de comportamiento que se repiten una y otra vez. Reconocerlos es el primer paso para evitarlos.", errores: [
      { titulo: "Intentar adivinar cuándo comprar y vender (market timing)", texto: "Ni los profesionales que se dedican a esto de tiempo completo aciertan consistentemente el momento perfecto para entrar o salir del mercado. Intentarlo casi siempre te cuesta más de lo que ganas — la estrategia que funciona es invertir de forma constante, sin importar el momento." },
      { titulo: "Invertir dinero que vas a necesitar pronto", texto: "El mercado sube y baja en el corto plazo. Solo invierte el dinero que no vas a necesitar en los próximos 3 a 5 años como mínimo, para no verte obligado a vender en un mal momento." },
      { titulo: "No diversificar", texto: "Poner todo tu dinero en una sola acción, por muy sólida que parezca, es una apuesta. Ni las empresas más grandes están garantizadas — repartir tu inversión entre muchas empresas reduce el riesgo sin sacrificar el potencial de crecimiento." },
      { titulo: "Vender en pánico cuando el mercado cae", texto: "Las caídas del mercado son temporales — históricamente, siempre se ha recuperado. Vender durante una caída convierte una pérdida temporal en una pérdida permanente." },
      { titulo: "No empezar por miedo a no saber lo suficiente", texto: "Nadie empieza sabiéndolo todo. Empezar con poco dinero mientras aprendes es mucho mejor que esperar el momento en que te sientas \"listo\" — ese momento casi nunca llega, y mientras tanto pierdes años de crecimiento compuesto." },
      { titulo: "Revisar tu portafolio obsesivamente", texto: "Ver tu cuenta todos los días aumenta la ansiedad y la tentación de reaccionar a movimientos que no importan a largo plazo. Para inversiones a largo plazo, revisar tu portafolio una vez al mes es más que suficiente." },
    ], cierre: "Cometer uno de estos errores no te descalifica como inversionista — todos los grandes inversionistas empezaron sin saberlo todo. La diferencia entre quienes tienen éxito a largo plazo y quienes no está en reconocer estos patrones y corregirlos antes de que le cuesten caro a tu patrimonio.", autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["errores", "principiantes", "psicología"] },
  { tipo: "tabla", titulo: "Roth IRA vs Traditional IRA: cuál te conviene abrir", slug: "roth-ira-o-traditional-ira", nivel: "Intermedio", tema: "Largo plazo y retiro", extracto: "Las dos cuentas de retiro más comunes en Estados Unidos funcionan muy diferente en cuanto a impuestos. Aquí la diferencia explicada simple, para que elijas con más claridad.", intro: "Si trabajas en Estados Unidos y quieres ahorrar para el retiro por tu cuenta (más allá del 401k de tu trabajo, si lo tienes), un IRA (Individual Retirement Account, o cuenta de retiro individual) es una de las herramientas más accesibles. La gran pregunta es cuál abrir: Roth o Traditional — la diferencia no está en dónde inviertes tu dinero, sino en cuándo pagas impuestos sobre él.", tabla: {
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
  { tipo: "estrategia", id: "covered-call", nombre: "Covered Call", sesgo: "neutral", nivel: "básico", riesgo: { etiqueta: "Riesgo alto", nota: "Conservas íntegra la caída de la acción; la prima solo amortigua una parte, y renuncias a la subida por encima del strike." },
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
    ejemploParams: {
      precioSubyacente: 100,
      patas: [
        { instrumento: "accion", accion: "compra", precioEntrada: 100, acciones: 100 },
        { instrumento: "call", accion: "venta", strike: 110, prima: 3 },
      ],
    },
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Covered Call", "Ingreso", "Básico"],
    nota: "Este contenido es educativo e informativo. Operar opciones conlleva riesgos significativos y requiere aprobación previa de tu broker. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar opciones." },
  { tipo: "estrategia", id: "naked-put", nombre: "Naked Put (Put al Descubierto)", sesgo: "alcista", nivel: "avanzado", riesgo: { etiqueta: "Riesgo alto", nota: "Si la acción se desploma puedes acabar comprándola muy por encima de su precio de mercado. La pérdida solo está acotada porque el precio no puede bajar de cero." },
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
    ejemploParams: {
      precioSubyacente: 100,
      patas: [
        { instrumento: "put", accion: "venta", strike: 95, prima: 2.5 },
      ],
    },
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Naked Put", "Avanzado", "Riesgo Alto"],
    nota: "Este contenido es educativo e informativo. El Naked Put es una estrategia de alto riesgo que puede generar pérdidas significativas y requiere aprobación de nivel avanzado de tu broker. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
  { tipo: "estrategia", id: "put-credit-spread", nombre: "Put Credit Spread (Spread de Crédito con Puts)", sesgo: "alcista", nivel: "intermedio", riesgo: { etiqueta: "Riesgo definido", nota: "La pata comprada fija de antemano la pérdida máxima: la diferencia entre strikes menos el crédito recibido." },
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
    ejemploParams: {
      precioSubyacente: 100,
      patas: [
        { instrumento: "put", accion: "venta", strike: 95, prima: 3 },
        { instrumento: "put", accion: "compra", strike: 90, prima: 1.5 },
      ],
    },
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Credit Spread", "Intermedio", "Riesgo Limitado"],
    nota: "Este contenido es educativo e informativo. Los spreads de opciones requieren aprobación de tu broker y conllevan riesgos, aunque limitados y conocidos desde el inicio. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
  { tipo: "estrategia", id: "call-credit-spread", nombre: "Call Credit Spread (Spread de Crédito con Calls)", sesgo: "bajista", nivel: "intermedio", riesgo: { etiqueta: "Riesgo definido", nota: "La pata comprada fija de antemano la pérdida máxima: la diferencia entre strikes menos el crédito recibido." },
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
    ejemploParams: {
      precioSubyacente: 100,
      patas: [
        { instrumento: "call", accion: "venta", strike: 105, prima: 3 },
        { instrumento: "call", accion: "compra", strike: 110, prima: 1.5 },
      ],
    },
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Credit Spread", "Intermedio", "Bajista"],
    nota: "Este contenido es educativo e informativo. Los spreads de opciones requieren aprobación de tu broker y conllevan riesgos, aunque limitados y conocidos desde el inicio. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
  { tipo: "estrategia", id: "short-strangle", nombre: "Short Strangle (Estrangulamiento Vendido)", sesgo: "neutral", nivel: "avanzado", riesgo: { etiqueta: "Riesgo ilimitado", nota: "El lado de la Call no tiene tope: cuanto más suba la acción, más se pierde, sin límite." },
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
    ejemploParams: {
      precioSubyacente: 100,
      patas: [
        { instrumento: "put", accion: "venta", strike: 90, prima: 2 },
        { instrumento: "call", accion: "venta", strike: 110, prima: 2 },
      ],
    },
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Short Strangle", "Avanzado", "Riesgo Ilimitado"],
    nota: "Este contenido es educativo e informativo. El Short Strangle incluye una pata sin cobertura con riesgo teóricamente ilimitado y requiere el nivel más alto de autorización de tu broker. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
  { tipo: "estrategia", id: "iron-condor", nombre: "Iron Condor", sesgo: "neutral", nivel: "avanzado", riesgo: { etiqueta: "Riesgo definido", nota: "Los dos spreads acotan la pérdida por ambos lados, aunque montar y gestionar cuatro patas exige experiencia." },
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
    ejemplo: "Una acción cotiza a $100. Vendes una Put $90 cobrando $2.50 y compras una Put $85 pagando $1.00 (Put Credit Spread, crédito neto $150), y vendes una Call $110 cobrando $2.00 y compras una Call $115 pagando $1.00 (Call Credit Spread, crédito neto $100). Tu crédito total es $250. Tus puntos de equilibrio son $87.50 y $112.50. Si la acción cierra entre $90 y $110, te quedas con los $250 completos. Si sube a $130 o cae a $60, tu pérdida máxima sigue siendo $250 en cualquiera de los dos casos — nunca más que eso, gracias a las alas de protección.",
    riesgos: "Aunque el riesgo es limitado y conocido (a diferencia del Short Strangle), gestionar 4 contratos distintos implica más comisiones y más complejidad de seguimiento. La ganancia máxima suele ser más modesta en proporción al capital en riesgo, comparada con estrategias más simples. Requiere aprobación de nivel avanzado de tu broker, y entender bien las 4 patas antes de operar — un error al armar la posición puede desbalancear la protección que se busca.",
    ejemploParams: {
      precioSubyacente: 100,
      patas: [
        { instrumento: "put", accion: "venta", strike: 90, prima: 2.5 },
        { instrumento: "put", accion: "compra", strike: 85, prima: 1 },
        { instrumento: "call", accion: "venta", strike: 110, prima: 2 },
        { instrumento: "call", accion: "compra", strike: 115, prima: 1 },
      ],
    },
    autor: "Equipo FinanzaDR", fecha: "Julio 2026", tags: ["Opciones", "Iron Condor", "Avanzado", "Riesgo Limitado"],
    nota: "Este contenido es educativo e informativo. El Iron Condor requiere aprobación de nivel avanzado de tu broker y gestionar 4 contratos simultáneamente. No constituye asesoría financiera personalizada — considera hablar con un asesor certificado antes de operar esta estrategia." },
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
  { to: "/aprende?guia=que-es-un-etf", titulo: "Entiende qué son las acciones y los ETFs", texto: "Qué compras exactamente cuando compras un ETF, y por qué es el punto de partida más común." },
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
              <Link to={`/aprende?guia=${post.slug}`} className="tarjeta-enlace" style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px", textDecoration: "none" }}>
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

// ===========================================================================
// CONTENIDO DIARIO
// ===========================================================================
//
// Es una herramienta editorial, pero pública: la ruta está en la navegación y
// no pide contraseña, al contrario que /monitoreo. Se deja como está y se dice
// para qué sirve, en vez de cambiarle el acceso por nuestra cuenta.

// Botón de copiar con confirmación anunciada. El anterior no tenía `.catch`:
// si el navegador bloqueaba el portapapeles, el botón se quedaba mudo y el
// aviso de éxito era solo un cambio de color, que un lector de pantalla no
// anuncia.
function CopyButton({ texto, etiqueta = "Copiar" }) {
  const { C } = useOutletContext();
  const [estado, setEstado] = useState("inactivo");

  const copiar = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Portapapeles no disponible");
      await navigator.clipboard.writeText(texto);
      setEstado("copiado");
    } catch (error) {
      console.error("[CopyButton]", error);
      setEstado("error");
    }
    setTimeout(() => setEstado("inactivo"), 3000);
  };

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <button type="button" onClick={copiar}
        style={{ minHeight: 44, padding: "0 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
        {etiqueta}
      </button>
      <span role="status" style={{ fontSize: 13, color: estado === "error" ? C.red : C.sub, minHeight: 18 }}>
        {estado === "copiado" ? "Copiado" : estado === "error" ? "No se pudo copiar" : ""}
      </span>
    </span>
  );
}

const FORMATOS_CONTENIDO = [
  { clave: "tiktok", etiqueta: "TikTok / Reels" },
  { clave: "x", etiqueta: "Hilo de X" },
  { clave: "instagram", etiqueta: "Instagram" },
];

function ContenidoDiarioPage() {
  useDocumentMeta(
    "Contenido diario — FinanzaDR",
    "Guiones y textos listos para redes, generados a partir de los resúmenes de apertura y cierre."
  );
  const { C } = useOutletContext();
  const [searchParams] = useSearchParams();
  const [fuente, setFuente] = useState(searchParams.get("fuente") === "apertura" ? "apertura" : "cierre");
  const [formato, setFormato] = useState("tiktok");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  // Estado derivado, no fijado dentro del efecto.
  const estado = error ? "error" : data ? "listo" : "cargando";

  useEffect(() => {
    let cancelado = false;
    const url = fuente === "apertura" ? "/api/contenido?fuente=apertura" : "/api/contenido";
    fetch(url)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "No se pudo obtener el contenido.");
        return body;
      })
      .then((body) => {
        if (cancelado) return;
        setData({ ...body, deHoy: claveDiaMercado(body.generadoEn) === claveDiaMercado(Date.now()) });
      })
      .catch((err) => { if (!cancelado) setError(err.message); });
    return () => { cancelado = true; };
  }, [fuente, intento]);

  const cambiarFuente = (nueva) => { setFuente(nueva); setData(null); setError(null); };

  const botonEstilo = (activo) => ({
    minHeight: 44, padding: "0 18px", borderRadius: 10,
    border: `1px solid ${activo ? C.text : C.border}`,
    background: activo ? C.text : C.card, color: activo ? C.bg : C.text,
    fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: "pointer",
  });

  const bloque = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 26px" };
  const hashtags = estado === "listo" ? (data.instagram?.hashtags || []).join(" ") : "";
  const instagramCompleto = estado === "listo" ? `${data.instagram?.caption || ""}\n\n${hashtags}`.trim() : "";

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Contenido diario</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, margin: "8px 0 24px", maxWidth: "68ch" }}>
        Textos listos para redes, escritos a partir del resumen de la sesión. Cada pieza sale de la edición que se indica arriba, así que dicen lo mismo que el análisis publicado.
      </p>

      <div role="group" aria-label="Edición de origen" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {[["cierre", "Desde el cierre"], ["apertura", "Desde la apertura"]].map(([clave, texto]) => (
          <button key={clave} type="button" onClick={() => cambiarFuente(clave)} aria-pressed={fuente === clave} style={botonEstilo(fuente === clave)}>{texto}</button>
        ))}
      </div>

      {estado === "cargando" && (
        <div className="skeleton-pulse" style={{ ...bloque, height: 260 }} aria-hidden="true" />
      )}

      {estado === "error" && (
        <div style={bloque}>
          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6, maxWidth: "68ch" }}>No se pudo cargar el contenido. {error}</p>
          <div style={{ marginTop: 16 }}>
            <Boton onClick={() => { setError(null); setIntento((n) => n + 1); }} variante="secundario">Reintentar</Boton>
          </div>
        </div>
      )}

      {estado === "listo" && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <p style={{ fontSize: 15, color: C.sub }}>
              Sesión del {fmtFechaSesion(data.generadoEn)} · generado a las {fmtHoraET(data.generadoEn)} (hora de Nueva York)
            </p>
            <Link to={fuente === "apertura" ? "/apertura" : "/briefing"}
              style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15, fontWeight: 600, color: C.goldText, textDecoration: "underline" }}>
              Ver la edición completa
            </Link>
          </div>

          {!data.deHoy && (
            <p role="status" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 15, color: C.sub, lineHeight: 1.55, marginBottom: 20, maxWidth: "72ch" }}>
              Es el último contenido disponible y corresponde a otra jornada. Revisa las cifras antes de publicarlo.
            </p>
          )}

          {/* Pestañas por formato: antes los tres bloques iban apilados en una
              página larguísima que había que recorrer entera. */}
          <div role="tablist" aria-label="Formato" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0 20px" }}>
            {FORMATOS_CONTENIDO.map(({ clave, etiqueta }) => (
              <button key={clave} type="button" role="tab" id={`tab-${clave}`}
                aria-selected={formato === clave} aria-controls={`panel-${clave}`}
                onClick={() => setFormato(clave)} style={botonEstilo(formato === clave)}>
                {etiqueta}
              </button>
            ))}
          </div>

          {formato === "tiktok" && (
            <section role="tabpanel" id="panel-tiktok" aria-labelledby="tab-tiktok" style={bloque}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Guion para vídeo corto</h2>
              <p style={{ fontSize: 17, lineHeight: 1.75, color: C.text, whiteSpace: "pre-wrap", marginBottom: 20, maxWidth: "68ch" }}>{data.tiktok?.guion}</p>
              <CopyButton texto={data.tiktok?.guion || ""} etiqueta="Copiar el guion" />
            </section>
          )}

          {formato === "x" && (
            <section role="tabpanel" id="panel-x" aria-labelledby="tab-x">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Hilo, publicación a publicación</h2>
              <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {(data.hiloX || []).map((tweet, i) => (
                  <li key={i} style={{ ...bloque, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 16, lineHeight: 1.65, color: C.text, flex: "1 1 320px", margin: 0 }}>
                      <span className="sr-only">{`Publicación ${i + 1}: `}</span>{tweet}
                    </p>
                    <CopyButton texto={tweet} etiqueta={`Copiar ${i + 1}`} />
                  </li>
                ))}
              </ol>
              <div style={{ marginTop: 16 }}>
                <CopyButton texto={(data.hiloX || []).join("\n\n")} etiqueta="Copiar el hilo entero" />
              </div>
            </section>
          )}

          {formato === "instagram" && (
            <section role="tabpanel" id="panel-instagram" aria-labelledby="tab-instagram" style={bloque}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Pie de publicación</h2>
              <p style={{ fontSize: 17, lineHeight: 1.75, color: C.text, whiteSpace: "pre-wrap", marginBottom: 16, maxWidth: "68ch" }}>{data.instagram?.caption}</p>
              <ul role="list" style={{ listStyle: "none", display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {(data.instagram?.hashtags || []).map((h, i) => (
                  <li key={i} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.sub, padding: "4px 12px", borderRadius: 999, fontSize: 14 }}>{h}</li>
                ))}
              </ul>
              <CopyButton texto={instagramCompleto} etiqueta="Copiar pie y etiquetas" />
            </section>
          )}

          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 24, maxWidth: "72ch" }}>
            Estos textos los redacta un modelo de lenguaje a partir de la edición del día y se publican sin revisión previa. Antes de usarlos, comprueba que las cifras coinciden con la edición enlazada arriba.
          </p>
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

// ===========================================================================
// APRENDE
// ===========================================================================

// Temas de la biblioteca, en el orden en que tiene sentido recorrerlos.
const TEMAS_APRENDE = ["Primeros pasos", "Acciones y ETFs", "Cuentas y brokers", "Largo plazo y retiro", "Herramientas"];
const NIVELES_APRENDE = ["Principiante", "Intermedio"];

// Secuencia recomendada para quien llega sin saber por dónde empezar. Son
// índices de ARTICULOS: entender el producto, entender el índice más común,
// abrir la cuenta y, ya con dinero dentro, ver qué hace el tiempo.
const SECUENCIA_APRENDE = [3, 1, 0, 5];

// Resuelve la guía pedida por la URL. Se aceptan las dos formas: ?guia=<slug>,
// que es la que enlaza el sitio, y ?articulo=<n>, que es la que llevaban los
// enlaces anteriores y sigue funcionando.
function resolverGuia(searchParams) {
  const slug = searchParams.get("guia");
  if (slug) {
    const i = ARTICULOS.findIndex((post) => post.slug === slug);
    if (i !== -1) return i;
  }
  const n = parseInt(searchParams.get("articulo"), 10);
  if (Number.isInteger(n) && n >= 0 && n < ARTICULOS.length) return n;
  return null;
}

const enlaceGuia = (post, i) => `/aprende?guia=${post.slug || i}`;

function CuerpoGuia({ post }) {
  if (post.tipo === "stats") return <ArticuloStats post={post} />;
  if (post.tipo === "tabla") return <ArticuloTabla post={post} />;
  if (post.tipo === "herramientas") return <ArticuloHerramientas post={post} />;
  if (post.tipo === "simulador") return <ArticuloSimulador post={post} />;
  if (post.tipo === "errores") return <ArticuloErrores post={post} />;
  return <ArticuloPasos post={post} />;
}

function MetaGuia({ post, tamano = 13 }) {
  const { C } = useOutletContext();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: tamano, color: C.muted }}>
      <span style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 999, padding: "3px 10px", fontWeight: 600, color: C.sub }}>{post.nivel}</span>
      <span>{post.tema}</span>
      <span aria-hidden="true">·</span>
      <span>{tiempoLectura(post)} min de lectura</span>
    </div>
  );
}

function FichaGuia({ post, indice, paso }) {
  const { C } = useOutletContext();
  return (
    <li style={{ display: "flex" }}>
      <Link to={enlaceGuia(post, indice)} className="tarjeta-enlace"
        style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px", textDecoration: "none" }}>
        {paso && (
          <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: C.goldBg, color: C.goldText, fontSize: 14, fontWeight: 700 }}>{paso}</span>
        )}
        <MetaGuia post={post} />
        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>
          {paso ? <span className="sr-only">{`Paso ${paso}: `}</span> : null}{post.titulo}
        </h3>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{post.extracto}</p>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.goldText, marginTop: "auto", paddingTop: 6 }}>Leer la guía →</span>
      </Link>
    </li>
  );
}

function BibliotecaAprende() {
  const { C } = useOutletContext();
  const [nivel, setNivel] = useState("Todos");
  const [tema, setTema] = useState("Todos");

  const visibles = ARTICULOS
    .map((post, indice) => ({ post, indice }))
    .filter(({ post }) => (nivel === "Todos" || post.nivel === nivel) && (tema === "Todos" || post.tema === tema));

  const botonFiltro = (activo) => ({
    minHeight: 44, padding: "0 16px", borderRadius: 10,
    border: `1px solid ${activo ? C.text : C.border}`,
    background: activo ? C.text : C.card, color: activo ? C.bg : C.text,
    fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Aprende a invertir</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, margin: "8px 0 0", maxWidth: "62ch" }}>
        Guías en español, ordenadas por nivel y por tema. Cada una dice cuánto se tarda en leerla y de dónde sale lo que afirma.
      </p>

      <section aria-labelledby="secuencia" style={{ marginTop: 48 }}>
        <h2 id="secuencia" style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>Por dónde empezar</h2>
        <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6, margin: "8px 0 24px", maxWidth: "62ch" }}>
          Si es tu primera vez, este es el orden que recomendamos: entender qué compras, entender dónde lo compras y ver qué hace el tiempo con ello.
        </p>
        <ol className="portada-grid-2" style={{ listStyle: "none" }}>
          {SECUENCIA_APRENDE.map((indice, i) => {
            const post = ARTICULOS[indice];
            if (!post) return null;
            return <FichaGuia key={indice} post={post} indice={indice} paso={i + 1} />;
          })}
        </ol>
      </section>

      <section aria-labelledby="biblioteca" style={{ marginTop: 64 }}>
        <h2 id="biblioteca" style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.25, marginBottom: 20 }}>Todas las guías</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div role="group" aria-label="Filtrar por nivel" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginRight: 4 }}>Nivel</span>
            {["Todos", ...NIVELES_APRENDE].map((n) => (
              <button key={n} type="button" onClick={() => setNivel(n)} aria-pressed={nivel === n} style={botonFiltro(nivel === n)}>{n}</button>
            ))}
          </div>
          <div role="group" aria-label="Filtrar por tema" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginRight: 4 }}>Tema</span>
            {["Todos", ...TEMAS_APRENDE].map((t) => (
              <button key={t} type="button" onClick={() => setTema(t)} aria-pressed={tema === t} style={botonFiltro(tema === t)}>{t}</button>
            ))}
          </div>
        </div>

        <p role="status" style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>
          {visibles.length === ARTICULOS.length
            ? `${ARTICULOS.length} guías`
            : `${visibles.length} de ${ARTICULOS.length} guías`}
        </p>

        {visibles.length === 0 ? (
          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6 }}>No hay guías con esa combinación de nivel y tema todavía.</p>
        ) : (
          <ul role="list" className="portada-grid-3" style={{ listStyle: "none" }}>
            {visibles.map(({ post, indice }) => <FichaGuia key={indice} post={post} indice={indice} />)}
          </ul>
        )}
      </section>

      <section aria-labelledby="avanzado" style={{ marginTop: 64, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "26px 30px" }}>
        <h2 id="avanzado" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>Cuando ya domines lo básico</h2>
        <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, maxWidth: "68ch" }}>
          El Opcionario reúne estrategias de opciones explicadas paso a paso. Es contenido de <strong style={{ color: C.text }}>nivel avanzado</strong>: las opciones pueden multiplicar tanto las ganancias como las pérdidas, y algunas estrategias pueden costar mucho más de lo que se ingresa por ellas.
        </p>
        <div style={{ marginTop: 16 }}><Boton to="/opciones" variante="secundario">Ver el Opcionario</Boton></div>
      </section>
    </div>
  );
}

function LecturaGuia({ post, indice }) {
  const { C } = useOutletContext();

  const relacionadas = ARTICULOS
    .map((p, i) => ({ post: p, indice: i }))
    .filter(({ post: p, indice: i }) => i !== indice && p.tema === post.tema)
    .slice(0, 2);

  const posicionSecuencia = SECUENCIA_APRENDE.indexOf(indice);
  const siguienteIndice = posicionSecuencia !== -1 && posicionSecuencia < SECUENCIA_APRENDE.length - 1
    ? SECUENCIA_APRENDE[posicionSecuencia + 1]
    : null;
  const siguiente = siguienteIndice != null ? ARTICULOS[siguienteIndice] : null;

  return (
    <article className="fade-in">
      <Link to="/aprende" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15, fontWeight: 600, color: C.goldText, textDecoration: "none" }}>
        <span aria-hidden="true">← </span>Volver a la biblioteca
      </Link>

      <h1 style={{ fontFamily: F.serif, fontSize: 40, fontWeight: 700, color: C.text, lineHeight: 1.2, margin: "12px 0 16px", maxWidth: "20ch" }}>{post.titulo}</h1>
      <MetaGuia post={post} tamano={14} />

      <p style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>
        {post.autor} · Publicado en {post.fecha}
        {post.revisadoEn ? ` · Revisado en ${post.revisadoEn}` : ""}
      </p>

      {/* Ancho de lectura cómodo: el cuerpo de la guía no pasa de ~68ch. */}
      <div style={{ marginTop: 32, maxWidth: "68ch" }}>
        <CuerpoGuia post={post} />
      </div>

      {post.fuentes && post.fuentes.length > 0 && (
        <section aria-labelledby="fuentes" style={{ marginTop: 48, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 26px", maxWidth: "68ch" }}>
          <h2 id="fuentes" style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Fuentes</h2>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {post.fuentes.map((fuente, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 15, color: C.sub, lineHeight: 1.6 }}>
                <span aria-hidden="true" style={{ color: C.goldText }}>—</span>
                <span>
                  {fuente.url
                    ? <a href={fuente.url} target="_blank" rel="noopener noreferrer" style={{ color: C.goldText }}>{fuente.texto}<span className="sr-only"> (se abre en una pestaña nueva)</span></a>
                    : fuente.texto}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 24, maxWidth: "68ch" }}>
        Contenido educativo de FinanzaDR. No es asesoría de inversión ni una recomendación de comprar o vender ningún producto; los requisitos y las condiciones que menciona cada guía los fija cada entidad y pueden cambiar.
      </p>

      {siguiente && (
        <section aria-labelledby="siguiente" style={{ marginTop: 48 }}>
          <h2 id="siguiente" style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>Siguiente paso de la ruta</h2>
          <ul role="list" style={{ listStyle: "none" }}>
            <FichaGuia post={siguiente} indice={siguienteIndice} />
          </ul>
        </section>
      )}

      {relacionadas.length > 0 && (
        <section aria-labelledby="relacionadas" style={{ marginTop: 48 }}>
          <h2 id="relacionadas" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 16 }}>Más sobre {post.tema.toLowerCase()}</h2>
          <ul role="list" className="portada-grid-2" style={{ listStyle: "none" }}>
            {relacionadas.map(({ post: p, indice: i }) => <FichaGuia key={i} post={p} indice={i} />)}
          </ul>
        </section>
      )}
    </article>
  );
}

function AprendePage() {
  const [searchParams] = useSearchParams();
  const indice = resolverGuia(searchParams);
  const post = indice != null ? ARTICULOS[indice] : null;

  // El título y la descripción cambian con la guía abierta; sin guía, los de
  // la biblioteca. Antes la ruta abría siempre el primer artículo desplegado
  // encima del listado, lo que dejaba la biblioteca enterrada.
  useDocumentMeta(
    post ? `${post.titulo} — FinanzaDR` : "Aprende a invertir — FinanzaDR",
    post ? post.extracto : "Guías en español sobre ETFs, acciones, cuentas de retiro y primeros pasos para invertir, ordenadas por nivel y tema."
  );

  return post ? <LecturaGuia post={post} indice={indice} /> : <BibliotecaAprende />;
}

function ArticuloPasos({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:17, color:C.sub, lineHeight:1.65, marginBottom:24 }}>{post.intro}</p>
      <div style={{ display:"grid", gap:18, marginBottom:24 }}>
        {post.pasos.map((paso,i) => (
          <div key={i} style={{ display:"flex", gap:18, alignItems:"flex-start" }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:C.goldBg, border:`2px solid ${C.gold}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:F.serif, fontSize:16, fontWeight:800, color:C.gold }}>
              {String(i+1).padStart(2,"0")}
            </div>
            <div style={{ paddingTop:4 }}>
              <h3 style={{ fontSize:19, fontWeight:700, color:C.text, marginBottom:6, lineHeight:1.35 }}>{paso.titulo}</h3>
              <p style={{ fontSize:17, color:C.sub, lineHeight:1.65 }}>{paso.texto}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px" }}>
        <p style={{ fontSize:17, color:C.text, lineHeight:1.65, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
      {post.nota && <p style={{ fontSize:11, color:C.muted, lineHeight:1.6, marginTop:16 }}>{post.nota}</p>}
    </div>
  );
}

function ArticuloStats({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:17, color:C.sub, lineHeight:1.65, marginBottom:24 }}>{post.intro}</p>
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
              <p style={{ fontSize:17, color:C.sub, lineHeight:1.65 }}>{r.texto}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px" }}>
        <p style={{ fontSize:17, color:C.text, lineHeight:1.65, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
    </div>
  );
}

function ArticuloTabla({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:17, color:C.sub, lineHeight:1.65, marginBottom:24 }}>{post.intro}</p>
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
        <p style={{ fontSize:17, color:C.text, lineHeight:1.65, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
      {post.nota && <p style={{ fontSize:11, color:C.muted, lineHeight:1.6, marginTop:16 }}>{post.nota}</p>}
    </div>
  );
}

function ArticuloHerramientas({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:17, color:C.sub, lineHeight:1.65, marginBottom:24 }}>{post.intro}</p>
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
        <p style={{ fontSize:17, color:C.text, lineHeight:1.65, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
    </div>
  );
}

function ArticuloSimulador({ post }) {
  const { C } = useOutletContext();
  return (
    <div>
      <p style={{ fontSize:17, color:C.sub, lineHeight:1.65, marginBottom:24 }}>{post.intro}</p>

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
        <p style={{ fontSize:17, color:C.text, lineHeight:1.65, fontStyle:"italic" }}>{post.cierre}</p>
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
      <p style={{ fontSize:17, color:C.sub, lineHeight:1.65, marginBottom:24 }}>{post.intro}</p>
      <div style={{ display:"grid", gap:14, marginBottom:24 }}>
        {post.errores.map((err,i) => (
          <div key={i} style={{ display:"flex", gap:16, alignItems:"flex-start", background:`${C.red}12`, border:`1px solid ${C.red}30`, borderRadius:10, padding:"16px 20px" }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:`${C.red}20`, border:`1px solid ${C.red}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17 }}>⚠️</div>
            <div>
              <div style={{ fontFamily:F.sans, fontSize:13, fontWeight:700, color:C.text, marginBottom:6 }}>{i+1}. {err.titulo}</div>
              <p style={{ fontSize:17, color:C.sub, lineHeight:1.65 }}>{err.texto}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:C.goldBg, borderLeft:`3px solid ${C.gold}`, borderRadius:6, padding:"16px 20px" }}>
        <p style={{ fontSize:17, color:C.text, lineHeight:1.65, fontStyle:"italic" }}>{post.cierre}</p>
      </div>
    </div>
  );
}

// ===========================================================================
// OPCIONARIO
// ===========================================================================

const SESGOS_OPCIONES = ["alcista", "bajista", "neutral"];
const NIVELES_OPCIONES = ["básico", "intermedio", "avanzado"];

const enlaceEstrategia = (post) => `/opciones?estrategia=${post.id}`;

// Dos etiquetas distintas, a propósito: la dificultad dice cuánto cuesta
// entender la estrategia y el riesgo, cuánto puedes perder con ella. Un
// covered call es de dificultad básica y de riesgo alto; un iron condor es
// avanzado y de riesgo definido. Mezclarlas en una sola etiqueta hacía leer
// "básico" como "seguro".
function EtiquetasEstrategia({ post, tamano = 13 }) {
  const { C } = useOutletContext();
  const chip = (fondo, color, borde) => ({
    display: "inline-block", background: fondo, color, border: `1px solid ${borde}`,
    borderRadius: 999, padding: "3px 10px", fontSize: tamano, fontWeight: 600,
  });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <span style={chip(C.surfaceAlt, C.sub, C.border)}>Sesgo {post.sesgo}</span>
      <span style={chip(C.surfaceAlt, C.sub, C.border)}>Dificultad {post.nivel}</span>
      <span style={chip(C.goldBg, C.goldText, "transparent")}>{post.riesgo.etiqueta}</span>
    </div>
  );
}

function FichaEstrategia({ post }) {
  const { C } = useOutletContext();
  return (
    <li style={{ display: "flex" }}>
      <Link to={enlaceEstrategia(post)} className="tarjeta-enlace"
        style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px", textDecoration: "none" }}>
        <EtiquetasEstrategia post={post} />
        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{post.nombre}</h3>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{post.extracto}</p>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.goldText, marginTop: "auto", paddingTop: 6 }}>Ver la estrategia →</span>
      </Link>
    </li>
  );
}

function DetalleEstrategia({ post }) {
  const { C } = useOutletContext();
  const fmtDolar = (n) => (n < 0 ? "−" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
  // El diagrama se calcula aquí, a partir del ejemplo de la estrategia.
  const puntos = puntosPayoff(post.ejemploParams);

  const bloque = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 22px" };
  const titulo = { fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 };

  return (
    <article className="fade-in">
      <Link to="/opciones" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15, fontWeight: 600, color: C.goldText, textDecoration: "none" }}>
        <span aria-hidden="true">← </span>Volver al Opcionario
      </Link>

      <h1 style={{ fontFamily: F.serif, fontSize: 40, fontWeight: 700, color: C.text, lineHeight: 1.2, margin: "12px 0 16px" }}>{post.nombre}</h1>
      <EtiquetasEstrategia post={post} tamano={14} />

      <p style={{ fontSize: 18, color: C.sub, lineHeight: 1.65, margin: "24px 0 0", maxWidth: "68ch" }}>{post.queEs}</p>

      <section aria-labelledby="riesgo-estrategia" style={{ marginTop: 24, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 22px", maxWidth: "68ch" }}>
        <h2 id="riesgo-estrategia" style={titulo}>{post.riesgo.etiqueta}</h2>
        <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6 }}>{post.riesgo.nota}</p>
      </section>

      <section aria-labelledby="patas" style={{ marginTop: 40 }}>
        <h2 id="patas" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 16 }}>Las patas de la operación</h2>
        <ul role="list" style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, maxWidth: "68ch" }}>
          {post.legs.map((leg, i) => (
            <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px" }}>
              <span style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: 999, padding: "3px 12px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                {leg.accion === "compra" ? "Compra" : "Venta"} · {leg.tipo}
              </span>
              <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6 }}>{leg.nota}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="limites" style={{ marginTop: 40 }}>
        <h2 id="limites" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 16 }}>Ganancia, pérdida y equilibrio</h2>
        <div className="portada-grid-3" style={{ alignItems: "start" }}>
          <div style={bloque}>
            <h3 style={titulo}>Ganancia máxima</h3>
            <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{post.maxGanancia}</p>
          </div>
          <div style={bloque}>
            <h3 style={titulo}>Pérdida máxima</h3>
            <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{post.maxPerdida}</p>
          </div>
          <div style={bloque}>
            <h3 style={titulo}>Punto de equilibrio</h3>
            <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{post.puntoEquilibrio}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="diagrama" style={{ marginTop: 40 }}>
        <h2 id="diagrama" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>Resultado al vencimiento</h2>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginBottom: 16, maxWidth: "68ch" }}>
          Calculado con las cifras del ejemplo de más abajo. Eje horizontal: precio del subyacente al vencimiento, en dólares por acción. Eje vertical: resultado de la operación completa, en dólares, contando que cada contrato cubre 100 acciones. No incluye comisiones ni el valor de la posición antes del vencimiento.
        </p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 12px 8px" }}>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={puntos} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="precio" type="number" domain={["dataMin", "dataMax"]} stroke={C.muted}
                  tick={{ fontFamily: F.sans, fontSize: 12, fill: C.muted }} tickFormatter={(v) => "$" + v} />
                <YAxis stroke={C.muted} tick={{ fontFamily: F.sans, fontSize: 12, fill: C.muted }} tickFormatter={fmtDolar} width={70} />
                <ReferenceLine y={0} stroke={C.muted} strokeDasharray="4 4" />
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: F.sans, fontSize: 13, color: C.text }}
                  labelFormatter={(v) => `Precio al vencimiento: $${v}`}
                  formatter={(v) => [fmtDolar(v), v >= 0 ? "Ganancia" : "Pérdida"]} />
                <Line type="linear" dataKey="ganancia" stroke={C.goldText} strokeWidth={2}
                  dot={{ r: 3, fill: C.goldText, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* El gráfico es una imagen para quien puede verlo; la tabla dice lo
            mismo para quien no. Son los mismos puntos calculados. */}
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontSize: 15, fontWeight: 600, color: C.goldText }}>
            Ver el diagrama como tabla
          </summary>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginTop: 12 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <caption className="sr-only">Resultado de la estrategia al vencimiento según el precio del subyacente</caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "right" }}>Precio al vencimiento</th>
                    <th scope="col" style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "right" }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {puntos.map((punto) => (
                    <tr key={punto.precio}>
                      <th scope="row" style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, textAlign: "right", fontWeight: 400, fontSize: 15, color: C.sub }}>${punto.precio}</th>
                      <td style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, textAlign: "right", fontSize: 15, fontWeight: 600, color: punto.ganancia > 0 ? C.green : punto.ganancia < 0 ? C.red : C.sub }}>
                        {fmtDolar(punto.ganancia)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </section>

      <section aria-labelledby="cuando" style={{ marginTop: 40, maxWidth: "68ch" }}>
        <h2 id="cuando" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12 }}>Cuándo se usa</h2>
        <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.65 }}>{post.cuandoUsarla}</p>
      </section>

      <section aria-labelledby="ejemplo" style={{ marginTop: 40, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 26px", maxWidth: "68ch" }}>
        <h2 id="ejemplo" style={titulo}>Ejemplo educativo</h2>
        <p style={{ fontSize: 17, color: C.text, lineHeight: 1.65 }}>{post.ejemplo}</p>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 12 }}>
          Cifras inventadas para explicar la mecánica, no una operación recomendada ni un precio de mercado real.
        </p>
      </section>

      <section aria-labelledby="riesgos" style={{ marginTop: 40, maxWidth: "68ch" }}>
        <h2 id="riesgos" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12 }}>Riesgos</h2>
        <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.65 }}>{post.riesgos}</p>
        {post.nota && <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 12 }}>{post.nota}</p>}
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 12 }}>
          Contenido educativo de nivel avanzado. Operar opciones puede hacerte perder más de lo que ingresas por la operación, y algunas estrategias exigen garantías en la cuenta. No es asesoría de inversión.
        </p>
      </section>
    </article>
  );
}

function ListadoOpciones() {
  const { C } = useOutletContext();
  const [sesgo, setSesgo] = useState("Todos");
  const [nivel, setNivel] = useState("Todos");

  const visibles = ARTICULOS_OPCIONES.filter((post) =>
    (sesgo === "Todos" || post.sesgo === sesgo) && (nivel === "Todos" || post.nivel === nivel)
  );

  const botonFiltro = (activo) => ({
    minHeight: 44, padding: "0 16px", borderRadius: 10,
    border: `1px solid ${activo ? C.text : C.border}`,
    background: activo ? C.text : C.card, color: activo ? C.bg : C.text,
    fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: "pointer", textTransform: "none",
  });

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Opcionario</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, margin: "8px 0 0", maxWidth: "68ch" }}>
        Estrategias de opciones explicadas paso a paso, con su diagrama de resultado calculado a partir del ejemplo. Es material de <strong style={{ color: C.text }}>nivel avanzado</strong>: conviene tener claro lo básico de acciones y ETFs antes de entrar aquí.
      </p>
      <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginTop: 12, maxWidth: "68ch" }}>
        Cada estrategia lleva dos etiquetas distintas: la <strong style={{ color: C.text }}>dificultad</strong> de entenderla y el <strong style={{ color: C.text }}>riesgo</strong> de usarla. No son lo mismo — hay estrategias fáciles de entender que pueden costar mucho dinero.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "32px 0 20px" }}>
        <div role="group" aria-label="Filtrar por sesgo de mercado" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginRight: 4 }}>Sesgo</span>
          {["Todos", ...SESGOS_OPCIONES].map((s) => (
            <button key={s} type="button" onClick={() => setSesgo(s)} aria-pressed={sesgo === s} style={botonFiltro(sesgo === s)}>{s}</button>
          ))}
        </div>
        <div role="group" aria-label="Filtrar por dificultad" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginRight: 4 }}>Dificultad</span>
          {["Todos", ...NIVELES_OPCIONES].map((n) => (
            <button key={n} type="button" onClick={() => setNivel(n)} aria-pressed={nivel === n} style={botonFiltro(nivel === n)}>{n}</button>
          ))}
        </div>
      </div>

      <p role="status" style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>
        {visibles.length === ARTICULOS_OPCIONES.length
          ? `${ARTICULOS_OPCIONES.length} estrategias`
          : `${visibles.length} de ${ARTICULOS_OPCIONES.length} estrategias`}
      </p>

      {visibles.length === 0 ? (
        <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6 }}>Ninguna estrategia coincide con esos filtros todavía.</p>
      ) : (
        <ul role="list" className="portada-grid-2" style={{ listStyle: "none" }}>
          {visibles.map((post) => <FichaEstrategia key={post.id} post={post} />)}
        </ul>
      )}
    </div>
  );
}

function OpcionesPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("estrategia");
  const post = id ? ARTICULOS_OPCIONES.find((e) => e.id === id) : null;

  useDocumentMeta(
    post ? `${post.nombre} — Opcionario de FinanzaDR` : "Opcionario — FinanzaDR",
    post ? post.extracto : "Estrategias de opciones explicadas paso a paso en español, con su riesgo, su ejemplo y su diagrama de resultado."
  );

  return post ? <DetalleEstrategia post={post} /> : <ListadoOpciones />;
}


// --- Diagrama de resultado de una estrategia de opciones -------------------
// El diagrama se calcula a partir del ejemplo de cada estrategia
// (`ejemploParams`), no de una lista de puntos escrita a mano: así el gráfico
// nunca puede contradecir al texto que lo acompaña.
// Unidades: dólares por operación completa, al vencimiento y sin comisiones.
// Un contrato de opciones cubre 100 acciones.
const ACCIONES_POR_CONTRATO = 100;

function resultadoPata(pata, precioFinal) {
  const signo = pata.accion === "compra" ? 1 : -1;
  if (pata.instrumento === "accion") {
    return signo * (precioFinal - pata.precioEntrada) * (pata.acciones ?? ACCIONES_POR_CONTRATO);
  }
  const intrinseco = pata.instrumento === "call"
    ? Math.max(0, precioFinal - pata.strike)
    : Math.max(0, pata.strike - precioFinal);
  const contratos = pata.contratos ?? 1;
  return signo * (intrinseco - pata.prima) * ACCIONES_POR_CONTRATO * contratos;
}

function resultadoEstrategia(ejemplo, precioFinal) {
  return ejemplo.patas.reduce((total, pata) => total + resultadoPata(pata, precioFinal), 0);
}

// Al vencimiento el resultado es lineal a trozos y sus únicos quiebres están en
// los strikes. Basta con incluir strikes, extremos y los cruces por cero: la
// recta entre dos de esos puntos es exacta, no una aproximación.
function puntosPayoff(ejemplo) {
  const strikes = ejemplo.patas.filter((l) => l.strike != null).map((l) => l.strike);
  const referencias = [...strikes, ejemplo.precioSubyacente];
  const minimo = Math.min(...referencias);
  const maximo = Math.max(...referencias);
  // Margen relativo al precio del subyacente (30%): con margen relativo a la
  // distancia entre strikes, una estrategia de un solo strike salia con un
  // rango tan estrecho que no se veia el lado de las perdidas.
  const margen = Math.max(10, ejemplo.precioSubyacente * 0.3);
  const extremos = [Math.max(0, minimo - margen), maximo + margen];

  const clave = [...new Set([...extremos, ...strikes, ejemplo.precioSubyacente])].sort((a, b) => a - b);

  const equilibrios = [];
  for (let i = 0; i < clave.length - 1; i += 1) {
    const [x1, x2] = [clave[i], clave[i + 1]];
    const [y1, y2] = [resultadoEstrategia(ejemplo, x1), resultadoEstrategia(ejemplo, x2)];
    if ((y1 < 0 && y2 > 0) || (y1 > 0 && y2 < 0)) {
      equilibrios.push(+(x1 + ((0 - y1) * (x2 - x1)) / (y2 - y1)).toFixed(2));
    }
  }

  return [...new Set([...clave, ...equilibrios])]
    .sort((a, b) => a - b)
    .map((precio) => ({ precio, ganancia: +resultadoEstrategia(ejemplo, precio).toFixed(2) }));
}

// ===========================================================================
// BROKERS Y REMESAS
// ===========================================================================
//
// Dos catálogos separados y con criterios propios: un broker y un servicio de
// remesas no se comparan entre sí. Antes compartían rejilla y hasta el campo
// `nivel`, donde convivían "Principiante", "Avanzado" y "Remesas".
//
// Sobre los datos: cada campo comparable es `{ valor, nota }`. Con `valor` en
// null, la interfaz dice "sin verificar" y remite a la web oficial, en vez de
// rellenar el hueco con una cifra recordada. Comisiones, requisitos y países
// admitidos cambian y dependen de dónde resida cada persona: afirmarlos sin
// comprobarlos era el problema de la versión anterior ("acepta clientes de
// República Dominicana y toda Latinoamérica", "tu primer envío gratis").
//
// `urlAfiliado` es un enlace de referido: si alguien abre cuenta por ahí,
// FinanzaDR puede cobrar una comisión. Siempre se muestra junto al enlace
// oficial sin referido, y la ficha lo dice.

const PENDIENTE = { valor: null, nota: "Sin verificar por FinanzaDR. Consúltalo en su web oficial." };

const BROKERS = [
  {
    id: "robinhood",
    nombre: "Robinhood",
    queEs: "Broker estadounidense con una aplicación pensada para empezar desde el móvil.",
    perfil: "Primera cuenta, cartera sencilla de acciones y ETFs",
    disponibilidad: PENDIENTE,
    requisitos: PENDIENTE,
    tiposCuenta: PENDIENTE,
    comisiones: PENDIENTE,
    depositoMinimo: PENDIENTE,
    urlOficial: "https://robinhood.com",
    urlAfiliado: "https://join.robinhood.com/juliocr-f91f36",
    revisadoEn: null,
  },
  {
    id: "webull",
    nombre: "Webull",
    queEs: "Broker estadounidense con herramientas de gráficos más completas que la media de las apps.",
    perfil: "Quien ya se maneja y quiere analizar antes de comprar",
    disponibilidad: PENDIENTE,
    requisitos: PENDIENTE,
    tiposCuenta: PENDIENTE,
    comisiones: PENDIENTE,
    depositoMinimo: PENDIENTE,
    urlOficial: "https://www.webull.com",
    urlAfiliado: null,
    revisadoEn: null,
  },
  {
    id: "tastytrade",
    nombre: "Tastytrade",
    queEs: "Broker estadounidense orientado a derivados: opciones y futuros.",
    perfil: "Uso avanzado, con las opciones como eje",
    disponibilidad: PENDIENTE,
    requisitos: PENDIENTE,
    tiposCuenta: PENDIENTE,
    comisiones: PENDIENTE,
    depositoMinimo: PENDIENTE,
    urlOficial: "https://tastytrade.com",
    urlAfiliado: "https://open.tastytrade.com/signup/?referralCode=6TNXH2EVQ8",
    revisadoEn: null,
  },
  {
    id: "interactive-brokers",
    nombre: "Interactive Brokers",
    queEs: "Broker con presencia internacional y acceso a mercados de varios países.",
    perfil: "Residencia fuera de EE.UU. o necesidad de mercados globales",
    disponibilidad: PENDIENTE,
    requisitos: PENDIENTE,
    tiposCuenta: PENDIENTE,
    comisiones: PENDIENTE,
    depositoMinimo: PENDIENTE,
    urlOficial: "https://www.interactivebrokers.com",
    urlAfiliado: null,
    revisadoEn: null,
  },
];

const REMESAS = [
  {
    id: "wise",
    nombre: "Wise",
    queEs: "Servicio de transferencias internacionales que muestra por separado el tipo de cambio y su comisión.",
    destinos: PENDIENTE,
    coste: PENDIENTE,
    tiempo: PENDIENTE,
    condiciones: PENDIENTE,
    urlOficial: "https://wise.com",
    urlAfiliado: null,
    revisadoEn: null,
  },
  {
    id: "remitly",
    nombre: "Remitly",
    queEs: "Servicio de remesas centrado en envíos a América Latina, con entrega en efectivo o a cuenta según el destino.",
    destinos: PENDIENTE,
    coste: PENDIENTE,
    tiempo: PENDIENTE,
    condiciones: PENDIENTE,
    urlOficial: "https://www.remitly.com",
    urlAfiliado: null,
    revisadoEn: null,
  },
];

const CRITERIOS_BROKERS = [
  ["disponibilidad", "Disponibilidad geográfica"],
  ["requisitos", "Requisitos de apertura"],
  ["tiposCuenta", "Tipos de cuenta"],
  ["comisiones", "Comisiones relevantes"],
  ["depositoMinimo", "Depósito mínimo"],
];

const CRITERIOS_REMESAS = [
  ["destinos", "Destinos"],
  ["coste", "Coste del envío"],
  ["tiempo", "Tiempo estimado"],
  ["condiciones", "Condiciones"],
];

function ValorCriterio({ dato }) {
  const { C } = useOutletContext();
  if (!dato || dato.valor == null) {
    return <span style={{ color: C.muted }}>Sin verificar<span className="sr-only">. {dato?.nota || "Consúltalo en su web oficial."}</span></span>;
  }
  return <span style={{ color: C.text }}>{dato.valor}</span>;
}

// Enlace externo: dice a dónde va, se abre en otra pestaña y, cuando es de
// referido, lo declara en su propio nombre accesible.
function EnlaceExterno({ href, children, variante = "secundario", afiliado = false }) {
  const { C } = useOutletContext();
  const dominio = (() => { try { return new URL(href).hostname.replace(/^www\./, ""); } catch { return href; } })();
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    minHeight: 48, padding: "0 18px", borderRadius: 10, fontFamily: F.sans,
    fontSize: 15, fontWeight: 600, textDecoration: "none",
    border: `1px solid ${variante === "primario" ? "transparent" : C.border}`,
    background: variante === "primario" ? C.text : C.card,
    color: variante === "primario" ? C.bg : C.text,
  };
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow sponsored" style={base}>
      {children}
      <span className="sr-only">
        {` — ${dominio}, se abre en una pestaña nueva${afiliado ? ", enlace de afiliado" : ""}`}
      </span>
      <Icon name="externo" size={16} />
    </a>
  );
}

function EtiquetaAfiliado() {
  const { C } = useOutletContext();
  return (
    <span style={{ display: "inline-block", background: C.goldBg, color: C.goldText, borderRadius: 999, padding: "3px 10px", fontSize: 13, fontWeight: 600 }}>
      Enlace de afiliado
    </span>
  );
}

function EnlacesFicha({ entrada }) {
  const { C } = useOutletContext();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <EnlaceExterno href={entrada.urlOficial}>Web oficial</EnlaceExterno>
        {entrada.urlAfiliado && (
          <EnlaceExterno href={entrada.urlAfiliado} afiliado>Abrir cuenta con nuestro enlace</EnlaceExterno>
        )}
      </div>
      {entrada.urlAfiliado && (
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
          El segundo enlace es de afiliado: si abres cuenta por ahí, FinanzaDR puede cobrar una comisión, sin coste adicional para ti. El primero va a su web sin referido.
        </p>
      )}
    </div>
  );
}

function FichaComparativa({ entrada, criterios }) {
  const { C } = useOutletContext();
  return (
    <li style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <h3 style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text }}>{entrada.nombre}</h3>
        {entrada.urlAfiliado && <EtiquetaAfiliado />}
      </div>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6 }}>{entrada.queEs}</p>
      {entrada.perfil && <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginTop: 8 }}><strong style={{ color: C.text }}>Perfil de uso:</strong> {entrada.perfil}</p>}

      {/* div dentro de dl es HTML5 valido y evita necesitar React.Fragment,
          que aqui no esta importado (solo se importan los hooks). */}
      <dl style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {criterios.map(([clave, etiqueta]) => (
          <div key={clave} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <dt style={{ fontSize: 14, color: C.sub, fontWeight: 600, minWidth: 170 }}>{etiqueta}</dt>
            <dd style={{ fontSize: 14 }}><ValorCriterio dato={entrada[clave]} /></dd>
          </div>
        ))}
      </dl>

      <p style={{ fontSize: 13, color: C.muted, marginTop: 12 }}>
        {entrada.revisadoEn ? `Ficha revisada en ${entrada.revisadoEn}.` : "Ficha sin revisión de datos todavía."}
      </p>

      <div style={{ marginTop: 16 }}><EnlacesFicha entrada={entrada} /></div>
    </li>
  );
}

// Tabla comparativa para escritorio: los criterios en filas y cada plataforma
// en su columna, que es como se comparan de un vistazo.
function TablaComparativa({ entradas, criterios, titulo }) {
  const { C } = useOutletContext();
  const celda = { padding: "12px 16px", borderTop: `1px solid ${C.border}`, fontSize: 14, verticalAlign: "top" };
  return (
    <div className="mercados-tabla" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr>
              <th scope="col" style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "left" }}>Criterio</th>
              {entradas.map((entrada) => (
                <th key={entrada.id} scope="col" style={{ padding: "12px 16px", fontSize: 16, fontWeight: 700, color: C.text, textAlign: "left" }}>
                  {entrada.nombre}
                  {entrada.urlAfiliado && <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.goldText, marginTop: 4 }}>Enlace de afiliado</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" style={{ ...celda, textAlign: "left", fontWeight: 600, color: C.sub }}>Qué es</th>
              {entradas.map((entrada) => <td key={entrada.id} style={{ ...celda, color: C.sub }}>{entrada.queEs}</td>)}
            </tr>
            {criterios.map(([clave, etiqueta]) => (
              <tr key={clave}>
                <th scope="row" style={{ ...celda, textAlign: "left", fontWeight: 600, color: C.sub }}>{etiqueta}</th>
                {entradas.map((entrada) => <td key={entrada.id} style={celda}><ValorCriterio dato={entrada[clave]} /></td>)}
              </tr>
            ))}
            <tr>
              <th scope="row" style={{ ...celda, textAlign: "left", fontWeight: 600, color: C.sub }}>Revisión</th>
              {entradas.map((entrada) => (
                <td key={entrada.id} style={{ ...celda, color: C.muted }}>{entrada.revisadoEn || "Pendiente"}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" style={{ ...celda, textAlign: "left", fontWeight: 600, color: C.sub }}>Enlaces</th>
              {entradas.map((entrada) => (
                <td key={entrada.id} style={celda}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                    <a href={entrada.urlOficial} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", minHeight: 44, color: C.goldText, fontSize: 14, fontWeight: 600 }}>
                      Web oficial<span className="sr-only"> de {entrada.nombre}, se abre en una pestaña nueva</span>
                    </a>
                    {entrada.urlAfiliado && (
                      <a href={entrada.urlAfiliado} target="_blank" rel="noopener noreferrer nofollow sponsored"
                        style={{ display: "inline-flex", alignItems: "center", minHeight: 44, color: C.goldText, fontSize: 14, fontWeight: 600 }}>
                        Enlace de afiliado<span className="sr-only"> de {entrada.nombre}, se abre en una pestaña nueva</span>
                      </a>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BrokersPage() {
  useDocumentMeta(
    "Brokers y remesas — FinanzaDR",
    "Comparación de plataformas para invertir y para enviar dinero, con los criterios que usamos, la fecha de revisión y los enlaces oficiales."
  );
  const { C } = useOutletContext();

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Brokers y remesas</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, margin: "8px 0 0", maxWidth: "68ch" }}>
        Dos cosas distintas, comparadas por separado: dónde abrir una cuenta para invertir y por dónde enviar dinero. No hay ranking ni "mejor plataforma": cada perfil y cada país cambian la respuesta.
      </p>

      <section aria-labelledby="aviso-afiliados" style={{ marginTop: 24, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", maxWidth: "72ch" }}>
        <h2 id="aviso-afiliados" style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>Enlaces de afiliado</h2>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>
          Algunas fichas incluyen un enlace de afiliado, señalado como tal. Si abres cuenta a través de él, FinanzaDR puede cobrar una comisión de la plataforma, sin coste adicional para ti. Eso <strong style={{ color: C.text }}>no determina el orden de esta página</strong> ni implica recomendación, y junto a cada uno tienes el enlace oficial sin referido.
        </p>
      </section>

      <section aria-labelledby="brokers" style={{ marginTop: 56 }}>
        <h2 id="brokers" style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>Brokers para invertir</h2>
        <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6, margin: "8px 0 24px", maxWidth: "68ch" }}>
          Plataformas donde se compran acciones y ETFs. Lo que decide cuál te sirve es dónde resides, qué documentos tienes y qué vas a operar.
        </p>
        <TablaComparativa entradas={BROKERS} criterios={CRITERIOS_BROKERS} titulo="Comparación de brokers según los criterios de FinanzaDR" />
        <ul role="list" className="mercados-fichas" style={{ listStyle: "none", display: "none", flexDirection: "column", gap: 16 }}>
          {BROKERS.map((entrada) => <FichaComparativa key={entrada.id} entrada={entrada} criterios={CRITERIOS_BROKERS} />)}
        </ul>
      </section>

      <section aria-labelledby="remesas" style={{ marginTop: 64 }}>
        <h2 id="remesas" style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>Servicios de remesas</h2>
        <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6, margin: "8px 0 24px", maxWidth: "68ch" }}>
          Enviar dinero no es invertir: aquí lo que importa es cuánto llega al otro lado, en cuánto tiempo y con qué condiciones. Por eso se comparan con criterios propios y no junto a los brokers.
        </p>
        <TablaComparativa entradas={REMESAS} criterios={CRITERIOS_REMESAS} titulo="Comparación de servicios de remesas según los criterios de FinanzaDR" />
        <ul role="list" className="mercados-fichas" style={{ listStyle: "none", display: "none", flexDirection: "column", gap: 16 }}>
          {REMESAS.map((entrada) => <FichaComparativa key={entrada.id} entrada={entrada} criterios={CRITERIOS_REMESAS} />)}
        </ul>
      </section>

      <section aria-labelledby="metodologia" style={{ marginTop: 64, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "26px 30px", maxWidth: "72ch" }}>
        <h2 id="metodologia" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12 }}>Cómo comparamos</h2>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Los brokers se comparan por disponibilidad geográfica, requisitos de apertura, tipos de cuenta, comisiones relevantes, depósito mínimo y perfil de uso. Las remesas, por destinos, coste, tiempo y condiciones.",
            "Cuando un dato dice “sin verificar” es que no lo hemos comprobado en la fuente oficial. Preferimos decirlo a rellenarlo de memoria: las comisiones y los países admitidos cambian, y dependen de dónde residas.",
            "No publicamos rankings ni “el mejor broker”. Tampoco prometemos que una plataforma vaya a aceptar tu solicitud: eso lo decide cada entidad con sus propios criterios.",
            "El orden de las listas no se vende ni depende de los enlaces de afiliado.",
          ].map((linea, i) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: 15, color: C.sub, lineHeight: 1.6 }}>
              <span aria-hidden="true" style={{ color: C.goldText }}>—</span><span>{linea}</span>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 16 }}>
          ¿Ves un dato desactualizado o quieres que verifiquemos uno concreto? Escríbenos a <a href="mailto:finanzasDR.oficial@gmail.com" style={{ color: C.goldText }}>finanzasDR.oficial@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}

function CalculadoraPage() {
  useDocumentMeta(
    "Calculadora de interés compuesto — FinanzaDR",
    "Simula cómo crecería un capital con aportes periódicos: tasa, capitalización, plazo y el desglose entre lo aportado y el rendimiento."
  );
  return <CompoundCalc />;
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

// ===========================================================================
// NEWSLETTER
// ===========================================================================

const MAILERLITE_JSONP = "https://assets.mailerlite.com/jsonp/2369844/forms/188124188244968944/subscribe";

// El alta se envía por JSONP porque es lo que admite ese endpoint y, a
// diferencia de un fetch cross-origin, deja leer la respuesta del proveedor.
// La versión anterior hacía `await fetch(...)` dentro de un try con el catch
// vacío y ponía el estado en "success" fuera del catch: el visitante veía
// "¡Ya estás suscrito!" aunque la petición hubiera fallado o el alta hubiera
// sido rechazada.
function suscribirPorJsonp(email, tiempoLimiteMs = 10000) {
  return new Promise((resolve, reject) => {
    const nombreCallback = `mlCallback${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement("script");
    let resuelto = false;

    const limpiar = () => {
      delete window[nombreCallback];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    const temporizador = setTimeout(() => {
      if (resuelto) return;
      resuelto = true;
      limpiar();
      // Sin respuesta no se afirma nada: quien llama muestra "no pudimos
      // confirmar", que es distinto de éxito y distinto de error.
      reject(new Error("sin-confirmacion"));
    }, tiempoLimiteMs);

    window[nombreCallback] = (respuesta) => {
      if (resuelto) return;
      resuelto = true;
      clearTimeout(temporizador);
      limpiar();
      resolve(respuesta);
    };

    script.onerror = () => {
      if (resuelto) return;
      resuelto = true;
      clearTimeout(temporizador);
      limpiar();
      reject(new Error("red"));
    };

    const parametros = new URLSearchParams({
      callback: nombreCallback,
      "fields[email]": email,
      "ml-submit": "1",
      anticsrf: "true",
    });
    script.src = `${MAILERLITE_JSONP}?${parametros.toString()}`;
    document.body.appendChild(script);
  });
}

// Interpreta la respuesta del proveedor sin inventarse un contrato: solo se
// da por buena si viene una señal explícita de éxito.
function interpretarRespuestaAlta(respuesta) {
  if (!respuesta || typeof respuesta !== "object") return "sin-confirmar";
  if (respuesta.success === true) return "exito";

  const texto = JSON.stringify(respuesta).toLowerCase();
  if (texto.includes("already") || texto.includes("exists") || texto.includes("duplicate")) return "duplicado";
  if (respuesta.success === false || respuesta.errors) return "error";
  return "sin-confirmar";
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function NewsletterForm() {
  const { C } = useOutletContext();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("inactivo");

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!EMAIL_VALIDO.test(email.trim())) { setEstado("invalido"); return; }
    setEstado("enviando");
    try {
      const respuesta = await suscribirPorJsonp(email.trim());
      setEstado(interpretarRespuestaAlta(respuesta));
    } catch (err) {
      setEstado(err.message === "sin-confirmacion" ? "sin-confirmar" : "error");
    }
  };

  if (estado === "exito" || estado === "duplicado") {
    return (
      <div role="status" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          {estado === "exito" ? "Suscripción registrada" : "Ese correo ya estaba suscrito"}
        </h3>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>
          {estado === "exito"
            ? "Revisa tu correo: si hace falta confirmar la suscripción, el mensaje estará ahí (mira también en spam)."
            : "No hace falta que hagas nada más; seguirás recibiendo el resumen semanal."}
        </p>
      </div>
    );
  }

  const hayError = estado === "invalido" || estado === "error" || estado === "sin-confirmar";
  const mensajes = {
    invalido: "Escribe un correo con el formato nombre@dominio.com.",
    error: "No se pudo completar la suscripción. Inténtalo de nuevo en un momento.",
    "sin-confirmar": "Enviamos la solicitud pero no recibimos confirmación. Revisa tu correo en unos minutos; si no llega nada, vuelve a intentarlo.",
  };

  return (
    <form onSubmit={enviar} noValidate>
      <label htmlFor="newsletter-email" style={{ display: "block", fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>
        Tu correo electrónico
      </label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (estado !== "enviando") setEstado("inactivo"); }}
          aria-invalid={hayError || undefined}
          aria-describedby={hayError ? "newsletter-mensaje" : "newsletter-privacidad"}
          placeholder="nombre@dominio.com"
          style={{
            flex: "1 1 240px", minHeight: 48, background: C.card,
            border: `1px solid ${hayError ? C.red : C.border}`, borderRadius: 10,
            padding: "0 14px", color: C.text, fontFamily: F.sans, fontSize: 16,
          }}
        />
        <button type="submit" disabled={estado === "enviando"}
          style={{
            minHeight: 48, padding: "0 22px", borderRadius: 10, border: "1px solid transparent",
            background: C.text, color: C.bg, fontFamily: F.sans, fontSize: 15, fontWeight: 600,
            cursor: estado === "enviando" ? "progress" : "pointer",
          }}>
          {estado === "enviando" ? "Enviando…" : "Suscribirme"}
        </button>
      </div>

      {hayError && (
        <p id="newsletter-mensaje" role="alert" style={{ fontSize: 14, color: estado === "sin-confirmar" ? C.sub : C.red, lineHeight: 1.55, marginTop: 10 }}>
          {mensajes[estado]}
        </p>
      )}

      <p id="newsletter-privacidad" style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 12 }}>
        Un correo por semana. Puedes darte de baja desde el enlace que lleva cada envío. Gestionamos la lista con MailerLite y no usamos tu dirección para otra cosa; el detalle está en la <Link to="/privacidad" style={{ color: C.goldText }}>política de privacidad</Link>.
      </p>
    </form>
  );
}

function NewsletterPage() {
  useDocumentMeta(
    "Resumen semanal — FinanzaDR",
    "Un correo por semana con lo que movió al mercado y las guías nuevas, en español y sin jerga."
  );
  const { C } = useOutletContext();

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2, maxWidth: "20ch" }}>Recibe el resumen semanal</h1>
      <p style={{ fontSize: 18, color: C.sub, lineHeight: 1.65, margin: "12px 0 32px", maxWidth: "62ch" }}>
        Un solo correo por semana con lo que movió al mercado, la guía nueva si la hay y el contexto para entenderla. En español y sin jerga.
      </p>

      <div className="portada-grid-2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 32px", alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Qué te llega</h2>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Un repaso de la semana en Wall Street, con la cadena de causas y no solo las cifras.",
              "La guía nueva de la biblioteca, cuando publicamos una.",
              "Nada de recomendaciones de compra o venta: es contenido educativo.",
            ].map((linea, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 16, color: C.sub, lineHeight: 1.6 }}>
                <span aria-hidden="true" style={{ color: C.goldText }}>—</span><span>{linea}</span>
              </li>
            ))}
          </ul>
        </div>
        <div><NewsletterForm /></div>
      </div>

      <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginTop: 24, maxWidth: "68ch" }}>
        ¿Quieres ver antes de qué va? Los resúmenes diarios de <Link to="/apertura" style={{ color: C.goldText }}>apertura</Link> y <Link to="/briefing" style={{ color: C.goldText }}>cierre</Link> están publicados en el sitio; el correo semanal recoge lo esencial de esas ediciones.
      </p>
    </div>
  );
}

// CALCULADORA DE INTERÉS COMPUESTO
// ===========================================================================

const PERIODOS_POR_ANO = { Anual: 1, Semestral: 2, Trimestral: 4, Mensual: 12, Semanal: 52 };
const FRECUENCIAS_APORTE = ["Semanal", "Mensual", "Anual"];
const CAPITALIZACIONES = ["Anual", "Semestral", "Trimestral", "Mensual"];
const NOMBRE_PERIODO = { Semanal: "Semana", Mensual: "Mes", Anual: "Año" };

const mcd = (a, b) => (b === 0 ? a : mcd(b, a % b));
const mcm = (a, b) => (a * b) / mcd(a, b);

// Motor de la simulación, separado de la presentación y sin nada de React:
// entra un escenario, salen las filas y el resumen. Así se puede probar.
//
// Convenciones, que la interfaz también declara:
// - `tasaAnual` es una tasa NOMINAL anual, capitalizada tantas veces al año
//   como diga `capitalizacion`. Antes el selector de capitalización existía en
//   pantalla pero no entraba en ningún cálculo: la tasa se trataba siempre
//   como efectiva anual y el control no hacía nada.
// - Los aportes entran al FINAL de cada periodo, así que el aporte de un
//   periodo no genera intereses dentro de ese mismo periodo.
// - Cuando una fecha de capitalización coincide con una de aporte, primero se
//   acreditan los intereses y después entra el aporte.
function simularInteresCompuesto({ capitalInicial, aporte, frecuenciaAporte, tasaAnual, capitalizacion, anos }) {
  const capitalizacionesPorAno = PERIODOS_POR_ANO[capitalizacion] ?? 1;
  const aportesPorAno = PERIODOS_POR_ANO[frecuenciaAporte] ?? 12;
  const anosEnteros = Math.max(1, Math.floor(anos || 0));
  const inicial = Math.max(0, capitalInicial || 0);
  const cuota = Math.max(0, aporte || 0);
  const tasaPeriodo = (tasaAnual || 0) / 100 / capitalizacionesPorAno;

  // Rejilla común: el mínimo número de pasos por año en el que caen todas las
  // fechas de capitalización y todas las de aporte.
  const pasosPorAno = mcm(capitalizacionesPorAno, aportesPorAno);
  const cadaCapitalizacion = pasosPorAno / capitalizacionesPorAno;
  const cadaAporte = pasosPorAno / aportesPorAno;

  let saldo = inicial;
  // Base sobre la que se calculan los intereses del periodo de capitalización
  // en curso. Es el saldo con el que EMPEZÓ el periodo: si se calculara sobre
  // el saldo del momento, un aporte hecho dentro del periodo cobraría el
  // interés íntegro de ese periodo, que es justo lo que la interfaz dice que
  // no ocurre.
  let baseCapitalizacion = inicial;
  let aportadoAcum = 0;
  let interesAcum = 0;

  const filasAnuales = [];
  const filasPeriodo = [];

  let saldoInicioAno = saldo;
  let aportadoAno = 0;
  let interesAno = 0;

  let saldoInicioPeriodo = saldo;
  let aportePeriodo = 0;
  let interesPeriodo = 0;

  const totalPasos = anosEnteros * pasosPorAno;
  for (let paso = 1; paso <= totalPasos; paso += 1) {
    const toca = { capitalizar: paso % cadaCapitalizacion === 0, aportar: paso % cadaAporte === 0 };

    if (toca.capitalizar) {
      const interes = baseCapitalizacion * tasaPeriodo;
      saldo += interes;
      interesAcum += interes;
      interesAno += interes;
      interesPeriodo += interes;
    }
    if (toca.aportar) {
      saldo += cuota;
      aportadoAcum += cuota;
      aportadoAno += cuota;
      aportePeriodo += cuota;

      filasPeriodo.push({
        indice: filasPeriodo.length + 1,
        saldoInicio: saldoInicioPeriodo,
        aporte: aportePeriodo,
        interes: interesPeriodo,
        saldoFin: saldo,
        aportadoAcum,
        interesAcum,
      });
      saldoInicioPeriodo = saldo;
      aportePeriodo = 0;
      interesPeriodo = 0;
    }
    // La base del siguiente periodo se fija después de acreditar intereses y
    // de recibir el aporte: lo aportado empieza a rendir en el periodo
    // siguiente, no en el que entra.
    if (toca.capitalizar) baseCapitalizacion = saldo;
    if (paso % pasosPorAno === 0) {
      filasAnuales.push({
        ano: paso / pasosPorAno,
        saldoInicio: saldoInicioAno,
        aportadoAno,
        interesAno,
        saldoFin: saldo,
        aportadoAcum,
        interesAcum,
      });
      saldoInicioAno = saldo;
      aportadoAno = 0;
      interesAno = 0;
    }
  }

  return {
    aportesPorAno,
    tasaEfectivaAnual: (Math.pow(1 + tasaPeriodo, capitalizacionesPorAno) - 1) * 100,
    filasAnuales,
    filasPeriodo,
    resumen: {
      capitalInicial: inicial,
      aportadoTotal: aportadoAcum,
      interesTotal: interesAcum,
      valorFinal: saldo,
    },
  };
}

const FILAS_POR_PAGINA = 24;

function CompoundCalc() {
  const { C } = useOutletContext();
  const [capitalInicial, setCapitalInicial] = useState(10000);
  const [aporte, setAporte] = useState(200);
  const [tasa, setTasa] = useState(10);
  const [anos, setAnos] = useState(15);
  const [moneda, setMoneda] = useState("USD");
  const [frecuencia, setFrecuencia] = useState("Mensual");
  // Por defecto, capitalización anual: es la lectura más conservadora de la
  // tasa (10% nominal capitalizado una vez al año = 10% efectivo) y evita que
  // el escenario por defecto proyecte más de lo que proyectaba antes.
  const [capitalizacion, setCapitalizacion] = useState("Anual");
  const [vistaTabla, setVistaTabla] = useState("Anual");
  const [pagina, setPagina] = useState(0);

  const simbolo = moneda === "DOP" ? "RD$" : "US$";
  const fmtMoneda = (n) => `${simbolo} ${Math.round(n).toLocaleString("es-DO")}`;
  const fmtEjeMoneda = (v) => v >= 1e6 ? `${simbolo}${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `${simbolo}${Math.round(v / 1000)}K` : `${simbolo}${Math.round(v)}`;

  const simulacion = simularInteresCompuesto({
    capitalInicial, aporte, frecuenciaAporte: frecuencia, tasaAnual: tasa, capitalizacion, anos,
  });
  const { resumen, filasAnuales, filasPeriodo, tasaEfectivaAnual } = simulacion;

  const etiquetaFila = NOMBRE_PERIODO[frecuencia] || "Periodo";
  const filasVisibles = vistaTabla === "Anual" ? filasAnuales : filasPeriodo;
  const totalPaginas = Math.max(1, Math.ceil(filasVisibles.length / FILAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const filasPagina = filasVisibles.slice(paginaActual * FILAS_POR_PAGINA, (paginaActual + 1) * FILAS_POR_PAGINA);

  const cambiarVista = (vista) => { setVistaTabla(vista); setPagina(0); };

  // --- estilos compartidos del formulario ---
  const etiqueta = { display: "block", fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 };
  const ayuda = { fontSize: 13, color: C.sub, lineHeight: 1.5, marginTop: 6 };
  const campoSelect = {
    width: "100%", minHeight: 48, background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "0 12px", color: C.text, fontFamily: F.sans, fontSize: 15, cursor: "pointer",
  };
  const celda = { padding: "10px 14px", borderTop: `1px solid ${C.border}`, textAlign: "right", whiteSpace: "nowrap", fontSize: 14 };
  const cabecera = { padding: "10px 14px", fontSize: 13, fontWeight: 600, color: C.muted, textAlign: "right", whiteSpace: "nowrap" };

  // Campo numérico con sus dos botones de paso. Los botones llevan nombre
  // accesible: un lector de pantalla no puede anunciar "más" y "menos" a
  // secas y esperar que se entienda de qué campo son.
  const campoNumero = (id, valor, setValor, paso, nombre, minimo = 0) => (
    <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", height: 48 }}>
      <button type="button" aria-label={`Reducir ${nombre}`}
        onClick={() => setValor((v) => Math.max(minimo, +(v - paso).toFixed(2)))}
        style={{ width: 48, background: C.surfaceAlt, border: "none", color: C.text, fontSize: 20, cursor: "pointer", flexShrink: 0 }}>−</button>
      <input id={id} type="number" inputMode="decimal" value={valor} min={minimo}
        onChange={(e) => setValor(e.target.value === "" ? 0 : Math.max(minimo, +e.target.value))}
        style={{ flex: 1, minWidth: 0, background: C.card, border: "none", outline: "none", color: C.text, fontFamily: F.sans, fontSize: 16, fontWeight: 600, textAlign: "center" }} />
      <button type="button" aria-label={`Aumentar ${nombre}`}
        onClick={() => setValor((v) => +(v + paso).toFixed(2))}
        style={{ width: 48, background: C.surfaceAlt, border: "none", color: C.text, fontSize: 20, cursor: "pointer", flexShrink: 0 }}>+</button>
    </div>
  );

  const botonOpcion = (activo) => ({
    minHeight: 44, padding: "0 16px", borderRadius: 10,
    border: `1px solid ${activo ? C.text : C.border}`,
    background: activo ? C.text : C.card, color: activo ? C.bg : C.text,
    fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Calculadora de interés compuesto</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, margin: "8px 0 32px", maxWidth: "68ch" }}>
        Simula cómo crecería un capital con aportes periódicos. Es un escenario con la tasa que tú supongas, no una previsión ni una promesa de rendimiento.
      </p>

      <div className="calc-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 24, alignItems: "start" }}>

        {/* ENTRADAS */}
        <section aria-labelledby="datos-simulacion" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 26px" }}>
          <h2 id="datos-simulacion" style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Tu escenario</h2>

          <fieldset style={{ border: "none", marginBottom: 20 }}>
            <legend style={{ ...etiqueta, marginBottom: 8 }}>Moneda del escenario</legend>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["USD", "DOP"].map((m) => (
                <button key={m} type="button" onClick={() => setMoneda(m)} aria-pressed={moneda === m} style={botonOpcion(moneda === m)}>
                  {m === "USD" ? "Dólares (US$)" : "Pesos dominicanos (RD$)"}
                </button>
              ))}
            </div>
            <p style={ayuda}>
              Solo cambia la denominación: introduces y lees todas las cifras en esta moneda. <strong style={{ color: C.text }}>No se convierte</strong> nada de una moneda a otra.
            </p>
          </fieldset>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="calc-capital" style={etiqueta}>Inversión inicial ({simbolo})</label>
            {campoNumero("calc-capital", capitalInicial, setCapitalInicial, 1000, "la inversión inicial")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginBottom: 20 }}>
            <div>
              <label htmlFor="calc-aporte" style={etiqueta}>Aporte por periodo ({simbolo})</label>
              {campoNumero("calc-aporte", aporte, setAporte, 50, "el aporte")}
            </div>
            <div>
              <label htmlFor="calc-frecuencia" style={etiqueta}>Cada</label>
              <select id="calc-frecuencia" value={frecuencia} onChange={(e) => { setFrecuencia(e.target.value); setPagina(0); }} style={campoSelect}>
                {FRECUENCIAS_APORTE.map((o) => <option key={o} value={o}>{o.toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          <p style={{ ...ayuda, marginTop: -12, marginBottom: 20 }}>Los aportes entran al final de cada periodo, así que no generan intereses dentro del periodo en que se hacen.</p>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginBottom: 20 }}>
            <div>
              <label htmlFor="calc-tasa" style={etiqueta}>Tasa anual supuesta (%)</label>
              {campoNumero("calc-tasa", tasa, setTasa, 0.5, "la tasa anual")}
            </div>
            <div>
              <label htmlFor="calc-capitalizacion" style={etiqueta}>Capitalización</label>
              <select id="calc-capitalizacion" value={capitalizacion} onChange={(e) => setCapitalizacion(e.target.value)} style={campoSelect}>
                {CAPITALIZACIONES.map((o) => <option key={o} value={o}>{o.toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          <p style={{ ...ayuda, marginTop: -12, marginBottom: 20 }}>
            La tasa se interpreta como nominal anual, capitalizada {capitalizacion.toLowerCase()}: equivale a una tasa efectiva del <strong style={{ color: C.text }}>{tasaEfectivaAnual.toFixed(2)}% anual</strong>.
          </p>

          <div>
            <label htmlFor="calc-anos" style={etiqueta}>Plazo (años)</label>
            {campoNumero("calc-anos", anos, setAnos, 1, "el plazo en años", 1)}
            {anos < 1 && <p style={{ ...ayuda, color: C.red }}>El plazo mínimo es un año; se simula con un año.</p>}
          </div>
        </section>

        {/* RESULTADOS */}
        <section aria-labelledby="resultado" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 id="resultado" className="sr-only">Resultado de la simulación</h2>

          <div role="status" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 26px" }}>
            <p style={{ fontSize: 14, color: C.sub, marginBottom: 6 }}>Valor simulado a {Math.max(1, Math.floor(anos || 1))} años</p>
            <p style={{ fontFamily: F.serif, fontSize: 40, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>{fmtMoneda(resumen.valorFinal)}</p>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginTop: 10 }}>
              Simulación, no una previsión: supone una tasa constante del {(+tasa || 0).toFixed(2)}% nominal anual todos los años, algo que ningún mercado hace.
            </p>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <caption className="sr-only">Desglose del valor final simulado</caption>
              <tbody>
                {[
                  ["Capital inicial", resumen.capitalInicial, C.text],
                  ["Aportaciones acumuladas", resumen.aportadoTotal, C.text],
                  ["Rendimiento estimado", resumen.interesTotal, C.green],
                  ["Valor final", resumen.valorFinal, C.text],
                ].map(([nombre, valor, color], i) => (
                  <tr key={nombre}>
                    <th scope="row" style={{ padding: "13px 20px", textAlign: "left", fontSize: 14, fontWeight: i === 3 ? 700 : 400, color: i === 3 ? C.text : C.sub, borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>{nombre}</th>
                    <td style={{ padding: "13px 20px", textAlign: "right", fontSize: 15, fontWeight: i === 3 ? 700 : 600, color, borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>{fmtMoneda(valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Qué supone este cálculo</h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                `Tasa del ${(+tasa || 0).toFixed(2)}% nominal anual, capitalizada ${capitalizacion.toLowerCase()} (${tasaEfectivaAnual.toFixed(2)}% efectivo anual), constante durante todo el plazo.`,
                `Aportes de ${fmtMoneda(aporte)} al final de cada periodo ${frecuencia.toLowerCase()}.`,
                "No descuenta inflación, impuestos, comisiones ni pérdidas: en el mercado real, ninguno de los tres es cero.",
              ].map((linea, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: C.sub, lineHeight: 1.55 }}>
                  <span aria-hidden="true" style={{ color: C.goldText }}>—</span><span>{linea}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* GRÁFICO */}
      <section aria-labelledby="proyeccion" style={{ marginTop: 40 }}>
        <h2 id="proyeccion" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>Cómo se reparte el resultado</h2>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginBottom: 16, maxWidth: "68ch" }}>
          Cada barra es el saldo al cierre de ese año, separando lo que has puesto tú de lo que aporta el rendimiento. Importes en {moneda === "DOP" ? "pesos dominicanos" : "dólares"}.
        </p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 12px 8px" }}>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filasAnuales} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="ano" stroke={C.muted} tick={{ fontFamily: F.sans, fontSize: 12, fill: C.muted }} />
                <YAxis stroke={C.muted} tick={{ fontFamily: F.sans, fontSize: 12, fill: C.muted }} tickFormatter={fmtEjeMoneda} width={80} />
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: F.sans, fontSize: 13, color: C.text }}
                  labelFormatter={(v) => `Año ${v}`}
                  formatter={(v, n) => [fmtMoneda(v), n]} />
                <Legend wrapperStyle={{ fontFamily: F.sans, fontSize: 13, paddingTop: 12 }} />
                <Bar dataKey="aportadoAcum" stackId="saldo" fill={C.sub} name="Capital aportado" />
                <Bar dataKey="interesAcum" stackId="saldo" fill={C.green} name="Rendimiento" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 10 }}>
          El capital aportado incluye la inversión inicial. Las dos barras suman el saldo de cada año, el mismo que aparece en la tabla.
        </p>
      </section>

      {/* TABLA */}
      <section aria-labelledby="detalle" style={{ marginTop: 40 }}>
        <h2 id="detalle" style={{ fontFamily: F.serif, fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 16 }}>Detalle periodo a periodo</h2>

        <div role="group" aria-label="Detalle de la tabla" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {[["Anual", "Por año"], ["Periodo", `Por ${etiquetaFila.toLowerCase()}`]].map(([clave, texto]) => (
            <button key={clave} type="button" onClick={() => cambiarVista(clave)} aria-pressed={vistaTabla === clave} style={botonOpcion(vistaTabla === clave)}>{texto}</button>
          ))}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <caption className="sr-only">
                Evolución del saldo simulado {vistaTabla === "Anual" ? "año a año" : `por ${etiquetaFila.toLowerCase()}`}, en {moneda === "DOP" ? "pesos dominicanos" : "dólares"}
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={{ ...cabecera, textAlign: "left" }}>{vistaTabla === "Anual" ? "Año" : etiquetaFila}</th>
                  <th scope="col" style={cabecera}>Saldo inicial</th>
                  <th scope="col" style={cabecera}>Aportado</th>
                  <th scope="col" style={cabecera}>Rendimiento</th>
                  <th scope="col" style={cabecera}>Saldo final</th>
                </tr>
              </thead>
              <tbody>
                {filasPagina.map((fila) => {
                  const clave = vistaTabla === "Anual" ? fila.ano : fila.indice;
                  return (
                    <tr key={clave}>
                      <th scope="row" style={{ ...celda, textAlign: "left", fontWeight: 600, color: C.text }}>
                        {vistaTabla === "Anual" ? `Año ${fila.ano}` : `${etiquetaFila} ${fila.indice}`}
                      </th>
                      <td style={{ ...celda, color: C.sub }}>{fmtMoneda(fila.saldoInicio)}</td>
                      <td style={{ ...celda, color: C.sub }}>{fmtMoneda(vistaTabla === "Anual" ? fila.aportadoAno : fila.aporte)}</td>
                      <td style={{ ...celda, color: C.green }}>{fmtMoneda(vistaTabla === "Anual" ? fila.interesAno : fila.interes)}</td>
                      <td style={{ ...celda, color: C.text, fontWeight: 600 }}>{fmtMoneda(fila.saldoFin)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "12px 16px", borderTop: `1px solid ${C.border}`, background: C.surfaceAlt }}>
              <p role="status" style={{ fontSize: 14, color: C.sub }}>
                Filas {paginaActual * FILAS_POR_PAGINA + 1}–{Math.min((paginaActual + 1) * FILAS_POR_PAGINA, filasVisibles.length)} de {filasVisibles.length}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setPagina((n) => Math.max(0, n - 1))} disabled={paginaActual === 0}
                  style={{ ...botonOpcion(false), opacity: paginaActual === 0 ? 0.5 : 1, cursor: paginaActual === 0 ? "not-allowed" : "pointer" }}>Anterior</button>
                <button type="button" onClick={() => setPagina((n) => Math.min(totalPaginas - 1, n + 1))} disabled={paginaActual >= totalPaginas - 1}
                  style={{ ...botonOpcion(false), opacity: paginaActual >= totalPaginas - 1 ? 0.5 : 1, cursor: paginaActual >= totalPaginas - 1 ? "not-allowed" : "pointer" }}>Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </section>
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

// ===========================================================================
// RESUMEN PARA COMPARTIR
// ===========================================================================
//
// La imagen se dibuja con la tipografía y los tokens del sitio (antes iba en
// Courier New y Georgia, con su propia paleta en hexadecimal), y nombra cada
// instrumento por lo que es: la versión anterior rotulaba "S&P 500" encima del
// precio de SPY, el mismo error que ya se corrigió en el resto del sitio.
// También lleva fuente, fecha de sesión y hora de consulta, y distingue una
// cotización en curso de la captura de un cierre.

function SnapshotCard({ stocks, modo = "vivo", fecha }) {
  const { C, dark, lastUpdate } = useOutletContext();
  const canvasRef = useRef(null);
  const [accion, setAccion] = useState({ tipo: null, mensaje: "" });
  const [temaTarjeta, setTemaTarjeta] = useState(dark ? "oscuro" : "claro");

  // Solo entran instrumentos con precio y variación reales: una imagen que se
  // comparte no puede llevar cifras semilla.
  const conDato = stocks.filter((s) => s.p != null && s.c != null);
  const enVerde = conDato.filter((s) => s.c > 0).length;
  // Momento retratado, como número: en modo cierre, cuándo se publicó esa
  // edición; en vivo, cuándo consultamos los precios.
  const momentoMs = fecha ? fecha.getTime() : (lastUpdate ? Date.parse(lastUpdate) : null);
  // Clave estable del contenido dibujado. Las dependencias del efecto tienen
  // que ser primitivas: con el array de instrumentos, que se crea nuevo en
  // cada render, el canvas se redibujaría en bucle.
  const claveDatos = conDato.map((s) => `${s.s}:${s.p}:${s.c}`).join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || conDato.length === 0) return;
    let cancelado = false;

    const dibujar = () => {
      if (cancelado) return;
      const ctx = canvas.getContext("2d");
      const oscuro = temaTarjeta === "oscuro";
      const paleta = oscuro ? DARK : LIGHT;

      const ANCHO = 1080;
      const columnas = 2;
      const margen = 64;
      const anchoFicha = (ANCHO - margen * 2 - 24) / columnas;
      const altoFicha = 132;
      const inicioFichas = 330;
      const filas = Math.ceil(conDato.length / columnas);
      const alto = inicioFichas + filas * (altoFicha + 16) + 190;

      canvas.width = ANCHO;
      canvas.height = alto;

      ctx.fillStyle = paleta.bg;
      ctx.fillRect(0, 0, ANCHO, alto);
      ctx.fillStyle = paleta.gold;
      ctx.fillRect(0, 0, ANCHO, 8);

      // Marca
      ctx.fillStyle = paleta.text;
      ctx.font = "700 60px 'Source Serif 4', Georgia, serif";
      ctx.fillText("FinanzaDR", margen, 108);
      ctx.fillStyle = paleta.sub;
      ctx.font = "500 26px Inter, system-ui, sans-serif";
      ctx.fillText("Wall Street en tu idioma", margen, 146);

      // Identidad de la captura: qué periodo es y de cuándo
      const fechaTexto = momentoMs != null
        ? new Intl.DateTimeFormat("es-DO", { timeZone: TZ_MERCADO, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(momentoMs)
        : "";
      ctx.fillStyle = paleta.text;
      ctx.font = "600 30px Inter, system-ui, sans-serif";
      ctx.fillText(modo === "cierre" ? `Cierre de la sesión del ${fechaTexto}` : `Cotizaciones en curso${fechaTexto ? ` · ${fechaTexto}` : ""}`, margen, 208);

      ctx.fillStyle = paleta.sub;
      ctx.font = "400 24px Inter, system-ui, sans-serif";
      ctx.fillText(`${enVerde} de ${conDato.length} activos seguidos en positivo`, margen, 248);

      ctx.strokeStyle = paleta.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margen, 284);
      ctx.lineTo(ANCHO - margen, 284);
      ctx.stroke();

      conDato.forEach((instrumento, i) => {
        const columna = i % columnas;
        const fila = Math.floor(i / columnas);
        const x = margen + columna * (anchoFicha + 24);
        const y = inicioFichas + fila * (altoFicha + 16);
        const positivo = instrumento.c >= 0;

        ctx.fillStyle = paleta.card;
        ctx.beginPath();
        ctx.roundRect(x, y, anchoFicha, altoFicha, 14);
        ctx.fill();
        ctx.strokeStyle = paleta.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = paleta.text;
        ctx.font = "700 30px Inter, system-ui, sans-serif";
        ctx.fillText(instrumento.s, x + 20, y + 44);

        ctx.fillStyle = paleta.muted;
        ctx.font = "400 20px Inter, system-ui, sans-serif";
        const descripcion = `${instrumento.corto || instrumento.n} · ${instrumento.tipoActivo || ""}`.replace(/ · $/, "");
        ctx.fillText(descripcion.length > 34 ? `${descripcion.slice(0, 33)}…` : descripcion, x + 20, y + 74);

        ctx.fillStyle = paleta.text;
        ctx.font = "600 32px Inter, system-ui, sans-serif";
        const precio = instrumento.p >= 1000
          ? instrumento.p.toLocaleString("en-US", { maximumFractionDigits: 0 })
          : instrumento.p.toFixed(2);
        ctx.fillText(`${precio} ${instrumento.moneda || "USD"}`, x + 20, y + 112);

        ctx.fillStyle = positivo ? paleta.green : paleta.red;
        ctx.font = "700 26px Inter, system-ui, sans-serif";
        const variacion = `${positivo ? "▲" : "▼"} ${positivo ? "+" : "−"}${Math.abs(instrumento.c).toFixed(2)}%`;
        ctx.textAlign = "right";
        ctx.fillText(variacion, x + anchoFicha - 20, y + 112);
        ctx.textAlign = "left";
      });

      // Pie: fuente, hora del dato y advertencia
      const pieY = alto - 120;
      ctx.strokeStyle = paleta.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margen, pieY);
      ctx.lineTo(ANCHO - margen, pieY);
      ctx.stroke();

      ctx.fillStyle = paleta.sub;
      ctx.font = "400 22px Inter, system-ui, sans-serif";
      ctx.fillText(
        momentoMs == null
          ? "Datos de Finnhub"
          : modo === "cierre"
            ? `Datos de Finnhub · cierre publicado a las ${fmtHoraET(momentoMs)} (hora de Nueva York)`
            : `Datos de Finnhub · consultados a las ${fmtHoraET(momentoMs)} (hora de Nueva York)`,
        margen, pieY + 40
      );
      ctx.fillStyle = paleta.muted;
      ctx.font = "400 20px Inter, system-ui, sans-serif";
      ctx.fillText("Los ETFs siguen a un índice: su precio no es el nivel del índice. Contenido educativo.", margen, pieY + 72);

      ctx.fillStyle = paleta.text;
      ctx.font = "700 24px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("finanzadr.com", ANCHO - margen, pieY + 72);
      ctx.textAlign = "left";
    };

    // Las fuentes del sitio se cargan por CSS: dibujar antes de que estén
    // listas deja la imagen en la tipografía de reserva.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(dibujar);
    } else {
      dibujar();
    }
    return () => { cancelado = true; };
  // Dependencias primitivas a proposito (ver claveDatos).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveDatos, temaTarjeta, modo, momentoMs, enVerde]);

  const anunciar = (tipo, mensaje) => {
    setAccion({ tipo, mensaje });
    setTimeout(() => setAccion({ tipo: null, mensaje: "" }), 4000);
  };

  const obtenerBlob = () => new Promise((resolve, reject) => {
    const canvas = canvasRef.current;
    if (!canvas) { reject(new Error("No hay imagen que exportar.")); return; }
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("El navegador no pudo generar la imagen.")), "image/png");
  });

  const descargar = async () => {
    try {
      const blob = await obtenerBlob();
      const nombre = `finanzadr-${modo}-${claveDiaMercado(momentoMs ?? Date.now())}.png`;
      const archivo = new File([blob], nombre, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo] });
        anunciar("ok", "Imagen enviada al menú de compartir.");
        return;
      }

      const enlace = document.createElement("a");
      enlace.download = nombre;
      enlace.href = URL.createObjectURL(blob);
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(enlace.href);
      anunciar("ok", `Imagen descargada como ${nombre}.`);
    } catch (error) {
      console.error("[descargar]", error);
      anunciar("error", "No se pudo descargar. Mantén pulsada la imagen y elige “Guardar imagen”.");
    }
  };

  const copiar = async () => {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error("Portapapeles no disponible");
      const blob = await obtenerBlob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      anunciar("ok", "Imagen copiada al portapapeles.");
    } catch (error) {
      console.error("[copiar]", error);
      anunciar("error", "Tu navegador no permite copiar imágenes. Usa “Descargar imagen”.");
    }
  };

  const botonEstilo = (primario) => ({
    minHeight: 48, padding: "0 20px", borderRadius: 10,
    border: `1px solid ${primario ? "transparent" : C.border}`,
    background: primario ? C.text : C.card, color: primario ? C.bg : C.text,
    fontFamily: F.sans, fontSize: 15, fontWeight: 600, cursor: "pointer",
  });

  if (conDato.length === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px" }}>
        <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6 }}>
          Todavía no hay cotizaciones con las que generar la imagen. Vuelve a intentarlo cuando carguen los precios.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div role="group" aria-label="Tema de la imagen" style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["claro", "Tema claro"], ["oscuro", "Tema oscuro"]].map(([clave, texto]) => (
          <button key={clave} type="button" onClick={() => setTemaTarjeta(clave)} aria-pressed={temaTarjeta === clave} style={botonEstilo(temaTarjeta === clave)}>
            {texto}
          </button>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: 10, display: "block" }}
          aria-label={`Imagen del ${modo === "cierre" ? "cierre" : "mercado en curso"} con ${conDato.length} instrumentos, ${enVerde} en positivo`} />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={descargar} style={botonEstilo(true)}>Descargar imagen</button>
        <button type="button" onClick={copiar} style={botonEstilo(false)}>Copiar imagen</button>
      </div>

      <p role="status" style={{ minHeight: 24, marginTop: 12, fontSize: 14, lineHeight: 1.55, color: accion.tipo === "error" ? C.red : C.sub }}>
        {accion.mensaje}
      </p>
    </div>
  );
}

function CompartirPage() {
  useDocumentMeta(
    "Resumen para compartir — FinanzaDR",
    "Genera una imagen con las cotizaciones del momento o con el cierre de la sesión, lista para compartir."
  );
  const { stocks, C } = useOutletContext();
  const [searchParams] = useSearchParams();
  const [vista, setVista] = useState(searchParams.get("vista") === "cierre" ? "cierre" : "vivo");
  const [cierreStocks, setCierreStocks] = useState(null);
  const [cierreFecha, setCierreFecha] = useState(null);
  const [errorCierre, setErrorCierre] = useState(null);
  const estadoCierre = errorCierre ? "error" : cierreStocks ? "listo" : "loading";

  useEffect(() => {
    if (vista !== "cierre") return;
    let cancelado = false;
    fetch("/api/briefing")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "No se pudo obtener el cierre del mercado.");
        return body;
      })
      .then((body) => {
        if (cancelado) return;
        const instrumentos = (body.precios || [])
          .filter((p) => p.precio != null && p.cambioPct != null)
          .map((p) => ({
            s: p.simbolo, n: p.nombre, corto: p.corto || p.nombre,
            tipoActivo: p.tipoActivo || "", moneda: p.moneda || "USD",
            p: p.precio, c: p.cambioPct,
          }));
        if (instrumentos.length === 0) throw new Error("El cierre guardado no trae cotizaciones.");
        setCierreStocks(instrumentos);
        setCierreFecha(new Date(body.generadoEn));
      })
      .catch((err) => { if (!cancelado) setErrorCierre(err.message); });
    return () => { cancelado = true; };
  }, [vista]);

  const botonEstilo = (activo) => ({
    minHeight: 44, padding: "0 18px", borderRadius: 10,
    border: `1px solid ${activo ? C.text : C.border}`,
    background: activo ? C.text : C.card, color: activo ? C.bg : C.text,
    fontFamily: F.sans, fontSize: 14, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Resumen para compartir</h1>
      <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.65, margin: "8px 0 24px", maxWidth: "68ch" }}>
        Una imagen con los instrumentos que seguimos, lista para redes. Lleva la fecha de la sesión, la fuente y la hora del dato, para que se entienda a qué momento corresponde.
      </p>

      <div role="group" aria-label="Qué momento retratar" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {[["vivo", "Cotizaciones en curso"], ["cierre", "Cierre de la última sesión"]].map(([clave, texto]) => (
          <button key={clave} type="button" onClick={() => { setVista(clave); setCierreStocks(null); setErrorCierre(null); }} aria-pressed={vista === clave} style={botonEstilo(vista === clave)}>{texto}</button>
        ))}
      </div>

      {vista === "vivo" && <SnapshotCard stocks={stocks} modo="vivo" />}

      {vista === "cierre" && estadoCierre === "loading" && (
        <div className="skeleton-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, height: 320 }} aria-hidden="true" />
      )}

      {vista === "cierre" && estadoCierre === "error" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px" }}>
          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.6 }}>No se pudo cargar el cierre del mercado. {errorCierre}</p>
        </div>
      )}

      {vista === "cierre" && estadoCierre === "listo" && (
        <>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginBottom: 16 }}>
            Captura de la sesión del {fmtFechaSesion(cierreFecha)}. No son precios del momento: es la foto de aquel cierre.
          </p>
          <SnapshotCard stocks={cierreStocks} modo="cierre" fecha={cierreFecha} />
        </>
      )}
    </div>
  );
}

