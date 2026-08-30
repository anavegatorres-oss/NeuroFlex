import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc, query, where, orderBy, addDoc, updateDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";

// ─── FIREBASE CONFIG ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCGv9Y-rCi1kcm3PAZUkiUWbY2U9QAX7mQ",
  authDomain: "neuroflex-506e1.firebaseapp.com",
  projectId: "neuroflex-506e1",
  storageBucket: "neuroflex-506e1.firebasestorage.app",
  messagingSenderId: "334616398067",
  appId: "1:334616398067:web:02783404a2a68ec4f9cf86"
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// Segunda instancia de Firebase SOLO para crear usuarios
// Esto evita que al crear un profesional/paciente el admin pierda su sesión
const firebaseApp2 = initializeApp(firebaseConfig, "secondary");
const auth2 = getAuth(firebaseApp2);


// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const COLORS = {
  // Primarios — azul clínico profundo
  primary:     "#2D4E8A",
  primaryDark: "#1E3461",
  primaryLight:"#4A6FA5",
  // Acento — verde salud
  accent:      "#2E9B7B",
  accentLight: "#3DBFA0",
  // Neutrales
  bg:          "#F4F6FA",
  bgDark:      "#E8EDF5",
  sidebar:     "#1E2B3C",
  sidebarHover:"#2D3F52",
  white:       "#FFFFFF",
  // Texto
  textPrimary: "#1A2332",
  textSecond:  "#4A5568",
  textMuted:   "#8A96A8",
  textLight:   "#C5CDD8",
  // Estado
  success:     "#2E9B7B",
  warning:     "#F59E0B",
  error:       "#E53E3E",
  info:        "#3182CE",
  // Bordes
  border:      "#E2E8F0",
  borderDark:  "#CBD5E0",
};

const FONTS = {
  display: "'Inter', sans-serif",
  body:    "'Inter', sans-serif",
};

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: ${COLORS.bg}; color: ${COLORS.textPrimary}; }
  input, button, textarea, select { font-family: inherit; }
  button { cursor: pointer; }
`;

// ─── UTILIDADES ───────────────────────────────────────────────────────────────
const pct = (c, t) => t > 0 ? Math.round((c / t) * 100) : 0;
const fmt = (s) => s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`;
const shuffle = (a) => { const b = [...a]; for (let i = b.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; };
const gradeColor = (p) => p >= 80 ? COLORS.success : p >= 60 ? COLORS.warning : COLORS.error;

// ─── COMPONENTES UI BASE ──────────────────────────────────────────────────────

// Botón primario
const BtnPrimary = ({ children, onClick, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? COLORS.textLight : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
    color: COLORS.white, border: "none", borderRadius: 10,
    padding: "11px 24px", fontWeight: 600, fontSize: ".9rem",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .2s", boxShadow: disabled ? "none" : "0 2px 8px rgba(45,78,138,.3)",
    ...style
  }}>{children}</button>
);

// Botón secundario
const BtnSecondary = ({ children, onClick, style = {} }) => (
  <button onClick={onClick} style={{
    background: "transparent", color: COLORS.primary,
    border: `1.5px solid ${COLORS.primary}`, borderRadius: 10,
    padding: "10px 24px", fontWeight: 600, fontSize: ".9rem",
    transition: "all .2s", ...style
  }}>{children}</button>
);

// Card
const Card = ({ children, style = {} }) => (
  <div style={{
    background: COLORS.white, borderRadius: 16,
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
    padding: 24, ...style
  }}>{children}</div>
);

// Badge de estado
const Badge = ({ label, color = COLORS.info }) => (
  <span style={{
    background: color + "18", color, borderRadius: 20,
    padding: "3px 10px", fontSize: ".72rem", fontWeight: 700,
    whiteSpace: "nowrap"
  }}>{label}</span>
);

// Input base
const Input = ({ label, value, onChange, type = "text", placeholder, disabled, style = {} }) => (
  <div style={{ marginBottom: 16, ...style }}>
    {label && <label style={{ display: "block", fontWeight: 600, fontSize: ".82rem", color: COLORS.textSecond, marginBottom: 6 }}>{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: ".9rem", color: COLORS.textPrimary, background: disabled ? COLORS.bg : COLORS.white, outline: "none", transition: "border .2s" }}
      onFocus={e => e.target.style.borderColor = COLORS.primary}
      onBlur={e => e.target.style.borderColor = COLORS.border}
    />
  </div>
);

// Select base
const Select = ({ label, value, onChange, options, style = {} }) => (
  <div style={{ marginBottom: 16, ...style }}>
    {label && <label style={{ display: "block", fontWeight: 600, fontSize: ".82rem", color: COLORS.textSecond, marginBottom: 6 }}>{label}</label>}
    <select value={value} onChange={onChange} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: ".9rem", color: COLORS.textPrimary, background: COLORS.white, outline: "none" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// Progress bar
const ProgressBar = ({ value, color = COLORS.primary, height = 8 }) => (
  <div style={{ height, background: COLORS.bgDark, borderRadius: height/2, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.min(100, value)}%`, background: color, borderRadius: height/2, transition: "width .5s ease" }} />
  </div>
);

// Stat card pequeño
const StatCard = ({ icon, label, value, sub, color = COLORS.primary }) => (
  <Card style={{ padding: "20px 20px" }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontSize: ".78rem", fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>{label}</p>
        <p style={{ fontSize: "2rem", fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: ".75rem", color: COLORS.textMuted, marginTop: 4 }}>{sub}</p>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>{icon}</div>
    </div>
  </Card>
);

// Avatar con iniciales
const Avatar = ({ name = "", size = 36, color = COLORS.primary }) => {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", color, fontWeight: 700, fontSize: size * .35, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {initials || "?"}
    </div>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = {
  admin: [
    { id: "dashboard", icon: "▪", label: "Panel" },
    { id: "profesionales", icon: "👥", label: "Profesionales" },
    { id: "pacientes", icon: "🧑‍⚕️", label: "Pacientes" },
    { id: "centros", icon: "🏢", label: "Centros" },
    { id: "estadisticas", icon: "📊", label: "Estadísticas" },
  ],
  profesional: [
    { id: "dashboard", icon: "▪", label: "Panel" },
    { id: "pacientes", icon: "👥", label: "Mis pacientes" },
    { id: "sesiones", icon: "📅", label: "Sesiones" },
    { id: "reportes", icon: "📄", label: "Reportes" },
  ],
  paciente: [
    { id: "inicio", icon: "🏠", label: "Inicio" },
    { id: "mi-sesion", icon: "🧠", label: "Mi sesión" },
    { id: "mi-progreso", icon: "📈", label: "Mi progreso" },
    { id: "historial", icon: "📋", label: "Historial" },
  ],
};

function Sidebar({ role, activeScreen, onNav, user, onLogout }) {
  const items = SIDEBAR_ITEMS[role] || [];
  return (
    <div style={{ width: 240, minHeight: "100vh", background: COLORS.sidebar, display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, zIndex: 100 }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🧠</div>
          <div>
            <p style={{ color: COLORS.white, fontWeight: 800, fontSize: "1rem", margin: 0 }}>NeuroFlex</p>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".68rem", margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{role}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {items.map(item => {
          const active = activeScreen === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 12px", borderRadius: 10, border: "none",
              background: active ? `${COLORS.primary}40` : "transparent",
              color: active ? COLORS.white : "rgba(255,255,255,.55)",
              fontWeight: active ? 600 : 400, fontSize: ".88rem",
              marginBottom: 4, textAlign: "left", transition: "all .15s",
              cursor: "pointer"
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.sidebarHover; e.currentTarget.style.color = COLORS.white; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,.55)"; }}
            >
              <span style={{ fontSize: "1.1rem", width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar name={user?.nombre || user?.email || "U"} size={32} color={COLORS.accent} />
          <div style={{ overflow: "hidden" }}>
            <p style={{ color: COLORS.white, fontSize: ".82rem", fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.nombre || "Usuario"}</p>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".68rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid rgba(255,255,255,.15)", background: "transparent", color: "rgba(255,255,255,.5)", fontSize: ".78rem", cursor: "pointer" }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─── LAYOUT PRINCIPAL ─────────────────────────────────────────────────────────
function MainLayout({ children, title, subtitle }) {
  return (
    <div style={{ marginLeft: 240, minHeight: "100vh", background: COLORS.bg }}>
      {/* Top bar */}
      <div style={{ padding: "20px 32px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.white, position: "sticky", top: 0, zIndex: 50 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: ".82rem", color: COLORS.textMuted, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {/* Content */}
      <div style={{ padding: "28px 32px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── TIMER BAR ───────────────────────────────────────────────────────────────
function TimerBar({ current, total, mayor }) {
  const pct = Math.max(0, Math.min(100, (current / total) * 100));
  const color = pct > 50 ? COLORS.success : pct > 25 ? COLORS.warning : COLORS.error;
  return (
    <div style={{ marginBottom: mayor ? 16 : 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: mayor ? ".9rem" : ".75rem", color: COLORS.textMuted, fontWeight: 600 }}>⏱️ Tiempo</span>
        <span style={{ fontSize: mayor ? "1.1rem" : ".88rem", fontWeight: 900, color }}>
          {current}s
        </span>
      </div>
      <div style={{ height: mayor ? 12 : 8, background: COLORS.bgDark, borderRadius: 6, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 6,
          transition: "width 1s linear, background .5s",
        }} />
      </div>
    </div>
  );
}

// ─── VOZ / TTS ────────────────────────────────────────────────────────────────
function speakInstruction(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-ES";
        u.rate = 0.88;
        u.pitch = 1;
        u.volume = 1;
        u.onerror = () => {};
        u.onend = () => {};
        window.speechSynthesis.speak(u);
      } catch(e) {}
    }, 80);
  } catch(e) {}
}

// ─── DOMINIOS COGNITIVOS ADULTOS ─────────────────────────────────────────────
const DOMINIOS_ADULTO = {
  memoria_trabajo:    { label: "Memoria de trabajo",    emoji: "🔄", color: "#3182CE", desc: "Retener y manipular información en tiempo real" },
  memoria_episodica:  { label: "Memoria episódica",     emoji: "📖", color: "#805AD5", desc: "Recordar eventos y experiencias pasadas" },
  atencion:           { label: "Atención y concentración", emoji: "🎯", color: "#E53E3E", desc: "Mantener el foco y filtrar distracciones" },
  funciones_exec:     { label: "Funciones ejecutivas",  emoji: "⚙️", color: "#D69E2E", desc: "Planificación, toma de decisiones y flexibilidad" },
  velocidad_proc:     { label: "Velocidad de procesamiento", emoji: "⚡", color: "#DD6B20", desc: "Rapidez para procesar y responder información" },
  lenguaje:           { label: "Lenguaje y comunicación", emoji: "🗣️", color: "#2E9B7B", desc: "Comprensión y expresión verbal" },
  percepcion_visual:  { label: "Percepción visual",     emoji: "👁️", color: "#00B5D8", desc: "Procesamiento e interpretación visual" },
  orientacion:        { label: "Orientación",           emoji: "🧭", color: "#68D391", desc: "Consciencia de tiempo, lugar y persona" },
  razonamiento:       { label: "Razonamiento lógico",   emoji: "🔍", color: "#6B46C1", desc: "Identificar patrones, sacar conclusiones y resolver problemas" },
  calculo:            { label: "Cálculo y números",     emoji: "🔢", color: "#2B6CB0", desc: "Operaciones matemáticas y manejo numérico" },
  flexibilidad:       { label: "Flexibilidad cognitiva", emoji: "🔀", color: "#B7791F", desc: "Cambiar entre tareas y adaptarse a reglas nuevas" },
  comprension:        { label: "Comprensión lectora",   emoji: "📚", color: "#276749", desc: "Entender, analizar y razonar sobre textos" },
};

// ─── BANCO DE EJERCICIOS PARA ADULTOS ────────────────────────────────────────

// ─── METADATOS CLÍNICOS DEL BANCO ─────────────────────────────────────────────
// Capa descriptiva. No modifica la ejecución actual de los ejercicios.
// Servirá como base para selección inteligente, dificultad adaptativa y seguimiento.
const MODOS_NEUROFLEX = {
  adulto: { id: "adulto", nombre: "Adulto" },
  adulto_mayor: { id: "adulto_mayor", nombre: "Adulto mayor" },
  rehabilitacion: { id: "rehabilitacion", nombre: "Rehabilitación" },
};

const METADATA_EJERCICIOS = {
  "digits_forward": { subcomponente: "amplitud atencional y memoria inmediata", modalidad: "mixta", dificultadBase: 2, demandasSecundarias: ["atencion sostenida"], metricas: ["precision", "tiempo", "longitud_secuencia"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "digits_backward": { subcomponente: "manipulación activa de información", modalidad: "mixta", dificultadBase: 3, demandasSecundarias: ["control ejecutivo"], metricas: ["precision", "tiempo", "longitud_secuencia"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "letter_number": { subcomponente: "secuenciación y manipulación", modalidad: "mixta", dificultadBase: 4, demandasSecundarias: ["flexibilidad", "ordenamiento"], metricas: ["precision", "tiempo", "longitud_secuencia"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "operation_span": { subcomponente: "memoria de trabajo dual", modalidad: "mixta", dificultadBase: 4, demandasSecundarias: ["calculo", "atencion dividida"], metricas: ["precision", "tiempo", "carga_doble"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "nback_1": { subcomponente: "actualización de información", modalidad: "visual", dificultadBase: 3, demandasSecundarias: ["atencion sostenida"], metricas: ["precision", "errores", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "word_recall": { subcomponente: "codificación y evocación verbal", modalidad: "visual", dificultadBase: 2, demandasSecundarias: ["lenguaje"], metricas: ["aciertos", "omisiones", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "story_recall": { subcomponente: "memoria episódica verbal", modalidad: "visual", dificultadBase: 3, demandasSecundarias: ["comprension", "lenguaje"], metricas: ["precision", "omisiones", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "sustained_attention": { subcomponente: "atención sostenida", modalidad: "visual", dificultadBase: 2, demandasSecundarias: ["inhibicion"], metricas: ["aciertos", "errores", "omisiones", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "divided_attention": { subcomponente: "atención dividida", modalidad: "visual", dificultadBase: 4, demandasSecundarias: ["calculo", "inhibicion"], metricas: ["aciertos", "errores", "omisiones", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "find_animal": { subcomponente: "atención selectiva", modalidad: "visual", dificultadBase: 2, demandasSecundarias: ["inhibicion", "percepcion visual"], metricas: ["aciertos", "errores", "omisiones", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "verbal_fluency": { subcomponente: "iniciación y búsqueda estratégica", modalidad: "verbal", dificultadBase: 3, demandasSecundarias: ["lenguaje", "velocidad"], metricas: ["producciones", "repeticiones", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"], requiereValoracionProfesional: true },
  "trail_making": { subcomponente: "planificación y secuenciación", modalidad: "visual", dificultadBase: 4, demandasSecundarias: ["atencion alternante", "velocidad"], metricas: ["precision", "errores", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "reaction_time": { subcomponente: "velocidad de respuesta simple", modalidad: "visual", dificultadBase: 2, demandasSecundarias: ["atencion sostenida"], metricas: ["tiempo_respuesta", "promedio", "variabilidad"], modos: ["adulto", "adulto_mayor", "rehabilitacion"], requiereValoracionProfesional: true },
  "color_naming": { subcomponente: "velocidad de procesamiento visual-verbal", modalidad: "visual", dificultadBase: 3, demandasSecundarias: ["lenguaje", "atencion"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "naming": { subcomponente: "denominación", modalidad: "visual", dificultadBase: 2, demandasSecundarias: ["acceso lexico"], metricas: ["aciertos", "errores", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "analogias_verbales": { subcomponente: "relaciones semánticas", modalidad: "verbal", dificultadBase: 3, demandasSecundarias: ["razonamiento"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "verbal_comprehension": { subcomponente: "comprensión verbal", modalidad: "verbal", dificultadBase: 3, demandasSecundarias: ["razonamiento verbal"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "visual_matching": { subcomponente: "discriminación visual", modalidad: "visual", dificultadBase: 2, demandasSecundarias: ["atencion selectiva"], metricas: ["precision", "errores", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "pe_rotacion": { subcomponente: "rotación y constancia perceptual", modalidad: "visual", dificultadBase: 3, demandasSecundarias: ["razonamiento espacial"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "pe_contar": { subcomponente: "búsqueda visual y conteo", modalidad: "visual", dificultadBase: 2, demandasSecundarias: ["atencion", "calculo"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "pe_patron": { subcomponente: "análisis de patrones visuales", modalidad: "visual", dificultadBase: 3, demandasSecundarias: ["razonamiento"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "temporal_orientation": { subcomponente: "orientación temporal", modalidad: "verbal", dificultadBase: 1, demandasSecundarias: [], metricas: ["precision"], modos: ["adulto_mayor", "rehabilitacion"] },
  "spatial_orientation": { subcomponente: "orientación espacial", modalidad: "verbal", dificultadBase: 1, demandasSecundarias: [], metricas: ["respuesta_clinica"], modos: ["adulto_mayor", "rehabilitacion"], requiereValoracionProfesional: true },
  "or_personas": { subcomponente: "orientación personal", modalidad: "verbal", dificultadBase: 1, demandasSecundarias: [], metricas: ["respuesta_clinica"], modos: ["adulto_mayor", "rehabilitacion"], requiereValoracionProfesional: true },
  "or_situacion": { subcomponente: "orientación situacional", modalidad: "verbal", dificultadBase: 1, demandasSecundarias: ["comprension"], metricas: ["respuesta_clinica"], modos: ["adulto_mayor", "rehabilitacion"], requiereValoracionProfesional: true },
  "ra_series": { subcomponente: "razonamiento inductivo", modalidad: "visual", dificultadBase: 3, demandasSecundarias: ["calculo"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "ra_discordante": { subcomponente: "categorización y abstracción", modalidad: "verbal", dificultadBase: 3, demandasSecundarias: ["lenguaje"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "ra_verdadero_falso": { subcomponente: "razonamiento deductivo", modalidad: "verbal", dificultadBase: 3, demandasSecundarias: ["comprension"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "calc_operaciones": { subcomponente: "cálculo mental", modalidad: "visual", dificultadBase: 2, demandasSecundarias: ["memoria de trabajo"], metricas: ["precision", "tiempo", "complejidad"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "calc_faltante": { subcomponente: "razonamiento numérico", modalidad: "visual", dificultadBase: 3, demandasSecundarias: ["razonamiento"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "flex_regla": { subcomponente: "cambio de criterio", modalidad: "visual", dificultadBase: 3, demandasSecundarias: ["inhibicion", "atencion alternante"], metricas: ["precision", "errores", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "flex_opuesto": { subcomponente: "inhibición y cambio de respuesta", modalidad: "visual", dificultadBase: 3, demandasSecundarias: ["inhibicion"], metricas: ["precision", "errores", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "cp_inferencia": { subcomponente: "inferencia", modalidad: "verbal", dificultadBase: 3, demandasSecundarias: ["razonamiento"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
  "cp_texto": { subcomponente: "comprensión global de texto", modalidad: "verbal", dificultadBase: 3, demandasSecundarias: ["memoria episodica", "razonamiento"], metricas: ["precision", "tiempo"], modos: ["adulto", "adulto_mayor", "rehabilitacion"] },
};

function getExerciseMetadata(domId, ex) {
  const meta = METADATA_EJERCICIOS[ex?.id] || {};
  return {
    id: ex?.id,
    dominio: domId,
    subcomponente: meta.subcomponente || null,
    modalidad: meta.modalidad || "visual",
    dificultadBase: meta.dificultadBase ?? (typeof ex?.nivel === "number" ? ex.nivel : null),
    demandasSecundarias: meta.demandasSecundarias || [],
    metricas: meta.metricas || ["precision", "tiempo"],
    modos: meta.modos || ["adulto", "adulto_mayor", "rehabilitacion"],
    requiereValoracionProfesional: meta.requiereValoracionProfesional || false,
  };
}


// ─── INTERPRETACIÓN CLÍNICA PRUDENTE ──────────────────────────────────────────
// Los porcentajes son indicadores internos de desempeño en tareas de NeuroFlex.
// No representan puntuaciones normativas, diagnósticos ni grados de deterioro.
function taskPct(res) {
  if (!res || res.requiresReview || !res.total || res.total <= 0) return null;
  return Math.round(((res.correct || 0) / res.total) * 100);
}

function performanceLabel(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return "Valoración profesional pendiente";
  if (pct >= 80) return "Fortaleza relativa en la tarea";
  if (pct >= 60) return "Desempeño intermedio en la tarea";
  return "Oportunidad de fortalecimiento";
}


// ─── MOTOR DE DIFICULTAD ADAPTATIVA ───────────────────────────────────────────
// El nivel se ajusta por desempeño previo, no por edad.
// Escala interna 1–5: 1 muy accesible, 3 intermedio, 5 alta demanda.



// ─── PANEL CLÍNICO / RESUMEN DEL CASO · FASE 17 ────────────────────────────────
function getLatestNumericSession(paciente) {
  const sesiones = paciente?.sesiones || [];
  for (let i = sesiones.length - 1; i >= 0; i--) {
    const value = getSessionMetric(sesiones[i], "taskIndicator");
    if (typeof value === "number" && !Number.isNaN(value)) return sesiones[i];
  }
  return null;
}

function getClinicalDashboardSummary(paciente) {
  const evalHist = paciente?.eval?.hist || [];
  const planAreas = paciente?.interventionPlan?.areas || [];
  const sesiones = paciente?.sesiones || [];
  const latest = sesiones[sesiones.length - 1] || null;
  const latestNumeric = getLatestNumericSession(paciente);

  const numericEval = evalHist.filter(h => typeof h.pct === "number" && !Number.isNaN(h.pct));
  const reviewEval = evalHist.filter(h => h.requiresReview || h.pct === null || h.pct === undefined);

  const activeAreas = planAreas
    .filter(a => a.estado === "objetivo" || a.estado === "seguimiento")
    .sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.prioridad] ?? 1) - ({ alta: 0, media: 1, baja: 2 }[b.prioridad] ?? 1));

  const highPriority = activeAreas.filter(a => a.prioridad === "alta");

  const latestTask = latestNumeric ? getSessionMetric(latestNumeric, "taskIndicator") : null;
  const latestAutonomy = latest ? getSessionMetric(latest, "autonomyRate") : null;
  const latestLevel = latest ? getSessionMetric(latest, "averageAdaptiveLevel") : null;
  const latestSupport = latest ? getSessionMetric(latest, "averageSupportLevel") : null;
  const latestTime = latest ? getSessionMetric(latest, "averageSecondsPerExercise") : null;

  const firstNumeric = sesiones.find(s => typeof getSessionMetric(s, "taskIndicator") === "number");
  const firstTask = firstNumeric ? getSessionMetric(firstNumeric, "taskIndicator") : null;
  const delta = typeof latestTask === "number" && typeof firstTask === "number" ? latestTask - firstTask : null;

  const reviewSuggestions = buildInterventionReview(paciente, planAreas);
  const relevantReview = reviewSuggestions.filter(s =>
    ["revisar_apoyos", "continuar_objetivo", "revision_profesional", "progreso_solido"].includes(s.status)
  );

  const pendingClinical = [];
  if (!paciente?.eval) pendingClinical.push("Evaluación pendiente");
  if (paciente?.eval && !paciente?.interventionPlan) pendingClinical.push("Plan de intervención pendiente");
  if (paciente?.interventionPlan && activeAreas.length === 0) pendingClinical.push("Plan sin objetivos activos");
  if (reviewEval.length > 0) pendingClinical.push(`${reviewEval.length} área(s) de evaluación requieren valoración profesional`);
  if (latest?.results?.some(r => r.requiresReview)) pendingClinical.push("La última sesión contiene tareas para valoración profesional");

  return {
    evalHist, numericEval, reviewEval, planAreas, activeAreas, highPriority,
    sesiones, latest, latestTask, latestAutonomy, latestLevel, latestSupport,
    latestTime, delta, reviewSuggestions, relevantReview, pendingClinical
  };
}

function ClinicalMetricCard({ icon, label, value, detail }) {
  return (
    <div style={{
      padding: 14,
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      minHeight: 98
    }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: "1.2rem" }}>{icon}</span>
        <span style={{ color: COLORS.textMuted, fontSize: ".7rem", fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ fontSize: "1.25rem", fontWeight: 850, color: COLORS.textPrimary }}>{value}</div>
      {detail && <div style={{ marginTop: 4, fontSize: ".66rem", color: COLORS.textMuted, lineHeight: 1.4 }}>{detail}</div>}
    </div>
  );
}

function ClinicalCaseDashboard({ paciente, onGo, onStartSession, onEvaluate }) {
  const s = getClinicalDashboardSummary(paciente);

  const nextStep = !paciente?.eval
    ? { icon: "🧠", text: "Realizar evaluación", action: onEvaluate }
    : !paciente?.interventionPlan
      ? { icon: "🎯", text: "Definir plan de intervención", action: () => onGo?.("intervencion") }
      : s.activeAreas.length === 0
        ? { icon: "🔄", text: "Revisar objetivos del plan", action: () => onGo?.("intervencion") }
        : { icon: "▶️", text: "Preparar próxima sesión", action: onStartSession };

  return (
    <div>
      <SectionIntro
        icon="🩺"
        title="Resumen clínico"
        description="Vista rápida del caso. Integra información de NeuroFlex sin sustituir la valoración clínica."
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
        gap: 10,
        marginBottom: 18
      }}>
        <ClinicalMetricCard
          icon="🧠"
          label="EVALUACIÓN"
          value={paciente?.eval ? "Completada" : "Pendiente"}
          detail={s.reviewEval.length ? `${s.reviewEval.length} área(s) requieren revisión` : paciente?.eval ? "Sin tareas pendientes de revisión" : "Aún no realizada"}
        />
        <ClinicalMetricCard
          icon="🎯"
          label="OBJETIVOS ACTIVOS"
          value={String(s.activeAreas.length)}
          detail={s.highPriority.length ? `${s.highPriority.length} de prioridad alta` : "Sin prioridad alta"}
        />
        <ClinicalMetricCard
          icon="📋"
          label="SESIONES"
          value={String(s.sesiones.length)}
          detail={s.latest ? `Última: sesión #${s.latest.numero || s.sesiones.length}` : "Sin sesiones registradas"}
        />
        <ClinicalMetricCard
          icon="📊"
          label="DESEMPEÑO RECIENTE"
          value={typeof s.latestTask === "number" ? `${s.latestTask}%` : "—"}
          detail="Indicador descriptivo de tareas cuantificables"
        />
        <ClinicalMetricCard
          icon="🧍"
          label="AUTONOMÍA RECIENTE"
          value={typeof s.latestAutonomy === "number" ? `${s.latestAutonomy}%` : "—"}
          detail="Basado en apoyos registrados"
        />
        <ClinicalMetricCard
          icon="🎚️"
          label="DIFICULTAD MEDIA"
          value={typeof s.latestLevel === "number" ? `${Math.round(s.latestLevel * 10) / 10}/5` : "—"}
          detail="Nivel adaptativo reciente"
        />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
        marginBottom: 18
      }}>
        <Card>
          <h3 style={{ margin: "0 0 10px", fontSize: ".9rem" }}>🎯 Foco actual</h3>
          {s.activeAreas.length === 0 ? (
            <p style={{ color: COLORS.textMuted, fontSize: ".76rem" }}>No hay objetivos activos en el plan.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {s.activeAreas.slice(0, 5).map(a => {
                const dom = DOMINIOS_ADULTO[a.id];
                return (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingBottom: 7, borderBottom: `1px solid ${COLORS.border}` }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".76rem" }}>{dom?.emoji} {dom?.label}</div>
                      {a.objetivo && <div style={{ color: COLORS.textMuted, fontSize: ".66rem", marginTop: 2 }}>{a.objetivo}</div>}
                    </div>
                    <Badge
                      label={a.prioridad || "media"}
                      color={a.prioridad === "alta" ? COLORS.error : a.prioridad === "media" ? COLORS.warning : COLORS.textMuted}
                    />
                  </div>
                );
              })}
              {s.activeAreas.length > 5 && (
                <div style={{ color: COLORS.textMuted, fontSize: ".68rem" }}>+ {s.activeAreas.length - 5} área(s) adicional(es)</div>
              )}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <BtnSecondary onClick={() => onGo?.("intervencion")} style={{ fontSize: ".72rem" }}>Ver plan completo</BtnSecondary>
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 10px", fontSize: ".9rem" }}>📈 Evolución reciente</h3>
          {s.sesiones.length === 0 ? (
            <p style={{ color: COLORS.textMuted, fontSize: ".76rem" }}>Todavía no hay sesiones para mostrar tendencia.</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                <div style={{ padding: 10, background: COLORS.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: ".64rem", color: COLORS.textMuted }}>CAMBIO</div>
                  <div style={{ fontWeight: 800, marginTop: 3 }}>
                    {typeof s.delta === "number" ? `${s.delta > 0 ? "+" : ""}${s.delta} pts` : "—"}
                  </div>
                </div>
                <div style={{ padding: 10, background: COLORS.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: ".64rem", color: COLORS.textMuted }}>APOYO MEDIO</div>
                  <div style={{ fontWeight: 800, marginTop: 3 }}>
                    {typeof s.latestSupport === "number" ? Math.round(s.latestSupport * 10) / 10 : "—"}
                  </div>
                </div>
                <div style={{ padding: 10, background: COLORS.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: ".64rem", color: COLORS.textMuted }}>TIEMPO / EJERCICIO</div>
                  <div style={{ fontWeight: 800, marginTop: 3 }}>
                    {typeof s.latestTime === "number" ? `${Math.round(s.latestTime)} s` : "—"}
                  </div>
                </div>
                <div style={{ padding: 10, background: COLORS.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: ".64rem", color: COLORS.textMuted }}>NIVEL MEDIO</div>
                  <div style={{ fontWeight: 800, marginTop: 3 }}>
                    {typeof s.latestLevel === "number" ? `${Math.round(s.latestLevel * 10) / 10}/5` : "—"}
                  </div>
                </div>
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: ".66rem", lineHeight: 1.45, margin: "10px 0 0" }}>
                Tendencia descriptiva de NeuroFlex. No corresponde a una puntuación normativa.
              </p>
            </>
          )}
          <div style={{ marginTop: 12 }}>
            <BtnSecondary onClick={() => onGo?.("progreso")} style={{ fontSize: ".72rem" }}>Ver evolución completa</BtnSecondary>
          </div>
        </Card>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
        marginBottom: 18
      }}>
        <Card>
          <h3 style={{ margin: "0 0 10px", fontSize: ".9rem" }}>🔎 Aspectos para revisar</h3>
          {s.pendingClinical.length === 0 && s.relevantReview.length === 0 ? (
            <p style={{ color: COLORS.textMuted, fontSize: ".76rem" }}>No hay avisos clínicos pendientes generados por NeuroFlex.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {s.pendingClinical.map((x, i) => (
                <div key={`p-${i}`} style={{ fontSize: ".72rem", padding: "8px 10px", borderRadius: 9, background: COLORS.warning + "10", border: `1px solid ${COLORS.warning}25` }}>
                  ⚠️ {x}
                </div>
              ))}
              {s.relevantReview.slice(0, 3).map(r => (
                <div key={r.id} style={{ fontSize: ".72rem", padding: "8px 10px", borderRadius: 9, background: COLORS.primary + "07", border: `1px solid ${COLORS.primary}15` }}>
                  {r.icon} <strong>{DOMINIOS_ADULTO[r.id]?.label}:</strong> {r.title}
                </div>
              ))}
            </div>
          )}
          {(s.pendingClinical.length > 0 || s.relevantReview.length > 0) && (
            <div style={{ marginTop: 12 }}>
              <BtnSecondary onClick={() => onGo?.("intervencion")} style={{ fontSize: ".72rem" }}>Revisar intervención</BtnSecondary>
            </div>
          )}
        </Card>

        <Card style={{ background: COLORS.primary + "05", border: `1.5px solid ${COLORS.primary}18` }}>
          <h3 style={{ margin: "0 0 8px", fontSize: ".9rem" }}>🧭 Próximo paso</h3>
          <p style={{ color: COLORS.textMuted, fontSize: ".75rem", lineHeight: 1.5, margin: "0 0 14px" }}>
            NeuroFlex propone el siguiente paso según el estado del caso. El profesional conserva la decisión final.
          </p>
          <BtnPrimary onClick={nextStep.action} style={{ width: "100%" }}>
            {nextStep.icon} {nextStep.text}
          </BtnPrimary>
        </Card>
      </div>
    </div>
  );
}

// ─── AUDITORÍA DE CALIDAD DE EJERCICIOS · FASE 16 ─────────────────────────────
// Describe demandas y forma de interpretación. No equivale a validación psicométrica.
const EXERCISE_QUALITY_PROFILE = {
  digits_forward:{principal:"memoria inmediata verbal",secundaria:["atención sostenida"],respuesta:"recuerdo serial",interpretacion:"descriptiva"},
  digits_backward:{principal:"memoria de trabajo",secundaria:["manipulación mental","atención"],respuesta:"recuerdo serial inverso",interpretacion:"descriptiva"},
  letter_number:{principal:"secuenciación y memoria de trabajo",secundaria:["ordenamiento","flexibilidad"],respuesta:"respuesta escrita ordenada",interpretacion:"descriptiva"},
  operation_span:{principal:"memoria de trabajo dual",secundaria:["cálculo","atención dividida"],respuesta:"cálculo + evocación",interpretacion:"descriptiva"},
  nback_1:{principal:"actualización de información",secundaria:["atención sostenida"],respuesta:"decisión igual/diferente",interpretacion:"descriptiva"},
  word_recall:{principal:"evocación verbal",secundaria:["codificación","lenguaje"],respuesta:"recuerdo libre",interpretacion:"descriptiva"},
  story_recall:{principal:"memoria episódica verbal",secundaria:["comprensión","lenguaje"],respuesta:"selección múltiple",interpretacion:"descriptiva"},
  sustained_attention:{principal:"atención sostenida",secundaria:["búsqueda visual","inhibición"],respuesta:"selección visual",interpretacion:"descriptiva"},
  divided_attention:{principal:"atención dividida",secundaria:["cálculo","búsqueda visual"],respuesta:"selección visual",interpretacion:"descriptiva"},
  find_animal:{principal:"atención selectiva",secundaria:["exploración visual"],respuesta:"selección visual",interpretacion:"descriptiva"},
  verbal_fluency:{principal:"fluidez verbal semántica",secundaria:["acceso léxico","estrategia de búsqueda"],respuesta:"producción libre",interpretacion:"requiere revisión profesional"},
  trail_making:{principal:"flexibilidad cognitiva",secundaria:["secuenciación","atención visual"],respuesta:"secuencia alternante",interpretacion:"descriptiva"},
  reaction_time:{principal:"velocidad de respuesta simple",secundaria:["alerta atencional"],respuesta:"latencia motora",interpretacion:"requiere revisión profesional"},
  color_naming:{principal:"velocidad de procesamiento visual",secundaria:["atención","discriminación cromática"],respuesta:"selección rápida",interpretacion:"descriptiva"},
  naming:{principal:"denominación",secundaria:["acceso léxico"],respuesta:"respuesta escrita",interpretacion:"descriptiva"},
  analogias_verbales:{principal:"razonamiento verbal",secundaria:["comprensión semántica"],respuesta:"selección múltiple",interpretacion:"descriptiva"},
  verbal_comprehension:{principal:"comprensión verbal",secundaria:["semántica"],respuesta:"selección múltiple",interpretacion:"descriptiva"},
  visual_matching:{principal:"discriminación visual",secundaria:["atención selectiva"],respuesta:"emparejamiento",interpretacion:"descriptiva"},
  pe_rotacion:{principal:"rotación mental",secundaria:["percepción visuoespacial"],respuesta:"igual/diferente",interpretacion:"descriptiva"},
  pe_contar:{principal:"exploración y conteo visual",secundaria:["atención selectiva"],respuesta:"estimación exacta",interpretacion:"descriptiva"},
  pe_patron:{principal:"continuidad de patrón visual",secundaria:["razonamiento no verbal"],respuesta:"selección múltiple",interpretacion:"descriptiva"},
  temporal_orientation:{principal:"orientación temporal",secundaria:["lenguaje"],respuesta:"respuesta libre",interpretacion:"descriptiva contextual"},
  spatial_orientation:{principal:"orientación espacial",secundaria:["lenguaje autobiográfico"],respuesta:"respuesta libre",interpretacion:"requiere revisión profesional"},
  or_personas:{principal:"orientación personal",secundaria:["memoria autobiográfica"],respuesta:"respuesta libre",interpretacion:"requiere revisión profesional"},
  or_situacion:{principal:"orientación situacional",secundaria:["comprensión contextual"],respuesta:"respuesta libre",interpretacion:"requiere revisión profesional"},
  ra_series:{principal:"razonamiento inductivo",secundaria:["cálculo"],respuesta:"continuación de serie",interpretacion:"descriptiva"},
  ra_discordante:{principal:"clasificación conceptual",secundaria:["abstracción","lenguaje"],respuesta:"selección del discordante",interpretacion:"descriptiva"},
  ra_verdadero_falso:{principal:"razonamiento lógico",secundaria:["comprensión verbal"],respuesta:"verdadero/falso",interpretacion:"descriptiva"},
  calc_operaciones:{principal:"cálculo mental",secundaria:["memoria de trabajo"],respuesta:"resultado numérico",interpretacion:"descriptiva"},
  calc_faltante:{principal:"razonamiento numérico inverso",secundaria:["cálculo"],respuesta:"número faltante",interpretacion:"descriptiva"},
  flex_regla:{principal:"cambio de criterio",secundaria:["inhibición","atención"],respuesta:"clasificación por regla",interpretacion:"descriptiva"},
  flex_opuesto:{principal:"flexibilidad verbal",secundaria:["acceso léxico","inhibición"],respuesta:"selección de antónimo",interpretacion:"descriptiva"},
  cp_inferencia:{principal:"comprensión inferencial",secundaria:["razonamiento verbal"],respuesta:"selección múltiple",interpretacion:"descriptiva"},
  cp_texto:{principal:"comprensión de lectura",secundaria:["memoria verbal","atención"],respuesta:"preguntas sobre texto",interpretacion:"descriptiva"},
};
function getExerciseQualityProfile(exId){ return EXERCISE_QUALITY_PROFILE[exId] || null; }

const ADAPTIVE_EXERCISE_SPECS = {
  digits_forward: {
    variable: "longitud de secuencia",
    niveles: { 1: "3 dígitos", 2: "4 dígitos", 3: "5 dígitos", 4: "6 dígitos", 5: "7 dígitos" },
  },
  digits_backward: {
    variable: "longitud de secuencia inversa",
    niveles: { 1: "2 dígitos", 2: "3 dígitos", 3: "4 dígitos", 4: "5 dígitos", 5: "6 dígitos" },
  },
  nback_1: {
    variable: "cantidad de ensayos y variedad de estímulos",
    niveles: { 1: "7 ensayos / 4 estímulos", 2: "8 / 5", 3: "10 / 6", 4: "12 / 8", 5: "14 / 10" },
  },
  sustained_attention: {
    variable: "carga visual y tiempo de búsqueda",
    niveles: { 1: "20 estímulos", 2: "28", 3: "36", 4: "44", 5: "52" },
  },
  find_animal: {
    variable: "cantidad de estímulos y distractores",
    niveles: { 1: "9 estímulos", 2: "12", 3: "15", 4: "18", 5: "20" },
  },
  calc_operaciones: {
    variable: "rango numérico y tipo de operación",
    niveles: { 1: "sumas/restas simples", 2: "incluye multiplicación", 3: "incluye división", 4: "rangos mayores", 5: "mayor carga numérica" },
  },
  calc_faltante: {
    variable: "complejidad de la operación inversa",
    niveles: { 1: "operaciones simples", 2: "simples y medias", 3: "medias", 4: "medias y complejas", 5: "mayor complejidad" },
  },
  ra_series: {
    variable: "complejidad de regla de serie",
    niveles: { 1: "patrones lineales simples", 2: "mixtos simples", 3: "intermedios", 4: "intermedios/complejos", 5: "complejos" },
  },
  visual_matching: {
    variable: "número de distractores y rondas",
    niveles: { 1: "2 distractores / 4 rondas", 2: "3 / 5", 3: "3 / 6", 4: "4 / 7", 5: "5 / 8" },
  },
  word_recall: {
    variable: "cantidad de palabras y tiempo de estudio",
    niveles: { 1: "5 palabras / 25 s", 2: "6 / 22 s", 3: "8 / 20 s", 4: "9 / 17 s", 5: "10 / 15 s" },
  },
  divided_attention: {
    variable: "cantidad de estímulos y rango numérico",
    niveles: { 1: "20 estímulos / 1–10", 2: "28 / 1–14", 3: "36 / 1–18", 4: "44 / 1–22", 5: "52 / 1–26" },
  },
  naming: {
    variable: "cantidad y frecuencia léxica de estímulos",
    niveles: { 1: "4 objetos frecuentes", 2: "5 frecuentes", 3: "6 mixtos", 4: "7 mixtos", 5: "8 con mayor demanda léxica" },
  },
  pe_contar: {
    variable: "cantidad total de estímulos y rondas",
    niveles: { 1: "10 estímulos / 4 rondas", 2: "12 / 5", 3: "16 / 6", 4: "20 / 7", 5: "24 / 8" },
  },
  trail_making: {
    variable: "longitud de secuencia alternante",
    niveles: { 1: "1-A-2-B-3-C", 2: "hasta 4-D", 3: "hasta 5-E", 4: "hasta 6-F", 5: "hasta 7-G" },
  },
  ra_discordante: {
    variable: "cantidad y abstracción de categorías",
    niveles: { 1: "4 grupos concretos", 2: "5 concretos", 3: "6 mixtos", 4: "6 con categorías abstractas", 5: "7 mixtos/abstractos" },
  },
  ra_verdadero_falso: {
    variable: "cantidad y complejidad lógica de afirmaciones",
    niveles: { 1: "4 afirmaciones simples", 2: "5", 3: "6 mixtas", 4: "7 con lógica", 5: "8 con mayor inferencia" },
  },
  flex_regla: {
    variable: "frecuencia de cambio de regla y rondas",
    niveles: { 1: "8 rondas / pocos cambios", 2: "9", 3: "10", 4: "12", 5: "14 / cambios frecuentes" },
  },
  flex_opuesto: {
    variable: "cantidad y dificultad léxica de antónimos",
    niveles: { 1: "4 pares frecuentes", 2: "5", 3: "6 mixtos", 4: "7", 5: "8 con mayor demanda léxica" },
  },
  analogias_verbales: {
    variable: "cantidad y abstracción de relaciones verbales",
    niveles: { 1: "3 analogías concretas", 2: "4", 3: "5 mixtas", 4: "6", 5: "7 con relaciones menos directas" },
  },
  verbal_comprehension: {
    variable: "cantidad y complejidad semántica",
    niveles: { 1: "3 ítems cotidianos", 2: "4", 3: "5 mixtos", 4: "6", 5: "7 con mayor demanda semántica" },
  },
  cp_texto: {
    variable: "tiempo disponible para lectura",
    niveles: { 1: "90 s", 2: "75 s", 3: "60 s", 4: "50 s", 5: "40 s" },
  },
};

const ADAPTIVE_MIN_LEVEL = 1;
const ADAPTIVE_MAX_LEVEL = 5;

function clampAdaptiveLevel(level) {
  return Math.max(ADAPTIVE_MIN_LEVEL, Math.min(ADAPTIVE_MAX_LEVEL, Math.round(level || 1)));
}

function getExerciseBaseLevel(domId, ex) {
  const meta = getExerciseMetadata(domId, ex);
  return clampAdaptiveLevel(meta.dificultadBase || ex?.nivel || 2);
}

function getAdaptiveRecord(paciente, exId) {
  return paciente?.adaptiveProfile?.exercises?.[exId] || null;
}

function getRecommendedLevel(paciente, domId, ex) {
  const previous = getAdaptiveRecord(paciente, ex?.id);
  if (previous?.nextLevel) return clampAdaptiveLevel(previous.nextLevel);
  return getExerciseBaseLevel(domId, ex);
}

function calculateNextAdaptiveLevel(currentLevel, pct, previousRecord = null) {
  const level = clampAdaptiveLevel(currentLevel);
  if (typeof pct !== "number" || Number.isNaN(pct)) return level;

  // Se exige desempeño consistente antes de subir de forma agresiva.
  const priorHigh = (previousRecord?.consecutiveHigh || 0);
  if (pct >= 90 && priorHigh >= 1) return clampAdaptiveLevel(level + 1);
  if (pct >= 80) return level;
  if (pct >= 60) return level;
  if (pct < 45) return clampAdaptiveLevel(level - 1);
  return level;
}

function buildUpdatedAdaptiveProfile(paciente, sessionResults = []) {
  const previousProfile = paciente?.adaptiveProfile || { exercises: {}, domains: {} };
  const exercises = { ...(previousProfile.exercises || {}) };
  const domains = { ...(previousProfile.domains || {}) };

  sessionResults.forEach(r => {
    const prior = exercises[r.exId] || {};
    const currentLevel = clampAdaptiveLevel(r.adaptiveLevel || prior.nextLevel || 2);
    const pct = typeof r.pct === "number" && !Number.isNaN(r.pct) ? r.pct : null;

    const consecutiveHigh = pct !== null && pct >= 90
      ? (prior.consecutiveHigh || 0) + 1
      : 0;

    const nextLevel = calculateNextAdaptiveLevel(
      currentLevel,
      pct,
      prior
    );

    exercises[r.exId] = {
      lastLevel: currentLevel,
      nextLevel,
      lastPct: pct,
      consecutiveHigh,
      attempts: (prior.attempts || 0) + 1,
      lastDate: new Date().toISOString(),
    };

    if (!domains[r.domId]) {
      domains[r.domId] = { attempts: 0, recentPct: null, recommendedLevel: 2 };
    }
    const d = domains[r.domId];
    const numericPcts = [
      ...(Array.isArray(d.history) ? d.history : []),
      ...(pct !== null ? [pct] : []),
    ].slice(-5);

    const recentPct = numericPcts.length
      ? Math.round(numericPcts.reduce((a, b) => a + b, 0) / numericPcts.length)
      : d.recentPct;

    const domainLevels = Object.entries(exercises)
      .filter(([exId]) => {
        for (const [domId, list] of Object.entries(EX_ADULTO || {})) {
          if (domId === r.domId && list.some(ex => ex.id === exId)) return true;
        }
        return false;
      })
      .map(([, rec]) => rec.nextLevel)
      .filter(n => typeof n === "number");

    domains[r.domId] = {
      attempts: (d.attempts || 0) + 1,
      history: numericPcts,
      recentPct,
      recommendedLevel: domainLevels.length
        ? clampAdaptiveLevel(domainLevels.reduce((a, b) => a + b, 0) / domainLevels.length)
        : (d.recommendedLevel || 2),
      lastDate: new Date().toISOString(),
    };
  });

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    exercises,
    domains,
  };
}

function getRecentExerciseHistory(paciente, maxSessions = 3) {
  const sesiones = paciente?.sesiones || [];
  return sesiones
    .slice(-maxSessions)
    .flatMap((s, sessionOffset) =>
      (s.results || []).map((r, resultOffset) => ({
        ...r,
        sessionOffset,
        resultOffset,
        sessionNumber: s.numero,
        date: s.date,
      }))
    );
}

function getInterventionArea(paciente, domId) {
  return (paciente?.interventionPlan?.areas || []).find(a => a.id === domId) || null;
}

function interventionPriorityWeight(area) {
  if (!area) return 1;
  if (area.estado === "objetivo") {
    return area.prioridad === "alta" ? 4 : area.prioridad === "media" ? 3 : 2;
  }
  if (area.estado === "seguimiento") {
    return area.prioridad === "alta" ? 3 : area.prioridad === "media" ? 2 : 1.5;
  }
  if (area.estado === "mantenimiento") return 0.75;
  if (area.estado === "revision") return 0.5;
  return 0;
}

function getRecentExerciseStats(paciente, exId, maxSessions = 3) {
  const history = getRecentExerciseHistory(paciente, maxSessions).filter(r => r.exId === exId);
  if (!history.length) {
    return {
      recentCount: 0,
      lastPct: null,
      averagePct: null,
      averageSupport: null,
      lastLevel: null,
      lastSessionNumber: null,
    };
  }

  const pcts = history.map(r => r.pct).filter(v => typeof v === "number" && !Number.isNaN(v));
  const support = history
    .map(r => getTrackedSupportLevel(r))
    .filter(v => typeof v === "number");
  const last = history[history.length - 1];

  return {
    recentCount: history.length,
    lastPct: typeof last.pct === "number" ? last.pct : null,
    averagePct: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
    averageSupport: support.length ? support.reduce((a, b) => a + b, 0) / support.length : null,
    lastLevel: typeof last.adaptiveLevel === "number" ? last.adaptiveLevel : null,
    lastSessionNumber: last.sessionNumber || null,
  };
}

function intelligentExerciseScore(paciente, domId, ex, context = {}) {
  const {
    usedIds = [],
    usedSubcomponents = [],
    intelligent = true,
    adaptive = true,
  } = context;

  const base = getExerciseBaseLevel(domId, ex);
  const recommended = adaptive ? getRecommendedLevel(paciente, domId, ex) : base;
  const domainLevel = adaptive ? paciente?.adaptiveProfile?.domains?.[domId]?.recommendedLevel : null;
  const target = clampAdaptiveLevel(domainLevel || recommended || base);
  const distance = Math.abs(base - target);
  const adaptiveRecord = getAdaptiveRecord(paciente, ex.id) || {};
  const recent = getRecentExerciseStats(paciente, ex.id, 3);
  const meta = getExerciseMetadata(domId, ex);
  const area = getInterventionArea(paciente, domId);
  const priority = interventionPriorityWeight(area);

  // Puntaje mayor = mejor candidato.
  let score = 100;

  // 1. Adecuación al nivel actual.
  score -= distance * 14;

  // 2. Evitar repetición en la sesión y en sesiones recientes.
  if (usedIds.includes(ex.id)) score -= 55;
  score -= recent.recentCount * 15;

  // 3. Favorecer ejercicios menos practicados a largo plazo.
  score -= Math.min(adaptiveRecord.attempts || 0, 8) * 2;

  // 4. Variar subcomponentes cuando la metadata lo permite.
  if (meta.subcomponente && usedSubcomponents.includes(meta.subcomponente)) score -= 10;
  else if (meta.subcomponente) score += 5;

  // 5. El objetivo terapéutico del dominio mantiene peso en la decisión.
  score += priority * 4;

  if (intelligent) {
    // Si históricamente necesitó mucho apoyo, conservar desafío pero evitar
    // elegir repetidamente una tarea de alta carga dentro de la misma sesión.
    if (typeof recent.averageSupport === "number") score -= recent.averageSupport * 4;

    // Si la tarea quedó baja y no se ha repetido recientemente, no se abandona:
    // recibe una pequeña bonificación para volver a entrenarla.
    if (recent.lastPct !== null && recent.lastPct < 60 && recent.recentCount <= 1) score += 8;

    // Buen dominio reciente favorece variedad en vez de repetir inmediatamente.
    if (recent.lastPct !== null && recent.lastPct >= 85 && recent.recentCount > 0) score -= 5;
  }

  return {
    score,
    base,
    target,
    distance,
    recent,
    meta,
    priority,
    reasons: {
      difficultyFit: distance === 0 ? "muy adecuada" : distance === 1 ? "adecuada" : "más distante",
      recentUse: recent.recentCount,
      supportHistory: typeof recent.averageSupport === "number"
        ? Math.round(recent.averageSupport * 10) / 10
        : null,
      subcomponent: meta.subcomponente || null,
      interventionPriority: area?.prioridad || null,
      interventionStatus: area?.estado || null,
    },
  };
}

function chooseIntelligentExercise(paciente, domId, exs, context = {}) {
  if (!exs?.length) return null;

  const scored = exs.map(ex => ({
    ex,
    ...intelligentExerciseScore(paciente, domId, ex, context),
  }));

  scored.sort((a, b) =>
    b.score - a.score ||
    a.recent.recentCount - b.recent.recentCount ||
    a.distance - b.distance
  );

  // Mantiene una pequeña variedad controlada entre candidatos prácticamente equivalentes.
  const topScore = scored[0]?.score ?? 0;
  const topCandidates = scored.filter(x => x.score >= topScore - 3).slice(0, 3);
  const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)] || scored[0];

  return chosen ? {
    ex: chosen.ex,
    selectionScore: Math.round(chosen.score),
    selectionReasons: chosen.reasons,
    targetLevel: chosen.target,
  } : null;
}

function buildIntelligentDomainSequence(paciente, areas = [], duration = 6) {
  if (!areas.length || duration <= 0) return [];

  const weighted = areas.map(id => {
    const area = getInterventionArea(paciente, id);
    return {
      id,
      weight: interventionPriorityWeight(area) || 1,
      area,
      used: 0,
    };
  });

  const sequence = [];

  // Primera vuelta: asegurar cobertura de las áreas seleccionadas cuando
  // la duración lo permite.
  weighted
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, Math.min(duration, weighted.length))
    .forEach(item => {
      sequence.push(item.id);
      item.used += 1;
    });

  // Resto: distribución ponderada que evita repetir el mismo dominio seguido.
  while (sequence.length < duration) {
    const previous = sequence[sequence.length - 1];
    const candidates = weighted
      .map(item => ({
        ...item,
        need: item.weight / (item.used + 1),
        repetitionPenalty: item.id === previous ? 0.35 : 1,
      }))
      .sort((a, b) =>
        (b.need * b.repetitionPenalty) - (a.need * a.repetitionPenalty) ||
        a.used - b.used
      );

    const chosen = candidates[0];
    sequence.push(chosen.id);
    const original = weighted.find(x => x.id === chosen.id);
    original.used += 1;
  }

  return sequence;
}

// Compatibilidad: conserva el nombre anterior para cualquier consumidor existente.
function chooseAdaptiveExercise(paciente, domId, exs, usedIds = []) {
  const choice = chooseIntelligentExercise(paciente, domId, exs, {
    usedIds,
    intelligent: false,
    adaptive: true,
  });
  return choice?.ex || null;
}

const EX_ADULTO = {
  memoria_trabajo: [
    {
      id: "digits_forward",
      nombre: "Dígitos en orden",
      instruccion: "Escucha la secuencia de números y repítela en el mismo orden",
      Component: ({ onDone, modoMayor, difficultyLevel = 2 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const len = [0, 3, 4, 5, 6, 7][L];
        const [seq] = useState(() => Array.from({ length: len }, () => Math.floor(Math.random() * 9) + 1));
        const [phase, setPhase] = useState("show");
        const [input, setInput] = useState("");
        const [tl, setTl] = useState(len + 1);
        const timerRef = useRef();
        useEffect(() => {
          if (phase !== "show") return;
          timerRef.current = setInterval(() => setTl(t => {
            if (t <= 1) { clearInterval(timerRef.current); setPhase("input"); return 0; }
            return t - 1;
          }), 1000);
          return () => clearInterval(timerRef.current);
        }, [phase]);
        const check = () => {
          const correct = input.replace(/\s/g, "") === seq.join("");
          onDone({ correct: correct ? 1 : 0, total: 1, errors: correct ? 0 : 1, seconds: 0 });
        };
        if (phase === "show") return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <TimerBar current={tl} total={len + 1} mayor={M} />
            <p style={{ color: COLORS.textMuted, marginBottom: 12, fontSize: M ? "1rem" : ".85rem" }}>Memoriza esta secuencia</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {seq.map((n, i) => <div key={i} style={{ width: M ? 64 : 52, height: M ? 64 : 52, borderRadius: M ? 16 : 12, background: COLORS.primary + "22", border: `2px solid ${COLORS.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: M ? "1.8rem" : "1.4rem", fontWeight: 800, color: COLORS.primary }}>{n}</div>)}
            </div>
          </div>
        );
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontWeight: 600, marginBottom: 16 }}>Escribe la secuencia en orden</p>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ej: 3 7 2 8 4" autoFocus
              style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: M ? "1.3rem" : "1.1rem", textAlign: "center", width: "100%", maxWidth: M ? 340 : 280, marginBottom: 16 }} />
            <br />
            <BtnPrimary onClick={check}>Confirmar</BtnPrimary>
          </div>
        );
      }
    },
    {
      id: "digits_backward",
      nombre: "Dígitos al revés",
      instruccion: "Escucha la secuencia y repítela en orden INVERSO",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const len = [0, 2, 3, 4, 5, 6][L];
        const [seq] = useState(() => Array.from({ length: len }, () => Math.floor(Math.random() * 9) + 1));
        const [phase, setPhase] = useState("show");
        const [input, setInput] = useState("");
        const [tl, setTl] = useState(len + 1);
        const timerRef = useRef();
        useEffect(() => {
          if (phase !== "show") return;
          timerRef.current = setInterval(() => setTl(t => {
            if (t <= 1) { clearInterval(timerRef.current); setPhase("input"); return 0; }
            return t - 1;
          }), 1000);
          return () => clearInterval(timerRef.current);
        }, [phase]);
        const check = () => {
          const reversed = [...seq].reverse().join("");
          const correct = input.replace(/\s/g, "") === reversed;
          onDone({ correct: correct ? 1 : 0, total: 1, errors: correct ? 0 : 1, seconds: 0 });
        };
        if (phase === "show") return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <TimerBar current={tl} total={len + 1} mayor={M} />
            <p style={{ color: COLORS.textMuted, marginBottom: 12, fontSize: M ? "1rem" : ".85rem" }}>Memoriza esta secuencia</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {seq.map((n, i) => <div key={i} style={{ width: M ? 64 : 52, height: M ? 64 : 52, borderRadius: M ? 16 : 12, background: COLORS.primary + "22", border: `2px solid ${COLORS.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: M ? "1.8rem" : "1.4rem", fontWeight: 800, color: COLORS.primary }}>{n}</div>)}
            </div>
          </div>
        );
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Escríbelos al <span style={{ color: COLORS.error }}>revés</span></p>
            <p style={{ color: COLORS.textMuted, fontSize: ".85rem", marginBottom: 16 }}>Si viste 3-7-2, escribe 2-7-3</p>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Secuencia invertida" autoFocus
              style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: M ? "1.3rem" : "1.1rem", textAlign: "center", width: "100%", maxWidth: M ? 340 : 280, marginBottom: 16 }} />
            <br />
            <BtnPrimary onClick={check}>Confirmar</BtnPrimary>
          </div>
        );
      }
    },
    {
      id: "letter_number",
      nombre: "Secuencia letras y números",
      instruccion: "Escucha la secuencia y ordena primero los números (de menor a mayor) y luego las letras (alfabético)",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const SEQS = [
          { seq: "A 3 B 1", correct: "1 3 A B" },
          { seq: "C 7 A 2", correct: "2 7 A C" },
          { seq: "B 4 D 1 A", correct: "1 4 A B D" },
          { seq: "E 3 B 9 A 1", correct: "1 3 9 A B E" },
        ];
        const [item] = useState(() => SEQS[Math.floor(Math.random() * SEQS.length)]);
        const [phase, setPhase] = useState("show");
        const [input, setInput] = useState("");
        const [tl, setTl] = useState(8);
        const timerRef = useRef();
        const t0 = useRef(Date.now());
        useEffect(() => {
          if (phase !== "show") return;
          timerRef.current = setInterval(() => setTl(t => {
            if (t <= 1) { clearInterval(timerRef.current); setPhase("input"); return 0; }
            return t - 1;
          }), 1000);
          return () => clearInterval(timerRef.current);
        }, [phase]);
        const check = () => {
          const ok = input.trim().toUpperCase() === item.correct.toUpperCase();
          onDone({ correct: ok ? 1 : 0, total: 1, errors: ok ? 0 : 1, seconds: Math.round((Date.now() - t0.current) / 1000) });
        };
        if (phase === "show") return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>Memoriza · {tl}s</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {item.seq.split(" ").map((c, i) => <div key={i} style={{ width: M ? 64 : 52, height: M ? 64 : 52, borderRadius: M ? 16 : 12, background: COLORS.primary + "22", border: `2px solid ${COLORS.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 800, color: COLORS.primary }}>{c}</div>)}
            </div>
          </div>
        );
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Escribe: números ↑ luego letras A-Z</p>
            <p style={{ color: COLORS.textMuted, fontSize: ".82rem", marginBottom: 16 }}>Ej: si viste "B 3 A 1" escribe "1 3 A B"</p>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="1 3 A B..." autoFocus
              style={{ padding: M ? "16px 18px" : "12px 16px", borderRadius: M ? 12 : 10, border: `2px solid ${COLORS.border}`, fontSize: M ? "1.2rem" : "1rem", textAlign: "center", width: "100%", maxWidth: M ? 340 : 280, marginBottom: 16 }} />
            <br /><BtnPrimary onClick={check}>Confirmar</BtnPrimary>
          </div>
        );
      }
    },
    {
      id: "operation_span",
      nombre: "Cálculo y memoria",
      instruccion: "Resuelve cada operación y recuerda la respuesta. Al final escríbelas en orden.",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const ops = shuffle([
          { op: "3 + 4", ans: 7 }, { op: "8 - 3", ans: 5 }, { op: "6 × 2", ans: 12 },
          { op: "15 - 7", ans: 8 }, { op: "4 + 9", ans: 13 }, { op: "20 ÷ 4", ans: 5 },
        ]).slice(0, 4);
        const [phase, setPhase] = useState("ops"); // ops | recall
        const [cur, setCur] = useState(0);
        const [answers, setAnswers] = useState([]);
        const [input, setInput] = useState("");
        const [recallInput, setRecallInput] = useState("");
        const t0 = useRef(Date.now());
        const nextOp = () => {
          if (!input.trim()) return;
          setAnswers(prev => [...prev, input.trim()]);
          setInput("");
          if (cur + 1 >= ops.length) setPhase("recall");
          else setCur(c => c + 1);
        };
        const checkRecall = () => {
          const recalled = recallInput.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
          const correct = ops.filter((op, i) => recalled[i] && parseInt(recalled[i]) === op.ans).length;
          onDone({ correct, total: ops.length, errors: ops.length - correct, seconds: Math.round((Date.now() - t0.current) / 1000) });
        };
        if (phase === "ops") return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 8 }}>Operación {cur + 1}/{ops.length} · Recuerda las respuestas</p>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: COLORS.primary, marginBottom: 20 }}>{ops[cur].op} = ?</p>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Resultado" autoFocus type="number"
              style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: "1.1rem", textAlign: "center", width: 160, marginBottom: 16 }} />
            <br /><BtnPrimary onClick={nextOp}>Siguiente →</BtnPrimary>
          </div>
        );
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Escribe las {ops.length} respuestas en orden</p>
            <p style={{ color: COLORS.textMuted, fontSize: ".82rem", marginBottom: 16 }}>Separadas por espacios o comas</p>
            <input value={recallInput} onChange={e => setRecallInput(e.target.value)}
              placeholder="7 5 12 8..." autoFocus
              style={{ padding: M ? "16px 18px" : "12px 16px", borderRadius: M ? 12 : 10, border: `2px solid ${COLORS.border}`, fontSize: M ? "1.2rem" : "1rem", textAlign: "center", width: "100%", maxWidth: M ? 340 : 280, marginBottom: 16 }} />
            <br /><BtnPrimary onClick={checkRecall}>Ver resultados</BtnPrimary>
          </div>
        );
      }
    },
    {
      id: "nback_1",
      nombre: "¿Es igual al anterior?",
      instruccion: "Di si la imagen es igual a la que apareció justo antes",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const L = clampAdaptiveLevel(difficultyLevel);
        const ALL_EMOJIS = ["🐕","🐈","🌹","🎈","⭐","🍎","🏠","🚗","🌙","☀️"];
        const EMOJIS = ALL_EMOJIS.slice(0, [0, 4, 5, 6, 8, 10][L]);
        const LEN = [0, 7, 8, 10, 12, 14][L];
        const repeatProbability = [0, .48, .44, .40, .36, .32][L];
        const [seq] = useState(() => {
          const s = [];
          for (let i = 0; i < LEN; i++) {
            if (i > 0 && Math.random() < repeatProbability) s.push(s[i-1]);
            else s.push(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
          }
          return s;
        });
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [errors, setErrors] = useState(0);
        const [feedback, setFeedback] = useState(null);
        const t0 = useRef(Date.now());
        const responder = (esIgual) => {
          if (cur === 0 || feedback) return;
          const correcto = esIgual === (seq[cur] === seq[cur-1]);
          if (correcto) setScore(s => s + 1); else setErrors(e => e + 1);
          setFeedback(correcto ? "ok" : "error");
          setTimeout(() => {
            setFeedback(null);
            if (cur + 1 >= LEN) {
              const ns = score + (correcto ? 1 : 0);
              onDone({ correct: ns, total: LEN - 1, errors: errors + (correcto ? 0 : 1), seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else setCur(c => c + 1);
          }, 800);
        };
        return (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 8, fontSize: modoMayor ? "1rem" : ".85rem" }}>
              {cur + 1}/{LEN} {cur === 0 ? "· Mira y recuerda" : "· ¿Es igual a la anterior?"}
            </p>
            <div style={{ fontSize: modoMayor ? "8rem" : "6rem", marginBottom: 20, lineHeight: 1 }}>{seq[cur]}</div>
            {cur === 0 ? (
              <BtnPrimary onClick={() => setCur(1)} style={{ padding: modoMayor ? "16px 36px" : "12px 28px", fontSize: modoMayor ? "1.05rem" : ".9rem" }}>
                Siguiente →
              </BtnPrimary>
            ) : (
              <div>
                {feedback && <p style={{ fontWeight: 700, color: feedback === "ok" ? COLORS.success : COLORS.error, marginBottom: 12, fontSize: modoMayor ? "1.1rem" : ".95rem" }}>
                  {feedback === "ok" ? "✅ ¡Correcto!" : "❌ Incorrecto"}
                </p>}
                {!feedback && (
                  <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                    <button onClick={() => responder(true)} style={{ padding: modoMayor ? "18px 32px" : "14px 24px", borderRadius: 14, border: `2px solid ${COLORS.success}`, background: COLORS.success+"15", fontWeight: 700, fontSize: modoMayor ? "1.1rem" : ".95rem", cursor: "pointer", color: COLORS.success, fontFamily: "inherit" }}>
                      ✅ Sí, igual
                    </button>
                    <button onClick={() => responder(false)} style={{ padding: modoMayor ? "18px 32px" : "14px 24px", borderRadius: 14, border: `2px solid ${COLORS.error}`, background: COLORS.error+"15", fontWeight: 700, fontSize: modoMayor ? "1.1rem" : ".95rem", cursor: "pointer", color: COLORS.error, fontFamily: "inherit" }}>
                      ❌ No, diferente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    },
  ],
  memoria_episodica: [
    {
      id: "word_recall",
      nombre: "Recuerdo de palabras",
      instruccion: "Lee las palabras con atención. Luego deberás recordarlas.",
      Component: ({ onDone, modoMayor, difficultyLevel = 2 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const wordCount = [0, 5, 6, 8, 9, 10][L];
        const studySeconds = [0, 25, 22, 20, 17, 15][L];
        const WORDS = shuffle(["MANZANA", "CAMISA", "RÍO", "SILLA", "PERRO", "LIBRO", "MESA", "FLOR", "LLAVE", "NUBE", "PAN", "ZAPATO"]).slice(0, wordCount);
        const [phase, setPhase] = useState("study");
        const [tl, setTl] = useState(studySeconds);
        const [recalled, setRecalled] = useState("");
        const timerRef = useRef();
        useEffect(() => {
          if (phase !== "study") return;
          timerRef.current = setInterval(() => setTl(t => {
            if (t <= 1) { clearInterval(timerRef.current); setPhase("distract"); return 0; }
            return t - 1;
          }), 1000);
          return () => clearInterval(timerRef.current);
        }, [phase]);
        const [distTl, setDistTl] = useState(15);
        useEffect(() => {
          if (phase !== "distract") return;
          const t = setInterval(() => setDistTl(t => {
            if (t <= 1) { clearInterval(t); setPhase("recall"); return 0; }
            return t - 1;
          }), 1000);
          return () => clearInterval(t);
        }, [phase]);
        const check = () => {
          const words = recalled.toUpperCase().split(/[\s,;]+/).filter(Boolean);
          const correct = words.filter(w => WORDS.includes(w)).length;
          onDone({ correct, total: WORDS.length, errors: WORDS.length - correct, seconds: 0 });
        };
        if (phase === "study") return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>Lee y memoriza estas palabras · {tl}s</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 360, margin: "0 auto" }}>
              {WORDS.map((w, i) => <div key={i} style={{ padding: M ? "10px 20px" : "8px 16px", background: COLORS.primary + "15", border: `1.5px solid ${COLORS.primary}30`, borderRadius: 20, fontWeight: 600, fontSize: M ? "1.05rem" : ".9rem", color: COLORS.primary }}>{w}</div>)}
            </div>
          </div>
        );
        if (phase === "distract") return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>Tarea de distracción</p>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>Cuenta hacia atrás desde 20 en voz alta · {distTl}s</p>
            <p style={{ fontSize: "3rem", fontWeight: 900, color: COLORS.primary }}>{distTl}</p>
          </div>
        );
        return (
          <div style={{ padding: "20px 0" }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>¿Qué palabras recuerdas?</p>
            <p style={{ color: COLORS.textMuted, fontSize: ".85rem", marginBottom: 16 }}>Escríbelas separadas por comas o espacios</p>
            <textarea value={recalled} onChange={e => setRecalled(e.target.value)}
              placeholder="MANZANA, PERRO, LIBRO..."
              style={{ width: "100%", minHeight: 100, padding: "12px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: ".95rem", resize: "vertical", marginBottom: 16 }} />
            <BtnPrimary onClick={check} style={{ width: "100%" }}>Ver resultados</BtnPrimary>
          </div>
        );
      }
    },
    {
      id: "story_recall",
      nombre: "Recuerdo de historia",
      instruccion: "Lee esta historia con atención. Luego responderás preguntas.",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const STORIES = [
          {
            texto: "Ana Rodríguez, una maestra de 67 años de Medellín, fue al mercado el martes por la mañana. Compró 3 kilos de tomates y 2 pollos. Al salir, encontró a su vecino Carlos y le prestó 5.000 pesos para el bus.",
            preguntas: [
              { q: "¿Cómo se llama la protagonista?", a: "ana rodríguez", opts: ["María López", "Ana Rodríguez", "Carmen Pérez", "Laura Gómez"] },
              { q: "¿Cuántos años tiene?", a: "67", opts: ["57", "67", "77", "47"] },
              { q: "¿Qué día fue al mercado?", a: "martes", opts: ["Lunes", "Martes", "Miércoles", "Jueves"] },
              { q: "¿Cuántos pollos compró?", a: "2", opts: ["1", "2", "3", "4"] },
            ]
          },
          {
            texto: "El doctor Vargas llegó al hospital a las 8 de la mañana. Atendió a 12 pacientes antes del almuerzo. Por la tarde operó a un señor de 54 años con problema en la rodilla derecha. La operación duró 2 horas.",
            preguntas: [
              { q: "¿A qué hora llegó el doctor?", a: "8", opts: ["7 AM", "8 AM", "9 AM", "10 AM"] },
              { q: "¿Cuántos pacientes atendió por la mañana?", a: "12", opts: ["10", "11", "12", "13"] },
              { q: "¿Qué parte del cuerpo operó?", a: "rodilla", opts: ["Cadera", "Rodilla", "Tobillo", "Hombro"] },
              { q: "¿Cuánto duró la operación?", a: "2", opts: ["1 hora", "2 horas", "3 horas", "4 horas"] },
            ]
          }
        ];
        const [story] = useState(() => STORIES[Math.floor(Math.random() * STORIES.length)]);
        const [phase, setPhase] = useState("read");
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const pick = (opt) => {
          if (sel) return;
          setSel(opt);
          const ok = opt.toLowerCase().includes(story.preguntas[cur].a);
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            if (cur + 1 >= story.preguntas.length) {
              const ns = score + (ok ? 1 : 0);
              onDone({ correct: ns, total: story.preguntas.length, errors: story.preguntas.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else { setCur(c => c + 1); setSel(null); }
          }, 700);
        };
        if (phase === "read") return (
          <div>
            <p style={{ color: COLORS.textMuted, marginBottom: 12, fontSize: ".85rem" }}>Lee con atención — luego habrá preguntas</p>
            <div style={{ background: COLORS.bg, borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${COLORS.border}`, lineHeight: 1.8 }}>
              <p style={{ margin: 0 }}>{story.texto}</p>
            </div>
            <BtnPrimary onClick={() => setPhase("questions")} style={{ width: "100%" }}>Responder preguntas →</BtnPrimary>
          </div>
        );
        const q = story.preguntas[cur];
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 12 }}>Pregunta {cur + 1}/{story.preguntas.length}</p>
            <p style={{ fontWeight: 700, marginBottom: 16 }}>{q.q}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 380, margin: "0 auto" }}>
              {q.opts.map((opt, i) => (
                <button key={i} onClick={() => pick(opt)} style={{
                  padding: "12px 16px", borderRadius: 12, border: "2px solid", fontWeight: 600, fontSize: ".88rem", cursor: sel ? "default" : "pointer", textAlign: "left",
                  borderColor: !sel ? COLORS.border : opt.toLowerCase().includes(q.a) ? COLORS.success : sel === opt ? COLORS.error : COLORS.border,
                  background: !sel ? COLORS.white : opt.toLowerCase().includes(q.a) ? COLORS.success + "15" : sel === opt ? COLORS.error + "15" : COLORS.white,
                  color: COLORS.textPrimary,
                }}>{opt}</button>
              ))}
            </div>
          </div>
        );
      }
    },
  ],
  atencion: [
    {
      id: "sustained_attention",
      nombre: "Atención sostenida",
      instruccion: "Toca SOLO los números 3. Ignora todos los demás.",
      Component: ({ onDone, modoMayor, difficultyLevel = 2 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const TARGET = 3;
        const gridSize = [0, 20, 28, 36, 44, 52][L];
        const baseTime = [0, 100, 95, 90, 85, 80][L];
        const timeLimit = M ? Math.round(baseTime * 1.3) : baseTime;
        const [grid] = useState(() => Array.from({ length: gridSize }, () => Math.floor(Math.random() * 9) + 1));
        const [tapped, setTapped] = useState(new Set());
        const [wrong, setWrong] = useState(new Set());
        const [done, setDone] = useState(false);
        const [tl, setTl] = useState(timeLimit);
        const timerRef = useRef();
        const totalTargets = grid.filter(n => n === TARGET).length;

        useEffect(() => {
          timerRef.current = setInterval(() => setTl(t => {
            if (t <= 1) { clearInterval(timerRef.current); finish(); return 0; }
            return t - 1;
          }), 1000);
          return () => clearInterval(timerRef.current);
        }, []);

        const finish = () => {
          clearInterval(timerRef.current);
          setDone(true);
          setTimeout(() => onDone({ correct: tapped.size, total: totalTargets, errors: wrong.size, seconds: 0 }), 500);
        };

        const tap = (i) => {
          if (done) return;
          if (grid[i] === TARGET) {
            const n = new Set([...tapped, i]);
            setTapped(n);
            if (n.size === totalTargets) { clearInterval(timerRef.current); setDone(true); setTimeout(() => onDone({ correct: n.size, total: totalTargets, errors: wrong.size, seconds: 0 }), 400); }
          } else {
            setWrong(w => new Set([...w, i]));
          }
        };

        return (
          <div>
            <TimerBar current={tl} total={timeLimit} mayor={M} />
            <p style={{ color: COLORS.textMuted, marginBottom: 4, fontSize: M ? "1rem" : ".88rem" }}>Toca todos los <strong style={{ color: COLORS.error }}>3</strong> · {tapped.size}/{totalTargets} encontrados</p>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${M ? (L <= 2 ? 5 : 6) : (L <= 2 ? 6 : 8)}, 1fr)`, gap: M ? 8 : 6, marginBottom: 16 }}>
              {grid.map((n, i) => (
                <button key={i} onClick={() => tap(i)} style={{
                  aspectRatio: "1", borderRadius: M ? 10 : 8, border: "1.5px solid",
                  fontWeight: 700, fontSize: M ? "1.2rem" : ".95rem", cursor: "pointer",
                  borderColor: tapped.has(i) ? COLORS.success : wrong.has(i) ? COLORS.error : COLORS.border,
                  background: tapped.has(i) ? COLORS.success + "20" : wrong.has(i) ? COLORS.error + "20" : COLORS.bg,
                  color: tapped.has(i) ? COLORS.success : wrong.has(i) ? COLORS.error : COLORS.textPrimary,
                }}>{n}</button>
              ))}
            </div>
            {done && <p style={{ color: COLORS.success, fontWeight: 700, textAlign: "center" }}>✅ ¡Completado!</p>}
            {!done && <BtnSecondary onClick={finish} style={{ width: "100%", fontSize: M ? "1rem" : ".85rem" }}>Terminar</BtnSecondary>}
          </div>
        );
      }
    },
    {
      id: "divided_attention",
      nombre: "Atención dividida",
      instruccion: "Toca solo los números PARES que sean MAYORES que 5",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const gridSize = [0, 20, 28, 36, 44, 52][L];
        const maxNumber = [0, 10, 14, 18, 22, 26][L];
        const [grid] = useState(() => Array.from({ length: gridSize }, () => Math.floor(Math.random() * maxNumber) + 1));
        const isTarget = n => n % 2 === 0 && n > 5;
        const [tapped, setTapped] = useState(new Set());
        const [wrong, setWrong] = useState(new Set());
        const totalTargets = grid.filter(isTarget).length;
        const tap = (i) => {
          if (isTarget(grid[i])) {
            const n = new Set([...tapped, i]);
            setTapped(n);
            if (n.size === totalTargets) setTimeout(() => onDone({ correct: n.size, total: totalTargets, errors: wrong.size, seconds: 0 }), 400);
          } else setWrong(w => new Set([...w, i]));
        };
        return (
          <div>
            <p style={{ color: COLORS.textMuted, marginBottom: 4, fontSize: ".88rem" }}>Toca los <strong style={{ color: COLORS.primary }}>pares mayores que 5</strong> · {tapped.size}/{totalTargets}</p>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${M ? 6 : L <= 2 ? 7 : 9}, 1fr)`, gap: M ? 7 : 5, marginBottom: 14 }}>
              {grid.map((n, i) => (
                <button key={i} onClick={() => tap(i)} style={{
                  aspectRatio: "1", borderRadius: 6, border: "1.5px solid",
                  fontWeight: 700, fontSize: ".82rem", cursor: "pointer",
                  borderColor: tapped.has(i) ? COLORS.success : wrong.has(i) ? COLORS.error : COLORS.border,
                  background: tapped.has(i) ? COLORS.success + "20" : wrong.has(i) ? COLORS.error + "20" : COLORS.bg,
                  color: tapped.has(i) ? COLORS.success : wrong.has(i) ? COLORS.error : COLORS.textPrimary,
                }}>{n}</button>
              ))}
            </div>
            <BtnSecondary onClick={() => onDone({ correct: tapped.size, total: totalTargets, errors: wrong.size, seconds: 0 })} style={{ width: "100%", fontSize: ".85rem" }}>Terminar</BtnSecondary>
          </div>
        );
      }
    },
    {
      id: "find_animal",
      nombre: "Encuentra los animales",
      instruccion: "Toca solo los animales. Ignora todo lo demás.",
      Component: ({ onDone, modoMayor, difficultyLevel = 2 }) => {
        const L = clampAdaptiveLevel(difficultyLevel);
        const ANIMALS = ["🐕","🐈","🐦","🐠","🐇","🦋","🐢","🐄"];
        const OTHERS = ["🌹","🚗","🏠","📚","⌚","🎈","🍎","✂️","🌙","🔑"];
        const [grid] = useState(() => {
          const tc = [0, 3, 4, 5, 6, 7][L];
          const total = [0, 9, 12, 15, 18, 20][L];
          const items = [
            ...shuffle(ANIMALS).slice(0, tc).map(e => ({ emoji: e, isTarget: true })),
            ...shuffle(OTHERS).slice(0, total - tc).map(e => ({ emoji: e, isTarget: false }))
          ];
          return shuffle(items).map((item, i) => ({ ...item, id: i }));
        });
        const [tapped, setTapped] = useState(new Set());
        const [wrong, setWrong] = useState(new Set());
        const totalTargets = grid.filter(g => g.isTarget).length;
        const tap = (cell) => {
          if (tapped.has(cell.id) || wrong.has(cell.id)) return;
          if (cell.isTarget) {
            const n = new Set([...tapped, cell.id]);
            setTapped(n);
            if (n.size === totalTargets) setTimeout(() => onDone({ correct: n.size, total: totalTargets, errors: wrong.size, seconds: 0 }), 500);
          } else setWrong(w => new Set([...w, cell.id]));
        };
        return (
          <div>
            <p style={{ color: COLORS.textMuted, marginBottom: 12, fontSize: modoMayor ? "1rem" : ".85rem" }}>
              Toca los <strong>🐾 animales</strong> · {tapped.size}/{totalTargets}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${modoMayor ? 3 : 4}, 1fr)`, gap: modoMayor ? 12 : 8 }}>
              {grid.map((cell) => (
                <button key={cell.id} onClick={() => tap(cell)} style={{
                  aspectRatio: "1", borderRadius: 14, fontSize: modoMayor ? "2.5rem" : "1.8rem",
                  border: `2px solid ${tapped.has(cell.id) ? COLORS.success : wrong.has(cell.id) ? COLORS.error : COLORS.border}`,
                  background: tapped.has(cell.id) ? COLORS.success+"20" : wrong.has(cell.id) ? COLORS.error+"20" : COLORS.white,
                  cursor: "pointer",
                }}>{cell.emoji}</button>
              ))}
            </div>
            <BtnSecondary onClick={() => onDone({ correct: tapped.size, total: totalTargets, errors: wrong.size, seconds: 0 })}
              style={{ width: "100%", marginTop: 14, fontSize: modoMayor ? "1rem" : ".85rem" }}>
              Terminar
            </BtnSecondary>
          </div>
        );
      }
    },
  ],
  funciones_exec: [
    {
      id: "verbal_fluency",
      nombre: "Fluidez verbal semántica",
      instruccion: "Di todas las palabras de la categoría que puedas en 60 segundos",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const CATS = ["animales", "frutas", "herramientas", "prendas de ropa", "países"];
        const [cat] = useState(() => CATS[Math.floor(Math.random() * CATS.length)]);
        const [phase, setPhase] = useState("ready");
        const [words, setWords] = useState([]);
        const [input, setInput] = useState("");
        const [tl, setTl] = useState(60);
        const timerRef = useRef();
        const start = () => {
          setPhase("typing");
          timerRef.current = setInterval(() => setTl(t => {
            if (t <= 1) { clearInterval(timerRef.current); finish(); return 0; }
            return t - 1;
          }), 1000);
        };
        const finish = () => {
          clearInterval(timerRef.current);
          setPhase("done");
          const allWords = [...words, ...(input.trim() ? [input.trim()] : [])];
          setTimeout(() => onDone({
            correct: 0, total: 0, errors: 0, requiresReview: true,
            wordCount: allWords.length, words: allWords, category: cat, seconds: 60
          }), 500);
        };
        const addWord = (e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const w = input.trim();
            if (w && !words.map(x => x.toLowerCase()).includes(w.toLowerCase())) setWords(prev => [...prev, w]);
            setInput("");
          }
        };
        useEffect(() => () => clearInterval(timerRef.current), []);
        if (phase === "ready") return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗣️</div>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>Categoría: <span style={{ color: COLORS.primary }}>{cat.toUpperCase()}</span></p>
            <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>Di tantas palabras como puedas en 60 segundos</p>
            <BtnPrimary onClick={start} style={{ padding: M ? "16px 36px" : "11px 24px", fontSize: M ? "1.05rem" : ".9rem" }}>▶ Comenzar</BtnPrimary>
          </div>
        );
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: COLORS.primary }}>{cat.toUpperCase()}</span>
              <span style={{ fontSize: "1.3rem", fontWeight: 900, color: tl < 15 ? COLORS.error : COLORS.textPrimary }}>{tl}s</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 60, marginBottom: 12, padding: 12, background: COLORS.bg, borderRadius: 10 }}>
              {words.map((w, i) => <span key={i} style={{ padding: "4px 12px", background: COLORS.primary + "15", borderRadius: 20, fontSize: ".85rem", color: COLORS.primary, fontWeight: 600 }}>{w}</span>)}
            </div>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={addWord}
              placeholder="Escribe y presiona Enter..." autoFocus
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: ".95rem", marginBottom: 12 }} />
            <p style={{ fontSize: ".75rem", color: COLORS.textMuted, marginBottom: 12 }}>{words.length} palabras · Presiona Enter después de cada una</p>
            <BtnSecondary onClick={finish} style={{ width: "100%" }}>Terminar</BtnSecondary>
          </div>
        );
      }
    },
    {
      id: "trail_making",
      nombre: "Secuencia alternante",
      instruccion: "Toca en orden alternando: 1-A-2-B-3-C... lo más rápido posible",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const fullSequence = ["1","A","2","B","3","C","4","D","5","E","6","F","7","G"];
        const sequence = fullSequence.slice(0, [0, 6, 8, 10, 12, 14][L]);
        const [positions] = useState(() => shuffle(sequence.map((v, i) => ({ v, id: i, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 }))));
        const [next, setNext] = useState(0);
        const [errors, setErrors] = useState(0);
        const t0 = useRef(Date.now());
        const tap = (item) => {
          if (item.v === sequence[next]) {
            if (next + 1 >= sequence.length) {
              const secs = Math.round((Date.now() - t0.current) / 1000);
              const score = secs < 20 ? 5 : secs < 30 ? 4 : secs < 45 ? 3 : 2;
              onDone({ correct: score, total: 5, errors, seconds: secs });
            } else setNext(n => n + 1);
          } else setErrors(e => e + 1);
        };
        return (
          <div>
            <p style={{ color: COLORS.textMuted, marginBottom: 4, fontSize: ".88rem" }}>Siguiente: <strong style={{ color: COLORS.primary, fontSize: "1.1rem" }}>{sequence[next]}</strong> · {next}/{sequence.length}</p>
            <div style={{ position: "relative", height: 260, background: COLORS.bg, borderRadius: 12, border: `1px solid ${COLORS.border}`, marginBottom: 12 }}>
              {positions.map((item, i) => {
                const done = sequence.indexOf(item.v) < next;
                const isNext = item.v === sequence[next];
                return (
                  <button key={i} onClick={() => tap(item)} style={{
                    position: "absolute", left: `${item.x}%`, top: `${item.y}%`,
                    transform: "translate(-50%,-50%)",
                    width: 44, height: 44, borderRadius: "50%",
                    border: `2px solid ${done ? COLORS.success : isNext ? COLORS.primary : COLORS.border}`,
                    background: done ? COLORS.success + "20" : isNext ? COLORS.primary + "15" : COLORS.white,
                    fontWeight: 800, fontSize: ".9rem", cursor: "pointer",
                    color: done ? COLORS.success : isNext ? COLORS.primary : COLORS.textPrimary,
                    boxShadow: isNext ? `0 0 12px ${COLORS.primary}40` : "none",
                  }}>{item.v}</button>
                );
              })}
            </div>
            {errors > 0 && <p style={{ fontSize: ".78rem", color: COLORS.error }}>Errores: {errors}</p>}
          </div>
        );
      }
    },
  ],
  velocidad_proc: [
    {
      id: "reaction_time",
      nombre: "Tiempo de reacción",
      instruccion: "Toca el círculo verde lo más rápido posible cuando aparezca",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const [phase, setPhase] = useState("wait"); // wait | ready | go | result
        const [times, setTimes] = useState([]);
        const [round, setRound] = useState(0);
        const [startTime, setStartTime] = useState(null);
        const timerRef = useRef();
        const ROUNDS = 5;
        const start = () => {
          setPhase("wait");
          const delay = 2000 + Math.random() * 3000;
          timerRef.current = setTimeout(() => { setPhase("go"); setStartTime(Date.now()); }, delay);
        };
        useEffect(() => { start(); return () => clearTimeout(timerRef.current); }, []);
        const tap = () => {
          if (phase !== "go") return;
          const rt = Date.now() - startTime;
          const newTimes = [...times, rt];
          setTimes(newTimes);
          if (round + 1 >= ROUNDS) {
            const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
            const variance = Math.round(newTimes.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / newTimes.length);
            onDone({
              correct: 0, total: 0, errors: 0, requiresReview: true,
              avgMs: avg,
              variabilityMs: Math.round(Math.sqrt(variance)),
              reactionTimes: newTimes,
              completedTrials: newTimes.length,
              seconds: Math.round((Date.now() - (startTime || Date.now())) / 1000)
            });
          } else {
            setRound(r => r + 1);
            setPhase("wait");
            start();
          }
        };
        const avgMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>Intento {round + 1}/{ROUNDS} {avgMs ? `· Promedio: ${avgMs}ms` : ""}</p>
            <button onClick={tap} style={{
              width: M ? 200 : 160, height: M ? 200 : 160, borderRadius: "50%", border: "none", cursor: phase === "go" ? "pointer" : "default",
              background: phase === "go" ? COLORS.success : phase === "wait" ? COLORS.error + "40" : COLORS.textLight,
              transition: "background .1s", fontSize: M ? "1.3rem" : "1rem", fontWeight: 700,
              color: phase === "go" ? COLORS.white : COLORS.textMuted,
              boxShadow: phase === "go" ? `0 0 30px ${COLORS.success}60` : "none",
            }}>
              {phase === "go" ? "¡TOCA!" : phase === "wait" ? "Espera..." : "Listo"}
            </button>
            <p style={{ marginTop: 16, fontSize: ".82rem", color: COLORS.textMuted }}>
              {times.length > 0 && `Último: ${times[times.length-1]}ms`}
            </p>
          </div>
        );
      }
    },
    {
      id: "color_naming",
      nombre: "Nombrar colores",
      instruccion: "Toca el color que se menciona lo más rápido posible",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const COLORS_MAP = [
          { name: "ROJO", bg: "#EF4444" },
          { name: "AZUL", bg: "#3B82F6" },
          { name: "VERDE", bg: "#22C55E" },
          { name: "AMARILLO", bg: "#EAB308" },
          { name: "NARANJA", bg: "#F97316" },
        ];
        const ROUNDS = 10;
        const [items] = useState(() => Array.from({ length: ROUNDS }, () => {
          const target = COLORS_MAP[Math.floor(Math.random() * COLORS_MAP.length)];
          const opts = shuffle(COLORS_MAP).slice(0, 4);
          if (!opts.find(o => o.name === target.name)) opts[0] = target;
          return { target, opts: shuffle(opts) };
        }));
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [times, setTimes] = useState([]);
        const itemStart = useRef(Date.now());
        const t0 = useRef(Date.now());
        useEffect(() => { itemStart.current = Date.now(); }, [cur]);
        const pick = (opt) => {
          const rt = Date.now() - itemStart.current;
          const ok = opt.name === items[cur].target.name;
          if (ok) setScore(s => s + 1);
          setTimes(prev => [...prev, rt]);
          if (cur + 1 >= ROUNDS) {
            const ns = score + (ok ? 1 : 0);
            onDone({ correct: ns, total: ROUNDS, errors: ROUNDS - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
          } else setCur(c => c + 1);
        };
        const item = items[cur];
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{ROUNDS}</p>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: COLORS.textPrimary, marginBottom: 24, padding: "16px", background: COLORS.bg, borderRadius: 12 }}>
              {item.target.name}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, maxWidth: 300, margin: "0 auto" }}>
              {item.opts.map((opt, i) => (
                <button key={i} onClick={() => pick(opt)} style={{
                  height: 60, borderRadius: 12, border: "none", cursor: "pointer",
                  background: opt.bg, color: "white", fontWeight: 700, fontSize: ".88rem",
                }}>{opt.name}</button>
              ))}
            </div>
          </div>
        );
      }
    },
  ],
  lenguaje: [
    {
      id: "naming",
      nombre: "Denominación",
      instruccion: "¿Cómo se llama cada cosa? Escribe el nombre y toca Siguiente",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const EASY = [
          { emoji: "⌚", answer: ["reloj", "reloj de pulsera"] },
          { emoji: "✂️", answer: ["tijeras", "tijera"] },
          { emoji: "🔑", answer: ["llave"] },
          { emoji: "🌵", answer: ["cactus"] },
        ];
        const HARD = [
          { emoji: "🌡️", answer: ["termómetro"] },
          { emoji: "⚓", answer: ["ancla"] },
          { emoji: "🎻", answer: ["violín", "violin"] },
          { emoji: "🦦", answer: ["nutria"] },
          { emoji: "🧲", answer: ["imán", "iman"] },
          { emoji: "🪗", answer: ["acordeón", "acordeon"] },
        ];
        const count = [0, 4, 5, 6, 7, 8][L];
        const pool = L <= 2 ? [...EASY, ...HARD.slice(0, 2)] : L === 3 ? [...EASY, ...HARD] : [...HARD, ...EASY];
        const ITEMS = shuffle(pool).slice(0, count);
        const [cur, setCur] = useState(0);
        const [input, setInput] = useState("");
        const [score, setScore] = useState(0);
        const [feedback, setFeedback] = useState(null); // null | "ok" | "error"
        const t0 = useRef(Date.now());

        const check = () => {
          if (!input.trim()) return;
          const ok = ITEMS[cur].answer.includes(input.toLowerCase().trim());
          if (ok) setScore(s => s + 1);
          setFeedback(ok ? "ok" : "error");
          // Esperar 1 segundo mostrando feedback ANTES de cambiar imagen
          setTimeout(() => {
            setFeedback(null);
            if (cur + 1 >= ITEMS.length) {
              const ns = score + (ok ? 1 : 0);
              onDone({ correct: ns, total: ITEMS.length, errors: ITEMS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else {
              setCur(c => c + 1);
              setInput("");
            }
          }, 1200);
        };

        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: ".95rem" }}>{cur + 1} / {ITEMS.length}</p>
            {/* Imagen grande y fija — no cambia hasta confirmar */}
            <div style={{ fontSize: M ? "9rem" : "7rem", marginBottom: 24, lineHeight: 1, minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ITEMS[cur].emoji}
            </div>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="¿Cómo se llama?"
              disabled={feedback !== null}
              style={{ padding: "14px 18px", borderRadius: 12, border: `2px solid ${feedback === "ok" ? COLORS.success : feedback === "error" ? COLORS.error : COLORS.border}`, fontSize: "1.1rem", textAlign: "center", width: "100%", maxWidth: 300, marginBottom: 16, background: feedback === "ok" ? COLORS.success + "10" : feedback === "error" ? COLORS.error + "10" : COLORS.white }}
            />
            {feedback && (
              <p style={{ fontWeight: 700, color: feedback === "ok" ? COLORS.success : COLORS.error, marginBottom: 12, fontSize: "1rem" }}>
                {feedback === "ok" ? "✅ ¡Correcto!" : `❌ Era: ${ITEMS[cur].answer[0]}`}
              </p>
            )}
            {!feedback && (
              <BtnPrimary onClick={check} disabled={!input.trim()} style={{ padding: M ? "18px 40px" : "14px 36px", fontSize: M ? "1.15rem" : "1rem" }}>
                Siguiente →
              </BtnPrimary>
            )}
          </div>
        );
      }
    },
    {
      id: "analogias_verbales",
      nombre: "Analogías verbales",
      instruccion: "Completa la analogía eligiendo la palabra correcta",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const L = clampAdaptiveLevel(difficultyLevel);
        const ITEMS = shuffle([
          { enunciado: "El médico cura enfermos, el maestro ___", opts: ["cocina","enseña","construye","maneja"], ans: "enseña" },
          { enunciado: "El pájaro tiene alas, el pez tiene ___", opts: ["patas","escamas","aletas","plumas"], ans: "aletas" },
          { enunciado: "El día tiene sol, la noche tiene ___", opts: ["lluvia","luna","viento","nubes"], ans: "luna" },
          { enunciado: "El zapato va en el pie, el guante va en la ___", opts: ["cabeza","mano","rodilla","espalda"], ans: "mano" },
          { enunciado: "La abeja produce miel, la vaca produce ___", opts: ["lana","leche","huevos","carne"], ans: "leche" },
          { enunciado: "El libro tiene páginas, el cuaderno tiene ___", opts: ["capítulos","hojas","tapas","índice"], ans: "hojas" },
          { enunciado: "Brújula es a dirección como termómetro es a ___", opts: ["distancia","temperatura","peso","velocidad"], ans: "temperatura" },
          { enunciado: "Semilla es a planta como huevo es a ___", opts: ["nido","ave","pluma","árbol"], ans: "ave" },
        ]).slice(0, [0, 3, 4, 5, 6, 7][L]);
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const pick = (opt) => {
          if (sel) return; setSel(opt);
          const ok = opt === ITEMS[cur].ans;
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            if (cur + 1 >= ITEMS.length) {
              const ns = score + (ok ? 1 : 0);
              onDone({ correct: ns, total: ITEMS.length, errors: ITEMS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else { setCur(c => c + 1); setSel(null); }
          }, 900);
        };
        const item = ITEMS[cur];
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{ITEMS.length}</p>
            <div style={{ background: COLORS.primary+"08", borderRadius: 14, padding: "18px 20px", marginBottom: 20, border: `1px solid ${COLORS.primary}15` }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: modoMayor ? "1.2rem" : "1rem", lineHeight: 1.6 }}>{item.enunciado}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, maxWidth: 380, margin: "0 auto" }}>
              {item.opts.map((opt, i) => (
                <button key={i} onClick={() => pick(opt)} style={{
                  padding: modoMayor ? "16px 12px" : "12px 10px", borderRadius: 12, border: "2px solid",
                  fontWeight: 600, fontSize: modoMayor ? "1.1rem" : ".9rem", cursor: sel ? "default" : "pointer", fontFamily: "inherit",
                  borderColor: !sel ? COLORS.border : opt === item.ans ? COLORS.success : sel === opt ? COLORS.error : COLORS.border,
                  background: !sel ? COLORS.white : opt === item.ans ? COLORS.success+"15" : sel === opt ? COLORS.error+"15" : COLORS.white,
                  color: COLORS.textPrimary,
                }}>{opt}</button>
              ))}
            </div>
          </div>
        );
      }
    },
    {
      id: "verbal_comprehension",
      nombre: "Comprensión verbal",
      instruccion: "Elige la palabra que mejor completa la oración",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const ITEMS = shuffle([
          { oracion: "El sol sale por el ___.", ans: "este", opts: ["norte", "sur", "este", "oeste"] },
          { oracion: "El hijo de mi hermana es mi ___.", ans: "sobrino", opts: ["primo", "sobrino", "nieto", "cuñado"] },
          { oracion: "Cuando el río suena, piedras ___.", ans: "lleva", opts: ["trae", "lleva", "mueve", "rompe"] },
          { oracion: "El agua hierve a ___ grados centígrados.", ans: "100", opts: ["50", "75", "100", "120"] },
          { oracion: "El corazón ___ unas 70 veces por minuto.", ans: "late", opts: ["salta", "late", "bombea", "corre"] },
          { oracion: "Los peces respiran con ___.", ans: "branquias", opts: ["pulmones", "branquias", "escamas", "aletas"] },
          { oracion: "Una persona prudente suele actuar con ___.", ans: "cautela", opts: ["prisa", "cautela", "enojo", "azar"] },
          { oracion: "Si una explicación es ambigua, puede resultar ___.", ans: "confusa", opts: ["exacta", "confusa", "breve", "visible"] },
        ]).slice(0, [0, 3, 4, 5, 6, 7][L]);
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const pick = (opt) => {
          if (sel) return;
          setSel(opt);
          const ok = opt === ITEMS[cur].ans;
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            if (cur + 1 >= ITEMS.length) {
              const ns = score + (ok ? 1 : 0);
              onDone({ correct: ns, total: ITEMS.length, errors: ITEMS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else { setCur(c => c + 1); setSel(null); }
          }, 600);
        };
        const item = ITEMS[cur];
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{ITEMS.length}</p>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 24, padding: "0 8px" }}>{item.oracion}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, maxWidth: 320, margin: "0 auto" }}>
              {item.opts.map((opt, i) => (
                <button key={i} onClick={() => pick(opt)} style={{
                  padding: "13px 10px", borderRadius: 12, border: "2px solid", fontWeight: 600, cursor: sel ? "default" : "pointer",
                  borderColor: !sel ? COLORS.border : opt === item.ans ? COLORS.success : sel === opt ? COLORS.error : COLORS.border,
                  background: !sel ? COLORS.white : opt === item.ans ? COLORS.success + "15" : sel === opt ? COLORS.error + "15" : COLORS.white,
                  color: COLORS.textPrimary,
                }}>{opt}</button>
              ))}
            </div>
          </div>
        );
      }
    },
  ],
  percepcion_visual: [
    {
      id: "visual_matching",
      nombre: "Emparejamiento visual",
      instruccion: "Encuentra la figura idéntica al modelo",
      Component: ({ onDone, modoMayor, difficultyLevel = 2 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const SHAPES = ["🔺", "🔵", "🟥", "⭐", "🔷", "🟡", "🟤", "⬛"];
        const ROUNDS = [0, 4, 5, 6, 7, 8][L];
        const distractors = [0, 2, 3, 3, 4, 5][L];
        const [data] = useState(() => Array.from({ length: ROUNDS }, () => {
          const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
          const opts = shuffle([target, ...shuffle(SHAPES.filter(s => s !== target)).slice(0, distractors)]);
          return { target, opts };
        }));
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const pick = (opt) => {
          if (sel) return;
          setSel(opt);
          const ok = opt === data[cur].target;
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            if (cur + 1 >= ROUNDS) {
              const ns = score + (ok ? 1 : 0);
              onDone({ correct: ns, total: ROUNDS, errors: ROUNDS - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else { setCur(c => c + 1); setSel(null); }
          }, 600);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 12 }}>{cur + 1}/{ROUNDS}</p>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: ".82rem", color: COLORS.textMuted, marginBottom: 8 }}>Modelo</p>
              <div style={{ fontSize: "3.5rem" }}>{data[cur].target}</div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {data[cur].opts.map((opt, i) => (
                <button key={i} onClick={() => pick(opt)} style={{
                  width: 72, height: 72, borderRadius: 16, fontSize: "2rem",
                  border: `2px solid ${!sel ? COLORS.border : opt === data[cur].target ? COLORS.success : sel === opt ? COLORS.error : COLORS.border}`,
                  background: !sel ? COLORS.white : opt === data[cur].target ? COLORS.success + "20" : sel === opt ? COLORS.error + "20" : COLORS.white,
                  cursor: sel ? "default" : "pointer",
                }}>{opt}</button>
              ))}
            </div>
          </div>
        );
      }
    },
    {
      id: "pe_rotacion",
      nombre: "¿Igual o diferente?",
      instruccion: "Di si la segunda figura es IGUAL a la primera (puede estar rotada) o es DIFERENTE",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const PARES = shuffle([
          { a: "🔺", b: "🔺", igual: true },
          { a: "🔵", b: "🔵", igual: true },
          { a: "⭐", b: "⭐", igual: true },
          { a: "🟥", b: "🟦", igual: false },
          { a: "🔺", b: "🔵", igual: false },
          { a: "⭐", b: "🟡", igual: false },
          { a: "🔷", b: "🔷", igual: true },
          { a: "🟤", b: "⬛", igual: false },
          { a: "🌟", b: "⭐", igual: false },
          { a: "🔶", b: "🔶", igual: true },
        ]).slice(0, 8);
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [feedback, setFeedback] = useState(null);
        const t0 = useRef(Date.now());
        const responder = (esIgual) => {
          if (feedback) return;
          const ok = esIgual === PARES[cur].igual;
          if (ok) setScore(s => s + 1);
          setFeedback(ok ? "ok" : "error");
          setTimeout(() => {
            setFeedback(null);
            if (cur + 1 >= PARES.length) {
              const ns = score + (ok ? 1 : 0);
              onDone({ correct: ns, total: PARES.length, errors: PARES.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else setCur(c => c + 1);
          }, 800);
        };
        const par = PARES[cur];
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{PARES.length}</p>
            <div style={{ display: "flex", gap: M ? 40 : 28, justifyContent: "center", alignItems: "center", marginBottom: 28 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: ".72rem", color: COLORS.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>Figura 1</p>
                <div style={{ fontSize: M ? "5rem" : "4rem", padding: M ? 20 : 14, background: COLORS.bg, borderRadius: 16, border: `2px solid ${COLORS.border}` }}>{par.a}</div>
              </div>
              <span style={{ fontSize: M ? "1.8rem" : "1.4rem", color: COLORS.textMuted }}>vs</span>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: ".72rem", color: COLORS.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>Figura 2</p>
                <div style={{ fontSize: M ? "5rem" : "4rem", padding: M ? 20 : 14, background: COLORS.bg, borderRadius: 16, border: `2px solid ${COLORS.border}` }}>{par.b}</div>
              </div>
            </div>
            {feedback && <p style={{ fontWeight: 700, color: feedback === "ok" ? COLORS.success : COLORS.error, marginBottom: 12, fontSize: M ? "1.1rem" : ".95rem" }}>
              {feedback === "ok" ? "✅ ¡Correcto!" : `❌ Son ${par.igual ? "IGUALES" : "DIFERENTES"}`}
            </p>}
            {!feedback && (
              <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                <button onClick={() => responder(true)} style={{ padding: M ? "18px 32px" : "14px 24px", borderRadius: 14, border: `2px solid ${COLORS.success}`, background: COLORS.success+"15", fontWeight: 700, fontSize: M ? "1.1rem" : ".95rem", cursor: "pointer", color: COLORS.success, fontFamily: "inherit" }}>
                  ✅ Igual
                </button>
                <button onClick={() => responder(false)} style={{ padding: M ? "18px 32px" : "14px 24px", borderRadius: 14, border: `2px solid ${COLORS.error}`, background: COLORS.error+"15", fontWeight: 700, fontSize: M ? "1.1rem" : ".95rem", cursor: "pointer", color: COLORS.error, fontFamily: "inherit" }}>
                  ❌ Diferente
                </button>
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: "pe_contar",
      nombre: "¿Cuántos hay?",
      instruccion: "Cuenta cuántos emojis iguales al modelo aparecen en la cuadrícula",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const POOL = ["🐕","🐈","🌹","🎈","⭐","🍎","🏠","🚗","🌙","☀️","🦋","🔑"];
        const ROUNDS = [0, 4, 5, 6, 7, 8][L];
        const totalStimuli = [0, 10, 12, 16, 20, 24][L];
        const [data] = useState(() => Array.from({ length: ROUNDS }, () => {
          const target = POOL[Math.floor(Math.random() * POOL.length)];
          const others = POOL.filter(p => p !== target);
          const count = Math.floor(Math.random() * (L >= 4 ? 5 : 4)) + 2;
          const total = totalStimuli;
          const items = [];
          for (let i = 0; i < count; i++) items.push(target);
          while (items.length < total) items.push(others[Math.floor(Math.random() * others.length)]);
          return { target, items: shuffle(items), count };
        }));
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const [feedback, setFeedback] = useState(null);
        const t0 = useRef(Date.now());
        const d = data[cur];
        const opts = shuffle([d.count, d.count + 1, Math.max(1, d.count - 1), d.count + 2]).slice(0, 4);
        if (!opts.includes(d.count)) opts[0] = d.count;
        const pick = (n) => {
          if (feedback) return;
          setSel(n);
          const ok = n === d.count;
          if (ok) setScore(s => s + 1);
          setFeedback(ok ? "ok" : "error");
          setTimeout(() => {
            setSel(null); setFeedback(null);
            if (cur + 1 >= ROUNDS) {
              const ns = score + (ok ? 1 : 0);
              onDone({ correct: ns, total: ROUNDS, errors: ROUNDS - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else setCur(c => c + 1);
          }, 900);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 8, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{ROUNDS} · ¿Cuántos <span style={{ fontSize: M ? "1.6rem" : "1.2rem" }}>{d.target}</span> ves?</p>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${M ? 4 : 4}, 1fr)`, gap: M ? 10 : 6, marginBottom: 20, padding: 12, background: COLORS.bg, borderRadius: 14, maxWidth: 360, margin: "0 auto 20px" }}>
              {d.items.map((e, i) => <div key={i} style={{ fontSize: M ? "2rem" : "1.5rem", padding: M ? 8 : 4, textAlign: "center" }}>{e}</div>)}
            </div>
            {feedback && <p style={{ fontWeight: 700, color: feedback === "ok" ? COLORS.success : COLORS.error, marginBottom: 12 }}>
              {feedback === "ok" ? "✅ ¡Correcto!" : `❌ Eran ${d.count}`}
            </p>}
            {!feedback && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, maxWidth: 280, margin: "0 auto" }}>
                {shuffle(opts).map((n, i) => (
                  <button key={i} onClick={() => pick(n)} style={{
                    padding: M ? "18px" : "14px", borderRadius: 12, border: "2px solid", fontWeight: 800,
                    fontSize: M ? "1.4rem" : "1.1rem", cursor: "pointer", fontFamily: "inherit",
                    borderColor: COLORS.border, background: COLORS.white, color: COLORS.textPrimary,
                  }}>{n}</button>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: "pe_patron",
      nombre: "¿Qué sigue?",
      instruccion: "Observa el patrón y elige qué elemento debe seguir",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const PATRONES = shuffle([
          { seq: ["🔴","🔵","🔴","🔵","🔴"], ans: "🔵", opts: ["🔵","🟡","🟢","🔴"] },
          { seq: ["⭐","⭐","🌙","⭐","⭐"], ans: "🌙", opts: ["🌙","⭐","☀️","🌟"] },
          { seq: ["🐕","🐈","🐕","🐈","🐕"], ans: "🐈", opts: ["🐕","🐈","🐦","🐇"] },
          { seq: ["🟥","🟦","🟩","🟥","🟦"], ans: "🟩", opts: ["🟥","🟦","🟩","🟨"] },
          { seq: ["1️⃣","2️⃣","3️⃣","1️⃣","2️⃣"], ans: "3️⃣", opts: ["1️⃣","2️⃣","3️⃣","4️⃣"] },
          { seq: ["🌞","🌙","🌞","🌙","🌞"], ans: "🌙", opts: ["🌞","🌙","⭐","☁️"] },
          { seq: ["🍎","🍊","🍋","🍎","🍊"], ans: "🍋", opts: ["🍎","🍊","🍋","🍇"] },
        ]).slice(0, 6);
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const p = PATRONES[cur];
        const pick = (opt) => {
          if (sel) return; setSel(opt);
          const ok = opt === p.ans;
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            setSel(null);
            if (cur + 1 >= PATRONES.length) {
              const ns = score + (ok ? 1 : 0);
              onDone({ correct: ns, total: PATRONES.length, errors: PATRONES.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else setCur(c => c + 1);
          }, 800);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{PATRONES.length} · ¿Qué sigue?</p>
            <div style={{ display: "flex", gap: M ? 12 : 8, justifyContent: "center", alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
              {p.seq.map((e, i) => <span key={i} style={{ fontSize: M ? "2.5rem" : "2rem" }}>{e}</span>)}
              <span style={{ fontSize: M ? "2.5rem" : "2rem", opacity: .3 }}>?</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, maxWidth: 280, margin: "0 auto" }}>
              {p.opts.map((opt, i) => (
                <button key={i} onClick={() => pick(opt)} style={{
                  padding: M ? "18px" : "14px", borderRadius: 12, fontSize: M ? "2rem" : "1.6rem",
                  border: `2px solid ${!sel ? COLORS.border : opt === p.ans ? COLORS.success : sel === opt ? COLORS.error : COLORS.border}`,
                  background: !sel ? COLORS.white : opt === p.ans ? COLORS.success+"15" : sel === opt ? COLORS.error+"15" : COLORS.white,
                  cursor: sel ? "default" : "pointer",
                }}>{opt}</button>
              ))}
            </div>
          </div>
        );
      }
    },
  ],
  orientacion: [
    {
      id: "temporal_orientation",
      nombre: "Orientación temporal",
      instruccion: "Responde las siguientes preguntas sobre la fecha de hoy",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const now = new Date();
        const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
        const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
        const QUESTIONS = [
          { q: "¿En qué año estamos?", answer: String(now.getFullYear()) },
          { q: "¿En qué mes estamos?", answer: MESES[now.getMonth()] },
          { q: "¿Qué día del mes es hoy?", answer: String(now.getDate()) },
          { q: "¿Qué día de la semana es hoy?", answer: DIAS[now.getDay()] },
        ];
        const [cur, setCur] = useState(0);
        const [input, setInput] = useState("");
        const [score, setScore] = useState(0);
        const [feedback, setFeedback] = useState(null);
        const t0 = useRef(Date.now());
        const check = () => {
          if (!input.trim()) return;
          const ok = input.toLowerCase().trim() === QUESTIONS[cur].answer.toLowerCase();
          if (ok) setScore(s => s + 1);
          setFeedback(ok ? "ok" : "error");
          setTimeout(() => {
            setFeedback(null);
            if (cur + 1 >= QUESTIONS.length) {
              const ns = score + (ok ? 1 : 0);
              onDone({ correct: ns, total: QUESTIONS.length, errors: QUESTIONS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
            } else { setCur(c => c + 1); setInput(""); }
          }, 1200);
        };
        const q = QUESTIONS[cur];
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>{cur + 1}/{QUESTIONS.length}</p>
            <p style={{ fontWeight: 700, fontSize: M ? "1.5rem" : "1.2rem", marginBottom: 24, lineHeight: 1.5 }}>{q.q}</p>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Tu respuesta..." disabled={feedback !== null}
              style={{ padding: "14px 18px", borderRadius: 12, border: `2px solid ${feedback === "ok" ? COLORS.success : feedback === "error" ? COLORS.error : COLORS.border}`, fontSize: "1.1rem", textAlign: "center", width: "100%", maxWidth: 300, marginBottom: 14, background: feedback === "ok" ? COLORS.success+"10" : feedback === "error" ? COLORS.error+"10" : COLORS.white }} />
            {feedback && <p style={{ fontWeight: 700, color: feedback === "ok" ? COLORS.success : COLORS.error, marginBottom: 12 }}>{feedback === "ok" ? "✅ ¡Correcto!" : `❌ Era: ${q.answer}`}</p>}
            {!feedback && <BtnPrimary onClick={check} disabled={!input.trim()} style={{ padding: M ? "18px 40px" : "14px 36px", fontSize: M ? "1.15rem" : "1rem" }}>Confirmar →</BtnPrimary>}
          </div>
        );
      }
    },
    {
      id: "spatial_orientation",
      nombre: "Orientación espacial",
      instruccion: "Responde las preguntas sobre el lugar donde te encuentras",
      Component: ({ onDone, paciente, modoMayor }) => {
        const M = modoMayor || false;
        const QUESTIONS = [
          { q: "¿En qué ciudad estás ahora?", tipo: "libre" },
          { q: "¿En qué país vives?", tipo: "libre" },
          { q: "¿Cómo se llama el lugar donde estás ahora?", tipo: "libre" },
          { q: "¿En qué piso o nivel estás?", tipo: "libre" },
        ];
        const [cur, setCur] = useState(0);
        const [input, setInput] = useState("");
        const [score, setScore] = useState(0);
        const [answers, setAnswers] = useState([]);
        const t0 = useRef(Date.now());
        const next = () => {
          if (!input.trim()) return;
          const newAnswers = [...answers, { q: QUESTIONS[cur].q, a: input.trim() }];
          setAnswers(newAnswers);
          if (cur + 1 >= QUESTIONS.length) {
            onDone({ correct: 0, total: 0, errors: 0, requiresReview: true, completedResponses: newAnswers.length, seconds: Math.round((Date.now() - t0.current) / 1000), answers: newAnswers });
          } else { setCur(c => c + 1); setInput(""); }
        };
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{QUESTIONS.length}</p>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 20 }}>{QUESTIONS[cur].q}</p>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Tu respuesta..." autoFocus
              style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: "1rem", textAlign: "center", width: "100%", maxWidth: 300, marginBottom: 16 }} />
            <br /><BtnPrimary onClick={next}>Siguiente →</BtnPrimary>
          </div>
        );
      }
    },
    {
      id: "or_personas",
      nombre: "Orientación personal",
      instruccion: "Responde las siguientes preguntas sobre ti y las personas cercanas",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const QUESTIONS = [
          { q: "¿Cuál es tu nombre completo?" },
          { q: "¿Cuántos años tienes?" },
          { q: "¿Cómo se llama tu médico o terapeuta?" },
          { q: "¿Cómo se llama algún familiar cercano?" },
        ];
        const [cur, setCur] = useState(0);
        const [input, setInput] = useState("");
        const [answers, setAnswers] = useState([]);
        const t0 = useRef(Date.now());
        const next = () => {
          if (!input.trim()) return;
          const newAns = [...answers, { q: QUESTIONS[cur].q, a: input.trim() }];
          setAnswers(newAns);
          if (cur + 1 >= QUESTIONS.length) {
            onDone({ correct: 0, total: 0, errors: 0, requiresReview: true, completedResponses: newAns.length, seconds: Math.round((Date.now() - t0.current) / 1000), answers: newAns });
          } else { setCur(c => c + 1); setInput(""); }
        };
        const q = QUESTIONS[cur];
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 20, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{QUESTIONS.length}</p>
            <p style={{ fontWeight: 700, fontSize: M ? "1.4rem" : "1.1rem", marginBottom: 24, lineHeight: 1.5, padding: "0 8px" }}>{q.q}</p>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Tu respuesta..."
              style={{ padding: M ? "16px 18px" : "12px 16px", borderRadius: M ? 12 : 10, border: `2px solid ${COLORS.border}`, fontSize: M ? "1.2rem" : "1rem", textAlign: "center", width: "100%", maxWidth: M ? 340 : 300, marginBottom: 16 }} />
            <br />
            <BtnPrimary onClick={next} disabled={!input.trim()} style={{ padding: M ? "16px 36px" : "11px 24px", fontSize: M ? "1.05rem" : ".9rem" }}>
              Siguiente →
            </BtnPrimary>
          </div>
        );
      }
    },
    {
      id: "or_situacion",
      nombre: "Situación general",
      instruccion: "Responde las preguntas sobre tu situación actual",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const QUESTIONS = [
          { q: "¿Por qué estás aquí hoy?", tipo: "libre" },
          { q: "¿Cómo llegaste hasta aquí?", tipo: "libre" },
          { q: "¿A dónde irás cuando salgas de aquí?", tipo: "libre" },
        ];
        const [cur, setCur] = useState(0);
        const [input, setInput] = useState("");
        const [answers, setAnswers] = useState([]);
        const t0 = useRef(Date.now());
        const next = () => {
          if (!input.trim()) return;
          const newAns = [...answers, { q: QUESTIONS[cur].q, a: input.trim() }];
          setAnswers(newAns);
          if (cur + 1 >= QUESTIONS.length) {
            onDone({ correct: 0, total: 0, errors: 0, requiresReview: true, completedResponses: newAns.length, seconds: Math.round((Date.now() - t0.current) / 1000), answers: newAns });
          } else { setCur(c => c + 1); setInput(""); }
        };
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 20, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{QUESTIONS.length}</p>
            <p style={{ fontWeight: 700, fontSize: M ? "1.4rem" : "1.1rem", marginBottom: 24, lineHeight: 1.5, padding: "0 8px" }}>{QUESTIONS[cur].q}</p>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              placeholder="Tu respuesta..."
              style={{ width: "100%", maxWidth: M ? 380 : 320, minHeight: M ? 100 : 80, padding: M ? "14px 16px" : "10px 14px", borderRadius: M ? 12 : 10, border: `2px solid ${COLORS.border}`, fontSize: M ? "1.1rem" : ".95rem", resize: "none", fontFamily: "inherit", marginBottom: 16 }} />
            <br />
            <BtnPrimary onClick={next} disabled={!input.trim()} style={{ padding: M ? "16px 36px" : "11px 24px", fontSize: M ? "1.05rem" : ".9rem" }}>
              Siguiente →
            </BtnPrimary>
          </div>
        );
      }
    },
  ],
  razonamiento: [
    {
      id: "ra_series",
      nombre: "Series numéricas",
      instruccion: "Encuentra el número que sigue en la serie",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const EASY = [
          { seq: [2,4,6,8], ans: 10, opts: [9,10,11,12] },
          { seq: [10,8,6,4], ans: 2, opts: [0,1,2,3] },
          { seq: [5,10,15,20], ans: 25, opts: [23,24,25,30] },
        ];
        const MEDIUM = [
          { seq: [3,6,9,12], ans: 15, opts: [13,14,15,18] },
          { seq: [1,2,4,8], ans: 16, opts: [12,14,16,32] },
          { seq: [1,1,2,3,5], ans: 8, opts: [6,7,8,9] },
          { seq: [4,7,10,13], ans: 16, opts: [15,16,17,19] },
        ];
        const HARD = [
          { seq: [1,4,9,16], ans: 25, opts: [20,23,25,36] },
          { seq: [2,6,12,20], ans: 30, opts: [28,30,32,36] },
          { seq: [3,6,12,24], ans: 48, opts: [36,42,48,52] },
          { seq: [20,17,13,8], ans: 2, opts: [1,2,3,4] },
        ];
        const pool = L <= 1 ? EASY : L === 2 ? [...EASY, ...MEDIUM] : L === 3 ? MEDIUM : [...MEDIUM, ...HARD];
        const SERIES = shuffle(pool).slice(0, [0, 4, 5, 6, 7, 8][L]);
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const s = SERIES[cur];
        const pick = (opt) => {
          if (sel !== null) return; setSel(opt);
          const ok = opt === s.ans;
          if (ok) setScore(sc => sc + 1);
          setTimeout(() => {
            setSel(null);
            if (cur + 1 >= SERIES.length) { const ns = score + (ok ? 1 : 0); onDone({ correct: ns, total: SERIES.length, errors: SERIES.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) }); }
            else setCur(c => c + 1);
          }, 800);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{SERIES.length}</p>
            <div style={{ display: "flex", gap: M ? 14 : 10, justifyContent: "center", alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
              {s.seq.map((n, i) => (
                <div key={i} style={{ width: M ? 60 : 48, height: M ? 60 : 48, borderRadius: 12, background: COLORS.primary+"15", border: `2px solid ${COLORS.primary}30`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: M ? "1.3rem" : "1.1rem", color: COLORS.primary }}>{n}</div>
              ))}
              <div style={{ width: M ? 60 : 48, height: M ? 60 : 48, borderRadius: 12, background: COLORS.bg, border: `2px dashed ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", color: COLORS.textMuted }}>?</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, maxWidth: 280, margin: "0 auto" }}>
              {shuffle(s.opts).map((opt, i) => (
                <button key={i} onClick={() => pick(opt)} style={{ padding: M ? "18px" : "14px", borderRadius: 12, border: "2px solid", fontWeight: 800, fontSize: M ? "1.3rem" : "1.1rem", cursor: sel !== null ? "default" : "pointer", fontFamily: "inherit", borderColor: sel === null ? COLORS.border : opt === s.ans ? COLORS.success : sel === opt ? COLORS.error : COLORS.border, background: sel === null ? COLORS.white : opt === s.ans ? COLORS.success+"15" : sel === opt ? COLORS.error+"15" : COLORS.white, color: COLORS.textPrimary }}>{opt}</button>
              ))}
            </div>
          </div>
        );
      }
    },
    {
      id: "ra_discordante",
      nombre: "El elemento diferente",
      instruccion: "Encuentra el elemento que NO pertenece al grupo",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const EASY = [
          { items: ["Perro","Gato","Mariposa","Carro"], ans: "Carro", razon: "Los demás son animales" },
          { items: ["Manzana","Naranja","Zanahoria","Limón"], ans: "Zanahoria", razon: "Los demás son frutas" },
          { items: ["Carro","Avión","Bicicleta","Libro"], ans: "Libro", razon: "Los demás son medios de transporte" },
          { items: ["Rosa","Clavel","Tulipán","Pino"], ans: "Pino", razon: "Los demás son flores" },
        ];
        const HARD = [
          { items: ["2","4","7","6"], ans: "7", razon: "Los demás son números pares" },
          { items: ["España","Francia","Colombia","Berlín"], ans: "Berlín", razon: "Los demás son países" },
          { items: ["Marte","Venus","Luna","Júpiter"], ans: "Luna", razon: "Los demás son planetas" },
          { items: ["Triángulo","Cuadrado","Círculo","Pentágono"], ans: "Círculo", razon: "Los demás son polígonos" },
          { items: ["Kilómetro","Metro","Litro","Centímetro"], ans: "Litro", razon: "Los demás miden longitud" },
        ];
        const count = [0, 4, 5, 6, 6, 7][L];
        const pool = L <= 2 ? [...EASY, ...HARD.slice(0, 1)] : L === 3 ? [...EASY, ...HARD] : [...HARD, ...EASY];
        const GRUPOS = shuffle(pool).slice(0, count);
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const g = GRUPOS[cur];
        const pick = (opt) => {
          if (sel) return; setSel(opt);
          const ok = opt === g.ans;
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            setSel(null);
            if (cur + 1 >= GRUPOS.length) { const ns = score + (ok ? 1 : 0); onDone({ correct: ns, total: GRUPOS.length, errors: GRUPOS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) }); }
            else setCur(c => c + 1);
          }, 900);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{GRUPOS.length} · ¿Cuál no pertenece?</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, maxWidth: 340, margin: "0 auto 16px" }}>
              {g.items.map((item, i) => (
                <button key={i} onClick={() => pick(item)} style={{ padding: M ? "20px" : "16px", borderRadius: 14, border: "2px solid", fontWeight: 700, fontSize: M ? "1.1rem" : ".95rem", cursor: sel ? "default" : "pointer", fontFamily: "inherit", borderColor: !sel ? COLORS.border : item === g.ans ? COLORS.success : sel === item ? COLORS.error : COLORS.border, background: !sel ? COLORS.white : item === g.ans ? COLORS.success+"15" : sel === item ? COLORS.error+"15" : COLORS.white, color: COLORS.textPrimary }}>{item}</button>
              ))}
            </div>
            {sel && <p style={{ fontSize: ".85rem", color: COLORS.textMuted, marginTop: 8 }}>💡 {g.razon}</p>}
          </div>
        );
      }
    },
    {
      id: "ra_verdadero_falso",
      nombre: "Verdadero o falso",
      instruccion: "Evalúa si la afirmación es verdadera o falsa",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const EASY = [
          { afirmacion: "Todos los perros son animales.", ans: true },
          { afirmacion: "Todos los animales son perros.", ans: false },
          { afirmacion: "Todos los cuadrados son rectángulos.", ans: true },
          { afirmacion: "Todos los rectángulos son cuadrados.", ans: false },
        ];
        const HARD = [
          { afirmacion: "El producto de dos números negativos es positivo.", ans: true },
          { afirmacion: "Si llueve, el suelo se moja. Está lloviendo. Por lo tanto el suelo está mojado.", ans: true },
          { afirmacion: "Todos los pájaros vuelan. El pingüino es un pájaro. Por lo tanto el pingüino vuela.", ans: false },
          { afirmacion: "Si algunas flores son rojas y esta rosa es una flor, necesariamente esta rosa es roja.", ans: false },
          { afirmacion: "Si ningún cuadrado es un círculo y esta figura es un cuadrado, entonces no puede ser un círculo.", ans: true },
        ];
        const count = [0, 4, 5, 6, 7, 8][L];
        const pool = L <= 2 ? [...EASY, ...HARD.slice(0, 1)] : [...EASY, ...HARD];
        const ITEMS = shuffle(pool).slice(0, count);
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const item = ITEMS[cur];
        const pick = (ans) => {
          if (sel !== null) return; setSel(ans);
          const ok = ans === item.ans;
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            setSel(null);
            if (cur + 1 >= ITEMS.length) { const ns = score + (ok ? 1 : 0); onDone({ correct: ns, total: ITEMS.length, errors: ITEMS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) }); }
            else setCur(c => c + 1);
          }, 800);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{ITEMS.length}</p>
            <div style={{ background: COLORS.primary+"08", borderRadius: 16, padding: M ? "20px 24px" : "16px 20px", marginBottom: 24, border: `1px solid ${COLORS.primary}15`, minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: M ? "1.15rem" : ".95rem", lineHeight: 1.7 }}>{item.afirmacion}</p>
            </div>
            {sel !== null && <p style={{ fontWeight: 700, color: sel === item.ans ? COLORS.success : COLORS.error, marginBottom: 12 }}>{sel === item.ans ? "Correcto!" : `Es ${item.ans ? "VERDADERO" : "FALSO"}`}</p>}
            {sel === null && (
              <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                {[{v:true,l:"Verdadero"},{v:false,l:"Falso"}].map(opt => (
                  <button key={String(opt.v)} onClick={() => pick(opt.v)} style={{ padding: M ? "18px 32px" : "14px 24px", borderRadius: 14, border: "2px solid", fontWeight: 800, fontSize: M ? "1.05rem" : ".9rem", cursor: "pointer", fontFamily: "inherit", borderColor: opt.v ? COLORS.success : COLORS.error, background: opt.v ? COLORS.success+"12" : COLORS.error+"12", color: opt.v ? COLORS.success : COLORS.error }}>{opt.l}</button>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
  ],
  calculo: [
    {
      id: "calc_operaciones",
      nombre: "Operaciones mentales",
      instruccion: "Resuelve las operaciones matemáticas mentalmente",
      Component: ({ onDone, modoMayor, difficultyLevel = 2 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const genOps = () => {
          const ops = [];
          const count = [0, 5, 6, 8, 9, 10][L];
          for (let i = 0; i < count; i++) {
            const maxType = L === 1 ? 2 : L === 2 ? 3 : 4;
            const tipo = Math.floor(Math.random() * maxType);
            let a, b, ans, sym;
            if (tipo === 0) {
              const max = [0, 15, 30, 60, 100, 200][L];
              a = Math.floor(Math.random()*max)+1; b = Math.floor(Math.random()*max)+1; ans = a+b; sym = "+";
            } else if (tipo === 1) {
              const max = [0, 20, 40, 80, 120, 250][L];
              a = Math.floor(Math.random()*max)+10; b = Math.floor(Math.random()*Math.max(5, a))+1; ans = a-b; sym = "-";
            } else if (tipo === 2) {
              const multMax = [0, 5, 7, 9, 11, 12][L];
              a = Math.floor(Math.random()*multMax)+2; b = Math.floor(Math.random()*multMax)+2; ans = a*b; sym = "x";
            } else {
              const divisors = L >= 5 ? [2,3,4,5,6,7,8,9,10,12] : [2,3,4,5,6,10];
              b = divisors[Math.floor(Math.random()*divisors.length)];
              a = b*(Math.floor(Math.random()*([0,5,6,9,11,13][L]))+2); ans = a/b; sym = "/";
            }
            ops.push({ expr: a+" "+sym+" "+b, ans });
          }
          return ops;
        };
        const [ops] = useState(genOps);
        const [cur, setCur] = useState(0);
        const [input, setInput] = useState("");
        const [score, setScore] = useState(0);
        const [feedback, setFeedback] = useState(null);
        const t0 = useRef(Date.now());
        const check = () => {
          if (!input.trim()) return;
          const ok = parseFloat(input.trim()) === ops[cur].ans;
          if (ok) setScore(s => s + 1);
          setFeedback(ok ? "ok" : "error");
          setTimeout(() => {
            setFeedback(null); setInput("");
            if (cur + 1 >= ops.length) { const ns = score + (ok ? 1 : 0); onDone({ correct: ns, total: ops.length, errors: ops.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) }); }
            else setCur(c => c + 1);
          }, 800);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{ops.length}</p>
            <div style={{ fontSize: M ? "2.5rem" : "2rem", fontWeight: 900, color: COLORS.primary, marginBottom: 24, padding: "16px", background: COLORS.bg, borderRadius: 14 }}>{ops[cur].expr} = ?</div>
            {feedback && <p style={{ fontWeight: 700, color: feedback === "ok" ? COLORS.success : COLORS.error, marginBottom: 12 }}>{feedback === "ok" ? "Correcto!" : "Era: "+ops[cur].ans}</p>}
            {!feedback && <>
              <input value={input} onChange={e => setInput(e.target.value)} type="number" placeholder="Resultado" autoFocus
                style={{ padding: M ? "16px 18px" : "12px 16px", borderRadius: 12, border: `2px solid ${COLORS.border}`, fontSize: M ? "1.5rem" : "1.2rem", textAlign: "center", width: 180, marginBottom: 16 }} />
              <br />
              <BtnPrimary onClick={check} disabled={!input.trim()} style={{ padding: M ? "16px 36px" : "11px 24px" }}>Confirmar</BtnPrimary>
            </>}
          </div>
        );
      }
    },
    {
      id: "calc_faltante",
      nombre: "Número faltante",
      instruccion: "Encuentra el número que falta para completar la operación",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const EASY = [
          { expr: "? + 4 = 10", ans: 6 }, { expr: "12 - ? = 7", ans: 5 },
          { expr: "? + 8 = 15", ans: 7 }, { expr: "20 - ? = 12", ans: 8 },
        ];
        const MEDIUM = [
          { expr: "? + 15 = 28", ans: 13 }, { expr: "45 - ? = 18", ans: 27 },
          { expr: "? x 4 = 36", ans: 9 }, { expr: "? + 37 = 100", ans: 63 },
          { expr: "80 - ? = 35", ans: 45 }, { expr: "? x 6 = 54", ans: 9 },
        ];
        const HARD = [
          { expr: "? / 8 = 6", ans: 48 }, { expr: "25 + ? = 73", ans: 48 },
          { expr: "144 / ? = 12", ans: 12 }, { expr: "? x 9 = 108", ans: 12 },
          { expr: "175 - ? = 89", ans: 86 }, { expr: "? + 128 = 275", ans: 147 },
        ];
        const pool = L <= 1 ? EASY : L === 2 ? [...EASY, ...MEDIUM] : L === 3 ? MEDIUM : [...MEDIUM, ...HARD];
        const ITEMS = shuffle(pool).slice(0, [0, 4, 5, 6, 7, 8][L]);
        const [cur, setCur] = useState(0);
        const [input, setInput] = useState("");
        const [score, setScore] = useState(0);
        const [feedback, setFeedback] = useState(null);
        const t0 = useRef(Date.now());
        const check = () => {
          if (!input.trim()) return;
          const ok = parseInt(input.trim()) === ITEMS[cur].ans;
          if (ok) setScore(s => s + 1);
          setFeedback(ok ? "ok" : "error");
          setTimeout(() => {
            setFeedback(null); setInput("");
            if (cur + 1 >= ITEMS.length) { const ns = score + (ok ? 1 : 0); onDone({ correct: ns, total: ITEMS.length, errors: ITEMS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) }); }
            else setCur(c => c + 1);
          }, 800);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{ITEMS.length}</p>
            <div style={{ fontSize: M ? "2.2rem" : "1.8rem", fontWeight: 900, color: COLORS.primary, marginBottom: 24, padding: "16px", background: COLORS.bg, borderRadius: 14 }}>{ITEMS[cur].expr}</div>
            {feedback && <p style={{ fontWeight: 700, color: feedback === "ok" ? COLORS.success : COLORS.error, marginBottom: 12 }}>{feedback === "ok" ? "Correcto!" : "Era: "+ITEMS[cur].ans}</p>}
            {!feedback && <>
              <input value={input} onChange={e => setInput(e.target.value)} type="number" placeholder="?" autoFocus
                style={{ padding: M ? "16px 18px" : "12px 16px", borderRadius: 12, border: `2px solid ${COLORS.border}`, fontSize: M ? "1.5rem" : "1.2rem", textAlign: "center", width: 160, marginBottom: 16 }} />
              <br />
              <BtnPrimary onClick={check} disabled={!input.trim()} style={{ padding: M ? "16px 36px" : "11px 24px" }}>Confirmar</BtnPrimary>
            </>}
          </div>
        );
      }
    },
  ],
  flexibilidad: [
    {
      id: "flex_regla",
      nombre: "Cambio de regla",
      instruccion: "La regla cambia de repente, adaptatate rapido",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const RONDAS = [0, 8, 9, 10, 12, 14][L];
        const switchProbability = [0, 0.18, 0.25, 0.35, 0.45, 0.55][L];
        const EMOJIS = [{e:"Rojo circulo",color:"rojo",forma:"circulo"},{e:"Azul circulo",color:"azul",forma:"circulo"},{e:"Rojo cuadrado",color:"rojo",forma:"cuadrado"},{e:"Azul cuadrado",color:"azul",forma:"cuadrado"},{e:"Amarillo circulo",color:"amarillo",forma:"circulo"},{e:"Amarillo cuadrado",color:"amarillo",forma:"cuadrado"}];
        const EMOJIVISUAL = {"Rojo circulo":"🔴","Azul circulo":"🔵","Rojo cuadrado":"🟥","Azul cuadrado":"🟦","Amarillo circulo":"🟡","Amarillo cuadrado":"🟨"};
        const [queue] = useState(() => {
          const q = []; let regla = "color";
          for (let i = 0; i < RONDAS; i++) {
            if (i > 0 && Math.random() < switchProbability) regla = regla === "color" ? "forma" : "color";
            q.push({ item: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], regla });
          }
          return q;
        });
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [feedback, setFeedback] = useState(null);
        const t0 = useRef(Date.now());
        const q = queue[cur];
        const opts = q?.regla === "color" ? ["rojo","azul","amarillo"] : ["circulo","cuadrado"];
        const pick = (opt) => {
          if (feedback) return;
          const ok = opt === q.item[q.regla];
          if (ok) setScore(s => s + 1);
          setFeedback(ok ? "ok" : "error");
          setTimeout(() => {
            setFeedback(null);
            if (cur + 1 >= RONDAS) { const ns = score + (ok ? 1 : 0); onDone({ correct: ns, total: RONDAS, errors: RONDAS - ns, seconds: Math.round((Date.now() - t0.current) / 1000) }); }
            else setCur(c => c + 1);
          }, 600);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, background: q?.regla === "color" ? COLORS.primary+"15" : COLORS.warning+"15", border: `1.5px solid ${q?.regla === "color" ? COLORS.primary : COLORS.warning}`, marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: M ? ".95rem" : ".82rem", color: q?.regla === "color" ? COLORS.primary : COLORS.warning }}>{q?.regla === "color" ? "Di el COLOR" : "Di la FORMA"}</span>
            </div>
            <div style={{ fontSize: M ? "7rem" : "5rem", marginBottom: 20, lineHeight: 1 }}>{EMOJIVISUAL[q?.item.e]}</div>
            {feedback && <p style={{ fontWeight: 700, color: feedback === "ok" ? COLORS.success : COLORS.error, marginBottom: 12 }}>{feedback === "ok" ? "Correcto!" : "Era: "+q?.item[q?.regla]}</p>}
            {!feedback && (
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {opts.map((opt, i) => (<button key={i} onClick={() => pick(opt)} style={{ padding: M ? "16px 24px" : "12px 18px", borderRadius: 12, border: `2px solid ${COLORS.border}`, fontWeight: 700, fontSize: M ? "1.05rem" : ".9rem", cursor: "pointer", background: COLORS.white, color: COLORS.textPrimary, fontFamily: "inherit" }}>{opt}</button>))}
              </div>
            )}
            <p style={{ color: COLORS.textMuted, fontSize: ".75rem", marginTop: 14 }}>{cur + 1}/{RONDAS}</p>
          </div>
        );
      }
    },
    {
      id: "flex_opuesto",
      nombre: "Di lo contrario",
      instruccion: "Elige el antonimo de la palabra",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const EASY = [
          { palabra: "GRANDE", ans: "pequeño", opts: ["pequeño","mediano","enorme","largo"] },
          { palabra: "RAPIDO", ans: "lento", opts: ["lento","quieto","suave","tardio"] },
          { palabra: "CALIENTE", ans: "frio", opts: ["frio","tibio","helado","fresco"] },
          { palabra: "ARRIBA", ans: "abajo", opts: ["abajo","al lado","lejos","dentro"] },
        ];
        const HARD = [
          { palabra: "CLARO", ans: "oscuro", opts: ["oscuro","gris","nublado","opaco"] },
          { palabra: "FUERTE", ans: "debil", opts: ["debil","suave","flojo","blando"] },
          { palabra: "ANTIGUO", ans: "nuevo", opts: ["nuevo","moderno","reciente","joven"] },
          { palabra: "ESCASO", ans: "abundante", opts: ["abundante","pequeño","vacío","limitado"] },
          { palabra: "RÍGIDO", ans: "flexible", opts: ["flexible","firme","duro","recto"] },
        ];
        const count = [0, 4, 5, 6, 7, 8][L];
        const pool = L <= 2 ? [...EASY, ...HARD.slice(0, 1)] : [...EASY, ...HARD];
        const PARES = shuffle(pool).slice(0, count);
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const p = PARES[cur];
        const pick = (opt) => {
          if (sel) return; setSel(opt);
          const ok = opt === p.ans;
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            setSel(null);
            if (cur + 1 >= PARES.length) { const ns = score + (ok ? 1 : 0); onDone({ correct: ns, total: PARES.length, errors: PARES.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) }); }
            else setCur(c => c + 1);
          }, 700);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 12, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{PARES.length}</p>
            <div style={{ fontSize: M ? "2.5rem" : "2rem", fontWeight: 900, color: COLORS.primary, padding: "20px", background: COLORS.bg, borderRadius: 16, marginBottom: 24 }}>{p.palabra}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, maxWidth: 340, margin: "0 auto" }}>
              {p.opts.map((opt, i) => (<button key={i} onClick={() => pick(opt)} style={{ padding: M ? "16px" : "12px", borderRadius: 12, border: "2px solid", fontWeight: 700, fontSize: M ? "1.1rem" : ".95rem", cursor: sel ? "default" : "pointer", fontFamily: "inherit", borderColor: !sel ? COLORS.border : opt === p.ans ? COLORS.success : sel === opt ? COLORS.error : COLORS.border, background: !sel ? COLORS.white : opt === p.ans ? COLORS.success+"15" : sel === opt ? COLORS.error+"15" : COLORS.white, color: COLORS.textPrimary }}>{opt}</button>))}
            </div>
          </div>
        );
      }
    },
  ],
  comprension: [
    {
      id: "cp_inferencia",
      nombre: "Inferencias",
      instruccion: "Lee el contexto y elige la conclusion mas logica",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const ITEMS = shuffle([
          { contexto: "Al salir de casa, Laura vio la calle mojada y a varias personas cerrando sus paraguas.", pregunta: "¿Qué es razonable inferir?", opts: ["Había llovido recientemente","Lavaron todas las calles","Era de noche","Había mucho viento"], ans: "Había llovido recientemente" },
          { contexto: "Carlos suele llegar diez minutos antes. Hoy la reunión comenzó hace quince minutos y todavía no ha llegado.", pregunta: "¿Qué es razonable inferir?", opts: ["Pudo ocurrirle un imprevisto","Nunca quiso asistir","La reunión fue cancelada","Olvidó para siempre la reunión"], ans: "Pudo ocurrirle un imprevisto" },
          { contexto: "El médico revisó los exámenes de Marta y le indicó que, según esos resultados, podía continuar con su plan actual de alimentación.", pregunta: "¿Qué podemos concluir del texto?", opts: ["El médico no indicó cambiar el plan actual","Marta no necesita controles futuros","La dieta cura cualquier enfermedad","Los exámenes nunca cambian"], ans: "El médico no indicó cambiar el plan actual" },
          { contexto: "Ana ahorró durante dos años para comprar un carro. Esta semana firmó los documentos de compra y recibió las llaves.", pregunta: "¿Qué podemos inferir con mayor seguridad?", opts: ["Ana adquirió un carro","Ana pidió un préstamo","El carro fue un regalo","Ana vendió su vivienda"], ans: "Ana adquirió un carro" },
          { contexto: "Pedro entró a la cocina con las manos llenas de harina y colocó una bandeja de masa junto al horno.", pregunta: "¿Qué actividad probablemente estaba realizando?", opts: ["Estaba preparando algo para hornear","Estaba reparando una bicicleta","Estaba regando plantas","Estaba pintando una pared"], ans: "Estaba preparando algo para hornear" },
        ]).slice(0, 4);
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const t0 = useRef(Date.now());
        const item = ITEMS[cur];
        const pick = (opt) => {
          if (sel) return; setSel(opt);
          const ok = opt === item.ans;
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            setSel(null);
            if (cur + 1 >= ITEMS.length) { const ns = score + (ok ? 1 : 0); onDone({ correct: ns, total: ITEMS.length, errors: ITEMS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) }); }
            else setCur(c => c + 1);
          }, 900);
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 12, fontSize: M ? "1rem" : ".85rem" }}>{cur + 1}/{ITEMS.length}</p>
            <div style={{ background: COLORS.primary+"08", borderRadius: 14, padding: M ? "16px 18px" : "12px 16px", marginBottom: 12, textAlign: "left", border: `1px solid ${COLORS.primary}15` }}>
              <p style={{ margin: 0, fontSize: M ? "1rem" : ".9rem", lineHeight: 1.8, fontStyle: "italic" }}>"{item.contexto}"</p>
            </div>
            <p style={{ fontWeight: 700, fontSize: M ? "1rem" : ".88rem", marginBottom: 14 }}>{item.pregunta}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 440, margin: "0 auto" }}>
              {item.opts.map((opt, i) => (<button key={i} onClick={() => pick(opt)} style={{ padding: M ? "13px 16px" : "10px 14px", borderRadius: 12, border: "2px solid", fontWeight: 600, fontSize: M ? ".95rem" : ".85rem", cursor: sel ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", borderColor: !sel ? COLORS.border : opt === item.ans ? COLORS.success : sel === opt ? COLORS.error : COLORS.border, background: !sel ? COLORS.white : opt === item.ans ? COLORS.success+"15" : sel === opt ? COLORS.error+"15" : COLORS.white, color: COLORS.textPrimary }}>{opt}</button>))}
            </div>
          </div>
        );
      }
    },
    {
      id: "cp_texto",
      nombre: "Comprension de texto",
      instruccion: "Lee el texto y responde las preguntas",
      Component: ({ onDone, modoMayor, difficultyLevel = 3 }) => {
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const TEXTOS = shuffle([
          { titulo: "El ejercicio y el cerebro", texto: "Estudios recientes demuestran que el ejercicio fisico regular beneficia al cerebro. Al caminar 30 minutos al dia, el hipocampo puede aumentar su volumen hasta en un 2%. Ademas, el ejercicio libera BDNF, una proteina que favorece nuevas conexiones neuronales. Los expertos recomiendan al menos 150 minutos de actividad moderada a la semana.", preguntas: [{ p: "Que region del cerebro se beneficia especialmente?", opts: ["El cerebelo","El hipocampo","El lobulo frontal","El bulbo raquideo"], ans: "El hipocampo" },{ p: "Cuantos minutos semanales recomiendan?", opts: ["30 minutos","60 minutos","120 minutos","150 minutos"], ans: "150 minutos" }] },
          { titulo: "La importancia del sueno", texto: "Durante el sueno el cerebro realiza procesos fundamentales. En la fase de sueno profundo se consolidan los recuerdos y se eliminan toxinas. La falta de sueno cronica se asocia con deterioro cognitivo. Los adultos necesitan entre 7 y 9 horas por noche.", preguntas: [{ p: "Cuantas horas de sueno necesitan los adultos?", opts: ["5-6 horas","6-7 horas","7-9 horas","9-11 horas"], ans: "7-9 horas" },{ p: "Que ocurre durante el sueno profundo?", opts: ["Se producen suenos vividos","Se consolidan recuerdos y eliminan toxinas","El cerebro descansa por completo","Aumenta la presion arterial"], ans: "Se consolidan recuerdos y eliminan toxinas" }] },
        ]).slice(0, 1);
        const [phase, setPhase] = useState("read");
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const [tl, setTl] = useState(60);
        const timerRef = useRef();
        const t0 = useRef(Date.now());
        const texto = TEXTOS[0];
        useEffect(() => {
          if (phase !== "read") return;
          timerRef.current = setInterval(() => setTl(t => { if (t <= 1) { clearInterval(timerRef.current); setPhase("questions"); return 0; } return t-1; }), 1000);
          return () => clearInterval(timerRef.current);
        }, [phase]);
        const pick = (opt) => {
          if (sel) return; setSel(opt);
          const ok = opt === texto.preguntas[cur].ans;
          if (ok) setScore(s => s + 1);
          setTimeout(() => {
            setSel(null);
            if (cur + 1 >= texto.preguntas.length) { const ns = score + (ok ? 1 : 0); onDone({ correct: ns, total: texto.preguntas.length, errors: texto.preguntas.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) }); }
            else setCur(c => c + 1);
          }, 800);
        };
        if (phase === "read") return (
          <div>
            <TimerBar current={tl} total={60} mayor={M} />
            <p style={{ fontWeight: 700, color: COLORS.primary, marginBottom: 8, fontSize: M ? "1.05rem" : ".9rem" }}>📖 {texto.titulo}</p>
            <div style={{ background: COLORS.bg, borderRadius: 12, padding: M ? "18px 20px" : "14px 16px", marginBottom: 16, border: `1px solid ${COLORS.border}` }}>
              <p style={{ margin: 0, fontSize: M ? "1rem" : ".9rem", lineHeight: 1.9 }}>{texto.texto}</p>
            </div>
            <BtnPrimary onClick={() => { clearInterval(timerRef.current); setPhase("questions"); }} style={{ width: "100%", padding: M ? "16px" : "12px" }}>Ya lei — responder</BtnPrimary>
          </div>
        );
        const q = texto.preguntas[cur];
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 12 }}>{cur + 1}/{texto.preguntas.length}</p>
            <p style={{ fontWeight: 700, fontSize: M ? "1.1rem" : ".95rem", marginBottom: 18, lineHeight: 1.6 }}>{q.p}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420, margin: "0 auto" }}>
              {q.opts.map((opt, i) => (<button key={i} onClick={() => pick(opt)} style={{ padding: M ? "14px 16px" : "11px 14px", borderRadius: 12, border: "2px solid", fontWeight: 600, fontSize: M ? ".95rem" : ".87rem", cursor: sel ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", borderColor: !sel ? COLORS.border : opt === q.ans ? COLORS.success : sel === opt ? COLORS.error : COLORS.border, background: !sel ? COLORS.white : opt === q.ans ? COLORS.success+"15" : sel === opt ? COLORS.error+"15" : COLORS.white, color: COLORS.textPrimary }}>{opt}</button>))}
            </div>
          </div>
        );
      }
    },
  ],
};

// ─── EVALUACIÓN COGNITIVA ADULTOS ────────────────────────────────────────────
function EvaluacionAdulto({ paciente, onFinish, onCancel }) {
  const dominios = Object.keys(DOMINIOS_ADULTO);
  const [domIdx, setDomIdx] = useState(0);
  const [exIdx, setExIdx] = useState(0);
  const [results, setResults] = useState({});
  const [phase, setPhase] = useState("intro"); // intro | demo | exercise | done
  const [demoSeen, setDemoSeen] = useState(new Set());
  const t0 = useRef(Date.now());
  const mayor = esModoMayor(paciente);

  const curDom = dominios[domIdx];
  const curExs = EX_ADULTO[curDom] || [];
  const curEx = curExs[exIdx];
  const progress = Math.round((domIdx / dominios.length) * 100);


  const handleExDone = (res) => {
    const meta = getExerciseMetadata(curDom, curEx);
    const requiresReview = !!(res.requiresReview || meta.requiereValoracionProfesional);
    const pct = requiresReview ? null : taskPct(res);
    setResults(prev => ({
      ...prev,
      [curDom]: { ...res, pct, exName: curEx?.nombre, requiresReview }
    }));
    if (domIdx + 1 >= dominios.length) {
      setPhase("done");
    } else {
      const nextDom = dominios[domIdx + 1];
      const nextExId = EX_ADULTO[nextDom]?.[0]?.id;
      const showDemoNext = paciente?.showDemo && nextExId && !demoSeen.has(nextExId);
      setDomIdx(d => d + 1);
      setExIdx(0);
      setPhase(showDemoNext ? "demo" : "exercise");
    }
  };

  const finishEval = () => {
    const hist = Object.entries(results).map(([id, r]) => ({ id, ...r }));
    const cuantificables = hist.filter(h => !h.requiresReview && typeof h.pct === "number" && !Number.isNaN(h.pct));
    const globalPct = cuantificables.length
      ? Math.round(cuantificables.reduce((a, b) => a + b.pct, 0) / cuantificables.length)
      : null;
    onFinish({ hist, globalPct, date: new Date().toISOString(), seconds: Math.round((Date.now() - t0.current) / 1000) });
  };

  // Leer instrucción al cambiar de ejercicio
  useEffect(() => {
    if (phase !== "exercise") return;
    const instruccion = curExs[exIdx]?.instruccion;
    if (instruccion) speakInstruction(instruccion);
    return () => { try { window.speechSynthesis?.cancel(); } catch(e) {} };
  }, [domIdx, exIdx, phase]);

  if (phase === "intro") return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Card style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🧠</div>
        <h2 style={{ fontWeight: 700, fontSize: "1.3rem", marginBottom: 8 }}>Evaluación Cognitiva</h2>
        <p style={{ color: COLORS.textMuted, marginBottom: 8 }}>Paciente: <strong>{paciente.nombre}</strong></p>
        <p style={{ color: COLORS.textMuted, marginBottom: 24, lineHeight: 1.7 }}>
          Se evaluarán {dominios.length} dominios cognitivos.<br />
          Duración aproximada: <strong>15-20 minutos</strong>.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, textAlign: "left" }}>
          {dominios.map(id => {
            const dom = DOMINIOS_ADULTO[id];
            return (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: COLORS.bg, borderRadius: 10 }}>
                <span style={{ fontSize: "1.2rem" }}>{dom.emoji}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: ".88rem", margin: 0 }}>{dom.label}</p>
                  <p style={{ color: COLORS.textMuted, fontSize: ".75rem", margin: 0 }}>{dom.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <BtnPrimary onClick={() => {
            const firstExId = EX_ADULTO[dominios[0]]?.[0]?.id;
            setPhase(paciente?.showDemo && firstExId ? "demo" : "exercise");
          }} style={{ flex: 1, padding: 14 }}>▶ Comenzar evaluación</BtnPrimary>
          <BtnSecondary onClick={onCancel}>Cancelar</BtnSecondary>
        </div>
      </Card>
    </div>
  );

  if (phase === "done") return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Card style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Evaluación completada</h2>
        <p style={{ color: COLORS.textMuted, marginBottom: 24 }}>Todos los dominios han sido evaluados correctamente.</p>
        <div style={{ marginBottom: 24 }}>
          {Object.entries(results).map(([id, r]) => {
            const dom = DOMINIOS_ADULTO[id];
            return (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: ".88rem" }}>{dom?.emoji} {dom?.label}</span>
                {typeof r.pct === "number"
                  ? {typeof r.pct === "number"
                ? <span style={{ fontWeight: 700, color: gradeColor(r.pct) }}>{r.pct}%</span>
                : <span style={{ fontSize: ".75rem", color: COLORS.accent, fontWeight: 600 }}>Valoración profesional</span>}
                  : <Badge label="Valoración profesional" color={COLORS.accent} />}
              </div>
            );
          })}
        </div>
        <BtnPrimary onClick={finishEval} style={{ width: "100%", padding: 14 }}>Ver perfil cognitivo →</BtnPrimary>
      </Card>
    </div>
  );

  // Demo phase
  if (phase === "demo") return (
    <DemoScreen
      exId={curEx?.id}
      mayor={mayor}
      onContinuar={() => {
        if (curEx?.id) setDemoSeen(prev => new Set([...prev, curEx.id]));
        setPhase("exercise");
      }}
    />
  );

  // Exercise phase
  const dom = DOMINIOS_ADULTO[curDom];
  const ExComp = curEx?.Component;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Progress header */}
      <Card style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: ".82rem", color: COLORS.textMuted }}>Dominio {domIdx + 1} de {dominios.length}</span>
          <span style={{ fontSize: ".82rem", fontWeight: 600, color: COLORS.primary }}>{progress}%</span>
        </div>
        <ProgressBar value={progress} color={COLORS.primary} />
      </Card>

      <Card>
        {/* Domain header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: dom.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>{dom.emoji}</div>
          <div>
            <p style={{ fontWeight: 700, margin: 0 }}>{dom.label}</p>
            <p style={{ color: COLORS.textMuted, fontSize: ".78rem", margin: 0 }}>{curEx?.nombre}</p>
          </div>
        </div>

        {/* Instrucción */}
        <div style={{ background: COLORS.primary + "10", borderRadius: 10, padding: "12px 16px", marginBottom: 20, border: `1px solid ${COLORS.primary}20` }}>
          <p style={{ margin: 0, fontSize: ".88rem", color: COLORS.primary, fontWeight: 500 }}>📋 {curEx?.instruccion}</p>
        </div>

        {/* Exercise */}
        {ExComp && <ExComp onDone={handleExDone} paciente={paciente} />}
      </Card>
    </div>
  );
}

// ─── PERFIL COGNITIVO ─────────────────────────────────────────────────────────
function PerfilCognitivoView({ evalData, paciente, onIniciarSesion }) {
  const hist = evalData.hist || [];
  const globalPct = typeof evalData.globalPct === "number" ? evalData.globalPct : null;

  const cuantificables = hist.filter(h => !h.requiresReview && typeof h.pct === "number" && !Number.isNaN(h.pct));
  const pendientes = hist.filter(h => h.requiresReview || typeof h.pct !== "number" || Number.isNaN(h.pct));
  const prioritarias = cuantificables.filter(h => h.pct < 60).sort((a, b) => a.pct - b.pct);
  const fortalecimiento = cuantificables.filter(h => h.pct >= 60 && h.pct < 80);
  const fortalezas = cuantificables.filter(h => h.pct >= 80);

  const renderArea = (h, label, color) => {
    const dom = DOMINIOS_ADULTO[h.id];
    return (
      <div key={h.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${COLORS.border}` }}>
        <span style={{ fontSize: ".88rem" }}>{dom?.emoji} {dom?.label}</span>
        <Badge label={typeof h.pct === "number" ? `${h.pct}% — ${label}` : label} color={color} />
      </div>
    );
  };

  return (
    <div>
      <Card style={{ marginBottom: 20, background: COLORS.primary + "06", border: `1px solid ${COLORS.primary}18` }}>
        <p style={{ margin: 0, fontSize: ".8rem", lineHeight: 1.65, color: COLORS.textSecond }}>
          <strong>Nota clínica:</strong> estos resultados describen el desempeño observado en las tareas de NeuroFlex.
          No corresponden a puntuaciones normativas, no establecen diagnóstico y deben interpretarse junto con
          la evaluación clínica y el criterio del profesional.
        </p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
        <Card style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {globalPct !== null ? (
            <>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: gradeColor(globalPct) + "20", border: `4px solid ${gradeColor(globalPct)}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <span style={{ fontSize: "1.8rem", fontWeight: 900, color: gradeColor(globalPct) }}>{globalPct}%</span>
              </div>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Indicador global de tareas</p>
              <Badge label={performanceLabel(globalPct)} color={gradeColor(globalPct)} />
            </>
          ) : (
            <>
              <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🧑‍⚕️</div>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Perfil pendiente de valoración</p>
            </>
          )}
        </Card>

        <Card>
          <p style={{ fontWeight: 700, marginBottom: 4, fontSize: ".9rem" }}>Desempeño por dominio</p>
          <p style={{ color: COLORS.textMuted, fontSize: ".75rem", marginBottom: 16 }}>Indicadores internos de las tareas realizadas</p>
          {hist.map(h => {
            const dom = DOMINIOS_ADULTO[h.id];
            const numeric = typeof h.pct === "number" && !Number.isNaN(h.pct);
            return (
              <div key={h.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: ".82rem", fontWeight: 500 }}>{dom?.emoji} {dom?.label}</span>
                  {numeric
                    ? <span style={{ fontSize: ".82rem", fontWeight: 700, color: gradeColor(h.pct) }}>{h.pct}%</span>
                    : <span style={{ fontSize: ".75rem", fontWeight: 600, color: COLORS.accent }}>Valoración profesional</span>}
                </div>
                {numeric && <ProgressBar value={h.pct} color={gradeColor(h.pct)} height={6} />}
              </div>
            );
          })}
        </Card>
      </div>

      {prioritarias.length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.error}25` }}>
          <p style={{ fontWeight: 700, color: COLORS.error, marginBottom: 4 }}>🔴 Oportunidades prioritarias de fortalecimiento</p>
          <p style={{ color: COLORS.textMuted, fontSize: ".76rem", marginBottom: 10 }}>Sugeridas por el desempeño en las tareas; el profesional determina los objetivos de intervención.</p>
          {prioritarias.map(h => renderArea(h, "Oportunidad de fortalecimiento", COLORS.error))}
        </Card>
      )}

      {fortalecimiento.length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.warning}25` }}>
          <p style={{ fontWeight: 700, color: COLORS.warning, marginBottom: 4 }}>🟡 Áreas para seguimiento y fortalecimiento</p>
          <p style={{ color: COLORS.textMuted, fontSize: ".76rem", marginBottom: 10 }}>Desempeño intermedio observado en las tareas realizadas.</p>
          {fortalecimiento.map(h => renderArea(h, "Desempeño intermedio", COLORS.warning))}
        </Card>
      )}

      {fortalezas.length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.success}25` }}>
          <p style={{ fontWeight: 700, color: COLORS.success, marginBottom: 4 }}>🟢 Fortalezas relativas observadas</p>
          <p style={{ color: COLORS.textMuted, fontSize: ".76rem", marginBottom: 10 }}>Buen desempeño relativo dentro de las tareas administradas.</p>
          {fortalezas.map(h => renderArea(h, "Fortaleza relativa", COLORS.success))}
        </Card>
      )}

      {pendientes.length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.accent}25` }}>
          <p style={{ fontWeight: 700, color: COLORS.accent, marginBottom: 4 }}>🧑‍⚕️ Respuestas para valoración profesional</p>
          <p style={{ color: COLORS.textMuted, fontSize: ".76rem", marginBottom: 10 }}>
            Estas tareas contienen respuestas abiertas y no se convierten automáticamente en un porcentaje cognitivo.
          </p>
          {pendientes.map(h => renderArea(h, "Revisar clínicamente", COLORS.accent))}
        </Card>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <BtnPrimary onClick={onIniciarSesion} style={{ flex: 1, padding: 14 }}>
          ▶ Configurar intervención
        </BtnPrimary>
      </div>
    </div>
  );
}



// ─── CORRECCIÓN FUNCIONAL · PLAN DE REHABILITACIÓN + PDF REAL ─────────────────
const REHAB_OBJECTIVE_TEMPLATES = {
  memoria_trabajo: "Fortalecer la capacidad para mantener y manipular información durante tareas funcionales, ajustando progresivamente la carga y los apoyos.",
  memoria_episodica: "Fortalecer estrategias de codificación y evocación de información verbal y contextual mediante práctica graduada.",
  atencion: "Fortalecer el control atencional, la búsqueda sistemática y el mantenimiento del foco con progresión gradual de distractores.",
  funciones_exec: "Fortalecer planificación, secuenciación, monitoreo y control de la respuesta mediante tareas estructuradas y progresivas.",
  velocidad_proc: "Favorecer respuestas eficientes manteniendo la precisión, sin interpretar la velocidad aislada como indicador diagnóstico.",
  lenguaje: "Fortalecer acceso léxico, comprensión y razonamiento verbal mediante tareas graduadas y funcionalmente relevantes.",
  percepcion_visual: "Fortalecer discriminación, análisis y organización visuoperceptiva mediante estímulos de complejidad progresiva.",
  orientacion: "Favorecer el uso funcional de referencias temporales, espaciales, personales y situacionales con apoyos graduados cuando sean necesarios.",
  razonamiento: "Fortalecer identificación de reglas, relaciones y solución de problemas mediante tareas de complejidad progresiva.",
  calculo: "Fortalecer cálculo mental y razonamiento numérico mediante operaciones graduadas y estrategias de comprobación.",
  flexibilidad: "Fortalecer cambio de criterio, inhibición de respuestas previas y adaptación a nuevas reglas.",
  comprension: "Fortalecer comprensión literal e inferencial, identificación de información relevante y uso funcional de lo leído.",
};

function buildRehabilitationPlanFromEvaluation(paciente) {
  const evalHist = paciente?.eval?.hist || [];
  return Object.keys(DOMINIOS_ADULTO).map(id => {
    const h = evalHist.find(x => x.id === id);
    const pct = typeof h?.pct === "number" && !Number.isNaN(h.pct) ? h.pct : null;
    const review = !!h?.requiresReview || pct === null;

    let estado = "seguimiento";
    let prioridad = "media";
    if (review) {
      estado = "revision";
      prioridad = "media";
    } else if (pct < 60) {
      estado = "objetivo";
      prioridad = "alta";
    } else if (pct >= 80) {
      estado = "mantenimiento";
      prioridad = "baja";
    }

    let objetivo = REHAB_OBJECTIVE_TEMPLATES[id] || `Fortalecer ${DOMINIOS_ADULTO[id]?.label?.toLowerCase() || "esta función"} mediante práctica graduada.`;
    if (estado === "mantenimiento") {
      objetivo = `Mantener el desempeño observado en ${DOMINIOS_ADULTO[id]?.label?.toLowerCase() || "esta área"} e incluirla de forma periódica para seguimiento.`;
    }
    if (estado === "revision") {
      objetivo = `Revisar profesionalmente las respuestas de ${DOMINIOS_ADULTO[id]?.label?.toLowerCase() || "esta área"} antes de definir objetivos específicos de intervención.`;
    }

    return {
      id,
      estado,
      prioridad,
      objetivo,
      pctInicial: review ? null : pct,
      generatedAt: new Date().toISOString(),
      generatedSource: "evaluacion_neuroflex",
    };
  });
}

function pdfSafeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfLine(text, maxChars = 82) {
  const raw = String(text ?? "").trim();
  if (!raw) return [""];
  const words = raw.split(/\s+/);
  const lines = [];
  let current = "";
  words.forEach(word => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function downloadSimplePdf(filename, title, sourceLines = []) {
  const lines = [title, "", ...sourceLines].flatMap(line => wrapPdfLine(line));
  const perPage = 48;
  const pages = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  if (!pages.length) pages.push([title]);

  const objects = [];
  const addObject = body => { objects.push(body); return objects.length; };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject(""); // se completa después
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pageIds = [];
  pages.forEach(pageLines => {
    const content = [
      "BT",
      "/F1 10 Tf",
      "48 795 Td",
      "14 TL",
      ...pageLines.map((line, idx) =>
        `${idx === 0 ? "" : "T* " }(${pdfSafeText(line)}) Tj`
      ),
      "ET"
    ].join("\n");

    const pageId = objects.length + 1;
    const contentId = objects.length + 2;
    pageIds.push(pageId);
    addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, idx) => {
    offsets[idx + 1] = pdf.length;
    pdf += `${idx + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function buildPlanPdfLines(paciente, areas, notas = "") {
  const active = (areas || []).filter(a => a.estado === "objetivo" || a.estado === "seguimiento");
  const maintenance = (areas || []).filter(a => a.estado === "mantenimiento");
  const review = (areas || []).filter(a => a.estado === "revision");
  const lines = [
    `Paciente: ${paciente?.nombre || "Sin nombre"}`,
    `Fecha: ${new Date().toLocaleDateString("es")}`,
    `Areas activas: ${active.length} | Mantenimiento: ${maintenance.length} | Revision profesional: ${review.length}`,
    "",
    "OBJETIVOS ACTIVOS",
  ];

  active.forEach(a => {
    const dom = DOMINIOS_ADULTO[a.id];
    lines.push(`${dom?.label || a.id} - prioridad ${a.prioridad || "media"}`);
    lines.push(`Objetivo: ${a.objetivo || "Objetivo funcional pendiente de especificar."}`);
    lines.push(`Indicador inicial: ${typeof a.pctInicial === "number" ? `${a.pctInicial}%` : "valoracion profesional"}`);
    lines.push("");
  });

  if (maintenance.length) {
    lines.push("MANTENIMIENTO");
    maintenance.forEach(a => lines.push(`${DOMINIOS_ADULTO[a.id]?.label || a.id} - ${a.objetivo || "Seguimiento periodico."}`));
    lines.push("");
  }

  if (review.length) {
    lines.push("REVISION PROFESIONAL");
    review.forEach(a => lines.push(`${DOMINIOS_ADULTO[a.id]?.label || a.id} - revisar antes de definir objetivo especifico.`));
    lines.push("");
  }

  if (notas?.trim()) {
    lines.push("OBSERVACIONES DEL PROFESIONAL");
    lines.push(notas.trim());
    lines.push("");
  }

  lines.push("Nota: este plan organiza la intervencion dentro de NeuroFlex. No constituye diagnostico ni sustituye el juicio clinico.");
  return lines;
}

function buildEvolutionPdfLines(paciente) {
  const summary = getPatientReportSummary(paciente);
  const plan = paciente?.interventionPlan?.areas || [];
  const evolution = getCognitiveProfileEvolution(paciente);
  const lines = [
    `Paciente: ${paciente?.nombre || "Sin nombre"}`,
    `Edad: ${paciente?.edad ?? "No registrada"}`,
    `Sesiones realizadas: ${summary.totalSessions}`,
    `Indicador inicial de sesiones: ${summary.firstPct !== null ? `${summary.firstPct}%` : "Sin dato"}`,
    `Indicador reciente: ${summary.lastPct !== null ? `${summary.lastPct}%` : "Sin dato"}`,
    `Cambio descriptivo: ${summary.delta !== null ? `${summary.delta > 0 ? "+" : ""}${summary.delta} puntos` : "Sin dato"}`,
    "",
    "PERFIL INICIAL VS ACTUAL",
  ];
  evolution.filter(r => r.initialPct !== null || r.currentPct !== null).forEach(r => {
    lines.push(`${DOMINIOS_ADULTO[r.domId]?.label || r.domId}: inicial ${r.initialPct !== null ? `${r.initialPct}%` : "sin dato"} | actual ${r.currentPct !== null ? `${r.currentPct}%` : "sin dato"} | ${r.evidence.label}`);
  });
  lines.push("", "PLAN DE INTERVENCION");
  plan.filter(a => a.estado === "objetivo" || a.estado === "seguimiento").forEach(a => {
    lines.push(`${DOMINIOS_ADULTO[a.id]?.label || a.id} - prioridad ${a.prioridad}: ${a.objetivo || "Objetivo pendiente"}`);
  });
  lines.push("", "Nota: resultados descriptivos de tareas NeuroFlex; no son puntuaciones normativas ni diagnostico.");
  return lines;
}

function buildSessionPdfLines(paciente, sesion) {
  const lines = [
    `Paciente: ${paciente?.nombre || "Sin nombre"}`,
    `Sesion: ${sesion?.numero ?? "—"}`,
    `Fecha: ${sesion?.date ? new Date(sesion.date).toLocaleDateString("es") : "—"}`,
    `Indicador de tareas: ${typeof getSessionMetric(sesion, "taskIndicator") === "number" ? `${getSessionMetric(sesion, "taskIndicator")}%` : "valoracion profesional"}`,
    `Autonomia: ${getSessionMetric(sesion, "autonomyRate") !== null ? `${getSessionMetric(sesion, "autonomyRate")}%` : "sin dato"}`,
    `Nivel adaptativo medio: ${getSessionMetric(sesion, "averageAdaptiveLevel") !== null ? `${getSessionMetric(sesion, "averageAdaptiveLevel")}/5` : "sin dato"}`,
    "",
    "DETALLE DE EJERCICIOS",
  ];
  (sesion?.results || []).forEach(r => {
    lines.push(`${DOMINIOS_ADULTO[r.domId]?.label || r.domId} - ${r.nombre}: ${typeof r.pct === "number" ? `${r.pct}%` : "valoracion profesional"} | nivel ${r.adaptiveLevel ?? "—"} | apoyo ${supportLabel(getTrackedSupportLevel(r))}`);
  });
  if (sesion?.nota) lines.push("", "NOTA CLINICA", sesion.nota);
  lines.push("", "Nota: resultados descriptivos de tareas NeuroFlex; no son puntuaciones normativas ni diagnostico.");
  return lines;
}

// ─── PERFIL DE INTERVENCIÓN ───────────────────────────────────────────────────
// Separa lo observado en evaluación de lo que el profesional decide trabajar.


// ─── UX CLÍNICA Y SIMPLIFICACIÓN ───────────────────────────────────────────────
const PROFILE_TAB_INFO = {
  info:{icon:"👤",help:"Datos generales y estado actual."},
  hc:{icon:"🗂️",help:"Antecedentes e información clínica registrada."},
  "perfil-cognitivo":{icon:"🧠",help:"Desempeño observado en la evaluación."},
  intervencion:{icon:"🎯",help:"Objetivos, prioridades y revisión del plan."},
  sesiones:{icon:"📋",help:"Historial de sesiones realizadas."},
  progreso:{icon:"📈",help:"Evolución longitudinal descriptiva."},
  reportes:{icon:"📄",help:"Reportes de sesión y evolución."},
};

function ClinicalStatusBanner({paciente,onGo,onEvaluate,onSession}) {
  const hasEval=!!paciente?.eval;
  const hasPlan=!!paciente?.interventionPlan;
  const active=(paciente?.interventionPlan?.areas||[]).filter(a=>a.estado==="objetivo"||a.estado==="seguimiento");
  const sessions=paciente?.sesiones?.length||0;
  let icon="🧠",title="Evaluación pendiente",detail="Realiza la evaluación para construir el perfil cognitivo.",action="Evaluar",fn=onEvaluate;
  if(hasEval&&!hasPlan){icon="🎯";title="Evaluación completada";detail="El siguiente paso es definir los objetivos del plan de intervención.";action="Crear plan";fn=()=>onGo?.("intervencion");}
  else if(hasEval&&hasPlan&&active.length===0){icon="🔄";title="Plan sin objetivos activos";detail="Revisa el plan antes de utilizar el modo automático.";action="Revisar plan";fn=()=>onGo?.("intervencion");}
  else if(hasEval&&active.length>0&&sessions===0){icon="▶️";title="Listo para intervenir";detail=`${active.length} área(s) activa(s). Puedes preparar la primera sesión.`;action="Configurar sesión";fn=onSession;}
  else if(sessions>0){icon="📈";title="Seguimiento en curso";detail=`${sessions} sesión(es) registrada(s). Revisa la evolución o continúa la intervención.`;action="Ver progreso";fn=()=>onGo?.("progreso");}
  return <div style={{marginBottom:18,padding:14,borderRadius:14,background:COLORS.primary+"07",border:`1px solid ${COLORS.primary}18`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
    <div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1,minWidth:220}}><div style={{fontSize:"1.4rem"}}>{icon}</div><div><div style={{fontWeight:800,fontSize:".88rem"}}>{title}</div><div style={{color:COLORS.textMuted,fontSize:".75rem",lineHeight:1.45,marginTop:2}}>{detail}</div></div></div>
    <BtnSecondary onClick={fn} style={{fontSize:".73rem",whiteSpace:"nowrap"}}>{action}</BtnSecondary>
  </div>;
}

function SectionIntro({icon,title,description}) {
  return <div style={{marginBottom:14}}><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:"1.25rem"}}>{icon}</span><h2 style={{margin:0,fontSize:"1.02rem",fontWeight:800}}>{title}</h2></div>{description&&<p style={{margin:"4px 0 0 32px",color:COLORS.textMuted,fontSize:".74rem",lineHeight:1.5}}>{description}</p>}</div>;
}

// ─── REVISIÓN CLÍNICA DEL PLAN ─────────────────────────────────────────────────
// Genera sugerencias descriptivas a partir del historial de NeuroFlex.
// Nunca modifica el plan automáticamente.
function getDomainRecentResults(paciente, domId, maxSessions = 4) {
  const sesiones = paciente?.sesiones || [];
  return sesiones
    .slice(-maxSessions)
    .flatMap(s => (s.results || []).filter(r => r.domId === domId))
    .filter(Boolean);
}

function buildDomainReviewSuggestion(paciente, area) {
  const domId = area.id;
  const results = getDomainRecentResults(paciente, domId, 4);
  const quant = results.filter(r => typeof r.pct === "number" && !Number.isNaN(r.pct));

  if (!results.length) {
    return {
      id: domId,
      status: "sin_datos",
      title: "Aún sin datos recientes",
      detail: "No hay suficientes sesiones recientes en esta área para proponer un ajuste.",
      suggestedState: area.estado,
      suggestedPriority: area.prioridad,
      confidence: "baja",
      icon: "⏳",
    };
  }

  const recent = quant.slice(-3);
  const avgPct = recent.length
    ? Math.round(recent.reduce((a, r) => a + r.pct, 0) / recent.length)
    : null;

  const trackedSupport = results
    .map(r => getTrackedSupportLevel(r))
    .filter(v => typeof v === "number");
  const avgSupport = trackedSupport.length
    ? trackedSupport.reduce((a, v) => a + v, 0) / trackedSupport.length
    : null;

  const avgLevelVals = results
    .map(r => r.adaptiveLevel)
    .filter(v => typeof v === "number");
  const avgLevel = avgLevelVals.length
    ? Math.round((avgLevelVals.reduce((a, b) => a + b, 0) / avgLevelVals.length) * 10) / 10
    : null;

  const autonomyRate = trackedSupport.length
    ? Math.round((trackedSupport.filter(v => v === 0).length / trackedSupport.length) * 100)
    : null;

  const firstPct = quant[0]?.pct ?? null;
  const lastPct = quant[quant.length - 1]?.pct ?? null;
  const delta = firstPct !== null && lastPct !== null ? lastPct - firstPct : null;

  const hasClinicalReview = results.some(r => r.requiresReview);

  if (hasClinicalReview && quant.length === 0) {
    return {
      id: domId,
      status: "revision_profesional",
      title: "Requiere valoración profesional",
      detail: "Los registros recientes de esta área no deben interpretarse automáticamente como porcentaje.",
      suggestedState: "revision",
      suggestedPriority: "media",
      confidence: "alta",
      icon: "🧑‍⚕️",
      metrics: { avgPct, avgSupport, avgLevel, autonomyRate, delta },
    };
  }

  if (avgPct !== null && avgPct >= 85 && autonomyRate !== null && autonomyRate >= 75 && avgSupport !== null && avgSupport <= 0.5) {
    return {
      id: domId,
      status: "progreso_solido",
      title: "Progreso sólido y autónomo",
      detail: "El desempeño reciente es alto con poca necesidad de apoyo. Puede considerarse mantenimiento o un aumento gradual del desafío.",
      suggestedState: area.estado === "objetivo" ? "seguimiento" : "mantenimiento",
      suggestedPriority: area.prioridad === "alta" ? "media" : "baja",
      confidence: recent.length >= 3 ? "alta" : "media",
      icon: "📈",
      metrics: { avgPct, avgSupport, avgLevel, autonomyRate, delta },
    };
  }

  if (avgPct !== null && avgPct < 60 && avgSupport !== null && avgSupport >= 1.5) {
    return {
      id: domId,
      status: "revisar_apoyos",
      title: "Revisar estrategia de apoyo",
      detail: "El área mantiene bajo desempeño y necesita apoyos frecuentes. Conviene revisar la estrategia, ejemplos o nivel de dificultad antes de intensificar.",
      suggestedState: "objetivo",
      suggestedPriority: "alta",
      confidence: recent.length >= 2 ? "alta" : "media",
      icon: "🧩",
      metrics: { avgPct, avgSupport, avgLevel, autonomyRate, delta },
    };
  }

  if (avgPct !== null && avgPct < 60) {
    return {
      id: domId,
      status: "continuar_objetivo",
      title: "Mantener como objetivo activo",
      detail: "El desempeño reciente aún muestra oportunidad de fortalecimiento. Conviene continuar el trabajo y observar la tendencia.",
      suggestedState: "objetivo",
      suggestedPriority: area.prioridad === "baja" ? "media" : area.prioridad,
      confidence: recent.length >= 2 ? "media" : "baja",
      icon: "🎯",
      metrics: { avgPct, avgSupport, avgLevel, autonomyRate, delta },
    };
  }

  if (avgPct !== null && avgPct >= 60 && avgPct < 85) {
    return {
      id: domId,
      status: "seguimiento",
      title: "Continuar seguimiento",
      detail: "El desempeño se encuentra en un rango intermedio. Mantén el objetivo y observa si mejora la autonomía o aumenta la dificultad tolerada.",
      suggestedState: "seguimiento",
      suggestedPriority: "media",
      confidence: recent.length >= 2 ? "media" : "baja",
      icon: "👀",
      metrics: { avgPct, avgSupport, avgLevel, autonomyRate, delta },
    };
  }

  return {
    id: domId,
    status: "mantener",
    title: "Mantener plan actual",
    detail: "Los datos recientes no muestran una señal clara para modificar el plan.",
    suggestedState: area.estado,
    suggestedPriority: area.prioridad,
    confidence: "baja",
    icon: "✅",
    metrics: { avgPct, avgSupport, avgLevel, autonomyRate, delta },
  };
}

function buildInterventionReview(paciente, planAreas = []) {
  return planAreas
    .filter(a => a.estado !== "excluir")
    .map(a => buildDomainReviewSuggestion(paciente, a));
}

function ReviewSuggestionCard({ suggestion, area, onApply }) {
  const dom = DOMINIOS_ADULTO[suggestion.id];
  const m = suggestion.metrics || {};
  const willChange = suggestion.suggestedState !== area.estado || suggestion.suggestedPriority !== area.prioridad;

  return (
    <div style={{ padding: 14, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 10, background: COLORS.white }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ fontSize: "1.4rem" }}>{suggestion.icon}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{dom?.emoji} {dom?.label}</div>
            <div style={{ fontWeight: 700, fontSize: ".76rem", marginTop: 3, color: COLORS.primary }}>{suggestion.title}</div>
            <p style={{ margin: "5px 0 0", fontSize: ".73rem", color: COLORS.textMuted, lineHeight: 1.5 }}>{suggestion.detail}</p>
          </div>
        </div>
        <Badge
          label={`Confianza ${suggestion.confidence}`}
          color={suggestion.confidence === "alta" ? COLORS.success : suggestion.confidence === "media" ? COLORS.warning : COLORS.textMuted}
        />
      </div>

      {suggestion.metrics && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${COLORS.border}`, fontSize: ".68rem", color: COLORS.textMuted }}>
          {m.avgPct !== null && m.avgPct !== undefined && <span>Desempeño reciente: {m.avgPct}%</span>}
          {m.autonomyRate !== null && m.autonomyRate !== undefined && <span>Autonomía: {m.autonomyRate}%</span>}
          {m.avgLevel !== null && m.avgLevel !== undefined && <span>Nivel medio: {m.avgLevel}/5</span>}
          {m.avgSupport !== null && m.avgSupport !== undefined && <span>Apoyo medio: {Math.round(m.avgSupport * 10) / 10}</span>}
          {m.delta !== null && m.delta !== undefined && <span>Cambio: {m.delta > 0 ? "+" : ""}{m.delta} pts</span>}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: ".7rem", color: COLORS.textMuted }}>
          Sugerencia: <strong>{suggestion.suggestedState}</strong> · prioridad <strong>{suggestion.suggestedPriority}</strong>
        </div>
        {willChange && (
          <BtnSecondary onClick={() => onApply?.(suggestion)} style={{ fontSize: ".72rem", padding: "6px 10px" }}>
            Aplicar al borrador
          </BtnSecondary>
        )}
      </div>
    </div>
  );
}

function PerfilIntervencion({ paciente, onUpdate, onIniciarSesion }) {
  const evalHist = paciente.eval?.hist || [];
  const allDoms = Object.keys(DOMINIOS_ADULTO);

  const sugerenciaInicial = allDoms.map(id => {
    const h = evalHist.find(x => x.id === id);
    const pct = typeof h?.pct === "number" ? h.pct : null;
    let estado = "seguimiento";
    let prioridad = "media";

    if (h?.requiresReview || pct === null) {
      estado = "revision";
      prioridad = "media";
    } else if (pct < 60) {
      estado = "objetivo";
      prioridad = "alta";
    } else if (pct >= 80) {
      estado = "mantenimiento";
      prioridad = "baja";
    }

    return {
      id,
      estado,
      prioridad,
      objetivo: "",
      pctInicial: h?.requiresReview ? null : pct,
    };
  });

  const [plan, setPlan] = useState(() =>
    paciente.interventionPlan?.areas?.length
      ? paciente.interventionPlan.areas
      : sugerenciaInicial
  );
  const [notas, setNotas] = useState(paciente.interventionPlan?.notas || "");
  const [saving, setSaving] = useState(false);
  const [showReview, setShowReview] = useState(true);
  const reviewSuggestions = buildInterventionReview(paciente, plan);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");

  const updateArea = (id, changes) => {
    setPlan(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a));
  };

  const applyReviewSuggestion = (suggestion) => {
    setPlan(prev => prev.map(a =>
      a.id === suggestion.id
        ? {
            ...a,
            estado: suggestion.suggestedState,
            prioridad: suggestion.suggestedPriority,
            reviewAppliedAt: new Date().toISOString(),
            reviewSource: suggestion.status,
          }
        : a
    ));
  };

  const generarPlanRehabilitacion = async () => {
    try {
      setGenerating(true);
      setGenerationMessage("");
      const generatedAreas = buildRehabilitationPlanFromEvaluation(paciente);
      const interventionPlan = {
        updatedAt: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        generatedBy: "neuroflex",
        planType: "rehabilitacion",
        sourceEvalDate: paciente.eval?.date || null,
        areas: generatedAreas,
        notas,
      };

      setPlan(generatedAreas);
      await updateDoc(doc(firestore, "pacientes", paciente.id), { interventionPlan });
      onUpdate?.({ ...paciente, interventionPlan });
      setGenerationMessage("✅ Plan de rehabilitación generado y guardado.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      return true;
    } catch (e) {
      console.error("Error generando plan de rehabilitación:", e);
      setGenerationMessage("❌ No se pudo guardar el plan. Revisa la conexión y vuelve a intentar.");
      return false;
    } finally {
      setGenerating(false);
    }
  };

  const guardar = async () => {
    try {
      setSaving(true);
      const interventionPlan = {
        updatedAt: new Date().toISOString(),
        sourceEvalDate: paciente.eval?.date || null,
        areas: plan,
        notas,
      };
      await updateDoc(doc(firestore, "pacientes", paciente.id), { interventionPlan });
      onUpdate?.({ ...paciente, interventionPlan });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      return true;
    } catch (e) {
      console.error("Error guardando perfil de intervención:", e);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const objetivosActivos = plan.filter(a => a.estado === "objetivo" || a.estado === "seguimiento");
  const mantenimiento = plan.filter(a => a.estado === "mantenimiento");
  const revision = plan.filter(a => a.estado === "revision");

  const estadoConfig = {
    objetivo: { label: "Objetivo", color: COLORS.error },
    seguimiento: { label: "Seguimiento", color: COLORS.warning },
    mantenimiento: { label: "Mantenimiento", color: COLORS.success },
    revision: { label: "Revisión clínica", color: COLORS.accent },
    excluir: { label: "Excluir", color: COLORS.textMuted },
  };

  const prioridadConfig = {
    alta: { label: "Alta", color: COLORS.error },
    media: { label: "Media", color: COLORS.warning },
    baja: { label: "Baja", color: COLORS.success },
  };

  return (
    <div>
      <Card style={{ marginBottom: 20, background: COLORS.primary + "06", border: `1px solid ${COLORS.primary}18` }}>
        <h3 style={{ margin: "0 0 6px", fontSize: ".95rem" }}>🎯 Perfil de intervención</h3>
        <p style={{ margin: 0, color: COLORS.textMuted, fontSize: ".8rem", lineHeight: 1.6 }}>
          NeuroFlex propone una organización inicial a partir de la evaluación. El profesional puede modificar
          prioridades, dejar áreas en mantenimiento, excluirlas o indicar revisión clínica. Este plan no modifica
          los resultados originales de la evaluación.
        </p>
      </Card>

      <Card style={{ marginBottom: 20, border: `1.5px solid ${COLORS.primary}25`, background: COLORS.primary + "04" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontWeight: 800, margin: "0 0 4px" }}>✨ Generar plan de rehabilitación</p>
            <p style={{ color: COLORS.textMuted, fontSize: ".75rem", lineHeight: 1.5, margin: 0 }}>
              Crea objetivos y prioridades a partir de la evaluación, los muestra aquí y los guarda en el paciente. Después puedes modificarlos libremente.
            </p>
          </div>
          <BtnPrimary onClick={generarPlanRehabilitacion} disabled={generating || !paciente.eval}>
            {generating ? "Generando..." : "✨ Generar y guardar plan"}
          </BtnPrimary>
        </div>
        {generationMessage && <p style={{ margin: "10px 0 0", fontSize: ".76rem", fontWeight: 700 }}>{generationMessage}</p>}
      </Card>


      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            ["Objetivos activos", objetivosActivos.length, COLORS.primary],
            ["Mantenimiento", mantenimiento.length, COLORS.success],
            ["Revisión clínica", revision.length, COLORS.accent],
          ].map(([label, value, color]) => (
            <div key={label} style={{ padding: 14, borderRadius: 12, background: color + "08", border: `1px solid ${color}18`, textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: "1.35rem", color }}>{value}</div>
              <div style={{ fontSize: ".73rem", color: COLORS.textMuted }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Áreas y objetivos terapéuticos</p>
        <p style={{ color: COLORS.textMuted, fontSize: ".76rem", marginBottom: 16 }}>
          Las sugerencias iniciales se basan en el desempeño de las tareas; puedes cambiarlas libremente.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {plan.map(area => {
            const dom = DOMINIOS_ADULTO[area.id];
            const evalItem = evalHist.find(h => h.id === area.id);
            const est = estadoConfig[area.estado] || estadoConfig.seguimiento;
            return (
              <div key={area.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: COLORS.white }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{dom?.emoji} {dom?.label}</div>
                    <div style={{ color: COLORS.textMuted, fontSize: ".72rem", marginTop: 2 }}>
                      {typeof evalItem?.pct === "number" ? `Indicador inicial: ${evalItem.pct}%` : "Requiere valoración profesional"}
                    </div>
                  </div>
                  <Badge label={est.label} color={est.color} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: ".72rem", color: COLORS.textMuted, fontWeight: 600 }}>Estado</label>
                    <select
                      value={area.estado}
                      onChange={e => updateArea(area.id, { estado: e.target.value })}
                      style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${COLORS.border}`, background: COLORS.white, fontFamily: "inherit" }}
                    >
                      <option value="objetivo">Objetivo de intervención</option>
                      <option value="seguimiento">Seguimiento / fortalecimiento</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="revision">Revisión clínica</option>
                      <option value="excluir">Excluir por ahora</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: ".72rem", color: COLORS.textMuted, fontWeight: 600 }}>Prioridad</label>
                    <select
                      value={area.prioridad}
                      onChange={e => updateArea(area.id, { prioridad: e.target.value })}
                      disabled={area.estado === "excluir"}
                      style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${COLORS.border}`, background: area.estado === "excluir" ? COLORS.bg : COLORS.white, fontFamily: "inherit" }}
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>
                </div>

                <label style={{ fontSize: ".72rem", color: COLORS.textMuted, fontWeight: 600 }}>Objetivo clínico / funcional</label>
                <input
                  value={area.objetivo || ""}
                  onChange={e => updateArea(area.id, { objetivo: e.target.value })}
                  placeholder={`Ej.: fortalecer ${dom?.label?.toLowerCase() || "esta área"} en actividades funcionales`}
                  style={{ width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${COLORS.border}`, fontFamily: "inherit", fontSize: ".82rem" }}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card style={{ marginBottom: 20, background: COLORS.primary + "04", border: `1.5px solid ${COLORS.primary}18` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: showReview ? 12 : 0 }}>
          <div>
            <p style={{ fontWeight: 800, margin: 0 }}>🔄 Revisión del plan según evolución</p>
            <p style={{ color: COLORS.textMuted, fontSize: ".75rem", margin: "3px 0 0" }}>
              Sugerencias descriptivas basadas en sesiones recientes. No modifican el plan automáticamente.
            </p>
          </div>
          <button onClick={() => setShowReview(v => !v)}
            style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: ".72rem" }}>
            {showReview ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {showReview && (
          <div>
            {reviewSuggestions.length === 0 ? (
              <p style={{ color: COLORS.textMuted, fontSize: ".8rem" }}>No hay áreas disponibles para revisar.</p>
            ) : reviewSuggestions.map(s => {
              const area = plan.find(a => a.id === s.id);
              return area ? (
                <ReviewSuggestionCard
                  key={s.id}
                  suggestion={s}
                  area={area}
                  onApply={applyReviewSuggestion}
                />
              ) : null;
            })}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>📝 Observaciones del plan</p>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Objetivos generales, consideraciones funcionales, factores clínicos, ajustes previstos..."
          style={{ width: "100%", minHeight: 100, padding: 12, borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontFamily: "inherit", resize: "vertical" }}
        />
      </Card>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {saved && <span style={{ alignSelf: "center", color: COLORS.success, fontSize: ".82rem", fontWeight: 600 }}>✅ Plan guardado</span>}
        <BtnSecondary
          onClick={() => downloadSimplePdf(
            `NeuroFlex_Plan_${(paciente.nombre || "paciente").replace(/\s+/g, "_")}.pdf`,
            "NeuroFlex - Plan de rehabilitacion",
            buildPlanPdfLines(paciente, plan, notas)
          )}
          disabled={!plan.length}
        >
          📄 Descargar plan PDF
        </BtnSecondary>
        <BtnSecondary onClick={guardar} disabled={saving}>{saving ? "Guardando..." : "💾 Guardar plan"}</BtnSecondary>
        <BtnPrimary onClick={async () => { const ok = await guardar(); if (ok) onIniciarSesion?.(); }} disabled={saving || objetivosActivos.length === 0}>
          ▶ Configurar próxima sesión
        </BtnPrimary>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Buscar el rol del usuario en Firestore
      const uid = cred.user.uid;
      let role = null;
      let userData = null;
      // Verificar en cada colección
      for (const col of ["admins", "profesionales", "pacientes"]) {
        const snap = await getDoc(doc(firestore, col, uid));
        if (snap.exists()) {
          role = col === "admins" ? "admin" : col === "profesionales" ? "profesional" : "paciente";
          userData = { ...snap.data(), uid, email: cred.user.email };
          break;
        }
      }
      if (!role) {
        await signOut(auth);
        setError("Usuario no encontrado en el sistema. Contacta al administrador.");
      } else {
        onLogin(role, userData);
      }
    } catch(e) {
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") setError("Correo o contraseña incorrectos.");
      else if (e.code === "auth/too-many-requests") setError("Demasiados intentos. Espera unos minutos.");
      else setError("Error al iniciar sesión. Verifica tu conexión.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.sidebar} 0%, ${COLORS.primaryDark} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.body }}>
      <style>{baseStyles}</style>
      <div style={{ width: "100%", maxWidth: 420, padding: 20 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 14px" }}>🧠</div>
          <h1 style={{ color: COLORS.white, fontWeight: 800, fontSize: "1.8rem", margin: "0 0 6px" }}>NeuroFlex</h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".9rem" }}>Plataforma de Rehabilitación Cognitiva</p>
        </div>

        {/* Card */}
        <div style={{ background: COLORS.white, borderRadius: 20, padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 24, color: COLORS.textPrimary }}>Iniciar sesión</h2>
          <Input label="Correo electrónico" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} type="email" placeholder="usuario@neuroflex.com" />
          <Input label="Contraseña" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} type="password" placeholder="••••••••" />
          {error && (
            <div style={{ background: COLORS.error + "12", border: `1px solid ${COLORS.error}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ color: COLORS.error, fontSize: ".82rem", margin: 0 }}>⚠️ {error}</p>
            </div>
          )}
          <BtnPrimary onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "13px" }}>
            {loading ? "Verificando..." : "Entrar →"}
          </BtnPrimary>
        </div>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,.25)", fontSize: ".72rem", marginTop: 20 }}>NeuroFlex · Uso exclusivo profesional clínico</p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ADMIN ──────────────────────────────────────────────────────────
function DashboardAdmin({ user }) {
  const [stats, setStats] = useState({ profesionales: 0, pacientes: 0, sesiones: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [profs, pacs] = await Promise.all([
          getDocs(collection(firestore, "profesionales")),
          getDocs(collection(firestore, "pacientes")),
        ]);
        setStats({ profesionales: profs.size, pacientes: pacs.size, sesiones: 0 });
      } catch(e) {}
    })();
  }, []);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
        <StatCard icon="👥" label="Profesionales" value={stats.profesionales} color={COLORS.primary} />
        <StatCard icon="🧑‍⚕️" label="Pacientes" value={stats.pacientes} color={COLORS.accent} />
        <StatCard icon="📅" label="Sesiones totales" value={stats.sesiones} color={COLORS.warning} />
      </div>
      <Card>
        <p style={{ color: COLORS.textMuted, fontSize: ".9rem" }}>Bienvenido al panel de administración de NeuroFlex. Desde aquí puedes gestionar profesionales, centros y visualizar estadísticas globales.</p>
      </Card>
    </>
  );
}

// ─── GESTIÓN DE PROFESIONALES (ADMIN) ────────────────────────────────────────
function GestionProfesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", especialidad: "", centro: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProf, setSelectedProf] = useState(null); // profesional seleccionado
  const [pacientesProf, setPacientesProf] = useState([]); // pacientes del profesional
  const [loadingPac, setLoadingPac] = useState(false);

  const cargar = async () => {
    const snap = await getDocs(collection(firestore, "profesionales"));
    setProfesionales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { cargar(); }, []);

  const verPacientes = async (prof) => {
    setSelectedProf(prof);
    setLoadingPac(true);
    try {
      const snap = await getDocs(query(collection(firestore, "pacientes"), where("profesionalId", "==", prof.id)));
      setPacientesProf(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn)));
    } catch(e) {}
    setLoadingPac(false);
  };

  const crearProfesional = async () => {
    if (!form.nombre || !form.email || !form.password) { setError("Completa todos los campos obligatorios."); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth2, form.email, form.password);
      await setDoc(doc(firestore, "profesionales", cred.user.uid), {
        nombre: form.nombre, email: form.email,
        especialidad: form.especialidad, centro: form.centro,
        creadoEn: new Date().toISOString(), activo: true,
      });
      setShowForm(false);
      setForm({ nombre: "", email: "", password: "", especialidad: "", centro: "" });
      await cargar();
    } catch(e) {
      setError(e.code === "auth/email-already-in-use" ? "Este correo ya está registrado." : "Error al crear profesional.");
    }
    setLoading(false);
  };

  // Vista de pacientes del profesional seleccionado
  if (selectedProf) return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setSelectedProf(null)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "1.1rem" }}>←</button>
        <Avatar name={selectedProf.nombre} size={40} />
        <div>
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>{selectedProf.nombre}</h2>
          <p style={{ color: COLORS.textMuted, margin: 0, fontSize: ".82rem" }}>{selectedProf.especialidad || "Sin especialidad"} · {selectedProf.centro || "Sin sede"}</p>
        </div>
        <Badge label={`${pacientesProf.length} pacientes`} color={COLORS.primary} />
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.bg }}>
              {["Paciente", "Edad", "Diagnóstico", "Sesiones", "Evaluación", "Estado"].map((h, i) => (
                <th key={i} style={{ padding: "12px 20px", textAlign: "left", fontSize: ".75rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: .5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingPac ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.textMuted }}>Cargando...</td></tr>
            ) : pacientesProf.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.textMuted }}>Este profesional aún no tiene pacientes.</td></tr>
            ) : pacientesProf.map((p, i) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={p.nombre} size={32} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: ".88rem", margin: 0 }}>{p.nombre}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: ".72rem", margin: 0 }}>{p.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: ".85rem" }}>{p.edad} años</td>
                <td style={{ padding: "14px 20px", fontSize: ".85rem", color: COLORS.textSecond }}>{p.diagnostico || "—"}</td>
                <td style={{ padding: "14px 20px" }}><Badge label={`${p.sesiones?.length || 0} sesiones`} color={COLORS.primary} /></td>
                <td style={{ padding: "14px 20px" }}><Badge label={p.eval ? "✅ Evaluado" : "⏳ Pendiente"} color={p.eval ? COLORS.success : COLORS.warning} /></td>
                <td style={{ padding: "14px 20px" }}><Badge label={p.activo ? "Activo" : "Inactivo"} color={p.activo ? COLORS.success : COLORS.textMuted} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <p style={{ color: COLORS.textMuted, fontSize: ".9rem" }}>{profesionales.length} profesionales registrados</p>
        <BtnPrimary onClick={() => setShowForm(true)}>+ Agregar profesional</BtnPrimary>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24, border: `2px solid ${COLORS.primary}30` }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1rem" }}>Nuevo profesional</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 20px" }}>
            <Input label="Nombre completo *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Dra. Ana García" />
            <Input label="Correo electrónico *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="ana@clinica.com" />
            <Input label="Contraseña *" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} type="password" placeholder="Mínimo 6 caracteres" />
            <Input label="Especialidad" value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} placeholder="Ej: Neuropsicología" />
            <Input label="Centro / Sede" value={form.centro} onChange={e => setForm(f => ({ ...f, centro: e.target.value }))} placeholder="Ej: Sede Barranquilla" />
          </div>
          {error && <p style={{ color: COLORS.error, fontSize: ".82rem", marginBottom: 12 }}>⚠️ {error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={crearProfesional} disabled={loading}>{loading ? "Creando..." : "Crear profesional"}</BtnPrimary>
            <BtnSecondary onClick={() => { setShowForm(false); setError(""); }}>Cancelar</BtnSecondary>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.bg }}>
              {["Profesional", "Especialidad", "Centro", "Estado", "Pacientes", ""].map((h, i) => (
                <th key={i} style={{ padding: "12px 20px", textAlign: "left", fontSize: ".75rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: .5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profesionales.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.textMuted }}>No hay profesionales registrados aún.</td></tr>
            ) : profesionales.map((p, i) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                onClick={() => verPacientes(p)}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={p.nombre} size={34} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: ".88rem", margin: 0 }}>{p.nombre}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: ".75rem", margin: 0 }}>{p.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: ".85rem", color: COLORS.textSecond }}>{p.especialidad || "—"}</td>
                <td style={{ padding: "14px 20px", fontSize: ".85rem", color: COLORS.textSecond }}>{p.centro || "—"}</td>
                <td style={{ padding: "14px 20px" }}><Badge label={p.activo ? "Activo" : "Inactivo"} color={p.activo ? COLORS.success : COLORS.textMuted} /></td>
                <td style={{ padding: "14px 20px", fontSize: ".82rem", color: COLORS.textMuted }}>Ver pacientes →</td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ color: COLORS.primary, fontSize: ".82rem", fontWeight: 600 }}>→</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ─── DASHBOARD PROFESIONAL ────────────────────────────────────────────────────
function DashboardProfesional({ user }) {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(firestore, "pacientes"), where("profesionalId", "==", user.uid)));
        setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch(e) {}
      setLoading(false);
    })();
  }, []);

  // Calcular estadísticas reales
  const total = pacientes.length;
  const activos = pacientes.filter(p => p.activo).length;
  const conEval = pacientes.filter(p => p.eval).length;
  const totalSesiones = pacientes.reduce((a, p) => a + (p.sesiones?.length || 0), 0);

  // Adherencia promedio (sesiones completadas / sesiones planeadas)
  const adherencia = total > 0
    ? Math.round(pacientes.reduce((a, p) => {
        const plan = p.plan?.length || 0;
        const done = p.sesiones?.length || 0;
        return a + (plan > 0 ? Math.min(100, Math.round(done/plan*100)) : 0);
      }, 0) / total)
    : 0;

  // Progreso promedio global: solo sesiones con indicador cuantificable.
  const promedioGlobal = (() => {
    const promedios = pacientes
      .map(p => {
        const vals = (p.sesiones || [])
          .map(s => getSessionMetric(s, "taskIndicator"))
          .filter(v => typeof v === "number");
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      })
      .filter(v => typeof v === "number");
    if (!promedios.length) return null;
    return Math.round(promedios.reduce((a, b) => a + b, 0) / promedios.length);
  })();

  // Top 5 pacientes más activos
  const masActivos = [...pacientes]
    .sort((a, b) => (b.sesiones?.length || 0) - (a.sesiones?.length || 0))
    .slice(0, 5);

  // Pacientes que más mejoraron: compara primera y última sesión cuantificable.
  const masProgreso = [...pacientes]
    .map(p => {
      const cuantificables = (p.sesiones || [])
        .filter(s => typeof getSessionMetric(s, "taskIndicator") === "number");
      if (cuantificables.length < 2) return null;
      const primera = getSessionMetric(cuantificables[0], "taskIndicator");
      const ultima = getSessionMetric(cuantificables[cuantificables.length - 1], "taskIndicator");
      return { ...p, mejora: ultima - primera };
    })
    .filter(Boolean)
    .sort((a, b) => b.mejora - a.mejora)
    .slice(0, 5);

  // Últimas sesiones (actividad reciente)
  const actividadReciente = pacientes
    .flatMap(p => (p.sesiones || []).map(s => ({ ...s, pacienteNombre: p.nombre, pacienteId: p.id })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>Cargando...</div>;

  return (
    <>
      {/* Stats principales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" label="Pacientes" value={total} sub={`${activos} activos`} color={COLORS.primary} />
        <StatCard icon="📅" label="Sesiones totales" value={totalSesiones} color={COLORS.accent} />
        <StatCard
          icon="📊"
          label="Progreso promedio"
          value={typeof promedioGlobal === "number" ? `${promedioGlobal}%` : "—"}
          sub={typeof promedioGlobal === "number" ? "Indicador descriptivo" : "Sin datos cuantificables"}
          color={typeof promedioGlobal === "number" ? gradeColor(promedioGlobal) : COLORS.textMuted}
        />
        <StatCard icon="🧠" label="Con evaluación" value={conEval} sub={`de ${total} pacientes`} color={COLORS.info} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 20 }}>
        {/* Pacientes más activos */}
        <Card>
          <p style={{ fontWeight: 700, marginBottom: 16, fontSize: ".95rem" }}>🏆 Pacientes más activos</p>
          {masActivos.length === 0 ? (
            <p style={{ color: COLORS.textMuted, fontSize: ".85rem" }}>Sin sesiones registradas aún.</p>
          ) : masActivos.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 900, color: COLORS.textMuted, fontSize: ".85rem", width: 16 }}>{i + 1}</span>
                <Avatar name={p.nombre} size={32} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: ".85rem" }}>{p.nombre}</p>
                  <p style={{ margin: 0, fontSize: ".72rem", color: COLORS.textMuted }}>{p.edad} años</p>
                </div>
              </div>
              <Badge label={`${p.sesiones?.length || 0} sesiones`} color={COLORS.primary} />
            </div>
          ))}
        </Card>

        {/* Pacientes que más mejoraron */}
        <Card>
          <p style={{ fontWeight: 700, marginBottom: 16, fontSize: ".95rem" }}>📈 Mayor progreso</p>
          {masProgreso.length === 0 ? (
            <p style={{ color: COLORS.textMuted, fontSize: ".85rem" }}>Se necesitan al menos 2 sesiones por paciente.</p>
          ) : masProgreso.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 900, color: COLORS.textMuted, fontSize: ".85rem", width: 16 }}>{i + 1}</span>
                <Avatar name={p.nombre} size={32} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: ".85rem" }}>{p.nombre}</p>
              </div>
              <Badge
                label={p.mejora > 0 ? `+${p.mejora}%` : `${p.mejora}%`}
                color={p.mejora > 0 ? COLORS.success : COLORS.error}
              />
            </div>
          ))}
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 16, fontSize: ".95rem" }}>🕐 Actividad reciente</p>
        {actividadReciente.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ color: COLORS.textMuted }}>No hay sesiones registradas aún.</p>
          </div>
        ) : actividadReciente.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: (typeof s.gp === "number" ? gradeColor(s.gp) : COLORS.accent) + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>📅</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: ".85rem" }}>{s.pacienteNombre}</p>
                <p style={{ margin: 0, fontSize: ".72rem", color: COLORS.textMuted }}>Sesión {s.numero} · {new Date(s.date).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {typeof s.gp === "number"
                ? <span style={{ fontWeight: 700, color: gradeColor(s.gp), fontSize: ".9rem" }}>{s.gp}%</span>
                : <span style={{ fontWeight: 600, color: COLORS.accent, fontSize: ".75rem" }}>Revisión clínica</span>}
              <span style={{ fontSize: ".75rem", color: COLORS.textMuted }}>{fmt(s.secs || 0)}</span>
            </div>
          </div>
        ))}
      </Card>

      {/* Gráfica de rendimiento por dominio (agregada) */}
      {pacientes.some(p => p.eval) && (
        <Card>
          <p style={{ fontWeight: 700, marginBottom: 16, fontSize: ".95rem" }}>🧠 Rendimiento promedio por dominio cognitivo</p>
          <p style={{ fontSize: ".78rem", color: COLORS.textMuted, marginBottom: 16 }}>Basado en evaluaciones completadas ({conEval} pacientes)</p>
          {Object.keys(DOMINIOS_ADULTO).map(id => {
            const dom = DOMINIOS_ADULTO[id];
            const vals = pacientes
              .filter(p => p.eval?.hist)
              .map(p => p.eval.hist.find(h => h.id === id))
              .filter(h => h && !h.requiresReview && typeof h.pct === "number")
              .map(h => h.pct);
            if (!vals.length) return null;
            const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
            return (
              <div key={id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: ".82rem", fontWeight: 500 }}>{dom.emoji} {dom.label}</span>
                  <span style={{ fontWeight: 700, color: gradeColor(avg), fontSize: ".82rem" }}>{avg}%</span>
                </div>
                <ProgressBar value={avg} color={gradeColor(avg)} height={8} />
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}

// ─── GESTIÓN PACIENTES (PROFESIONAL) ─────────────────────────────────────────
function GestionPacientes({ user, onVerPaciente }) {
  const [pacientes, setPacientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ nombre: "", edad: "", diagnostico: "", motivo: "", email: "", telefono: "", hc: "" });
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    try {
      const snap = await getDocs(query(collection(firestore, "pacientes"), where("profesionalId", "==", user.uid)));
      setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn)));
    } catch(e) {}
  };

  useEffect(() => { cargar(); }, []);

  const [createdCredentials, setCreatedCredentials] = useState(null);

  const crearPaciente = async () => {
    if (!form.nombre || !form.edad) return;
    setLoading(true);
    try {
      // Generar email y contraseña automáticos para el paciente
      const baseEmail = form.email || `${form.nombre.toLowerCase().replace(/\s+/g, ".")}.${Date.now()}@neuroflex.app`;
      const password = Math.random().toString(36).slice(-8).toUpperCase();

      // Crear usuario en Firebase Auth
      let uid = null;
      try {
        const cred = await createUserWithEmailAndPassword(auth2, baseEmail, password);
        uid = cred.user.uid;
        // Guardar en colección pacientes con el UID como documento ID
        await setDoc(doc(firestore, "pacientes", uid), {
          nombre: form.nombre, edad: parseInt(form.edad),
          diagnostico: form.diagnostico, motivo: form.motivo, hc: form.hc,
          email: baseEmail, telefono: form.telefono,
          profesionalId: user.uid, activo: true,
          creadoEn: new Date().toISOString(),
          sesiones: [], plan: null, eval: null,
        });
        setCreatedCredentials({ nombre: form.nombre, email: baseEmail, password });
      } catch(authErr) {
        // Si falla Auth (email duplicado), crear sin Auth
        await addDoc(collection(firestore, "pacientes"), {
          nombre: form.nombre, edad: parseInt(form.edad),
          diagnostico: form.diagnostico, motivo: form.motivo, hc: form.hc,
          email: form.email, telefono: form.telefono,
          profesionalId: user.uid, activo: true,
          creadoEn: new Date().toISOString(),
          sesiones: [], plan: null, eval: null,
        });
      }
      setShowForm(false);
      setForm({ nombre: "", edad: "", diagnostico: "", motivo: "", email: "", telefono: "", hc: "" });
      await cargar();
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const filtrados = pacientes.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <>
      {/* Modal de credenciales creadas */}
      {createdCredentials && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.white, borderRadius: 20, padding: 32, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎉</div>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Paciente creado</h3>
              <p style={{ color: COLORS.textMuted, fontSize: ".88rem" }}>Guarda estas credenciales para el paciente</p>
            </div>
            <div style={{ background: COLORS.bg, borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>{createdCredentials.nombre}</p>
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: ".75rem", color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Usuario (email)</p>
                <p style={{ fontFamily: "monospace", fontSize: ".9rem", color: COLORS.primary, wordBreak: "break-all" }}>{createdCredentials.email}</p>
              </div>
              <div>
                <p style={{ fontSize: ".75rem", color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Contraseña</p>
                <p style={{ fontFamily: "monospace", fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary, letterSpacing: 3 }}>{createdCredentials.password}</p>
              </div>
            </div>
            <p style={{ fontSize: ".78rem", color: COLORS.error, marginBottom: 16 }}>⚠️ Anota estas credenciales ahora. No las podrás ver de nuevo.</p>
            <BtnPrimary onClick={() => setCreatedCredentials(null)} style={{ width: "100%" }}>Entendido, las anoté ✓</BtnPrimary>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
        <input
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar paciente..."
          style={{ flex: 1, maxWidth: 320, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: ".88rem", outline: "none" }}
        />
        <BtnPrimary onClick={() => setShowForm(true)}>+ Nuevo paciente</BtnPrimary>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24, border: `2px solid ${COLORS.primary}30` }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1rem" }}>Nuevo paciente</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 20px" }}>
            <Input label="Nombre completo *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Carlos Martínez" />
            <Input label="Edad *" value={form.edad} onChange={e => setForm(f => ({ ...f, edad: e.target.value }))} type="number" placeholder="Ej: 45" />
            <Input label="Diagnóstico / Condición" value={form.diagnostico} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))} placeholder="Ej: TCE leve, ACV, DCL..." />
            <Input label="Motivo de consulta" value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Ej: Quejas de memoria..." />
            <Input label="Correo (opcional)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
            <Input label="Teléfono (opcional)" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: ".82rem", color: COLORS.textSecond, marginBottom: 6 }}>Historia Clínica (opcional)</label>
            <textarea value={form.hc} onChange={e => setForm(f => ({ ...f, hc: e.target.value }))}
              placeholder="Antecedentes médicos, quirúrgicos, familiares, medicamentos actuales, observaciones relevantes..."
              style={{ width: "100%", minHeight: 120, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: ".9rem", resize: "vertical", fontFamily: "inherit", color: COLORS.textPrimary }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={crearPaciente} disabled={loading || !form.nombre || !form.edad}>{loading ? "Guardando..." : "Crear paciente"}</BtnPrimary>
            <BtnSecondary onClick={() => setShowForm(false)}>Cancelar</BtnSecondary>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.bg }}>
              {["Paciente", "Edad", "Diagnóstico", "Estado", "Última sesión", ""].map((h, i) => (
                <th key={i} style={{ padding: "12px 20px", textAlign: "left", fontSize: ".75rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: .5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: COLORS.textMuted }}>
                {busqueda ? "No se encontraron pacientes." : "Aún no tienes pacientes. Crea el primero."}
              </td></tr>
            ) : filtrados.map(p => (
              <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                onClick={() => onVerPaciente(p)}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={p.nombre} size={34} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: ".88rem", margin: 0 }}>{p.nombre}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: ".72rem", margin: 0 }}>{p.email || "Sin correo"}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: ".85rem" }}>{p.edad} años</td>
                <td style={{ padding: "14px 20px", fontSize: ".85rem", color: COLORS.textSecond }}>{p.diagnostico || "—"}</td>
                <td style={{ padding: "14px 20px" }}><Badge label={p.activo ? "Activo" : "Inactivo"} color={p.activo ? COLORS.success : COLORS.textMuted} /></td>
                <td style={{ padding: "14px 20px", fontSize: ".82rem", color: COLORS.textMuted }}>
                  {p.sesiones?.length > 0 ? new Date(p.sesiones[p.sesiones.length-1]?.date).toLocaleDateString("es") : "Sin sesiones"}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ color: COLORS.primary, fontSize: ".82rem", fontWeight: 600 }}>Ver perfil →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ─── HISTORIA CLÍNICA ─────────────────────────────────────────────────────────
function HistoriaClinicaEditor({ paciente, onUpdate }) {
  const [hc, setHc] = useState(paciente.hc || "");
  const [antMed, setAntMed] = useState(paciente.antMed || "");
  const [antQx, setAntQx] = useState(paciente.antQx || "");
  const [antFam, setAntFam] = useState(paciente.antFam || "");
  const [medicamentos, setMedicamentos] = useState(paciente.medicamentos || "");
  const [alergias, setAlergias] = useState(paciente.alergias || "");
  const [evolucion, setEvolucion] = useState(paciente.evolucion || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const guardar = async () => {
    setSaving(true);
    try {
      const data = { hc, antMed, antQx, antFam, medicamentos, alergias, evolucion };
      await updateDoc(doc(firestore, "pacientes", paciente.id), data);
      onUpdate({ ...paciente, ...data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const sectionStyle = { marginBottom: 20 };
  const labelStyle = { display: "block", fontWeight: 700, fontSize: ".82rem", color: COLORS.textSecond, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 };
  const textareaStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: ".9rem", resize: "vertical", fontFamily: "inherit", color: COLORS.textPrimary, lineHeight: 1.7, outline: "none" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 20 }}>
        {/* Antecedentes médicos */}
        <Card>
          <div style={sectionStyle}>
            <label style={labelStyle}>🏥 Antecedentes médicos</label>
            <textarea value={antMed} onChange={e => setAntMed(e.target.value)} rows={4}
              placeholder="HTA, DM, hipotiroidismo, ACV previo, TCE, epilepsia..."
              style={textareaStyle}
              onFocus={e => e.target.style.borderColor = COLORS.primary}
              onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>🔪 Antecedentes quirúrgicos</label>
            <textarea value={antQx} onChange={e => setAntQx(e.target.value)} rows={3}
              placeholder="Cirugías previas, fechas, complicaciones..."
              style={textareaStyle}
              onFocus={e => e.target.style.borderColor = COLORS.primary}
              onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
          <div>
            <label style={labelStyle}>👨‍👩‍👧 Antecedentes familiares</label>
            <textarea value={antFam} onChange={e => setAntFam(e.target.value)} rows={3}
              placeholder="Demencia, Alzheimer, Parkinson, ACV en familia..."
              style={textareaStyle}
              onFocus={e => e.target.style.borderColor = COLORS.primary}
              onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
        </Card>

        {/* Medicamentos y alergias */}
        <Card>
          <div style={sectionStyle}>
            <label style={labelStyle}>💊 Medicamentos actuales</label>
            <textarea value={medicamentos} onChange={e => setMedicamentos(e.target.value)} rows={4}
              placeholder="Nombre, dosis, frecuencia. Ej: Atorvastatina 20mg c/24h..."
              style={textareaStyle}
              onFocus={e => e.target.style.borderColor = COLORS.primary}
              onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>⚠️ Alergias</label>
            <textarea value={alergias} onChange={e => setAlergias(e.target.value)} rows={2}
              placeholder="Medicamentos, alimentos, sustancias..."
              style={textareaStyle}
              onFocus={e => e.target.style.borderColor = COLORS.primary}
              onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
          <div>
            <label style={labelStyle}>📋 Motivo de consulta / Historia actual</label>
            <textarea value={hc} onChange={e => setHc(e.target.value)} rows={4}
              placeholder="Descripción detallada del motivo de consulta, inicio de síntomas, evolución..."
              style={textareaStyle}
              onFocus={e => e.target.style.borderColor = COLORS.primary}
              onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
        </Card>
      </div>

      {/* Evolución clínica */}
      <Card style={{ marginBottom: 20 }}>
        <label style={labelStyle}>📈 Evolución y observaciones clínicas</label>
        <p style={{ fontSize: ".78rem", color: COLORS.textMuted, marginBottom: 10 }}>
          Registro cronológico de la evolución del paciente durante el proceso de rehabilitación
        </p>
        <textarea value={evolucion} onChange={e => setEvolucion(e.target.value)} rows={6}
          placeholder={`${new Date().toLocaleDateString("es")} — [Fecha]: Observaciones de la sesión, cambios en el estado del paciente, ajustes al plan terapéutico...`}
          style={{ ...textareaStyle, minHeight: 140 }}
          onFocus={e => e.target.style.borderColor = COLORS.primary}
          onBlur={e => e.target.style.borderColor = COLORS.border} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => {
            const fecha = new Date().toLocaleDateString("es");
            setEvolucion(prev => prev ? `${prev}\n\n${fecha} — ` : `${fecha} — `);
          }} style={{ fontSize: ".78rem", color: COLORS.primary, background: "transparent", border: `1px solid ${COLORS.primary}30`, borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>
            + Agregar entrada de hoy
          </button>
        </div>
      </Card>

      {/* Botón guardar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        {saved && <span style={{ color: COLORS.success, fontWeight: 600, alignSelf: "center", fontSize: ".88rem" }}>✅ Guardado correctamente</span>}
        <BtnPrimary onClick={guardar} disabled={saving} style={{ padding: "12px 28px" }}>
          {saving ? "Guardando..." : "💾 Guardar Historia Clínica"}
        </BtnPrimary>
      </div>
    </div>
  );
}


function PerfilPaciente({ paciente: pacienteInit, onVolver, profesionalUid, onIniciarSesion, onPacienteUpdate }) {
  const [paciente, setPaciente] = useState(pacienteInit);
  const setPac = (p) => { setPaciente(p); onPacienteUpdate?.(p); };
  const [tab, setTab] = useState("info");
  const [showEval, setShowEval] = useState(false);
  const [reportSessionNumber, setReportSessionNumber] = useState(null);
  const TABS = [
    { id: "info", label: "Resumen clínico" },
    { id: "hc", label: "Historia clínica" },
    { id: "perfil-cognitivo", label: "Perfil cognitivo" },
    { id: "intervencion", label: "Intervención" },
    { id: "sesiones", label: "Sesiones" },
    { id: "progreso", label: "Progreso" },
    { id: "reportes", label: "Reportes" },
  ];

  const saveEval = async (evalData) => {
    try {
      const updated = { ...paciente, eval: evalData };
      await updateDoc(doc(firestore, "pacientes", paciente.id), { eval: evalData });
      setPaciente(updated);
      setShowEval(false);
      setTab("perfil-cognitivo");
    } catch(e) { console.error(e); }
  };

  if (showEval) return (
    <EvaluacionAdulto
      paciente={paciente}
      onFinish={saveEval}
      onCancel={() => setShowEval(false)}
    />
  );

  return (
    <>
      {/* Header paciente */}
      <Card style={{ marginBottom: 24, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={onVolver} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "1.1rem" }}>←</button>
            <Avatar name={paciente.nombre} size={48} />
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "1.15rem", margin: "0 0 4px" }}>{paciente.nombre}</h2>
              <p style={{ color: COLORS.textMuted, fontSize: ".82rem", margin: 0 }}>
                {paciente.edad} años · {paciente.diagnostico || "Sin diagnóstico"} · {paciente.sesiones?.length || 0} sesiones
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Badge label={paciente.activo ? "Activo" : "Inactivo"} color={paciente.activo ? COLORS.success : COLORS.textMuted} />
            {/* Toggle modo adulto mayor */}
            <button onClick={async () => {
              const nuevo = !paciente.modoMayor;
              await updateDoc(doc(firestore, "pacientes", paciente.id), { modoMayor: nuevo });
              setPac({ ...paciente, modoMayor: nuevo });
            }} style={{
              padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${paciente.modoMayor ? COLORS.accent : COLORS.border}`,
              background: paciente.modoMayor ? COLORS.accent + "15" : "transparent",
              color: paciente.modoMayor ? COLORS.accent : COLORS.textMuted,
              cursor: "pointer", fontSize: ".78rem", fontWeight: 600, fontFamily: "inherit"
            }}>
              {paciente.modoMayor ? "♿ Modo accesible ON" : "♿ Modo accesible"}
            </button>
            {/* Toggle demostración */}
            <button onClick={async () => {
              const nuevo = !paciente.showDemo;
              await updateDoc(doc(firestore, "pacientes", paciente.id), { showDemo: nuevo });
              setPac({ ...paciente, showDemo: nuevo });
            }} style={{
              padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${paciente.showDemo ? COLORS.primary : COLORS.border}`,
              background: paciente.showDemo ? COLORS.primary + "15" : "transparent",
              color: paciente.showDemo ? COLORS.primary : COLORS.textMuted,
              cursor: "pointer", fontSize: ".78rem", fontWeight: 600, fontFamily: "inherit"
            }}>
              {paciente.showDemo ? "🎬 Demo ON" : "🎬 Demo"}
            </button>
            {paciente.eval
              ? <BtnPrimary onClick={onIniciarSesion} style={{ padding: "8px 16px", fontSize: ".82rem" }}>▶ Iniciar sesión</BtnPrimary>
              : <BtnPrimary onClick={() => setShowEval(true)} style={{ padding: "8px 16px", fontSize: ".82rem", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` }}>🧠 Evaluar</BtnPrimary>
            }
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: COLORS.white, padding: 4, borderRadius: 12, border: `1px solid ${COLORS.border}`, width: "fit-content", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} title={PROFILE_TAB_INFO[t.id]?.help} style={{
            padding: "8px 14px", borderRadius: 10, border: "none",
            background: tab === t.id ? COLORS.primary : "transparent",
            color: tab === t.id ? COLORS.white : COLORS.textSecond,
            fontWeight: tab === t.id ? 700 : 400, fontSize: ".8rem", cursor: "pointer", whiteSpace: "nowrap",
          }}><span style={{marginRight:5}}>{PROFILE_TAB_INFO[t.id]?.icon}</span>{t.label}</button>
        ))}
      </div>

      <ClinicalStatusBanner paciente={paciente} onGo={setTab} onEvaluate={() => setShowEval(true)} onSession={onIniciarSesion} />

      {/* Tab content */}
      {tab === "info" && (
        <ClinicalCaseDashboard
          paciente={paciente}
          onGo={setTab}
          onStartSession={onIniciarSesion}
          onEvaluate={() => setShowEval(true)}
        />
      )}

      {tab === "hc" && (
        <HistoriaClinicaEditor paciente={paciente} onUpdate={p => { setPac(p); }} />
      )}

      {tab === "perfil-cognitivo" && (
        paciente.eval
          ? (
            <div>
              <PerfilCognitivoView evalData={paciente.eval} paciente={paciente} onIniciarSesion={() => setTab("intervencion")} />
              <div style={{ marginTop: 20 }}>
                <CurrentVsInitialProfile paciente={paciente} />
              </div>
            </div>
          )
          : (
            <Card>
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: 12 }}>🧠</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Evaluación pendiente</h3>
                <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>Este paciente aún no ha completado la evaluación cognitiva inicial.</p>
                <BtnPrimary onClick={() => setShowEval(true)}>Iniciar evaluación ahora</BtnPrimary>
              </div>
            </Card>
          )
      )}

      {tab === "intervencion" && (
        paciente.eval
          ? <PerfilIntervencion
              paciente={paciente}
              onUpdate={p => setPac(p)}
              onIniciarSesion={onIniciarSesion}
            />
          : (
            <Card>
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎯</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Primero realiza la evaluación</h3>
                <p style={{ color: COLORS.textMuted }}>El perfil de intervención se construye a partir de la evaluación y el criterio profesional.</p>
              </div>
            </Card>
          )
      )}

      {tab === "sesiones" && (
        <Card>
          {!paciente.sesiones?.length ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>📅</div>
              <p style={{ color: COLORS.textMuted }}>No hay sesiones registradas aún.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: COLORS.bg }}>
                  {["Sesión", "Fecha", "Rendimiento", "Duración", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontSize: ".75rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paciente.sesiones.map((s, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: ".88rem" }}>Sesión {s.numero}</td>
                    <td style={{ padding: "12px 16px", fontSize: ".85rem", color: COLORS.textSecond }}>{new Date(s.date).toLocaleDateString("es")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {typeof s.gp === "number"
                        ? <span style={{ fontWeight: 700, color: gradeColor(s.gp) }}>{s.gp}%</span>
                        : <span style={{ color: COLORS.accent, fontSize: ".75rem", fontWeight: 600 }}>Revisión clínica</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: ".85rem", color: COLORS.textSecond }}>{fmt(s.secs || 0)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => { setReportSessionNumber(s.numero); setTab("reportes"); }}
                        style={{ fontSize: ".75rem", color: COLORS.primary, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>
                        Ver reporte
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "progreso" && (
        <ProgressLongitudinal sesiones={paciente.sesiones || []} />
      )}

      {tab === "reportes" && (
        <ClinicalReportCenter
          paciente={paciente}
          initialSessionNumber={reportSessionNumber}
          onClearInitialSession={() => setReportSessionNumber(null)}
        />
      )}
    </>
  );
}


// ─── REPORTES CLÍNICOS INTEGRADOS ─────────────────────────────────────────────

// ─── FASE 19 · PERFIL INICIAL VS ACTUAL + GENERALIZACIÓN INTERNA ───────────────
function getInitialDomainPct(paciente, domId) {
  const item = (paciente?.eval?.hist || []).find(h => h.id === domId);
  return item && typeof item.pct === "number" && !Number.isNaN(item.pct) ? item.pct : null;
}

function getCurrentDomainSnapshot(paciente, domId, maxSessions = 4) {
  const sesiones = paciente?.sesiones || [];
  const recent = [];
  for (let i = sesiones.length - 1; i >= 0 && recent.length < maxSessions; i--) {
    const d = sesiones[i]?.byDom?.[domId];
    if (!d) continue;
    const pct = typeof d.pct === "number"
      ? d.pct
      : (d.total > 0 ? Math.round((d.correct / d.total) * 100) : null);
    recent.unshift({
      numero: sesiones[i].numero,
      date: sesiones[i].date,
      pct,
      level: typeof d.averageAdaptiveLevel === "number" ? d.averageAdaptiveLevel : null,
      autonomy: typeof d.autonomyRate === "number" ? d.autonomyRate : null,
    });
  }
  const numeric = recent.filter(r => typeof r.pct === "number" && !Number.isNaN(r.pct));
  const currentPct = numeric.length ? Math.round(numeric.reduce((a,r)=>a+r.pct,0)/numeric.length) : null;
  return {
    recent,
    currentPct,
    recentSessions: recent.length,
    lastLevel: numeric.length ? numeric[numeric.length-1].level : null,
    lastAutonomy: numeric.length ? numeric[numeric.length-1].autonomy : null,
  };
}

function getExerciseImprovementEvidence(paciente, domId) {
  const byExercise = {};
  (paciente?.sesiones || []).forEach(s => {
    (s.results || []).forEach(r => {
      if (r.domId !== domId || typeof r.pct !== "number" || Number.isNaN(r.pct)) return;
      if (!byExercise[r.exId]) byExercise[r.exId] = [];
      byExercise[r.exId].push({ pct:r.pct, session:s.numero, date:s.date, level:r.adaptiveLevel ?? null });
    });
  });

  const exercises = Object.entries(byExercise).map(([exId,rows]) => {
    const first=rows[0], last=rows[rows.length-1];
    return {
      exId,
      attempts: rows.length,
      firstPct:first?.pct ?? null,
      lastPct:last?.pct ?? null,
      delta:first && last ? last.pct-first.pct : null,
      improved: rows.length>=2 && last.pct>first.pct,
    };
  });

  const distinctImproved=exercises.filter(x=>x.improved).length;
  const distinctMeasured=exercises.length;
  let evidenceType="insuficiente";
  let label="Datos insuficientes";
  let detail="Aún no hay suficientes repeticiones o variedad de tareas para describir un patrón de mejoría.";

  if (distinctImproved>=2) {
    evidenceType="dominio";
    label="Mejoría observada en diferentes tareas";
    detail=`Se observa mejoría en ${distinctImproved} ejercicios diferentes de este dominio. Esto describe generalización dentro de las tareas de NeuroFlex, no transferencia a actividades externas.`;
  } else if (distinctImproved===1) {
    evidenceType="especifica";
    label="Mejoría específica en una tarea";
    detail="La mejoría observada se concentra por ahora en un ejercicio repetido. Conviene comprobarla en otras tareas del mismo dominio.";
  } else if (distinctMeasured>=2) {
    evidenceType="variedad_sin_mejoria";
    label="Varias tareas observadas";
    detail="Existe información de diferentes ejercicios del dominio, pero todavía no se observa una mejoría consistente entre ellos.";
  }
  return { evidenceType,label,detail,distinctImproved,distinctMeasured,exercises };
}

function getCognitiveProfileEvolution(paciente) {
  return Object.keys(DOMINIOS_ADULTO).map(domId => {
    const initialPct=getInitialDomainPct(paciente,domId);
    const current=getCurrentDomainSnapshot(paciente,domId);
    const evidence=getExerciseImprovementEvidence(paciente,domId);
    const delta=initialPct!==null && current.currentPct!==null ? current.currentPct-initialPct : null;
    return {
      domId, initialPct, currentPct:current.currentPct, delta,
      recentSessions:current.recentSessions,
      lastLevel:current.lastLevel,
      lastAutonomy:current.lastAutonomy,
      evidence,
    };
  });
}

function CurrentVsInitialProfile({ paciente }) {
  const rows=getCognitiveProfileEvolution(paciente).filter(r=>r.initialPct!==null || r.currentPct!==null);
  if (!rows.length) return <Card><p style={{color:COLORS.textMuted,margin:0}}>Aún no hay información suficiente para comparar el perfil inicial con el actual.</p></Card>;

  return (
    <div>
      <Card style={{marginBottom:18,background:COLORS.primary+"05",border:`1px solid ${COLORS.primary}18`}}>
        <p style={{fontWeight:800,margin:"0 0 5px"}}>🧭 Perfil inicial vs perfil actual</p>
        <p style={{color:COLORS.textMuted,fontSize:".75rem",lineHeight:1.55,margin:0}}>
          El perfil inicial proviene de la evaluación. El perfil actual resume hasta 4 sesiones recientes de NeuroFlex.
          Las diferencias describen desempeño dentro de estas tareas y no equivalen a cambio clínico general ni transferencia fuera de la plataforma.
        </p>
      </Card>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {rows.map(r=>{
          const dom=DOMINIOS_ADULTO[r.domId];
          const trend=r.delta===null?"—":r.delta>0?`+${r.delta}`:String(r.delta);
          return (
            <Card key={r.domId} style={{padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div style={{minWidth:190,flex:1}}>
                  <div style={{fontWeight:800,fontSize:".82rem"}}>{dom?.emoji} {dom?.label}</div>
                  <div style={{color:COLORS.textMuted,fontSize:".67rem",marginTop:3}}>{r.evidence.label}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(72px, 1fr))",gap:7}}>
                  <div style={{background:COLORS.bg,borderRadius:9,padding:"7px 9px",textAlign:"center"}}><div style={{fontSize:".6rem",color:COLORS.textMuted}}>INICIAL</div><div style={{fontWeight:850}}>{r.initialPct!==null?`${r.initialPct}%`:"—"}</div></div>
                  <div style={{background:COLORS.bg,borderRadius:9,padding:"7px 9px",textAlign:"center"}}><div style={{fontSize:".6rem",color:COLORS.textMuted}}>ACTUAL</div><div style={{fontWeight:850}}>{r.currentPct!==null?`${r.currentPct}%`:"—"}</div></div>
                  <div style={{background:COLORS.bg,borderRadius:9,padding:"7px 9px",textAlign:"center"}}><div style={{fontSize:".6rem",color:COLORS.textMuted}}>CAMBIO</div><div style={{fontWeight:850,color:r.delta>0?COLORS.success:r.delta<0?COLORS.error:COLORS.textMuted}}>{r.delta!==null?`${trend} pts`:"—"}</div></div>
                </div>
              </div>
              <div style={{marginTop:10,padding:"8px 10px",borderRadius:9,background:COLORS.white,border:`1px solid ${COLORS.border}`}}>
                <div style={{fontSize:".68rem",lineHeight:1.45,color:COLORS.textSecond}}><strong>{r.evidence.label}:</strong> {r.evidence.detail}</div>
                {(r.lastLevel!==null || r.lastAutonomy!==null) && <div style={{marginTop:5,fontSize:".64rem",color:COLORS.textMuted}}>
                  {r.lastLevel!==null?`Nivel reciente ${r.lastLevel}/5`:""}{r.lastLevel!==null&&r.lastAutonomy!==null?" · ":""}{r.lastAutonomy!==null?`Autonomía reciente ${r.lastAutonomy}%`:""}
                </div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getDomainLongitudinalSummary(paciente, domId) {
  const sesiones = paciente?.sesiones || [];
  const rows = sesiones
    .map(s => {
      const d = s.byDom?.[domId];
      if (!d) return null;
      const pct = typeof d.pct === "number"
        ? d.pct
        : (d.total > 0 ? Math.round((d.correct / d.total) * 100) : null);
      return {
        numero: s.numero,
        date: s.date,
        pct,
        level: typeof d.averageAdaptiveLevel === "number" ? d.averageAdaptiveLevel : null,
        autonomy: typeof d.autonomyRate === "number" ? d.autonomyRate : null,
        support: typeof d.averageSupportLevel === "number" ? d.averageSupportLevel : null,
      };
    })
    .filter(Boolean);

  const cuantificables = rows.filter(r => typeof r.pct === "number");
  const first = cuantificables[0] || null;
  const last = cuantificables[cuantificables.length - 1] || null;

  return {
    sessions: rows.length,
    firstPct: first?.pct ?? null,
    lastPct: last?.pct ?? null,
    delta: first && last ? last.pct - first.pct : null,
    lastLevel: last?.level ?? null,
    lastAutonomy: last?.autonomy ?? null,
    pendingClinicalReview: rows.filter(r => r.pct === null).length,
  };
}

function getPatientReportSummary(paciente) {
  const sesiones = paciente?.sesiones || [];
  const cuantificables = sesiones.filter(s => typeof getSessionMetric(s, "taskIndicator") === "number");
  const first = cuantificables[0] || null;
  const last = cuantificables[cuantificables.length - 1] || null;
  const firstPct = first ? getSessionMetric(first, "taskIndicator") : null;
  const lastPct = last ? getSessionMetric(last, "taskIndicator") : null;

  const lastSession = sesiones[sesiones.length - 1] || null;
  const lastAutonomy = lastSession ? getSessionMetric(lastSession, "autonomyRate") : null;
  const lastLevel = lastSession ? getSessionMetric(lastSession, "averageAdaptiveLevel") : null;
  const lastTime = lastSession ? getSessionMetric(lastSession, "averageSecondsPerExercise") : null;

  return {
    totalSessions: sesiones.length,
    quantifiableSessions: cuantificables.length,
    firstPct,
    lastPct,
    delta: firstPct !== null && lastPct !== null ? lastPct - firstPct : null,
    lastAutonomy,
    lastLevel,
    lastTime,
  };
}

function ReportDisclaimer() {
  return (
    <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: "#f7f8fb", border: "1px solid #e6e8ef", fontSize: ".72rem", color: "#667085", lineHeight: 1.55 }}>
      Los resultados presentados describen el desempeño observado en tareas de NeuroFlex.
      No corresponden a puntuaciones normativas ni constituyen, por sí solos, un diagnóstico.
      Deben interpretarse junto con la valoración clínica, antecedentes relevantes y juicio profesional.
    </div>
  );
}

function ReporteEvolucionImprimible({ paciente }) {
  const evalHist = paciente?.eval?.hist || [];
  const planAreas = paciente?.interventionPlan?.areas || [];
  const activos = planAreas.filter(a => a.estado === "objetivo" || a.estado === "seguimiento");
  const revision = evalHist.filter(h => h.requiresReview || typeof h.pct !== "number");
  const summary = getPatientReportSummary(paciente);

  return (
    <div id="neuroflex-clinical-report" style={{ background: "#fff", color: "#202632", padding: 28, borderRadius: 16, border: "1px solid #e6e8ef" }}>
      <div style={{ borderBottom: "3px solid #5b5bd6", paddingBottom: 14, marginBottom: 20 }}>
        <div style={{ fontSize: "1.45rem", fontWeight: 900 }}>NeuroFlex · Reporte de evolución</div>
        <div style={{ fontSize: ".78rem", color: "#667085", marginTop: 4 }}>
          Generado el {new Date().toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div><strong>Paciente:</strong> {paciente.nombre}</div>
        <div><strong>Edad:</strong> {paciente.edad ?? "—"} años</div>
        <div><strong>Motivo de consulta:</strong> {paciente.motivo || "No registrado"}</div>
        <div><strong>Sesiones realizadas:</strong> {summary.totalSessions}</div>
      </div>

      <section style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>1. Evaluación inicial</h3>
        {!paciente.eval ? (
          <p style={{ color: "#667085" }}>No se registra evaluación inicial completada.</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
              {evalHist.map(h => {
                const dom = DOMINIOS_ADULTO[h.id];
                return (
                  <div key={h.id} style={{ padding: "8px 10px", border: "1px solid #eceef3", borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: ".8rem" }}>{dom?.emoji} {dom?.label}</div>
                    <div style={{ fontSize: ".74rem", color: "#667085", marginTop: 2 }}>
                      {h.requiresReview || typeof h.pct !== "number"
                        ? "Valoración profesional"
                        : `${h.pct}% · ${performanceLabel(h.pct)}`}
                    </div>
                  </div>
                );
              })}
            </div>
            {!!revision.length && (
              <p style={{ fontSize: ".75rem", color: "#7a5a00", marginTop: 10 }}>
                {revision.length} área(s) incluyen respuestas que requieren valoración profesional y no se incorporan automáticamente al indicador global.
              </p>
            )}
          </>
        )}
      </section>

      <section style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>2. Perfil de intervención</h3>
        {!paciente.interventionPlan ? (
          <p style={{ color: "#667085" }}>No se registra un plan de intervención guardado.</p>
        ) : activos.length === 0 ? (
          <p style={{ color: "#667085" }}>El plan actual no contiene objetivos o áreas de seguimiento activas.</p>
        ) : (
          <div>
            {activos.map(a => {
              const dom = DOMINIOS_ADULTO[a.id];
              return (
                <div key={a.id} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #eceef3" }}>
                  <div style={{ fontWeight: 800, fontSize: ".82rem" }}>
                    {dom?.emoji} {dom?.label} · Prioridad {a.prioridad}
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#667085", marginTop: 2 }}>
                    {a.objetivo?.trim() ? a.objetivo : "Objetivo funcional no especificado."}
                  </div>
                </div>
              );
            })}
            {paciente.interventionPlan?.notas && (
              <div style={{ marginTop: 10, padding: 10, background: "#f7f8fb", borderRadius: 8, fontSize: ".75rem" }}>
                <strong>Observaciones del plan:</strong> {paciente.interventionPlan.notas}
              </div>
            )}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>3. Evolución global en NeuroFlex</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 8, marginBottom: 12 }}>
          {[
            ["Sesiones", summary.totalSessions],
            ["Indicador inicial", summary.firstPct !== null ? `${summary.firstPct}%` : "—"],
            ["Indicador reciente", summary.lastPct !== null ? `${summary.lastPct}%` : "—"],
            ["Cambio descriptivo", summary.delta !== null ? `${summary.delta > 0 ? "+" : ""}${summary.delta} pts` : "—"],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: 10, border: "1px solid #eceef3", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: "1rem" }}>{value}</div>
              <div style={{ fontSize: ".66rem", color: "#667085", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: ".75rem", color: "#667085", lineHeight: 1.55 }}>
          La evolución se interpreta considerando conjuntamente precisión, dificultad, autonomía, tiempo y apoyos.
          Un cambio pequeño en porcentaje puede acompañarse de una modificación relevante en la dificultad alcanzada o en la necesidad de ayuda.
        </p>
      </section>

      <section style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>4. Evolución por dominio</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".72rem" }}>
          <thead>
            <tr style={{ background: "#f7f8fb" }}>
              {["Dominio", "Sesiones", "Inicial", "Reciente", "Cambio", "Nivel reciente", "Autonomía"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "7px 8px", borderBottom: "1px solid #dfe3ea" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(DOMINIOS_ADULTO).map(id => {
              const dom = DOMINIOS_ADULTO[id];
              const d = getDomainLongitudinalSummary(paciente, id);
              if (!d.sessions) return null;
              return (
                <tr key={id}>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #eceef3", fontWeight: 700 }}>{dom?.emoji} {dom?.label}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #eceef3" }}>{d.sessions}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #eceef3" }}>{d.firstPct !== null ? `${d.firstPct}%` : "—"}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #eceef3" }}>{d.lastPct !== null ? `${d.lastPct}%` : "—"}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #eceef3" }}>{d.delta !== null ? `${d.delta > 0 ? "+" : ""}${d.delta}` : "—"}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #eceef3" }}>{d.lastLevel !== null ? `${d.lastLevel}/5` : "—"}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid #eceef3" }}>{d.lastAutonomy !== null ? `${d.lastAutonomy}%` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      
      <section style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>5. Perfil inicial vs actual</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {getCognitiveProfileEvolution(paciente).filter(r => r.initialPct !== null || r.currentPct !== null).map(r => (
            <div key={r.domId} style={{ display: "grid", gridTemplateColumns: "1.5fr .7fr .7fr .8fr", gap: 8, padding: "7px 8px", borderBottom: "1px solid #eceef3", fontSize: ".72rem" }}>
              <span><strong>{DOMINIOS_ADULTO[r.domId]?.label}</strong><br/><span style={{color:"#667085"}}>{r.evidence.label}</span></span>
              <span>Inicial: {r.initialPct !== null ? `${r.initialPct}%` : "—"}</span>
              <span>Actual: {r.currentPct !== null ? `${r.currentPct}%` : "—"}</span>
              <span>Cambio: {r.delta !== null ? `${r.delta > 0 ? "+" : ""}${r.delta} pts` : "—"}</span>
            </div>
          ))}
        </div>
        <p style={{ color: "#667085", fontSize: ".68rem", lineHeight: 1.45, marginTop: 8 }}>
          La mejoría en diferentes tareas se refiere a actividades de NeuroFlex dentro del mismo dominio; no demuestra transferencia fuera de la plataforma.
        </p>
      </section>

<section style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>6. Revisión sugerida del plan</h3>
        {(() => {
          const suggestions = buildInterventionReview(paciente, paciente.interventionPlan?.areas || []);
          if (!suggestions.length) return <p style={{ color: "#667085" }}>No hay áreas disponibles para revisión.</p>;
          return suggestions.map(s => (
            <div key={s.id} style={{ padding: "8px 0", borderBottom: "1px solid #eceef3" }}>
              <div style={{ fontWeight: 700, fontSize: ".78rem" }}>{DOMINIOS_ADULTO[s.id]?.emoji} {DOMINIOS_ADULTO[s.id]?.label} · {s.title}</div>
              <div style={{ color: "#667085", fontSize: ".72rem", marginTop: 2 }}>{s.detail}</div>
            </div>
          ));
        })()}
      </section>

      <section style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>7. Sesiones recientes</h3>
        {(paciente.sesiones || []).length === 0 ? (
          <p style={{ color: "#667085" }}>No se registran sesiones.</p>
        ) : (
          (paciente.sesiones || []).slice(-6).map(s => (
            <div key={s.numero} style={{ padding: "8px 0", borderBottom: "1px solid #eceef3", display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong>Sesión {s.numero}</strong>
                <span style={{ color: "#667085", marginLeft: 8 }}>{new Date(s.date).toLocaleDateString("es")}</span>
                {s.nota && <div style={{ fontSize: ".72rem", color: "#667085", marginTop: 3 }}>Nota clínica: {s.nota}</div>}
              </div>
              <div style={{ textAlign: "right", fontSize: ".74rem" }}>
                <div>{typeof getSessionMetric(s, "taskIndicator") === "number" ? `${getSessionMetric(s, "taskIndicator")}%` : "Revisión clínica"}</div>
                <div style={{ color: "#667085" }}>
                  Autonomía {getSessionMetric(s, "autonomyRate") !== null ? `${getSessionMetric(s, "autonomyRate")}%` : "—"}
                  {" · "}Nivel {getSessionMetric(s, "averageAdaptiveLevel") !== null ? `${getSessionMetric(s, "averageAdaptiveLevel")}/5` : "—"}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <ReportDisclaimer />
    </div>
  );
}

function ReporteSesionImprimible({ paciente, sesion }) {
  if (!sesion) return null;
  const indicator = getSessionMetric(sesion, "taskIndicator");
  return (
    <div id="neuroflex-clinical-report" style={{ background: "#fff", color: "#202632", padding: 28, borderRadius: 16, border: "1px solid #e6e8ef" }}>
      <div style={{ borderBottom: "3px solid #5b5bd6", paddingBottom: 14, marginBottom: 20 }}>
        <div style={{ fontSize: "1.45rem", fontWeight: 900 }}>NeuroFlex · Reporte de sesión {sesion.numero}</div>
        <div style={{ fontSize: ".78rem", color: "#667085", marginTop: 4 }}>
          {paciente.nombre} · {new Date(sesion.date).toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 8, marginBottom: 20 }}>
        {[
          ["Indicador", indicator !== null ? `${indicator}%` : "—"],
          ["Autonomía", getSessionMetric(sesion, "autonomyRate") !== null ? `${getSessionMetric(sesion, "autonomyRate")}%` : "—"],
          ["Nivel medio", getSessionMetric(sesion, "averageAdaptiveLevel") !== null ? `${getSessionMetric(sesion, "averageAdaptiveLevel")}/5` : "—"],
          ["Duración", fmt(sesion.secs || 0)],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: 10, border: "1px solid #eceef3", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontWeight: 900 }}>{value}</div>
            <div style={{ fontSize: ".66rem", color: "#667085" }}>{label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>Resultados por ejercicio</h3>
      {(sesion.results || []).map((r, i) => (
        <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eceef3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <strong style={{ fontSize: ".78rem" }}>{DOMINIOS_ADULTO[r.domId]?.emoji} {r.nombre}</strong>
            <span style={{ fontSize: ".75rem" }}>{typeof r.pct === "number" ? `${r.pct}%` : "Valoración profesional"}</span>
          </div>
          <div style={{ color: "#667085", fontSize: ".7rem", marginTop: 2 }}>
            Nivel {r.adaptiveLevel ?? "—"}/5 · Apoyo: {supportLabel(getTrackedSupportLevel(r))}
            {typeof r.seconds === "number" ? ` · ${fmt(r.seconds)}` : ""}
            {r.professionalOverride ? " · Ajuste profesional" : ""}
          </div>
        </div>
      ))}

      {sesion.nota && (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: 8 }}>Nota clínica</h3>
          <div style={{ padding: 12, background: "#f7f8fb", borderRadius: 8, fontSize: ".76rem", lineHeight: 1.55 }}>{sesion.nota}</div>
        </div>
      )}

      <ReportDisclaimer />
    </div>
  );
}

function ClinicalReportCenter({ paciente, initialSessionNumber = null, onClearInitialSession }) {
  const sesiones = paciente?.sesiones || [];
  const [type, setType] = useState(initialSessionNumber ? "session" : "evolution");
  const [sessionNumber, setSessionNumber] = useState(initialSessionNumber || sesiones[sesiones.length - 1]?.numero || null);

  useEffect(() => {
    if (initialSessionNumber) {
      setType("session");
      setSessionNumber(initialSessionNumber);
    }
  }, [initialSessionNumber]);

  const selectedSession = sesiones.find(s => s.numero === Number(sessionNumber)) || null;

  const printReport = () => {
    window.print();
  };

  const downloadReportPdf = () => {
    const safeName = (paciente?.nombre || "paciente").replace(/\s+/g, "_");
    if (type === "session") {
      if (!selectedSession) return;
      downloadSimplePdf(
        `NeuroFlex_Sesion_${selectedSession.numero}_${safeName}.pdf`,
        `NeuroFlex - Reporte de sesion ${selectedSession.numero}`,
        buildSessionPdfLines(paciente, selectedSession)
      );
      return;
    }
    downloadSimplePdf(
      `NeuroFlex_Evolucion_${safeName}.pdf`,
      "NeuroFlex - Reporte de evolucion",
      buildEvolutionPdfLines(paciente)
    );
  };

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #neuroflex-clinical-report, #neuroflex-clinical-report * { visibility: visible !important; }
          #neuroflex-clinical-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 16mm !important;
            box-sizing: border-box !important;
          }
          .nf-no-print { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <Card className="nf-no-print" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 6 }}>📄 Centro de reportes</h3>
        <p style={{ color: COLORS.textMuted, fontSize: ".8rem", lineHeight: 1.55, marginBottom: 14 }}>
          Elige el tipo de reporte. Puedes imprimirlo o guardarlo como PDF desde el navegador.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <button onClick={() => { setType("evolution"); onClearInitialSession?.(); }}
            style={{ padding: "9px 14px", borderRadius: 9, border: `2px solid ${type === "evolution" ? COLORS.primary : COLORS.border}`, background: type === "evolution" ? COLORS.primary + "10" : COLORS.white, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
            📈 Reporte de evolución
          </button>
          <button onClick={() => setType("session")} disabled={!sesiones.length}
            style={{ padding: "9px 14px", borderRadius: 9, border: `2px solid ${type === "session" ? COLORS.primary : COLORS.border}`, background: type === "session" ? COLORS.primary + "10" : COLORS.white, cursor: sesiones.length ? "pointer" : "default", opacity: sesiones.length ? 1 : .45, fontFamily: "inherit", fontWeight: 700 }}>
            🧾 Reporte de sesión
          </button>
        </div>

        {type === "session" && sesiones.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: ".72rem", fontWeight: 700, color: COLORS.textMuted }}>Sesión a incluir</label>
            <select value={sessionNumber || ""} onChange={e => setSessionNumber(Number(e.target.value))}
              style={{ display: "block", marginTop: 4, minWidth: 220, padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${COLORS.border}`, fontFamily: "inherit", background: COLORS.white }}>
              {sesiones.map(s => (
                <option key={s.numero} value={s.numero}>
                  Sesión {s.numero} · {new Date(s.date).toLocaleDateString("es")}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <BtnPrimary onClick={downloadReportPdf} disabled={type === "session" && !selectedSession}>
            📥 Descargar PDF
          </BtnPrimary>
          <BtnSecondary onClick={printReport} disabled={type === "session" && !selectedSession}>
            🖨️ Imprimir
          </BtnSecondary>
        </div>
      </Card>

      {type === "evolution"
        ? <ReporteEvolucionImprimible paciente={paciente} />
        : selectedSession
          ? <ReporteSesionImprimible paciente={paciente} sesion={selectedSession} />
          : <Card><p style={{ color: COLORS.textMuted }}>No hay una sesión disponible para generar el reporte.</p></Card>
      }
    </div>
  );
}

// ─── DASHBOARD PACIENTE ───────────────────────────────────────────────────────
function DashboardPaciente({ user }) {
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // El UID del usuario = ID del documento en pacientes
        const snap = await getDoc(doc(firestore, "pacientes", user.uid));
        if (snap.exists()) setPaciente({ id: snap.id, ...snap.data() });
      } catch(e) {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>Cargando...</div>;
  if (!paciente) return (
    <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>🧠</div>
      <p style={{ color: COLORS.textMuted }}>Tu perfil está siendo configurado por tu terapeuta. Vuelve pronto.</p>
    </div>
  );

  const sesiones = paciente.sesiones || [];
  const ultimaSesion = sesiones[sesiones.length - 1];
  const sesionesCuantificables = sesiones.filter(s => typeof getSessionMetric(s, "taskIndicator") === "number");
  const promedioGlobal = sesionesCuantificables.length > 0
    ? Math.round(sesionesCuantificables.reduce((a, s) => a + getSessionMetric(s, "taskIndicator"), 0) / sesionesCuantificables.length)
    : null;
  const mejora = sesionesCuantificables.length >= 2
    ? getSessionMetric(sesionesCuantificables[sesionesCuantificables.length - 1], "taskIndicator")
      - getSessionMetric(sesionesCuantificables[0], "taskIndicator")
    : null;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Saludo */}
      <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: COLORS.white, padding: "28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar name={paciente.nombre} size={52} color={COLORS.white} />
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "1.3rem", margin: "0 0 4px" }}>
              ¡Hola, {paciente.nombre.split(" ")[0]}!
            </h2>
            <p style={{ opacity: .85, margin: 0, fontSize: ".88rem" }}>
              {sesiones.length === 0
                ? "Bienvenido a NeuroFlex. Tu terapeuta preparará tu programa pronto."
                : `Llevas ${sesiones.length} sesión${sesiones.length !== 1 ? "es" : ""} completada${sesiones.length !== 1 ? "s" : ""}. ¡Sigue así!`}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats del paciente */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <StatCard icon="📅" label="Sesiones" value={sesiones.length} color={COLORS.primary} />
        <StatCard icon="📊" label="Promedio" value={promedioGlobal !== null ? `${promedioGlobal}%` : "—"} color={promedioGlobal !== null ? gradeColor(promedioGlobal) : COLORS.textMuted} />
        <StatCard icon="📈" label="Mejora" value={mejora !== null ? `${mejora > 0 ? "+" : ""}${mejora}%` : "—"} color={mejora !== null && mejora > 0 ? COLORS.success : COLORS.textMuted} />
      </div>

      {/* Sesión más reciente */}
      {ultimaSesion && (
        <Card style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, marginBottom: 14, fontSize: ".95rem" }}>📅 Última sesión</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <p style={{ fontWeight: 600, margin: "0 0 2px" }}>Sesión {ultimaSesion.numero}</p>
              <p style={{ color: COLORS.textMuted, fontSize: ".78rem", margin: 0 }}>
                {new Date(ultimaSesion.date).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              {typeof getSessionMetric(ultimaSesion, "taskIndicator") === "number"
                ? <p style={{ fontSize: "1.5rem", fontWeight: 900, color: gradeColor(getSessionMetric(ultimaSesion, "taskIndicator")), margin: 0 }}>{getSessionMetric(ultimaSesion, "taskIndicator")}%</p>
                : <p style={{ fontSize: ".85rem", fontWeight: 700, color: COLORS.accent, margin: 0 }}>Revisión clínica</p>}
              <p style={{ color: COLORS.textMuted, fontSize: ".75rem", margin: 0 }}>{fmt(ultimaSesion.secs || 0)}</p>
            </div>
          </div>
          {Object.entries(ultimaSesion.byDom || {}).map(([id, d]) => {
            const dom = DOMINIOS_ADULTO[id];
            const pct = typeof d.pct === "number" ? d.pct : (d.total > 0 ? Math.round((d.correct / d.total) * 100) : null);
            return (
              <div key={id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: ".78rem" }}>{dom?.emoji} {dom?.label}</span>
                  {pct !== null
                    ? <span style={{ fontSize: ".78rem", fontWeight: 700, color: gradeColor(pct) }}>{pct}%</span>
                    : <span style={{ fontSize: ".72rem", fontWeight: 600, color: COLORS.accent }}>Revisión clínica</span>}
                </div>
                {pct !== null && <ProgressBar value={pct} color={gradeColor(pct)} height={5} />}
              </div>
            );
          })}
          {ultimaSesion.nota && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: COLORS.bg, borderRadius: 10 }}>
              <p style={{ fontSize: ".72rem", color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Nota del terapeuta</p>
              <p style={{ margin: 0, fontSize: ".85rem", color: COLORS.textSecond, lineHeight: 1.6 }}>{ultimaSesion.nota}</p>
            </div>
          )}
        </Card>
      )}

      {/* Progreso histórico */}
      {sesionesCuantificables.length > 1 && (
        <Card style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, marginBottom: 16, fontSize: ".95rem" }}>📈 Mi progreso</p>
          <svg width="100%" height="100" viewBox={`0 0 ${sesionesCuantificables.length * 50} 80`} preserveAspectRatio="none">
            {[25, 50, 75].map(ref => (
              <line key={ref} x1="0" y1={80 - ref * 0.7} x2={sesionesCuantificables.length * 50} y2={80 - ref * 0.7}
                stroke={COLORS.border} strokeWidth="1" strokeDasharray="4 4" />
            ))}
            <polyline
              points={sesionesCuantificables.map((s, i) => `${i * 50 + 25},${80 - getSessionMetric(s, "taskIndicator") * 0.7}`).join(" ")}
              fill="none" stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
            {sesionesCuantificables.map((s, i) => (
              <circle key={i} cx={i * 50 + 25} cy={80 - getSessionMetric(s, "taskIndicator") * 0.7}
                r={i === sesionesCuantificables.length - 1 ? 5 : 3.5}
                fill={i === sesionesCuantificables.length - 1 ? COLORS.primary : COLORS.primary + "80"} stroke={COLORS.white} strokeWidth="1.5" />
            ))}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {sesionesCuantificables.map((s, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: ".68rem" }}>
                <div style={{ fontWeight: 700, color: i === sesionesCuantificables.length - 1 ? COLORS.primary : COLORS.textMuted }}>{getSessionMetric(s, "taskIndicator")}%</div>
                <div style={{ color: COLORS.textMuted }}>S{s.numero}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {sesiones.length === 0 && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>⏳</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Aún no tienes sesiones</p>
          <p style={{ color: COLORS.textMuted, fontSize: ".88rem" }}>Tu terapeuta iniciará tu primera sesión de rehabilitación pronto.</p>
        </Card>
      )}
    </div>
  );
}

// ─── DEMOSTRACIONES POR EJERCICIO ────────────────────────────────────────────
const DEMOS = {
  digits_forward: {
    titulo: "Dígitos en orden",
    pasos: [
      { icono: "👀", texto: "Verás una secuencia de números por unos segundos" },
      { icono: "🧠", texto: "Memorízalos bien mientras los ves" },
      { icono: "✍️", texto: "Cuando desaparezcan, escríbelos en el mismo orden" },
    ],
    ejemplo: { muestra: "3  7  2  8", respuesta: "3  7  2  8" }
  },
  digits_backward: {
    titulo: "Dígitos al revés",
    pasos: [
      { icono: "👀", texto: "Verás una secuencia de números por unos segundos" },
      { icono: "🔄", texto: "Memorízalos y dales la vuelta mentalmente" },
      { icono: "✍️", texto: "Escríbelos en orden INVERSO al que los viste" },
    ],
    ejemplo: { muestra: "4  2  9", respuesta: "9  2  4" }
  },
  word_recall: {
    titulo: "Recuerdo de palabras",
    pasos: [
      { icono: "📖", texto: "Leerás una lista de palabras durante 20 segundos" },
      { icono: "🧮", texto: "Luego harás una tarea de distracción (contar al revés)" },
      { icono: "✍️", texto: "Al final escribe todas las palabras que recuerdes" },
    ],
    ejemplo: { muestra: "MANZANA · LIBRO · PERRO · CASA", respuesta: "Escribe: manzana, libro, perro..." }
  },
  sustained_attention: {
    titulo: "Atención sostenida",
    pasos: [
      { icono: "🎯", texto: "Verás una cuadrícula con números del 1 al 9" },
      { icono: "👆", texto: "Toca ÚNICAMENTE los números 3" },
      { icono: "🚫", texto: "Ignora todos los demás números, aunque estén cerca" },
    ],
    ejemplo: { muestra: "1  3  7  3  5  3  2", respuesta: "Toca solo los: 3  3  3" }
  },
  verbal_fluency: {
    titulo: "Fluidez verbal",
    pasos: [
      { icono: "🗣️", texto: "Se te dará una categoría (ej: animales)" },
      { icono: "⏱️", texto: "Tienes 60 segundos para decir palabras de esa categoría" },
      { icono: "✍️", texto: "Escribe cada palabra y presiona el botón para registrarla" },
    ],
    ejemplo: { muestra: "Categoría: FRUTAS", respuesta: "manzana, pera, uva, mango, limón..." }
  },
  reaction_time: {
    titulo: "Tiempo de reacción",
    pasos: [
      { icono: "⏳", texto: "Verás un círculo rojo — espera sin tocar nada" },
      { icono: "🟢", texto: "Cuando el círculo se vuelva VERDE, tócalo inmediatamente" },
      { icono: "⚡", texto: "Lo más rápido posible — se repite 5 veces" },
    ],
    ejemplo: { muestra: "🔴 Espera...", respuesta: "🟢 ¡TOCA!" }
  },
  naming: {
    titulo: "Denominación",
    pasos: [
      { icono: "🖼️", texto: "Aparecerá una imagen (emoji) en la pantalla" },
      { icono: "✍️", texto: "Escribe el nombre de lo que ves" },
      { icono: "👆", texto: "Toca 'Siguiente' para confirmar tu respuesta" },
    ],
    ejemplo: { muestra: "⌚", respuesta: "Escribe: reloj" }
  },
  visual_matching: {
    titulo: "Emparejamiento visual",
    pasos: [
      { icono: "👁️", texto: "Verás una figura modelo en la parte de arriba" },
      { icono: "🔍", texto: "Busca entre las 4 opciones la que sea idéntica al modelo" },
      { icono: "👆", texto: "Toca la figura correcta" },
    ],
    ejemplo: { muestra: "Modelo: ⭐", respuesta: "Opciones: 🔷 ⭐ 🟥 🔵 → Toca ⭐" }
  },
  temporal_orientation: {
    titulo: "Orientación temporal",
    pasos: [
      { icono: "📅", texto: "Se harán preguntas sobre la fecha de hoy" },
      { icono: "✍️", texto: "Escribe tu respuesta en el campo de texto" },
      { icono: "👆", texto: "Toca 'Confirmar' para pasar a la siguiente pregunta" },
    ],
    ejemplo: { muestra: "¿En qué mes estamos?", respuesta: "Escribe: agosto" }
  },
  letter_number: {
    titulo: "Secuencia letras y números",
    pasos: [
      { icono: "👀", texto: "Verás una mezcla de letras y números" },
      { icono: "🧠", texto: "Memorízalos y ordénalos mentalmente" },
      { icono: "✍️", texto: "Escribe primero los números (de menor a mayor) y luego las letras (A-Z)" },
    ],
    ejemplo: { muestra: "B  3  A  1", respuesta: "Escribe: 1 3 A B" }
  },
  operation_span: {
    titulo: "Cálculo y memoria",
    pasos: [
      { icono: "🔢", texto: "Verás operaciones matemáticas una por una" },
      { icono: "✍️", texto: "Resuelve cada operación y recuerda el resultado" },
      { icono: "📝", texto: "Al final escribe todos los resultados en orden" },
    ],
    ejemplo: { muestra: "3+4=?  8-3=?  6×2=?", respuesta: "Escribe: 7  5  12" }
  },
  nback_1: {
    titulo: "¿Es igual al anterior?",
    pasos: [
      { icono: "👁️", texto: "Verás imágenes aparecer una por una" },
      { icono: "🧠", texto: "Recuerda siempre la imagen ANTERIOR" },
      { icono: "👆", texto: "Di si la imagen actual es igual o diferente a la de antes" },
    ],
    ejemplo: { muestra: "🐕 → 🐈 → 🐈", respuesta: "La tercera es igual a la segunda → Sí, igual" }
  },
  trail_making: {
    titulo: "Secuencia alternante",
    pasos: [
      { icono: "👀", texto: "Verás números y letras distribuidos en la pantalla" },
      { icono: "🔄", texto: "Tócalos alternando: primero 1, luego A, luego 2, luego B..." },
      { icono: "⚡", texto: "Lo más rápido posible sin equivocarte" },
    ],
    ejemplo: { muestra: "1 → A → 2 → B → 3 → C", respuesta: "Toca en ese orden exacto" }
  },
  story_recall: {
    titulo: "Recuerdo de historia",
    pasos: [
      { icono: "📖", texto: "Leerás una historia corta — presta atención a los detalles" },
      { icono: "👆", texto: "Cuando termines, toca 'Responder preguntas'" },
      { icono: "✅", texto: "Elige la respuesta correcta entre 4 opciones" },
    ],
    ejemplo: { muestra: "Historia: 'Ana fue al mercado el martes...'", respuesta: "¿Qué día fue? → Martes" }
  },
  color_naming: {
    titulo: "Nombrar colores",
    pasos: [
      { icono: "📝", texto: "Verás una palabra escrita (ej: ROJO, AZUL)" },
      { icono: "🎨", texto: "Toca el botón del color que dice la palabra" },
      { icono: "⚡", texto: "Lo más rápido posible — 10 rondas" },
    ],
    ejemplo: { muestra: "Palabra: VERDE", respuesta: "Toca el botón: 🟢 VERDE" }
  },
  find_animal: {
    titulo: "Encuentra los animales",
    pasos: [
      { icono: "🔍", texto: "Verás una cuadrícula con diferentes emojis" },
      { icono: "🐾", texto: "Toca SOLO los que sean animales" },
      { icono: "🚫", texto: "Ignora casas, carros, flores y otros objetos" },
    ],
    ejemplo: { muestra: "🐕 🌹 🐈 🚗 🦋", respuesta: "Toca: 🐕 🐈 🦋" }
  },
  divided_attention: {
    titulo: "Atención dividida",
    pasos: [
      { icono: "🎯", texto: "Dos condiciones al mismo tiempo" },
      { icono: "🔢", texto: "El número debe ser MAYOR que 5" },
      { icono: "2️⃣", texto: "Y además debe ser PAR (2, 4, 6, 8...)" },
    ],
    ejemplo: { muestra: "3  8  5  12  7  6", respuesta: "Toca: 8  12  6 (pares y mayores que 5)" }
  },
  verbal_comprehension: {
    titulo: "Comprensión verbal",
    pasos: [
      { icono: "📖", texto: "Leerás una oración incompleta" },
      { icono: "🧠", texto: "Piensa qué palabra tiene más sentido para completarla" },
      { icono: "👆", texto: "Elige la opción correcta entre 4 alternativas" },
    ],
    ejemplo: { muestra: "El sol sale por el ___", respuesta: "Opciones: norte / sur / este / oeste → este" }
  },
  analogias_verbales: {
    titulo: "Analogías verbales",
    pasos: [
      { icono: "🔗", texto: "Verás una frase que relaciona dos cosas" },
      { icono: "🧠", texto: "Entende la relación y aplícala a la segunda parte" },
      { icono: "👆", texto: "Elige la palabra que mejor completa la analogía" },
    ],
    ejemplo: { muestra: "El pájaro vuela, el pez ___", respuesta: "Opciones: corre / nada / vuela / salta → nada" }
  },
  or_personas: {
    titulo: "Orientación personal",
    pasos: [
      { icono: "🙋", texto: "Se harán preguntas sobre ti y personas cercanas" },
      { icono: "✍️", texto: "Escribe tu respuesta con calma" },
      { icono: "👆", texto: "Toca Siguiente para pasar a la próxima pregunta" },
    ],
    ejemplo: { muestra: "¿Cuál es tu nombre completo?", respuesta: "Escribe tu nombre y apellidos" }
  },
  or_situacion: {
    titulo: "Situación general",
    pasos: [
      { icono: "🌍", texto: "Se harán preguntas sobre tu situación actual" },
      { icono: "🧠", texto: "Responde con lo primero que recuerdes" },
      { icono: "✍️", texto: "No hay respuestas incorrectas, es para evaluar tu orientación" },
    ],
    ejemplo: { muestra: "¿Por qué estás aquí hoy?", respuesta: "Escribe el motivo de tu visita" }
  },
  pe_rotacion: {
    titulo: "¿Igual o diferente?",
    pasos: [
      { icono: "👁️", texto: "Verás dos figuras lado a lado" },
      { icono: "🧠", texto: "Compara si son la misma figura o figuras distintas" },
      { icono: "👆", texto: "Toca Igual o Diferente según lo que veas" },
    ],
    ejemplo: { muestra: "⭐ vs ⭐", respuesta: "Son iguales → toca ✅ Igual" }
  },
  pe_contar: {
    titulo: "¿Cuántos hay?",
    pasos: [
      { icono: "🔍", texto: "Verás una cuadrícula con varios emojis mezclados" },
      { icono: "🔢", texto: "Cuenta cuántos hay del emoji que se muestra arriba" },
      { icono: "👆", texto: "Elige el número correcto entre las 4 opciones" },
    ],
    ejemplo: { muestra: "¿Cuántos 🐕 hay? → 🐕🌹🐕🚗🐕🎈", respuesta: "Hay 3 → toca el número 3" }
  },
  pe_patron: {
    titulo: "¿Qué sigue?",
    pasos: [
      { icono: "🔍", texto: "Verás una secuencia de emojis con un patrón" },
      { icono: "🧠", texto: "Identifica cómo se repite el patrón" },
      { icono: "👆", texto: "Elige el emoji que debería venir después" },
    ],
    ejemplo: { muestra: "🔴 🔵 🔴 🔵 🔴 ?", respuesta: "Sigue alternando → toca 🔵" }
  },
    spatial_orientation: {
  titulo: "Orientación espacial",
    pasos: [
      { icono: "📍", texto: "Se harán preguntas sobre el lugar donde estás" },
      { icono: "🧠", texto: "Piensa bien antes de responder" },
      { icono: "✍️", texto: "Escribe tu respuesta y toca Siguiente" },
    ],
    ejemplo: { muestra: "¿En qué ciudad estás?", respuesta: "Escribe: Barranquilla" }
  },
  ra_series: {
    titulo: "Series numéricas",
    pasos: [
      { icono: "🔢", texto: "Verás una secuencia de números con un patrón" },
      { icono: "🧠", texto: "Identifica la regla: ¿suman, restan, multiplican?" },
      { icono: "👆", texto: "Elige el número que sigue en la serie" },
    ],
    ejemplo: { muestra: "2 → 4 → 6 → 8 → ?", respuesta: "Suman 2 cada vez → respuesta: 10" }
  },
  ra_discordante: {
    titulo: "El elemento diferente",
    pasos: [
      { icono: "👀", texto: "Verás 4 palabras o elementos" },
      { icono: "🧠", texto: "Encuentra qué tienen en común 3 de ellos" },
      { icono: "👆", texto: "Toca el elemento que NO pertenece al grupo" },
    ],
    ejemplo: { muestra: "Perro / Gato / Mariposa / Carro", respuesta: "Carro → los demás son animales" }
  },
  ra_verdadero_falso: {
    titulo: "Verdadero o falso",
    pasos: [
      { icono: "📖", texto: "Leerás una afirmación lógica" },
      { icono: "🧠", texto: "Piensa si es correcta o incorrecta" },
      { icono: "👆", texto: "Toca Verdadero o Falso" },
    ],
    ejemplo: { muestra: "Todos los perros son animales.", respuesta: "VERDADERO ✅" }
  },
  ra_logico: {
    titulo: "Conclusión más lógica",
    pasos: [
      { icono: "📖", texto: "Leerás una situación breve" },
      { icono: "🧠", texto: "Analiza qué conclusión tiene más sentido" },
      { icono: "👆", texto: "Elige la opción más razonable" },
    ],
    ejemplo: { muestra: "Cada vez que come helado le duele el estómago", respuesta: "Lo más lógico: evitar el helado" }
  },
  calc_operaciones: {
    titulo: "Operaciones mentales",
    pasos: [
      { icono: "🔢", texto: "Verás una operación matemática" },
      { icono: "🧠", texto: "Resuélvela mentalmente sin calculadora" },
      { icono: "✍️", texto: "Escribe el resultado y confirma" },
    ],
    ejemplo: { muestra: "25 + 37 = ?", respuesta: "Escribe: 62" }
  },
  calc_faltante: {
    titulo: "Número faltante",
    pasos: [
      { icono: "🔢", texto: "Verás una operación con un número faltante (?)" },
      { icono: "🧠", texto: "Calcula qué número completa la operación" },
      { icono: "✍️", texto: "Escribe el número que falta" },
    ],
    ejemplo: { muestra: "? + 15 = 28", respuesta: "Escribe: 13" }
  },
  flex_regla: {
    titulo: "Cambio de regla",
    pasos: [
      { icono: "👀", texto: "Verás una figura de color" },
      { icono: "🔄", texto: "La regla dice si debes decir el COLOR o la FORMA" },
      { icono: "⚡", texto: "Cuando la regla cambie, adáptate rápido" },
    ],
    ejemplo: { muestra: "Regla: COLOR → 🔵", respuesta: "Responde: azul" }
  },
  flex_opuesto: {
    titulo: "Di lo contrario",
    pasos: [
      { icono: "📖", texto: "Verás una palabra en mayúsculas" },
      { icono: "🧠", texto: "Piensa en su antónimo (palabra de significado opuesto)" },
      { icono: "👆", texto: "Elige la opción correcta entre las 4" },
    ],
    ejemplo: { muestra: "GRANDE", respuesta: "Contrario: pequeño" }
  },
  cp_inferencia: {
    titulo: "Inferencias",
    pasos: [
      { icono: "📖", texto: "Leerás una situación breve" },
      { icono: "🧠", texto: "Piensa en la conclusión más razonable" },
      { icono: "👆", texto: "Elige la opción que mejor se puede inferir" },
    ],
    ejemplo: { muestra: "Ana ahorró 2 años y compró un carro.", respuesta: "Inferencia: lo compró con sus ahorros" }
  },
  cp_texto: {
    titulo: "Comprensión de texto",
    pasos: [
      { icono: "📖", texto: "Leerás un texto corto — tienes 60 segundos" },
      { icono: "🧠", texto: "Presta atención a los detalles importantes" },
      { icono: "✅", texto: "Cuando termines, responde las preguntas de opción múltiple" },
    ],
    ejemplo: { muestra: "Texto sobre el ejercicio y el cerebro", respuesta: "Pregunta: ¿qué región se beneficia? → El hipocampo" }
  },

};

function DemoScreen({ exId, onContinuar, mayor }) {
  const demo = DEMOS[exId];

  useEffect(() => {
    if (!demo) onContinuar?.();
  }, [demo, onContinuar]);

  if (!demo) return null;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <Card style={{ padding: mayor ? 32 : 24 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎬</div>
          <h3 style={{ fontWeight: 700, fontSize: mayor ? "1.3rem" : "1.1rem", marginBottom: 4 }}>
            Cómo hacer: {demo.titulo}
          </h3>
          <p style={{ color: COLORS.textMuted, fontSize: mayor ? ".9rem" : ".78rem" }}>
            Sigue estos pasos
          </p>
        </div>

        {/* Pasos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {demo.pasos.map((paso, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 16px", background: COLORS.bg, borderRadius: 12 }}>
              <span style={{ fontSize: mayor ? "1.8rem" : "1.4rem", flexShrink: 0 }}>{paso.icono}</span>
              <div>
                <span style={{ fontSize: mayor ? "1rem" : ".9rem", color: COLORS.textPrimary, fontWeight: 500, lineHeight: 1.5 }}>
                  <strong style={{ color: COLORS.primary }}>Paso {i + 1}:</strong> {paso.texto}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Ejemplo */}
        {demo.ejemplo && (
          <div style={{ background: COLORS.primary + "08", borderRadius: 14, padding: mayor ? "18px 20px" : "14px 16px", marginBottom: 24, border: `1px solid ${COLORS.primary}20` }}>
            <p style={{ fontWeight: 700, fontSize: mayor ? ".95rem" : ".82rem", color: COLORS.primary, marginBottom: 10 }}>📌 Ejemplo:</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ background: COLORS.white, borderRadius: 10, padding: "8px 14px", border: `1px solid ${COLORS.border}` }}>
                <p style={{ margin: 0, fontSize: mayor ? "1rem" : ".85rem", color: COLORS.textSecond }}>{demo.ejemplo.muestra}</p>
              </div>
              <span style={{ color: COLORS.textMuted, fontSize: "1.2rem" }}>→</span>
              <div style={{ background: COLORS.success + "12", borderRadius: 10, padding: "8px 14px", border: `1px solid ${COLORS.success}30` }}>
                <p style={{ margin: 0, fontSize: mayor ? "1rem" : ".85rem", color: COLORS.success, fontWeight: 600 }}>{demo.ejemplo.respuesta}</p>
              </div>
            </div>
          </div>
        )}

        <BtnPrimary onClick={onContinuar} style={{ width: "100%", padding: mayor ? "18px" : "14px", fontSize: mayor ? "1.1rem" : ".95rem" }}>
          ✅ Entendido, comenzar →
        </BtnPrimary>
      </Card>
    </div>
  );
}



// ─── PRESCRIPCIÓN DE SESIÓN ────────────────────────────────────────────────────
function buildSessionPrescription(paciente, config) {
  const { areas = [], duracion = 6 } = config || {};
  const domPool = areas.filter(id => EX_ADULTO[id]?.length > 0);
  if (!domPool.length) return [];

  const intelligent = config?.seleccionInteligente !== false;
  const domainSequence = intelligent
    ? buildIntelligentDomainSequence(paciente, domPool, duracion)
    : Array.from({ length: duracion }, (_, idx) => domPool[idx % domPool.length]);

  const usedByDomain = {};
  const usedSubcomponentsByDomain = {};

  return domainSequence.map((domId, idx) => {
    const exs = EX_ADULTO[domId] || [];
    usedByDomain[domId] = usedByDomain[domId] || [];
    usedSubcomponentsByDomain[domId] = usedSubcomponentsByDomain[domId] || [];

    let ex = null;
    let selectionScore = null;
    let selectionReasons = null;
    let adaptiveLevel = null;

    if (intelligent) {
      const choice = chooseIntelligentExercise(paciente, domId, exs, {
        usedIds: usedByDomain[domId],
        usedSubcomponents: usedSubcomponentsByDomain[domId],
        intelligent: true,
        adaptive: config?.adaptativo !== false,
      });
      ex = choice?.ex || exs[0] || null;
      selectionScore = choice?.selectionScore ?? null;
      selectionReasons = choice?.selectionReasons || null;
      adaptiveLevel = config?.adaptativo !== false
        ? (choice?.targetLevel || (ex ? getRecommendedLevel(paciente, domId, ex) : 2))
        : (ex ? getExerciseBaseLevel(domId, ex) : 2);
    } else {
      ex = exs[Math.floor(Math.random() * exs.length)] || exs[0] || null;
      adaptiveLevel = ex
        ? (config?.adaptativo !== false
            ? getRecommendedLevel(paciente, domId, ex)
            : getExerciseBaseLevel(domId, ex))
        : 2;
    }

    if (ex) {
      const meta = getExerciseMetadata(domId, ex);
      usedByDomain[domId].push(ex.id);
      if (meta.subcomponente) usedSubcomponentsByDomain[domId].push(meta.subcomponente);
    }

    return {
      id: `rx_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
      domId,
      exId: ex?.id || null,
      adaptiveLevel: clampAdaptiveLevel(adaptiveLevel || 2),
      selectedBy: intelligent ? "intelligent" : "conventional",
      selectionScore,
      selectionReasons,
      professionalOverride: false,
    };
  }).filter(item => item.exId);
}

function resolvePrescriptionItem(item) {
  const ex = (EX_ADULTO[item.domId] || []).find(e => e.id === item.exId);
  return { ...item, ex };
}

function getPrescriptionReasonText(item) {
  if (item.professionalOverride) return "Ajustado manualmente por el profesional";
  const r = item.selectionReasons;
  if (!r) return item.selectedBy === "intelligent" ? "Selección inteligente" : "Selección convencional";
  const parts = [];
  if (r.difficultyFit) parts.push(`dificultad ${r.difficultyFit}`);
  if (r.recentUse) parts.push(`uso reciente: ${r.recentUse}`);
  else parts.push("sin uso reciente");
  if (r.subcomponent) parts.push(r.subcomponent);
  if (r.interventionPriority) parts.push(`prioridad ${r.interventionPriority}`);
  return parts.join(" · ");
}

function PrescriptionReview({ paciente, config, prescriptionInit, onStart, onBack }) {
  const [items, setItems] = useState(() =>
    (prescriptionInit?.length ? prescriptionInit : buildSessionPrescription(paciente, config)).map(resolvePrescriptionItem)
  );

  const moveItem = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    setItems(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateLevel = (index, level) => {
    setItems(prev => prev.map((item, i) =>
      i === index
        ? { ...item, adaptiveLevel: clampAdaptiveLevel(level), professionalOverride: true }
        : item
    ));
  };

  const replaceExercise = (index, exId) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const ex = (EX_ADULTO[item.domId] || []).find(e => e.id === exId);
      return {
        ...item,
        exId,
        ex,
        adaptiveLevel: ex ? getRecommendedLevel(paciente, item.domId, ex) : item.adaptiveLevel,
        professionalOverride: true,
        selectedBy: "professional",
        selectionScore: null,
        selectionReasons: null,
      };
    }));
  };

  const regenerate = () => {
    setItems(buildSessionPrescription(paciente, config).map(resolvePrescriptionItem));
  };

  const start = () => {
    const clean = items.map(({ ex, ...item }) => item);
    onStart({
      ...config,
      prescription: clean,
      prescriptionReviewed: true,
      prescriptionReviewedAt: new Date().toISOString(),
    });
  };

  const totalOverrides = items.filter(i => i.professionalOverride).length;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <Card style={{ marginBottom: 18 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 5 }}>🧾 Prescripción de sesión</h2>
        <p style={{ color: COLORS.textMuted, fontSize: ".84rem", lineHeight: 1.55, margin: 0 }}>
          NeuroFlex preparó una propuesta. Revísala antes de iniciar: puedes cambiar el orden, sustituir un ejercicio o ajustar su nivel.
        </p>
      </Card>

      <div style={{display:"flex",gap:7,flexWrap:"wrap",margin:"-5px 0 14px"}}>
        {["↕ Reordenar","🔁 Sustituir","🎚 Nivel 1–5"].map(x=><span key={x} style={{padding:"5px 8px",borderRadius:999,background:COLORS.bg,border:`1px solid ${COLORS.border}`,fontSize:".68rem",color:COLORS.textMuted}}>{x}</span>)}
      </div>
      <Card style={{ marginBottom: 18, background: COLORS.primary + "06", border: `1px solid ${COLORS.primary}18` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 10 }}>
          {[
            ["Ejercicios", items.length],
            ["Áreas", new Set(items.map(i => i.domId)).size],
            ["Ajustes manuales", totalOverrides],
            ["Duración estimada", config?.duracion ? `~${config.duracion === 4 ? 15 : config.duracion === 6 ? 25 : config.duracion === 8 ? 35 : 50} min` : "—"],
          ].map(([label, value]) => (
            <div key={label} style={{ textAlign: "center", padding: 10, background: COLORS.white, borderRadius: 10 }}>
              <div style={{ fontWeight: 900, color: COLORS.primary, fontSize: "1.15rem" }}>{value}</div>
              <div style={{ fontSize: ".68rem", color: COLORS.textMuted }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
        {items.map((item, index) => {
          const dom = DOMINIOS_ADULTO[item.domId];
          const exs = EX_ADULTO[item.domId] || [];
          const meta = item.ex ? getExerciseMetadata(item.domId, item.ex) : null;
          return (
            <Card key={item.id || `${item.domId}_${index}`} style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "42px 1fr", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: dom?.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: dom?.color || COLORS.primary }}>
                  {index + 1}
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: ".92rem" }}>{dom?.emoji} {dom?.label}</div>
                      <div style={{ fontSize: ".75rem", color: COLORS.textMuted, marginTop: 2 }}>
                        {meta?.subcomponente || "Subcomponente no especificado"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                        style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, borderRadius: 8, padding: "5px 9px", cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? .35 : 1 }}>↑</button>
                      <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}
                        style={{ border: `1px solid ${COLORS.border}`, background: COLORS.white, borderRadius: 8, padding: "5px 9px", cursor: index === items.length - 1 ? "default" : "pointer", opacity: index === items.length - 1 ? .35 : 1 }}>↓</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.6fr .8fr", gap: 10, marginTop: 12 }}>
                    <div>
                      <label style={{ fontSize: ".69rem", color: COLORS.textMuted, fontWeight: 700 }}>Ejercicio</label>
                      <select value={item.exId || ""} onChange={e => replaceExercise(index, e.target.value)}
                        style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${COLORS.border}`, background: COLORS.white, fontFamily: "inherit" }}>
                        {exs.map(ex => <option key={ex.id} value={ex.id}>{ex.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: ".69rem", color: COLORS.textMuted, fontWeight: 700 }}>Nivel</label>
                      <select value={item.adaptiveLevel || 2} onChange={e => updateLevel(index, Number(e.target.value))}
                        style={{ width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${COLORS.border}`, background: COLORS.white, fontFamily: "inherit" }}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>Nivel {n}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 9, padding: "8px 10px", borderRadius: 8, background: COLORS.bg }}>
                    <div style={{ fontSize: ".69rem", color: item.professionalOverride ? COLORS.accent : COLORS.textMuted }}>
                      {item.professionalOverride ? "✍️ " : "🧠 "}{getPrescriptionReasonText(item)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card style={{ marginBottom: 18, background: COLORS.warning + "08", border: `1px solid ${COLORS.warning}25` }}>
        <p style={{ margin: 0, fontSize: ".76rem", color: COLORS.textSecond, lineHeight: 1.55 }}>
          Los cambios realizados aquí quedan registrados como ajustes profesionales. La prescripción no modifica la evaluación ni el plan de intervención.
        </p>
      </Card>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <BtnSecondary onClick={onBack}>← Volver</BtnSecondary>
        <BtnSecondary onClick={regenerate}>🔄 Regenerar propuesta</BtnSecondary>
        <BtnPrimary onClick={start} style={{ flex: 1, minWidth: 220 }}>▶ Confirmar e iniciar sesión</BtnPrimary>
      </div>
    </div>
  );
}

// ─── CONTROLADOR DEL FLUJO DEL PACIENTE ────────────────────────────────────────
function PerfilPacienteWrapper({ paciente: pacienteInit, onVolver, profesionalUid }) {
  const [paciente, setPaciente] = useState(pacienteInit);
  const [flow, setFlow] = useState("perfil"); // perfil | config | prescription | sesion | reporte
  const [config, setConfig] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [ultimaSesion, setUltimaSesion] = useState(null);

  const refreshPaciente = async () => {
    try {
      const snap = await getDoc(doc(firestore, "pacientes", paciente.id));
      if (snap.exists()) {
        const updated = { id: snap.id, ...snap.data() };
        setPaciente(updated);
        return updated;
      }
    } catch (e) {
      console.error("Error actualizando paciente:", e);
    }
    return paciente;
  };

  const prepararPrescripcion = cfg => {
    setConfig(cfg);
    const proposal = buildSessionPrescription(paciente, cfg);
    setPrescription(proposal);
    setFlow("prescription");
  };

  const iniciarSesion = cfg => {
    setConfig(cfg);
    setFlow("sesion");
  };

  const finalizarSesion = async sesion => {
    try {
      const adaptiveProfile = sesion.adaptiveEnabled
        ? buildUpdatedAdaptiveProfile(paciente, sesion.results || [])
        : (paciente.adaptiveProfile || null);

      const sesionConAdaptacion = {
        ...sesion,
        adaptiveProfileVersion: adaptiveProfile?.version || null,
      };

      const sesiones = [...(paciente.sesiones || []), sesionConAdaptacion];
      await updateDoc(doc(firestore, "pacientes", paciente.id), {
        sesiones,
        adaptiveProfile,
      });

      const updated = { ...paciente, sesiones, adaptiveProfile };
      setPaciente(updated);
      setUltimaSesion(sesionConAdaptacion);
      setFlow("reporte");
    } catch (e) {
      console.error("Error guardando sesión:", e);
    }
  };

  if (flow === "config") {
    return (
      <ConfiguradorSesion
        paciente={paciente}
        onIniciar={prepararPrescripcion}
        onCancelar={() => setFlow("perfil")}
      />
    );
  }

  if (flow === "prescription" && config) {
    return (
      <PrescriptionReview
        paciente={paciente}
        config={config}
        prescriptionInit={prescription}
        onStart={iniciarSesion}
        onBack={() => setFlow("config")}
      />
    );
  }

  if (flow === "sesion" && config) {
    return (
      <SesionActiva
        paciente={paciente}
        config={config}
        sesionNum={(paciente.sesiones?.length || 0) + 1}
        onFinalizar={finalizarSesion}
        onCancelar={() => setFlow("perfil")}
      />
    );
  }

  if (flow === "reporte" && ultimaSesion) {
    return (
      <ReporteSesion
        sesion={ultimaSesion}
        paciente={paciente}
        onVolver={async () => {
          await refreshPaciente();
          setFlow("perfil");
        }}
      />
    );
  }

  return (
    <PerfilPaciente
      paciente={paciente}
      onVolver={onVolver}
      profesionalUid={profesionalUid}
      onIniciarSesion={() => setFlow("config")}
      onPacienteUpdate={p => setPaciente(p)}
    />
  );
}


// ─── APOYOS GRADUADOS ─────────────────────────────────────────────────────────
// Los apoyos se registran sin convertirlos en "errores".
// Nivel 0 = ejecución autónoma; 1 = repetición; 2 = ejemplo; 3 = pista estratégica.
const SUPPORT_STRATEGIES = {
  memoria_trabajo: "Concéntrate en pocos elementos a la vez y repásalos mentalmente antes de responder.",
  memoria_episodica: "Busca una forma de relacionar la información con una imagen, historia o categoría.",
  atencion: "Revisa de forma ordenada, de izquierda a derecha, y vuelve a comprobar antes de responder.",
  funciones_exec: "Identifica primero la regla de la tarea y mantén esa regla activa antes de actuar.",
  velocidad_proc: "Prioriza precisión; cuando la respuesta sea clara, intenta responder sin demoras innecesarias.",
  lenguaje: "Piensa primero en la categoría o significado general y luego busca la palabra concreta.",
  percepcion_visual: "Compara una característica a la vez: forma, orientación, tamaño o posición.",
  orientacion: "Usa referencias del contexto actual: fecha, lugar, personas y situación presente.",
  razonamiento: "Busca qué regla se repite y comprueba si funciona en todos los elementos.",
  calculo: "Divide la operación en pasos simples y verifica el resultado antes de confirmar.",
  flexibilidad: "Antes de responder, verifica si la regla sigue siendo la misma o ha cambiado.",
  comprension: "Identifica la idea principal y luego revisa los detalles que apoyan la respuesta.",
};

function emptySupportRecord() {
  return {
    instructionRepeats: 0,
    exampleRequests: 0,
    strategyHints: 0,
    maxSupportLevel: 0,
  };
}

function hasTrackedSupport(result) {
  return !!result && (
    typeof result.supportLevel === "number" ||
    result.support !== undefined
  );
}

function getTrackedSupportLevel(result) {
  if (!hasTrackedSupport(result)) return null;
  if (typeof result.supportLevel === "number") return result.supportLevel;
  return typeof result.support?.maxSupportLevel === "number" ? result.support.maxSupportLevel : 0;
}

function supportLabel(level) {
  if (level === null || level === undefined) return "No registrado";
  if (level === 0) return "Autónomo";
  if (level === 1) return "Repetición de instrucción";
  if (level === 2) return "Ejemplo adicional";
  return "Pista estratégica";
}


// ─── MÉTRICAS DE SESIÓN Y SEGUIMIENTO LONGITUDINAL ─────────────────────────────
function safeAverage(values) {
  const nums = (values || []).filter(v => typeof v === "number" && !Number.isNaN(v));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function buildSessionMetrics(results = [], secs = 0) {
  const cuantificables = results.filter(r => typeof r.pct === "number" && !Number.isNaN(r.pct));
  const pct = safeAverage(cuantificables.map(r => r.pct));
  const avgSeconds = safeAverage(results.map(r => r.seconds).filter(v => typeof v === "number" && v >= 0));
  const avgDifficulty = safeAverage(results.map(r => r.adaptiveLevel).filter(v => typeof v === "number"));
  const trackedSupport = results
    .map(r => getTrackedSupportLevel(r))
    .filter(v => typeof v === "number");
  const avgSupport = safeAverage(trackedSupport);
  const autonomous = trackedSupport.filter(v => v === 0).length;

  return {
    taskIndicator: pct === null ? null : Math.round(pct),
    quantifiableExercises: cuantificables.length,
    clinicalReviewExercises: results.length - cuantificables.length,
    totalExercises: results.length,
    totalErrors: results.reduce((a, r) => a + (r.errors || 0), 0),
    averageSecondsPerExercise: avgSeconds === null ? null : Math.round(avgSeconds),
    averageAdaptiveLevel: avgDifficulty === null ? null : Math.round(avgDifficulty * 10) / 10,
    averageSupportLevel: avgSupport === null ? null : Math.round(avgSupport * 10) / 10,
    autonomousExercises: autonomous,
    autonomyRate: trackedSupport.length ? Math.round((autonomous / trackedSupport.length) * 100) : null,
    supportTrackedExercises: trackedSupport.length,
    exercisesWithSupport: trackedSupport.length ? trackedSupport.filter(v => v > 0).length : null,
    sessionSeconds: secs || 0,
  };
}

function buildDomainMetrics(results = []) {
  const byDom = {};
  results.forEach(r => {
    if (!byDom[r.domId]) {
      byDom[r.domId] = {
        correct: 0, total: 0, errors: 0, count: 0,
        pcts: [], secondsList: [], supportLevels: [], difficultyLevels: [],
        clinicalReviewCount: 0,
      };
    }
    const d = byDom[r.domId];
    d.correct += r.correct || 0;
    d.total += r.total || 0;
    d.errors += r.errors || 0;
    d.count += 1;
    if (typeof r.pct === "number" && !Number.isNaN(r.pct)) d.pcts.push(r.pct);
    else d.clinicalReviewCount += 1;
    if (typeof r.seconds === "number") d.secondsList.push(r.seconds);
    const trackedSupport = getTrackedSupportLevel(r);
    if (typeof trackedSupport === "number") d.supportLevels.push(trackedSupport);
    if (typeof r.adaptiveLevel === "number") d.difficultyLevels.push(r.adaptiveLevel);
  });

  Object.values(byDom).forEach(d => {
    const pctAvg = safeAverage(d.pcts);
    const secAvg = safeAverage(d.secondsList);
    const supportAvg = safeAverage(d.supportLevels);
    const diffAvg = safeAverage(d.difficultyLevels);
    d.pct = pctAvg === null ? null : Math.round(pctAvg);
    d.averageSeconds = secAvg === null ? null : Math.round(secAvg);
    d.averageSupportLevel = supportAvg === null ? null : Math.round(supportAvg * 10) / 10;
    d.averageAdaptiveLevel = diffAvg === null ? null : Math.round(diffAvg * 10) / 10;
    d.autonomyRate = d.supportLevels.length
      ? Math.round((d.supportLevels.filter(x => x === 0).length / d.supportLevels.length) * 100)
      : null;
    d.supportTrackedCount = d.supportLevels.length;

    // Las listas son temporales para calcular promedios. No se guardan en Firestore.
    delete d.pcts;
    delete d.secondsList;
    delete d.supportLevels;
    delete d.difficultyLevels;
  });

  return byDom;
}

function getSessionMetric(session, key) {
  if (session?.metrics && session.metrics[key] !== undefined) return session.metrics[key];
  // Compatibilidad con sesiones antiguas.
  if (key === "taskIndicator") return typeof session?.gp === "number" ? session.gp : null;
  if (key === "averageAdaptiveLevel") {
    const vals = (session?.results || []).map(r => r.adaptiveLevel).filter(v => typeof v === "number");
    const avg = safeAverage(vals);
    return avg === null ? null : Math.round(avg * 10) / 10;
  }
  if (key === "autonomyRate") {
    const tracked = (session?.results || [])
      .map(r => getTrackedSupportLevel(r))
      .filter(v => typeof v === "number");
    if (!tracked.length) return null;
    const autonomous = tracked.filter(v => v === 0).length;
    return Math.round((autonomous / tracked.length) * 100);
  }
  if (key === "averageSupportLevel") {
    const tracked = (session?.results || [])
      .map(r => getTrackedSupportLevel(r))
      .filter(v => typeof v === "number");
    const avg = safeAverage(tracked);
    return avg === null ? null : Math.round(avg * 10) / 10;
  }
  if (key === "averageSecondsPerExercise") {
    const vals = (session?.results || []).map(r => r.seconds).filter(v => typeof v === "number");
    const avg = safeAverage(vals);
    return avg === null ? null : Math.round(avg);
  }
  return null;
}

function ProgressLongitudinal({ sesiones = [] }) {
  const numeric = sesiones.filter(s => typeof getSessionMetric(s, "taskIndicator") === "number");
  const first = numeric[0];
  const last = numeric[numeric.length - 1];
  const firstPct = first ? getSessionMetric(first, "taskIndicator") : null;
  const lastPct = last ? getSessionMetric(last, "taskIndicator") : null;
  const delta = firstPct !== null && lastPct !== null ? lastPct - firstPct : null;

  const lastAutonomy = sesiones.length ? getSessionMetric(sesiones[sesiones.length - 1], "autonomyRate") : null;
  const lastLevel = sesiones.length ? getSessionMetric(sesiones[sesiones.length - 1], "averageAdaptiveLevel") : null;
  const lastTime = sesiones.length ? getSessionMetric(sesiones[sesiones.length - 1], "averageSecondsPerExercise") : null;

  if (sesiones.length < 2) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: COLORS.textMuted }}>Se necesitan al menos 2 sesiones para mostrar tendencias longitudinales.</p>
        </div>
      </Card>
    );
  }

  const graphSessions = numeric;
  const width = Math.max(240, graphSessions.length * 60);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 10, marginBottom: 18 }}>
        {[
          ["Indicador última sesión", lastPct !== null ? `${lastPct}%` : "—"],
          ["Cambio desde primera", delta !== null ? `${delta > 0 ? "+" : ""}${delta} pts` : "—"],
          ["Autonomía última sesión", lastAutonomy !== null ? `${lastAutonomy}%` : "—"],
          ["Nivel adaptativo medio", lastLevel !== null ? `${lastLevel}/5` : "—"],
        ].map(([label, value]) => (
          <Card key={label} style={{ textAlign: "center", padding: 14 }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, color: COLORS.primary }}>{value}</div>
            <div style={{ fontSize: ".69rem", color: COLORS.textMuted, marginTop: 3 }}>{label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>📈 Indicador de desempeño en tareas</p>
        <p style={{ color: COLORS.textMuted, fontSize: ".75rem", marginBottom: 14 }}>
          Tendencia descriptiva de NeuroFlex; no es una puntuación normativa.
        </p>
        {graphSessions.length > 1 ? (
          <>
            <svg width="100%" height="140" viewBox={`0 0 ${width} 110`} preserveAspectRatio="none">
              {[25,50,75].map(ref => (
                <line key={ref} x1="0" y1={100-ref} x2={width} y2={100-ref} stroke={COLORS.border} strokeWidth="1" strokeDasharray="4 4" />
              ))}
              <polyline
                points={graphSessions.map((s,i) => `${i*60+30},${100-getSessionMetric(s,"taskIndicator")}`).join(" ")}
                fill="none" stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              />
              {graphSessions.map((s,i) => (
                <circle key={i} cx={i*60+30} cy={100-getSessionMetric(s,"taskIndicator")} r="4" fill={COLORS.primary} />
              ))}
            </svg>
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
              {graphSessions.map((s,i) => (
                <div key={i} style={{ minWidth: 46, textAlign: "center", fontSize: ".7rem", color: COLORS.textMuted }}>
                  <strong style={{ color: gradeColor(getSessionMetric(s,"taskIndicator")) }}>{getSessionMetric(s,"taskIndicator")}%</strong>
                  <div>S{s.numero}</div>
                </div>
              ))}
            </div>
          </>
        ) : <p style={{ color: COLORS.textMuted }}>Aún no hay suficientes sesiones cuantificables.</p>}
      </Card>

      <Card>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Lectura conjunta de la evolución</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ padding: 12, background: COLORS.bg, borderRadius: 10 }}>
            <div style={{ fontSize: ".7rem", color: COLORS.textMuted }}>Autonomía</div>
            <div style={{ fontWeight: 800, marginTop: 2 }}>{lastAutonomy !== null ? `${lastAutonomy}%` : "Sin dato"}</div>
          </div>
          <div style={{ padding: 12, background: COLORS.bg, borderRadius: 10 }}>
            <div style={{ fontSize: ".7rem", color: COLORS.textMuted }}>Dificultad media</div>
            <div style={{ fontWeight: 800, marginTop: 2 }}>{lastLevel !== null ? `${lastLevel}/5` : "Sin dato"}</div>
          </div>
          <div style={{ padding: 12, background: COLORS.bg, borderRadius: 10 }}>
            <div style={{ fontSize: ".7rem", color: COLORS.textMuted }}>Tiempo medio / ejercicio</div>
            <div style={{ fontWeight: 800, marginTop: 2 }}>{lastTime !== null ? fmt(lastTime) : "Sin dato"}</div>
          </div>
        </div>
        <p style={{ color: COLORS.textMuted, fontSize: ".73rem", lineHeight: 1.55, marginTop: 12 }}>
          La evolución debe interpretarse considerando simultáneamente precisión, dificultad alcanzada, tiempo y apoyos utilizados.
        </p>
      </Card>
    </div>
  );
}

// ─── MOTOR DE SESIONES ────────────────────────────────────────────────────────
// ─── MODO ADULTO MAYOR ────────────────────────────────────────────────────────
// Se activa si paciente.edad >= 60 O paciente.modoMayor = true
const esModoMayor = (paciente) => !!(paciente?.modoMayor || (paciente?.edad >= 60));

// Estilos adaptativos según modo
const getStyles = (mayor) => ({
  fontSize: mayor ? "1.15rem" : ".95rem",
  fontSizeSm: mayor ? "1rem" : ".82rem",
  fontSizeLg: mayor ? "1.4rem" : "1.1rem",
  padding: mayor ? "16px 24px" : "11px 24px",
  paddingInput: mayor ? "16px 18px" : "11px 14px",
  borderRadius: mayor ? 16 : 10,
  iconSize: mayor ? "6rem" : "5rem",
  gap: mayor ? 16 : 10,
});


// ─── FASE 20 · APRENDIZAJE → PRÁCTICA → COMPROBACIÓN ──────────────────────────
// La enseñanza y la práctica guiada NO se puntúan. Su función es separar,
// cuando sea pertinente, comprensión de la consigna de ejecución cognitiva.
const TASK_LEARNING_PROTOCOLS = {
  digits_backward: {
    title: "Repetir al revés",
    teaching: "Primero observa la secuencia. Después responde comenzando por el último número y terminando por el primero.",
    example: "Si aparece 3 - 7 - 2, la respuesta es 2 - 7 - 3.",
    practice: { prompt: "Práctica: si ves 4 - 1 - 8, ¿cuál es la respuesta?", options: ["8 - 1 - 4","4 - 1 - 8","1 - 4 - 8"], answer: "8 - 1 - 4" },
  },
  letter_number: {
    title: "Ordenar números y letras",
    teaching: "Conserva todos los elementos. Ordena primero los números de menor a mayor y después las letras en orden alfabético.",
    example: "B 3 A 1 → 1 3 A B.",
    practice: { prompt: "Práctica: C 2 A 5", options: ["2 5 A C","A C 2 5","5 2 C A"], answer: "2 5 A C" },
  },
  operation_span: {
    title: "Calcular y recordar",
    teaching: "Resuelve cada operación, pero además conserva mentalmente cada resultado porque al final tendrás que escribirlos en el mismo orden.",
    example: "3+2=5 y 8-2=6 → al final: 5 6.",
    practice: { prompt: "Práctica: 4+3=7 y 9-4=5. ¿Qué recordarías?", options: ["7 5","5 7","7 9"], answer: "7 5" },
  },
  nback_1: {
    title: "Comparar con el estímulo anterior",
    teaching: "No compares con el primero de la serie. En cada paso compara únicamente la imagen actual con la que apareció justo antes.",
    example: "⭐ → 🌙 → 🌙. En la tercera imagen la respuesta es SÍ porque coincide con la segunda.",
    practice: { prompt: "Práctica: 🐕 → 🐈 → 🐈. En la tercera imagen, ¿es igual a la anterior?", options: ["Sí","No"], answer: "Sí" },
  },
  trail_making: {
    title: "Alternar número y letra",
    teaching: "La regla alterna un número y una letra: 1-A-2-B-3-C. No continúes solamente números ni solamente letras.",
    example: "Después de 2 corresponde B; después de B corresponde 3.",
    practice: { prompt: "Práctica: 1 → A → 2 → ¿qué sigue?", options: ["B","3","C"], answer: "B" },
  },
  flex_regla: {
    title: "Comprobar la regla activa",
    teaching: "Antes de responder, mira qué regla está activa. La regla puede cambiar, por eso no debes mantener automáticamente el criterio anterior.",
    example: "Si la regla es COLOR eliges por color; si cambia a FORMA, desde ese momento respondes por forma.",
    practice: { prompt: "Práctica: la regla acaba de cambiar de COLOR a FORMA. ¿Qué debes comparar?", options: ["La forma","El color","La posición"], answer: "La forma" },
  },
  calc_faltante: {
    title: "Encontrar el número que falta",
    teaching: "Busca qué número hace verdadera la igualdad. Puedes pensar la operación de manera inversa para comprobarlo.",
    example: "□ + 4 = 9 → 5, porque 5 + 4 = 9.",
    practice: { prompt: "Práctica: □ + 3 = 8", options: ["5","4","6"], answer: "5" },
  },
  ra_series: {
    title: "Descubrir la regla de la serie",
    teaching: "No elijas por parecido. Busca la operación o relación que se repite entre todos los elementos y úsala para predecir el siguiente.",
    example: "2, 4, 6, 8 → aumenta de 2 en 2 → sigue 10.",
    practice: { prompt: "Práctica: 5, 10, 15, 20, ¿qué sigue?", options: ["25","22","30"], answer: "25" },
  },
  cp_inferencia: {
    title: "Inferir sin inventar información",
    teaching: "Elige la conclusión más apoyada por el texto. Una inferencia puede ir más allá de lo literal, pero no debe añadir datos que el contexto no permite sostener.",
    example: "Calle mojada + personas cerrando paraguas → es razonable pensar que llovió recientemente.",
    practice: { prompt: "Práctica: Marta entra con el cabello mojado y sostiene un paraguas húmedo. ¿Qué es razonable inferir?", options: ["Probablemente estuvo bajo la lluvia","Fue a una piscina","Compró un paraguas nuevo"], answer: "Probablemente estuvo bajo la lluvia" },
  },
};

function getTaskLearningProtocol(exId) {
  return TASK_LEARNING_PROTOCOLS[exId] || null;
}

function getExerciseAttemptCount(paciente, exId) {
  return (paciente?.sesiones || []).reduce(
    (count, s) => count + (s.results || []).filter(r => r.exId === exId).length,
    0
  );
}

function getLastExerciseResult(paciente, exId) {
  const sesiones = paciente?.sesiones || [];
  for (let i = sesiones.length - 1; i >= 0; i--) {
    const matches = (sesiones[i].results || []).filter(r => r.exId === exId);
    if (matches.length) return matches[matches.length - 1];
  }
  return null;
}

function resolvePreparationMode(paciente, exId, configuredMode = "auto") {
  const protocol = getTaskLearningProtocol(exId);
  if (!protocol) return "comprobacion";
  if (configuredMode === "aprendizaje" || configuredMode === "practica" || configuredMode === "comprobacion") return configuredMode;

  const attempts = getExerciseAttemptCount(paciente, exId);
  const last = getLastExerciseResult(paciente, exId);

  if (attempts === 0) return "aprendizaje";
  if (last && typeof last.pct === "number" && last.pct < 60) return "practica";
  if (last?.requiresReview) return "practica";
  return "comprobacion";
}

function TaskLearningScreen({ exId, mayor, onContinue, onSkip }) {
  const p = getTaskLearningProtocol(exId);
  if (!p) { onContinue?.(); return null; }

  return (
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <Card style={{ padding: mayor ? 32 : 24 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📘</div>
          <h3 style={{ margin: "0 0 5px", fontSize: mayor ? "1.35rem" : "1.1rem" }}>Aprendamos la regla</h3>
          <p style={{ color: COLORS.textMuted, margin: 0, fontSize: mayor ? ".95rem" : ".78rem" }}>{p.title}</p>
        </div>
        <div style={{ padding: mayor ? 18 : 14, background: COLORS.primary+"07", borderRadius: 12, border:`1px solid ${COLORS.primary}18`, marginBottom: 14 }}>
          <p style={{ margin: 0, lineHeight: 1.65, fontSize: mayor ? "1.05rem" : ".86rem" }}>{p.teaching}</p>
        </div>
        <div style={{ padding: mayor ? 18 : 14, background: COLORS.bg, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontSize: ".7rem", color: COLORS.textMuted, fontWeight: 700, marginBottom: 5 }}>EJEMPLO</div>
          <p style={{ margin: 0, lineHeight: 1.6, fontSize: mayor ? "1rem" : ".83rem" }}>{p.example}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <BtnPrimary onClick={onContinue} style={{ flex: 2, padding: mayor ? 16 : 12 }}>Practicar →</BtnPrimary>
          <BtnSecondary onClick={onSkip} style={{ flex: 1 }}>Ir a la tarea</BtnSecondary>
        </div>
      </Card>
    </div>
  );
}

function GuidedPracticeScreen({ exId, mayor, onComplete }) {
  const protocol = getTaskLearningProtocol(exId);
  const [selected, setSelected] = useState(null);
  if (!protocol?.practice) { onComplete?.(); return null; }

  const p = protocol.practice;
  const correct = selected === p.answer;

  return (
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <Card style={{ padding: mayor ? 32 : 24 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: "2.3rem", marginBottom: 7 }}>🧩</div>
          <h3 style={{ margin: "0 0 5px", fontSize: mayor ? "1.35rem" : "1.1rem" }}>Práctica guiada</h3>
          <p style={{ color: COLORS.textMuted, fontSize: mayor ? ".95rem" : ".78rem", margin: 0 }}>Esta práctica no cuenta para el resultado de la sesión.</p>
        </div>

        <p style={{ fontWeight: 750, lineHeight: 1.55, fontSize: mayor ? "1.1rem" : ".9rem", marginBottom: 14 }}>{p.prompt}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {p.options.map(opt => (
            <button key={opt} onClick={() => setSelected(opt)} disabled={selected !== null} style={{
              padding: mayor ? "15px 16px" : "11px 14px",
              borderRadius: 11,
              border: "2px solid",
              borderColor: selected === null ? COLORS.border : opt === p.answer ? COLORS.success : selected === opt ? COLORS.error : COLORS.border,
              background: selected === null ? COLORS.white : opt === p.answer ? COLORS.success+"12" : selected === opt ? COLORS.error+"10" : COLORS.white,
              textAlign: "left",
              fontFamily: "inherit",
              fontSize: mayor ? "1rem" : ".84rem",
              cursor: selected === null ? "pointer" : "default"
            }}>{opt}</button>
          ))}
        </div>

        {selected !== null && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: correct ? COLORS.success+"10" : COLORS.warning+"10", fontSize: mayor ? ".98rem" : ".78rem", lineHeight: 1.5 }}>
            {correct ? "✅ Correcto. La regla está comprendida." : <>💡 La respuesta de práctica es <strong>{p.answer}</strong>. Revisa la regla antes de comenzar.</>}
          </div>
        )}

        {selected !== null && (
          <BtnPrimary onClick={onComplete} style={{ width: "100%", marginTop: 16, padding: mayor ? 16 : 12 }}>
            Comenzar ejercicio →
          </BtnPrimary>
        )}
      </Card>
    </div>
  );
}

function ConfiguradorSesion({ paciente, onIniciar, onCancelar }) {
  const evalHist = paciente.eval?.hist || [];
  const interventionAreas = paciente.interventionPlan?.areas || [];
  const hasInterventionPlan = !!paciente.interventionPlan && Array.isArray(paciente.interventionPlan.areas);
  const activosPlan = interventionAreas
    .filter(a => a.estado === "objetivo" || a.estado === "seguimiento")
    .sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.prioridad] ?? 1) - ({ alta: 0, media: 1, baja: 2 }[b.prioridad] ?? 1))
    .map(a => a.id);
  const sugeridosEval = evalHist
    .filter(h => typeof h.pct === "number" && h.pct < 60)
    .sort((a, b) => a.pct - b.pct)
    .map(h => h.id);
  const areasAuto = hasInterventionPlan ? activosPlan : sugeridosEval;
  const autoBlockedByPlan = hasInterventionPlan && activosPlan.length === 0;
  const [modo, setModo] = React.useState("auto");
  const [areasSelec, setAreasSelec] = React.useState(areasAuto.slice(0, 3));
  const [duracion, setDuracion] = React.useState(6);
  const [avanceManual, setAvanceManual] = React.useState(true); // true = paciente toca Siguiente, false = avanza solo
  const [adaptativo, setAdaptativo] = React.useState(true);
  const [seleccionInteligente, setSeleccionInteligente] = React.useState(true);
  const [preparacionTarea, setPreparacionTarea] = React.useState("auto");
  const mayor = esModoMayor(paciente);
  const DURACIONES = [
    { value: 4, label: "Corta", desc: "~15 min · 4 ejercicios" },
    { value: 6, label: "Normal", desc: "~25 min · 6 ejercicios" },
    { value: 8, label: "Larga", desc: "~35 min · 8 ejercicios" },
    { value: 12, label: "Extensa", desc: "~50 min · 12 ejercicios" },
  ];
  const allDoms = Object.keys(DOMINIOS_ADULTO);
  const toggleArea = (id) => setAreasSelec(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div style={{ maxWidth: 580, margin: "0 auto" }}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {["1. Áreas","2. Duración","3. Adaptación","4. Prescripción"].map((s,i)=><span key={s} style={{padding:"5px 8px",borderRadius:999,background:i<3?COLORS.primary+"09":COLORS.success+"0d",color:i<3?COLORS.primary:COLORS.success,fontSize:".67rem",fontWeight:700,border:`1px solid ${i<3?COLORS.primary+"18":COLORS.success+"20"}`}}>{s}</span>)}
      </div>
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 4 }}>⚙️ Configurar sesión</h2>
        <p style={{ color: COLORS.textMuted, fontSize: ".88rem" }}>{paciente.nombre} · Sesión #{(paciente.sesiones?.length || 0) + 1}</p>
      </Card>

      {/* Resumen de foco clínico */}
      {hasInterventionPlan && activosPlan.length > 0 && (
        <Card style={{ marginBottom: 20, background: COLORS.success + "07", border: `1px solid ${COLORS.success}20` }}>
          <p style={{ fontWeight: 700, marginBottom: 7 }}>🧭 Foco de la próxima sesión</p>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {activosPlan.slice(0, 4).map(id => {
              const dom = DOMINIOS_ADULTO[id];
              const area = interventionAreas.find(a => a.id === id);
              return (
                <span key={id} style={{ padding: "6px 9px", background: COLORS.white, borderRadius: 9, border: `1px solid ${COLORS.border}`, fontSize: ".73rem" }}>
                  {dom?.emoji} {dom?.label} · {area?.prioridad || "media"}
                </span>
              );
            })}
          </div>
          <p style={{ fontSize: ".7rem", color: COLORS.textMuted, margin: "8px 0 0" }}>
            La selección inteligente usará estas prioridades junto con historial, dificultad y apoyos recientes.
          </p>
        </Card>
      )}

      {/* Modo */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Modo de sesión</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
          {[{ id: "auto", label: "🤖 Automático", desc: "Basado en perfil de intervención" }, { id: "manual", label: "✍️ Manual", desc: "Elijo las áreas" }].map(m => (
            <button key={m.id} onClick={() => setModo(m.id)} style={{ flex: 1, padding: "14px 12px", borderRadius: 12, border: `2px solid ${modo === m.id ? COLORS.primary : COLORS.border}`, background: modo === m.id ? COLORS.primary + "10" : COLORS.white, cursor: "pointer", fontFamily: "inherit" }}>
              <div style={{ fontWeight: 700, fontSize: ".9rem", color: modo === m.id ? COLORS.primary : COLORS.textPrimary }}>{m.label}</div>
              <div style={{ fontSize: ".75rem", color: COLORS.textMuted, marginTop: 4 }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Áreas */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Áreas a trabajar</p>
        {modo === "auto" ? (
          <div>
            {areasAuto.length > 0 && <p style={{ fontSize: ".82rem", color: COLORS.textMuted, marginBottom: 10 }}>Priorizando objetivos definidos en el plan de intervención:</p>}
            {(areasAuto.length > 0 ? areasAuto.slice(0, 3) : allDoms.slice(0, 3)).map(id => {
              const dom = DOMINIOS_ADULTO[id];
              const h = evalHist.find(x => x.id === id);
              return (
                <div key={id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: COLORS.error + "08", borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: ".88rem" }}>{dom?.emoji} {dom?.label}</span>
                  {h && typeof h.pct === "number" && <Badge label={`${h.pct}%`} color={gradeColor(h.pct)} />}
                </div>
              );
            })}
            {areasAuto.length === 0 && (
              <p style={{ color: autoBlockedByPlan ? COLORS.warning : COLORS.textMuted, fontSize: ".85rem", lineHeight: 1.5 }}>
                {autoBlockedByPlan
                  ? "El plan de intervención no tiene objetivos activos. Ajusta el plan o utiliza el modo manual; NeuroFlex no reactivará áreas excluidas o en mantenimiento automáticamente."
                  : "No hay áreas prioritarias derivadas de la evaluación; puedes elegir las áreas manualmente."}
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {allDoms.map(id => {
              const dom = DOMINIOS_ADULTO[id];
              const h = evalHist.find(x => x.id === id);
              const sel = areasSelec.includes(id);
              return (
                <button key={id} onClick={() => toggleArea(id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, border: `2px solid ${sel ? COLORS.primary : COLORS.border}`, background: sel ? COLORS.primary + "08" : COLORS.white, cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontWeight: sel ? 600 : 400, fontSize: ".88rem" }}>{sel ? "☑️" : "⬜"} {dom?.emoji} {dom?.label}</span>
                  {h && typeof h.pct === "number" && <Badge label={`${h.pct}%`} color={gradeColor(h.pct)} />}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Duración */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Duración</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {DURACIONES.map(d => (
            <button key={d.value} onClick={() => setDuracion(d.value)} style={{ padding: "12px", borderRadius: 12, border: `2px solid ${duracion === d.value ? COLORS.primary : COLORS.border}`, background: duracion === d.value ? COLORS.primary + "10" : COLORS.white, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: duracion === d.value ? COLORS.primary : COLORS.textPrimary }}>{d.label}</div>
              <div style={{ fontSize: ".75rem", color: COLORS.textMuted, marginTop: 2 }}>{d.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Selección inteligente */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>🎯 Selección inteligente de ejercicios</p>
        <p style={{ fontSize: ".82rem", color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.55 }}>
          Combina objetivos del plan, historial reciente, variedad, apoyos utilizados y nivel actual.
          Evita repetir por repetir, pero puede volver a una tarea cuando sigue siendo terapéuticamente útil.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { id: true, label: "🧠 Inteligente", desc: "Prioriza y varía según el historial" },
            { id: false, label: "🎲 Convencional", desc: "Selección simple dentro de cada área" },
          ].map(opt => (
            <button key={String(opt.id)} onClick={() => setSeleccionInteligente(opt.id)} style={{
              flex: 1, padding: "12px", borderRadius: 12,
              border: `2px solid ${seleccionInteligente === opt.id ? COLORS.primary : COLORS.border}`,
              background: seleccionInteligente === opt.id ? COLORS.primary + "10" : COLORS.white,
              cursor: "pointer", fontFamily: "inherit", textAlign: "center"
            }}>
              <div style={{ fontWeight: 700, color: seleccionInteligente === opt.id ? COLORS.primary : COLORS.textPrimary }}>{opt.label}</div>
              <div style={{ fontSize: ".75rem", color: COLORS.textMuted, marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Dificultad adaptativa */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>🧠 Dificultad adaptativa</p>
        <p style={{ fontSize: ".82rem", color: COLORS.textMuted, marginBottom: 12 }}>
          NeuroFlex puede usar el desempeño previo para seleccionar ejercicios cercanos al nivel actual del paciente.
          La edad no determina automáticamente la dificultad.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { id: true, label: "✨ Adaptativa", desc: "Recuerda desempeño y ajusta progresivamente" },
            { id: false, label: "🎛️ Estándar", desc: "Mantiene selección convencional" },
          ].map(opt => (
            <button key={String(opt.id)} onClick={() => setAdaptativo(opt.id)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${adaptativo === opt.id ? COLORS.primary : COLORS.border}`, background: adaptativo === opt.id ? COLORS.primary + "10" : COLORS.white, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: adaptativo === opt.id ? COLORS.primary : COLORS.textPrimary }}>{opt.label}</div>
              <div style={{ fontSize: ".75rem", color: COLORS.textMuted, marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Comprensión de la tarea */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>📘 Preparación antes de puntuar</p>
        <p style={{ fontSize: ".82rem", color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.55 }}>
          En tareas con una regla que conviene comprobar primero, NeuroFlex puede enseñar y practicar antes de comenzar.
          La práctica guiada nunca suma ni resta puntos.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
          {[
            { id:"auto", label:"✨ Según necesidad", desc:"Primera vez: enseña; dificultad previa: practica" },
            { id:"aprendizaje", label:"📘 Aprendizaje", desc:"Explicación + ejemplo + práctica" },
            { id:"practica", label:"🧩 Práctica", desc:"Ensayo guiado antes de ejecutar" },
            { id:"comprobacion", label:"✅ Comprobación", desc:"Va directo a la tarea puntuable" },
          ].map(opt => (
            <button key={opt.id} onClick={() => setPreparacionTarea(opt.id)} style={{
              padding:"10px 8px",borderRadius:11,border:`2px solid ${preparacionTarea===opt.id?COLORS.primary:COLORS.border}`,
              background:preparacionTarea===opt.id?COLORS.primary+"09":COLORS.white,cursor:"pointer",fontFamily:"inherit"
            }}>
              <div style={{fontWeight:700,fontSize:".77rem",color:preparacionTarea===opt.id?COLORS.primary:COLORS.textPrimary}}>{opt.label}</div>
              <div style={{fontSize:".64rem",color:COLORS.textMuted,marginTop:3,lineHeight:1.35}}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Avance Manual vs Automático */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>🖱️ Control de avance</p>
        <p style={{ fontSize: ".82rem", color: COLORS.textMuted, marginBottom: 12 }}>¿Cómo pasa el paciente al siguiente ejercicio?</p>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { id: true, label: "👆 Manual", desc: "El paciente toca Siguiente" },
            { id: false, label: "⚡ Automático", desc: "Avanza solo al terminar" },
          ].map(opt => (
            <button key={String(opt.id)} onClick={() => setAvanceManual(opt.id)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${avanceManual === opt.id ? COLORS.accent : COLORS.border}`, background: avanceManual === opt.id ? COLORS.accent + "10" : COLORS.white, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: avanceManual === opt.id ? COLORS.accent : COLORS.textPrimary }}>{opt.label}</div>
              <div style={{ fontSize: ".75rem", color: COLORS.textMuted, marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Info modo accesible */}
      {mayor && (
        <Card style={{ marginBottom: 20, background: COLORS.accent + "08", border: `1.5px solid ${COLORS.accent}30` }}>
          <p style={{ fontWeight: 700, color: COLORS.accent, margin: "0 0 4px" }}>♿ Modo accesible activo</p>
          <p style={{ fontSize: ".82rem", color: COLORS.textMuted, margin: 0 }}>Texto más grande, botones amplios y más tiempo por ejercicio</p>
        </Card>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <BtnPrimary onClick={() => onIniciar({
            modo,
            areas: modo === "auto"
              ? (areasAuto.length > 0 ? areasAuto : (hasInterventionPlan ? [] : allDoms))
              : areasSelec,
            duracion,
            avanceManual,
            adaptativo,
            seleccionInteligente,
            preparacionTarea,
            modoMayor: mayor,
            interventionPlanSnapshot: paciente.interventionPlan || null
          })}
          disabled={(modo === "manual" && areasSelec.length === 0) || (modo === "auto" && autoBlockedByPlan)}
          style={{ flex: 1, padding: 14, opacity: ((modo === "manual" && areasSelec.length === 0) || (modo === "auto" && autoBlockedByPlan)) ? 0.4 : 1 }}>
          ▶ Iniciar sesión
        </BtnPrimary>
        <BtnSecondary onClick={onCancelar}>Cancelar</BtnSecondary>
      </div>
    </div>
  );
}


function getEntryPhaseForExercise(paciente, item, config, showDemo, demoSeen = new Set()) {
  const exId = item?.ex?.id;
  if (!exId) return "exercise";
  const mode = resolvePreparationMode(paciente, exId, config?.preparacionTarea || "auto");
  if (mode === "aprendizaje" && getTaskLearningProtocol(exId)) return "learning";
  if (mode === "practica" && getTaskLearningProtocol(exId)) return "practice";
  if (mode === "comprobacion" && getTaskLearningProtocol(exId)) return "exercise";
  if (showDemo && !demoSeen.has(exId)) return "demo";
  return "exercise";
}

function SesionActiva({ paciente, config, sesionNum, onFinalizar, onCancelar }) {
  const mayor = config.modoMayor || false;
  const avanceManual = config.avanceManual !== false; // default true
  const ST = getStyles(mayor);

  // Construir cola de ejercicios.
  // Si el profesional revisó una prescripción, se respeta exactamente.
  const buildQueue = () => {
    if (Array.isArray(config.prescription) && config.prescription.length > 0) {
      return config.prescription.map((item, idx) => {
        const ex = (EX_ADULTO[item.domId] || []).find(e => e.id === item.exId);
        return ex ? {
          domId: item.domId,
          ex,
          adaptiveLevel: clampAdaptiveLevel(item.adaptiveLevel || getRecommendedLevel(paciente, item.domId, ex)),
          selectionScore: item.selectionScore ?? null,
          selectionReasons: item.selectionReasons || null,
          selectedBy: item.professionalOverride ? "professional" : (item.selectedBy || "intelligent"),
          professionalOverride: !!item.professionalOverride,
          key: `${item.domId}_${idx}`,
        } : null;
      }).filter(Boolean);
    }

    // Fallback para sesiones antiguas o configuraciones sin prescripción.
    const { areas, duracion } = config;
    const domPool = areas.filter(id => EX_ADULTO[id]?.length > 0);
    if (!domPool.length) return [];

    const rx = buildSessionPrescription(paciente, config);
    return rx.map((item, idx) => {
      const ex = (EX_ADULTO[item.domId] || []).find(e => e.id === item.exId);
      return ex ? {
        domId: item.domId,
        ex,
        adaptiveLevel: item.adaptiveLevel,
        selectionScore: item.selectionScore,
        selectionReasons: item.selectionReasons,
        selectedBy: item.selectedBy,
        professionalOverride: !!item.professionalOverride,
        key: `${item.domId}_${idx}`,
      } : null;
    }).filter(Boolean);
  };

  const [queue] = useState(buildQueue);
  const [cur, setCur] = useState(0);
  const [results, setResults] = useState([]);
  const showDemo = config.showDemo || paciente?.showDemo || false;
  const [demoSeen, setDemoSeen] = useState(new Set());
  const [phase, setPhase] = useState(() =>
    getEntryPhaseForExercise(paciente, queue[0], config, showDemo, new Set())
  );
  const [lastResult, setLastResult] = useState(null);
  const [supportByItem, setSupportByItem] = useState({});
  const [supportOverlay, setSupportOverlay] = useState(null); // "example" | "strategy" | null
  const t0 = useRef(Date.now());
  const autoTimer = useRef();

  // Leer instrucción en voz al montar cada ejercicio
  useEffect(() => {
    if (phase !== "exercise") return;
    const instruccion = queue[cur]?.ex?.instruccion;
    if (instruccion) speakInstruction(instruccion);
    return () => { try { window.speechSynthesis?.cancel(); } catch(e) {} };
  }, [cur, phase]);

  const registerSupport = (type) => {
    const key = queue[cur]?.key;
    if (!key) return;
    setSupportByItem(prev => {
      const current = prev[key] || emptySupportRecord();
      const next = { ...current };
      if (type === "repeat") {
        next.instructionRepeats += 1;
        next.maxSupportLevel = Math.max(next.maxSupportLevel, 1);
      }
      if (type === "example") {
        next.exampleRequests += 1;
        next.maxSupportLevel = Math.max(next.maxSupportLevel, 2);
      }
      if (type === "strategy") {
        next.strategyHints += 1;
        next.maxSupportLevel = Math.max(next.maxSupportLevel, 3);
      }
      return { ...prev, [key]: next };
    });
  };

  const currentSupport = supportByItem[queue[cur]?.key] || emptySupportRecord();

  const handleExDone = (res) => {
    const item = queue[cur];
    const meta = getExerciseMetadata(item.domId, item.ex);
    const requiresReview = !!(res.requiresReview || meta.requiereValoracionProfesional);
    const pct = requiresReview ? null : taskPct(res);
    const support = supportByItem[item?.key] || emptySupportRecord();
    const entry = {
      domId: item.domId,
      exId: item.ex.id,
      nombre: item.ex.nombre,
      adaptiveLevel: item.adaptiveLevel || getExerciseBaseLevel(item.domId, item.ex),
      selectedBy: item.selectedBy || "conventional",
      professionalOverride: !!item.professionalOverride,
      selectionScore: item.selectionScore ?? null,
      selectionReasons: item.selectionReasons || null,
      ...res,
      pct,
      requiresReview,
      support,
      supportLevel: support.maxSupportLevel || 0,
      autonomous: (support.maxSupportLevel || 0) === 0,
      preparationMode: resolvePreparationMode(paciente, item.ex.id, config.preparacionTarea || "auto"),
    };
    const newResults = [...results, entry];
    setResults(newResults);
    setLastResult(entry);
    if (cur + 1 >= queue.length) {
      setPhase("done");
    } else {
      setPhase("between");
      // Si es automático, avanzar solo después de 3 segundos
      if (!avanceManual) {
        autoTimer.current = setTimeout(() => siguiente(), 3000);
      }
    }
  };

  useEffect(() => () => clearTimeout(autoTimer.current), []);

  const siguiente = () => {
    clearTimeout(autoTimer.current);
    const nextIdx = cur + 1;
    const nextItem = queue[nextIdx];
    const nextExId = nextItem?.ex?.id;
    setCur(nextIdx);
    setPhase(getEntryPhaseForExercise(paciente, nextItem, config, showDemo, demoSeen));
    setLastResult(null);
  };

  const finalizar = () => {
    const byDom = buildDomainMetrics(results);
    const metrics = buildSessionMetrics(results, Math.round((Date.now() - t0.current) / 1000));
    const globalPct = metrics.taskIndicator;
    const supportSummary = {
      exercisesWithSupport: results.filter(r => {
        const level = getTrackedSupportLevel(r);
        return typeof level === "number" && level > 0;
      }).length,
      autonomousExercises: results.filter(r => getTrackedSupportLevel(r) === 0).length,
      supportTrackedExercises: results.filter(r => hasTrackedSupport(r)).length,
      instructionRepeats: results.reduce((a, r) => a + (r.support?.instructionRepeats || 0), 0),
      exampleRequests: results.reduce((a, r) => a + (r.support?.exampleRequests || 0), 0),
      strategyHints: results.reduce((a, r) => a + (r.support?.strategyHints || 0), 0),
    };
    onFinalizar({
      numero: sesionNum,
      dataVersion: 3,
      date: new Date().toISOString(),
      gp: globalPct,
      byDom,
      results,
      supportSummary,
      metrics,
      intelligentSelectionEnabled: config.seleccionInteligente !== false,
      prescriptionReviewed: !!config.prescriptionReviewed,
      prescriptionReviewedAt: config.prescriptionReviewedAt || null,
      professionalOverrideCount: queue.filter(item => item.professionalOverride).length,
      adaptiveEnabled: config.adaptativo !== false,
      taskPreparationMode: config.preparacionTarea || "auto",
      secs: Math.round((Date.now() - t0.current) / 1000)
    });
  };

  const progress = Math.round((cur / queue.length) * 100);
  const curItem = queue[cur];
  const curDom = curItem ? DOMINIOS_ADULTO[curItem.domId] : null;
  const ExComp = curItem?.ex?.Component;

  if (queue.length === 0) return (
    <Card style={{ textAlign: "center", padding: 40 }}>
      <p style={{ color: COLORS.textMuted }}>No hay ejercicios disponibles para las áreas seleccionadas.</p>
      <BtnSecondary onClick={onCancelar} style={{ marginTop: 16 }}>Volver</BtnSecondary>
    </Card>
  );

  if (phase === "learning") return (
    <TaskLearningScreen
      exId={curItem?.ex?.id}
      mayor={mayor}
      onContinue={() => setPhase("practice")}
      onSkip={() => setPhase("exercise")}
    />
  );

  if (phase === "practice") return (
    <GuidedPracticeScreen
      exId={curItem?.ex?.id}
      mayor={mayor}
      onComplete={() => setPhase("exercise")}
    />
  );

  // Pantalla de demostración
  if (phase === "demo") return (
    <DemoScreen
      exId={curItem?.ex?.id}
      mayor={mayor}
      onContinuar={() => {
        if (curItem?.ex?.id) setDemoSeen(prev => new Set([...prev, curItem.ex.id]));
        setPhase("exercise");
      }}
    />
  );

  if (phase === "done") return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Card style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>¡Sesión completada!</h2>
        <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>
          {results.length} ejercicios · {fmt(Math.round((Date.now() - t0.current) / 1000))}
          {results.some(r => typeof r.pct === "number") && ` · ${Math.round(results.filter(r => typeof r.pct === "number").reduce((a, b) => a + b.pct, 0) / results.filter(r => typeof r.pct === "number").length)}% indicador de tareas`}
        </p>
        <div style={{ marginBottom: 24 }}>
          {results.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: ".85rem" }}>{DOMINIOS_ADULTO[r.domId]?.emoji} {r.nombre}</span>
              <div style={{ textAlign: "right" }}>
                {typeof r.pct === "number"
                  ? <span style={{ fontWeight: 700, color: gradeColor(r.pct) }}>{r.pct}%</span>
                  : <span style={{ fontSize: ".72rem", color: COLORS.accent, fontWeight: 600 }}>Valoración profesional</span>}
                <div style={{ color: COLORS.textMuted, fontSize: ".66rem", marginTop: 2 }}>{supportLabel(getTrackedSupportLevel(r))}</div>
              </div>
            </div>
          ))}
        </div>
        <BtnPrimary onClick={finalizar} style={{ width: "100%", padding: 14 }}>Guardar y ver reporte →</BtnPrimary>
      </Card>
    </div>
  );

  if (phase === "between") return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <Card style={{ textAlign: "center", padding: mayor ? 48 : 40 }}>
        <div style={{ fontSize: mayor ? "3.5rem" : "2.5rem", marginBottom: 12 }}>
          {typeof lastResult?.pct !== "number" ? "🧑‍⚕️" : lastResult.pct >= 80 ? "🌟" : lastResult.pct >= 60 ? "👍" : "💪"}
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: mayor ? "1.4rem" : "1.1rem" }}>
          {typeof lastResult?.pct !== "number" ? "Respuesta registrada" : lastResult.pct >= 80 ? "¡Excelente trabajo!" : lastResult.pct >= 60 ? "¡Bien hecho!" : "¡Sigue adelante!"}
        </h3>
        <p style={{ color: COLORS.textMuted, marginBottom: 6, fontSize: mayor ? "1rem" : ".9rem" }}>{lastResult?.nombre}</p>
        {typeof lastResult?.pct === "number"
          ? <p style={{ fontSize: mayor ? "2rem" : "1.5rem", fontWeight: 900, color: gradeColor(lastResult.pct), marginBottom: 24 }}>{lastResult.pct}%</p>
          : <p style={{ fontSize: mayor ? "1.1rem" : ".9rem", fontWeight: 700, color: COLORS.accent, marginBottom: 24 }}>Pendiente de valoración profesional</p>}
        <p style={{ color: COLORS.textMuted, fontSize: mayor ? ".92rem" : ".78rem", margin: "-12px 0 20px" }}>
          Nivel de apoyo: <strong>{supportLabel(getTrackedSupportLevel(lastResult))}</strong>
        </p>
        {avanceManual ? (
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <BtnPrimary onClick={siguiente} style={{ padding: mayor ? "16px 32px" : "11px 24px", fontSize: mayor ? "1.05rem" : ".9rem" }}>
              Siguiente ejercicio →
            </BtnPrimary>
            <BtnSecondary onClick={() => setPhase("done")} style={{ fontSize: mayor ? "1rem" : ".9rem" }}>Terminar</BtnSecondary>
          </div>
        ) : (
          <div>
            <p style={{ color: COLORS.textMuted, fontSize: mayor ? ".95rem" : ".82rem", marginBottom: 12 }}>Continuando en 3 segundos...</p>
            <BtnSecondary onClick={siguiente} style={{ fontSize: mayor ? "1rem" : ".9rem" }}>Continuar ahora →</BtnSecondary>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Header progreso */}
      <Card style={{ marginBottom: 16, padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: ".82rem", color: COLORS.textMuted }}>Ejercicio {cur + 1} de {queue.length}</span>
          <button onClick={() => { if (confirm("¿Terminar la sesión?")) setPhase("done"); }}
            style={{ fontSize: ".78rem", color: COLORS.textMuted, background: "transparent", border: "none", cursor: "pointer" }}>
            Terminar sesión
          </button>
        </div>
        <ProgressBar value={progress} color={COLORS.primary} />
      </Card>

      <Card>
        {/* Domain label */}
        <div style={{ display: "flex", alignItems: "center", gap: mayor ? 14 : 10, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ width: mayor ? 50 : 36, height: mayor ? 50 : 36, borderRadius: mayor ? 14 : 10, background: curDom?.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: mayor ? "1.6rem" : "1.2rem" }}>{curDom?.emoji}</div>
          <div>
            <p style={{ fontWeight: 700, margin: 0, fontSize: mayor ? "1.1rem" : ".9rem" }}>{curDom?.label}</p>
            <p style={{ color: COLORS.textMuted, fontSize: mayor ? ".88rem" : ".75rem", margin: 0 }}>
              {curItem?.ex?.nombre}
              {config.adaptativo !== false && curItem?.adaptiveLevel ? ` · Nivel adaptativo ${curItem.adaptiveLevel}/5` : ""}
            </p>
          </div>
        </div>

        {/* Instrucción — más grande en modo mayor */}
        <div style={{ background: COLORS.primary + "08", borderRadius: mayor ? 14 : 10, padding: mayor ? "16px 18px" : "10px 14px", marginBottom: 20, border: `1px solid ${COLORS.primary}15` }}>
          <p style={{ margin: 0, fontSize: mayor ? "1.05rem" : ".85rem", color: COLORS.primary, lineHeight: 1.6, fontWeight: mayor ? 600 : 400 }}>
            📋 {curItem?.ex?.instruccion}
          </p>
          {/* Botón para repetir la instrucción en voz */}
          <button onClick={() => { registerSupport("repeat"); speakInstruction(curItem?.ex?.instruccion); }} style={{ marginTop: 8, background: "transparent", border: `1px solid ${COLORS.primary}30`, borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: mayor ? ".85rem" : ".72rem", color: COLORS.primary, fontFamily: "inherit" }}>
            🔊 Repetir instrucción
          </button>
        </div>

        {/* Apoyos graduados — permanecen visibles sin interrumpir el ejercicio */}
        <div style={{ marginBottom: 16, padding: mayor ? "12px 14px" : "9px 12px", borderRadius: 10, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: mayor ? ".9rem" : ".76rem", color: COLORS.textMuted }}>
              Ayuda utilizada: <strong style={{ color: currentSupport.maxSupportLevel ? COLORS.accent : COLORS.success }}>{supportLabel(currentSupport.maxSupportLevel)}</strong>
            </span>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {DEMOS[curItem?.ex?.id] && (
                <button onClick={() => { registerSupport("example"); setSupportOverlay("example"); }}
                  style={{ border: `1px solid ${COLORS.primary}35`, background: COLORS.white, color: COLORS.primary, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: mayor ? ".85rem" : ".72rem" }}>
                  🎬 Ver ejemplo
                </button>
              )}
              <button onClick={() => { registerSupport("strategy"); setSupportOverlay("strategy"); }}
                style={{ border: `1px solid ${COLORS.accent}35`, background: COLORS.white, color: COLORS.accent, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: mayor ? ".85rem" : ".72rem" }}>
                💡 Pista estratégica
              </button>
            </div>
          </div>
        </div>

        {/* Ejercicio */}
        {ExComp && <ExComp
          onDone={handleExDone}
          paciente={paciente}
          modoMayor={mayor}
          adaptiveLevel={curItem?.adaptiveLevel}
          difficultyLevel={curItem?.adaptiveLevel}
        />}

        {supportOverlay && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(20,25,35,.48)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 520, background: COLORS.white, borderRadius: 18, padding: mayor ? 26 : 22, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
              {supportOverlay === "example" && DEMOS[curItem?.ex?.id] ? (
                <>
                  <h3 style={{ margin: "0 0 14px", fontSize: mayor ? "1.25rem" : "1.05rem" }}>🎬 Ejemplo adicional</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    {DEMOS[curItem.ex.id].pasos?.map((p, i) => (
                      <div key={i} style={{ padding: "9px 11px", background: COLORS.bg, borderRadius: 9, fontSize: mayor ? ".95rem" : ".82rem" }}>
                        {p.icono} {p.texto}
                      </div>
                    ))}
                  </div>
                  {DEMOS[curItem.ex.id].ejemplo && (
                    <div style={{ padding: 12, borderRadius: 10, background: COLORS.primary + "08", marginBottom: 16 }}>
                      <strong>Ejemplo:</strong> {DEMOS[curItem.ex.id].ejemplo.muestra} → {DEMOS[curItem.ex.id].ejemplo.respuesta}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 style={{ margin: "0 0 12px", fontSize: mayor ? "1.25rem" : "1.05rem" }}>💡 Pista estratégica</h3>
                  <p style={{ lineHeight: 1.65, color: COLORS.textSecond, fontSize: mayor ? "1rem" : ".88rem" }}>
                    {SUPPORT_STRATEGIES[curItem?.domId] || "Detente un momento, identifica la regla principal y resuelve un paso a la vez."}
                  </p>
                  <p style={{ color: COLORS.textMuted, fontSize: ".74rem", marginTop: 10 }}>
                    La pista orienta la estrategia sin revelar la respuesta.
                  </p>
                </>
              )}
              <BtnPrimary onClick={() => setSupportOverlay(null)} style={{ width: "100%", marginTop: 10 }}>
                Volver al ejercicio
              </BtnPrimary>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ReporteSesion({ sesion, paciente, onVolver }) {
  const [nota, setNota] = useState(sesion.nota || "");
  const [guardado, setGuardado] = useState(false);

  const guardarNota = async () => {
    try {
      const sesiones = (paciente.sesiones || []).map(s => s.numero === sesion.numero ? { ...s, nota } : s);
      await updateDoc(doc(firestore, "pacientes", paciente.id), { sesiones });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch(e) {}
  };
  return (
    <div id="neuroflex-session-report" style={{ maxWidth: 600, margin: "0 auto" }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #neuroflex-session-report, #neuroflex-session-report * { visibility: visible !important; }
          #neuroflex-session-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 10mm !important;
            box-sizing: border-box !important;
          }
          #neuroflex-session-report .nf-no-print { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
      <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: COLORS.white, padding: "28px 24px" }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
        <h2 style={{ fontWeight: 800, marginBottom: 4 }}>Sesión {sesion.numero} · {paciente.nombre}</h2>
        <p style={{ opacity: .85, fontSize: ".88rem" }}>{new Date(sesion.date).toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Indicador de tareas", value: typeof getSessionMetric(sesion, "taskIndicator") === "number" ? `${getSessionMetric(sesion, "taskIndicator")}%` : "—", color: typeof getSessionMetric(sesion, "taskIndicator") === "number" ? gradeColor(getSessionMetric(sesion, "taskIndicator")) : COLORS.textMuted },
          { label: "Autonomía", value: getSessionMetric(sesion, "autonomyRate") !== null ? `${getSessionMetric(sesion, "autonomyRate")}%` : "—", color: COLORS.success },
          { label: "Nivel adaptativo medio", value: getSessionMetric(sesion, "averageAdaptiveLevel") !== null ? `${getSessionMetric(sesion, "averageAdaptiveLevel")}/5` : "—", color: COLORS.primary },
          { label: "Tiempo medio / ejercicio", value: getSessionMetric(sesion, "averageSecondsPerExercise") !== null ? fmt(getSessionMetric(sesion, "averageSecondsPerExercise")) : "—", color: COLORS.accent },
          { label: "Ejercicios", value: sesion.results?.length || 0, color: COLORS.primary },
          { label: "Duración total", value: fmt(sesion.secs || 0), color: COLORS.accent },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: "center", padding: 14 }}>
            <div style={{ fontSize: "1.35rem", fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: ".69rem", color: COLORS.textMuted, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 14 }}>Rendimiento por dominio</p>
        {Object.entries(sesion.byDom || {}).map(([id, d]) => {
          const dom = DOMINIOS_ADULTO[id];
          const pct = typeof d.pct === "number"
            ? d.pct
            : (d.total > 0 ? Math.round((d.correct / d.total) * 100) : null);
          return (
            <div key={id} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: ".85rem", fontWeight: 600 }}>{dom?.emoji} {dom?.label}</span>
                {pct !== null
                  ? <span style={{ fontWeight: 700, color: gradeColor(pct) }}>{pct}%</span>
                  : <span style={{ color: COLORS.accent, fontSize: ".75rem", fontWeight: 600 }}>Valoración profesional</span>}
              </div>
              {pct !== null && <ProgressBar value={pct} color={gradeColor(pct)} height={7} />}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6, fontSize: ".69rem", color: COLORS.textMuted }}>
                {d.averageAdaptiveLevel !== undefined && d.averageAdaptiveLevel !== null && <span>Nivel: {d.averageAdaptiveLevel}/5</span>}
                {d.autonomyRate !== undefined && d.autonomyRate !== null && <span>Autonomía: {d.autonomyRate}%</span>}
                {d.averageSeconds !== undefined && d.averageSeconds !== null && <span>Tiempo medio: {fmt(d.averageSeconds)}</span>}
                {!!d.clinicalReviewCount && <span>Revisión clínica: {d.clinicalReviewCount}</span>}
              </div>
            </div>
          );
        })}
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 14 }}>Detalle por ejercicio</p>
        {(sesion.results || []).map((r, i) => {
          const dom = DOMINIOS_ADULTO[r.domId];
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: ".85rem" }}>{dom?.emoji} {r.nombre}</p>
                <p style={{ margin: "2px 0 0", fontSize: ".7rem", color: COLORS.textMuted }}>
                  {typeof r.pct === "number" ? `✅ ${r.correct}/${r.total} correctos` : "🧑‍⚕️ Respuesta para valoración profesional"}
                  {typeof r.adaptiveLevel === "number" ? ` · Nivel ${r.adaptiveLevel}/5` : ""}
                  {typeof r.seconds === "number" ? ` · ${fmt(r.seconds)}` : ""}
                  {r.preparationMode && r.preparationMode !== "comprobacion" ? ` · Preparación: ${r.preparationMode}` : ""}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: ".68rem", color: getTrackedSupportLevel(r) === null ? COLORS.textMuted : getTrackedSupportLevel(r) > 0 ? COLORS.accent : COLORS.success }}>
                  Apoyo: {supportLabel(getTrackedSupportLevel(r))}
                </p>
                {r.professionalOverride ? (
                  <p style={{ margin: "2px 0 0", fontSize: ".66rem", color: COLORS.accent }}>
                    ✍️ Prescripción ajustada por el profesional
                  </p>
                ) : r.selectedBy === "intelligent" && r.selectionReasons && (
                  <p style={{ margin: "2px 0 0", fontSize: ".66rem", color: COLORS.textMuted }}>
                    Selección: ajuste de dificultad {r.selectionReasons.difficultyFit}
                    {r.selectionReasons.recentUse ? ` · usado ${r.selectionReasons.recentUse} vez/veces recientemente` : " · no reciente"}
                    {r.selectionReasons.subcomponent ? ` · ${r.selectionReasons.subcomponent}` : ""}
                  </p>
                )}
              </div>
              {typeof r.pct === "number"
                ? <Badge label={`${r.pct}%`} color={gradeColor(r.pct)} />
                : <Badge label="Revisión clínica" color={COLORS.accent} />}
            </div>
          );
        })}
      </Card>

      {sesion.prescriptionReviewed && (
        <Card style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>🧾 Prescripción aplicada</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: ".75rem", color: COLORS.textMuted }}>
            <span>Revisada antes de iniciar: ✅</span>
            <span>Ajustes profesionales: {sesion.professionalOverrideCount || 0}</span>
            <span>Selección inteligente: {sesion.intelligentSelectionEnabled ? "Activa" : "No"}</span>
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 20, background: COLORS.primary + "06", border: `1px solid ${COLORS.primary}18` }}>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>🔎 Lectura de la sesión</p>
        <p style={{ color: COLORS.textMuted, fontSize: ".77rem", lineHeight: 1.6, margin: 0 }}>
          El porcentaje debe leerse junto con el nivel de dificultad, el tiempo y los apoyos utilizados.
          Un desempeño similar puede representar condiciones de ejecución diferentes si cambian la autonomía o la dificultad.
          Estos indicadores son descriptivos de NeuroFlex y no sustituyen medidas normativas ni juicio clínico.
        </p>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>📝 Nota clínica</p>
        <textarea value={nota} onChange={e => setNota(e.target.value)}
          placeholder="Observaciones del profesional: actitud del paciente, dificultades observadas, logros, recomendaciones..."
          style={{ width: "100%", minHeight: 100, padding: 12, borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: ".88rem", resize: "vertical", marginBottom: 10, fontFamily: "inherit" }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <BtnSecondary onClick={guardarNota} style={{ fontSize: ".82rem", padding: "8px 16px" }}>
            {guardado ? "✅ Guardado" : "Guardar nota"}
          </BtnSecondary>
        </div>
      </Card>

      <div className="nf-no-print" style={{ display: "flex", gap: 10 }}>
        <BtnSecondary onClick={() => window.print()} style={{ flex: 1 }}>🖨️ Imprimir</BtnSecondary>
        <BtnPrimary onClick={onVolver} style={{ flex: 2, padding: 14 }}>← Volver al perfil</BtnPrimary>
      </div>
    </div>
  );
}


export default function App() {
  const [authState, setAuthState] = useState("loading"); // loading | unauthenticated | authenticated
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [selectedPaciente, setSelectedPaciente] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setAuthState("unauthenticated"); return; }
      // Intentar recuperar rol desde Firestore
      for (const [col, r] of [["admins","admin"],["profesionales","profesional"],["pacientes","paciente"]]) {
        const snap = await getDoc(doc(firestore, col, user.uid));
        if (snap.exists()) {
          setRole(r);
          setCurrentUser({ ...snap.data(), uid: user.uid, email: user.email });
          setAuthState("authenticated");
          return;
        }
      }
      await signOut(auth);
      setAuthState("unauthenticated");
    });
    return () => unsub();
  }, []);

  const handleLogin = (r, userData) => {
    setRole(r); setCurrentUser(userData); setAuthState("authenticated");
    setScreen("dashboard");
  };

  const handleLogout = async () => {
    await signOut(auth);
    setRole(null); setCurrentUser(null); setAuthState("unauthenticated");
    setScreen("dashboard");
  };

  // Loading
  if (authState === "loading") return (
    <div style={{ minHeight: "100vh", background: COLORS.sidebar, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.body }}>
      <style>{baseStyles}</style>
      <div style={{ textAlign: "center", color: "rgba(255,255,255,.6)" }}>
        <div style={{ fontSize: "3rem", marginBottom: 12 }}>🧠</div>
        <p>Cargando NeuroFlex...</p>
      </div>
    </div>
  );

  // Login
  if (authState === "unauthenticated") return (
    <>
      <style>{baseStyles}</style>
      <LoginScreen onLogin={handleLogin} />
    </>
  );

  // Render por rol
  const getTitleForScreen = () => {
    const titles = {
      dashboard: "Panel principal",
      profesionales: "Gestión de profesionales",
      pacientes: "Mis pacientes",
      sesiones: "Sesiones",
      reportes: "Reportes",
      centros: "Centros",
      estadisticas: "Estadísticas globales",
      inicio: "Inicio",
      "mi-sesion": "Mi sesión",
      "mi-progreso": "Mi progreso",
      historial: "Historial",
    };
    return titles[screen] || "NeuroFlex";
  };

  const renderContent = () => {
    // Admin
    if (role === "admin") {
      if (screen === "dashboard") return <DashboardAdmin user={currentUser} />;
      if (screen === "profesionales") return <GestionProfesionales />;
      if (screen === "pacientes") return <p style={{ color: COLORS.textMuted }}>Vista global de pacientes — próximamente</p>;
      if (screen === "estadisticas") return <p style={{ color: COLORS.textMuted }}>Estadísticas globales — próximamente</p>;
    }

    // Profesional
    if (role === "profesional") {
      if (screen === "dashboard") return <DashboardProfesional user={currentUser} />;
      if (screen === "pacientes") {
        if (selectedPaciente) return (
          <PerfilPacienteWrapper
            paciente={selectedPaciente}
            onVolver={() => setSelectedPaciente(null)}
            profesionalUid={currentUser.uid}
          />
        );
        return <GestionPacientes user={currentUser} onVerPaciente={p => { setSelectedPaciente(p); }} />;
      }
      if (screen === "sesiones") return <p style={{ color: COLORS.textMuted }}>Historial de sesiones — próximamente</p>;
      if (screen === "reportes") return <p style={{ color: COLORS.textMuted }}>Reportes — próximamente</p>;
    }

    // Paciente
    if (role === "paciente") {
      if (screen === "inicio") return <DashboardPaciente user={currentUser} />;
      return <p style={{ color: COLORS.textMuted }}>Próximamente</p>;
    }

    return <p style={{ color: COLORS.textMuted }}>Pantalla no encontrada</p>;
  };

  const defaultScreen = role === "paciente" ? "inicio" : "dashboard";

  return (
    <>
      <style>{baseStyles}</style>
      <Sidebar
        role={role}
        activeScreen={screen}
        onNav={s => { setScreen(s); setSelectedPaciente(null); }}
        user={currentUser}
        onLogout={handleLogout}
      />
      <MainLayout title={selectedPaciente && screen === "pacientes" ? selectedPaciente.nombre : getTitleForScreen()}>
        {renderContent()}
      </MainLayout>
    </>
  );
}
