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


// ─── FASE 32 · NEUROFLEX EVALUATION v2 — ARQUITECTURA BASE ──────────────────
// Esta capa NO sustituye todavía a EvaluacionAdulto.
// Define el contrato técnico de la batería multidimensional futura y permite
// implementarla por fases sin alterar el tratamiento ni los 34 ejercicios actuales.
const NEUROFLEX_ASSESSMENT_VERSION = "NF-EVAL-2.0";
const NEUROFLEX_ASSESSMENT_SCHEMA_VERSION = 1;

const ASSESSMENT_DOMAINS_V2 = {
  orientacion: {
    id: "orientacion", label: "Orientación",
    subprocesos: ["temporal", "espacial", "personal", "contextual"],
  },
  atencion: {
    id: "atencion", label: "Atención",
    subprocesos: ["focalizada", "selectiva", "sostenida", "vigilancia", "alternante", "dividida", "resistencia_distractores"],
  },
  velocidad_proc: {
    id: "velocidad_proc", label: "Velocidad de procesamiento",
    subprocesos: ["velocidad_perceptiva", "velocidad_respuesta", "eficiencia_cognitiva", "equilibrio_velocidad_precision"],
  },
  inhibicion: {
    id: "inhibicion", label: "Control inhibitorio",
    subprocesos: ["inhibicion_respuesta", "resistencia_interferencia", "control_impulsividad", "detencion_respuesta_automatizada"],
  },
  flexibilidad: {
    id: "flexibilidad", label: "Flexibilidad cognitiva",
    subprocesos: ["cambio_regla", "alternancia", "adaptacion", "perseveracion", "costo_cambio"],
  },
  memoria_trabajo: {
    id: "memoria_trabajo", label: "Memoria de trabajo",
    subprocesos: ["verbal_auditiva", "visual", "visuoespacial", "mantenimiento", "manipulacion", "actualizacion"],
  },
  memoria_verbal: {
    id: "memoria_verbal", label: "Aprendizaje y memoria verbal",
    subprocesos: ["codificacion", "adquisicion", "curva_aprendizaje", "interferencia", "evocacion_inmediata", "evocacion_diferida", "reconocimiento", "intrusiones", "perseveraciones", "falsas_alarmas"],
  },
  memoria_visual: {
    id: "memoria_visual", label: "Aprendizaje y memoria visual",
    subprocesos: ["codificacion", "aprendizaje", "organizacion", "evocacion", "reconocimiento", "retencion_diferida"],
  },
  memoria_prospectiva: {
    id: "memoria_prospectiva", label: "Memoria prospectiva",
    subprocesos: ["intencion_futura", "basada_eventos", "doble_demanda"],
  },
  lenguaje: {
    id: "lenguaje", label: "Lenguaje",
    subprocesos: ["denominacion", "comprension", "acceso_lexico", "fluidez_verbal", "procesamiento_semantico", "relaciones_conceptuales"],
  },
  razonamiento: {
    id: "razonamiento", label: "Razonamiento",
    subprocesos: ["logico", "abstracto", "analogico", "inductivo", "deductivo", "cuantitativo"],
  },
  planificacion: {
    id: "planificacion", label: "Planificación y resolución de problemas",
    subprocesos: ["anticipacion", "planificacion", "secuenciacion", "estrategia", "monitorizacion", "correccion", "resolucion_problemas"],
  },
  visuoespacial: {
    id: "visuoespacial", label: "Procesamiento visuoespacial y visuoconstructivo",
    subprocesos: ["relaciones_espaciales", "rotacion_mental", "organizacion_espacial", "analisis_configuraciones", "construccion"],
  },
  gnosias: {
    id: "gnosias", label: "Percepción y gnosias",
    subprocesos: ["discriminacion_visual", "figura_fondo", "cierre_visual", "reconocimiento_visual", "reconocimiento_auditivo"],
  },
  praxias: {
    id: "praxias", label: "Praxias",
    subprocesos: ["ideomotora", "ideatoria", "secuencial", "constructiva"],
  },
  cognicion_social_metacognicion: {
    id: "cognicion_social_metacognicion", label: "Cognición social y metacognición",
    subprocesos: ["reconocimiento_emocional", "inferencia_social", "deteccion_errores", "estimacion_desempeno", "confianza_respuesta"],
    complementario: true,
  },
  cognicion_funcional: {
    id: "cognicion_funcional", label: "Cognición funcional",
    subprocesos: ["manejo_temporal", "planificacion_cotidiana", "calculo_funcional", "seguimiento_instrucciones", "doble_tarea_funcional"],
    transversal: true,
  },
};

const ASSESSMENT_METRIC_SCHEMA = {
  precision: null,
  correct: null,
  total: null,
  errors: null,
  omissions: null,
  commissions: null,
  perseverations: null,
  intrusions: null,
  falseAlarms: null,
  sequenceErrors: null,
  selfCorrections: null,
  meanResponseMs: null,
  medianResponseMs: null,
  responseVariabilityMs: null,
  extremelyFastResponses: null,
  extremelySlowResponses: null,
  blockPerformance: null,
  performanceChange: null,
  interferenceCost: null,
  switchCost: null,
  supportsUsed: null,
  attempts: null,
  levelReached: null,
  latencyMs: null,
  anticipatoryResponses: null,
  retentionRate: null,
  spontaneousRecall: null,
  cuedRecall: null,
  taskVersionAdministered: null,
};

function createEmptyAssessmentMetrics() {
  return { ...ASSESSMENT_METRIC_SCHEMA };
}

function normalizeAssessmentMetrics(metrics = {}) {
  const base = createEmptyAssessmentMetrics();
  Object.keys(base).forEach(key => {
    if (metrics[key] !== undefined) base[key] = metrics[key];
  });
  return base;
}

function makeAssessmentTaskResult(taskId, raw = {}) {
  const task = ASSESSMENT_TASKS_V2[taskId];
  if (!task) return null;
  const date = new Date().toISOString();
  const metrics = normalizeAssessmentMetrics(raw.metrics || raw);
  if (!metrics.taskVersionAdministered) {
    metrics.taskVersionAdministered = `${taskId}-${task.version}`;
  }
  return {
    taskId,
    taskVersion: task.version,
    taskVersionId: metrics.taskVersionAdministered,
    assessmentVersion: NEUROFLEX_ASSESSMENT_VERSION,
    primaryDomain: task.primaryDomain,
    secondaryDomains: [...(task.secondaryDomains || [])],
    processes: [...(task.processes || [])],
    metrics,
    requiresProfessionalReview: !!raw.requiresProfessionalReview,
    notes: raw.notes || "",
    startedAt: raw.startedAt || null,
    completedAt: raw.completedAt || date,
  };
}

// Referencias = inspiración conceptual del paradigma, NO equivalencia ni aplicación
// digital de pruebas comerciales. Los estímulos/reactivos de NeuroFlex serán propios.
const ASSESSMENT_TASKS_V2 = {
  "NF-E01": {
    id: "NF-E01", name: "¿Dónde estamos?", version: "1.0",
    primaryDomain: "orientacion", secondaryDomains: [],
    processes: ["temporal","espacial","personal","contextual"],
    conceptualReferences: ["MoCA/MMSE (orientación, referencia conceptual)"],
    variables: ["precision","errors","latencyMs"],
    estimatedMinutes: 3,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["temporal_orientation","spatial_orientation","or_personas","or_situacion"],
    implementationStatus: "reuse_candidate",
    scoringNote: "Describir exactitud por componente; no usar baremos externos.",
    allowedInterpretations: ["orientación observada durante la tarea"],
    limitations: ["Puede depender de contexto, comprensión de la consigna y condiciones ambientales."],
  },
  "NF-E02": {
    id: "NF-E02", name: "Objetivo entre distractores", version: "1.0",
    primaryDomain: "atencion", secondaryDomains: ["velocidad_proc","gnosias"],
    processes: ["selectiva","resistencia_distractores","exploracion_visual"],
    conceptualReferences: ["Tareas de cancelación / búsqueda visual"],
    variables: ["correct","omissions","commissions","meanResponseMs","responseVariabilityMs","blockPerformance"],
    estimatedMinutes: 3,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["find_animal","visual_matching"],
    implementationStatus: "reuse_candidate",
    scoringNote: "Separar precisión, omisiones, comisiones y tiempo.",
    allowedInterpretations: ["eficiencia de búsqueda visual observada","selección de estímulos relevantes"],
    limitations: ["El desempeño puede verse afectado por visión, dispositivo y familiaridad táctil."],
  },
  "NF-E03": {
    id: "NF-E03", name: "Mantén el foco", version: "1.0",
    primaryDomain: "atencion", secondaryDomains: ["velocidad_proc"],
    processes: ["sostenida","vigilancia","estabilidad_respuesta"],
    conceptualReferences: ["Continuous Performance Test / paradigmas de vigilancia"],
    variables: ["correct","omissions","commissions","meanResponseMs","responseVariabilityMs","blockPerformance","performanceChange"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["sustained_attention"],
    implementationStatus: "reuse_candidate",
    scoringNote: "Analizar por bloques y evitar atribuir automáticamente cambios a fatiga clínica.",
    allowedInterpretations: ["estabilidad atencional observada","cambio del rendimiento durante la tarea"],
    limitations: ["Una caída temporal no identifica por sí sola su causa clínica."],
  },
  "NF-E04": {
    id: "NF-E04", name: "Responde / Detente", version: "1.0",
    primaryDomain: "inhibicion", secondaryDomains: ["atencion","velocidad_proc"],
    processes: ["inhibicion_respuesta","control_impulsividad","vigilancia"],
    conceptualReferences: ["Go/No-Go"],
    variables: ["correct","omissions","commissions","meanResponseMs","anticipatoryResponses"],
    estimatedMinutes: 3,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: [],
    implementationStatus: "new_task",
    scoringNote: "Distinguir omisiones de comisiones y respuestas anticipatorias.",
    allowedInterpretations: ["control de respuesta observado"],
    limitations: ["No equivale a una medida diagnóstica de impulsividad."],
  },
  "NF-E05": {
    id: "NF-E05", name: "Regla contraria", version: "1.0",
    primaryDomain: "inhibicion", secondaryDomains: ["velocidad_proc","atencion"],
    processes: ["resistencia_interferencia","detencion_respuesta_automatizada"],
    conceptualReferences: ["Stroop / paradigmas de interferencia"],
    variables: ["precision","errors","meanResponseMs","interferenceCost","selfCorrections"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["color_naming","flex_opuesto"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Comparar condición simple vs interferente con estímulos originales NeuroFlex.",
    allowedInterpretations: ["costo descriptivo de interferencia","control inhibitorio observado"],
    limitations: ["No utilizar puntuaciones, reactivos ni baremos Stroop."],
  },
  "NF-E06": {
    id: "NF-E06", name: "Cambia la regla", version: "1.0",
    primaryDomain: "flexibilidad", secondaryDomains: ["atencion","velocidad_proc","planificacion"],
    processes: ["cambio_regla","alternancia","adaptacion","perseveracion","costo_cambio"],
    conceptualReferences: ["Task-switching","WCST","Trail Making Test B","BANFE (referencia ejecutiva conceptual)"],
    variables: ["errors","perseverations","meanResponseMs","switchCost","selfCorrections"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["flex_regla","trail_making"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Registrar errores perseverativos y costo de cambio sin usar baremos externos.",
    allowedInterpretations: ["adaptación al cambio de criterio","alternancia observada"],
    limitations: ["No equivale a WCST, TMT ni BANFE."],
  },
  "NF-E07": {
    id: "NF-E07", name: "Secuencia activa", version: "1.0",
    primaryDomain: "memoria_trabajo", secondaryDomains: ["atencion"],
    processes: ["verbal_auditiva","mantenimiento","manipulacion"],
    conceptualReferences: ["Span verbal","WAIS Dígitos / Secuenciación, referencia conceptual"],
    variables: ["precision","errors","levelReached","latencyMs"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["digits_forward","digits_backward","letter_number"],
    implementationStatus: "reuse_candidate",
    scoringNote: "Usar secuencias propias y registrar amplitud/nivel alcanzado.",
    allowedInterpretations: ["mantenimiento y manipulación verbal observados"],
    limitations: ["No genera puntuaciones WAIS."],
  },
  "NF-E08": {
    id: "NF-E08", name: "Ruta espacial", version: "1.0",
    primaryDomain: "memoria_trabajo", secondaryDomains: ["visuoespacial"],
    processes: ["visuoespacial","mantenimiento","manipulacion"],
    conceptualReferences: ["Corsi Block-Tapping / span visuoespacial"],
    variables: ["precision","sequenceErrors","levelReached","latencyMs"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: [],
    implementationStatus: "new_task",
    scoringNote: "Secuencias espaciales originales directas e inversas.",
    allowedInterpretations: ["span visuoespacial observado"],
    limitations: ["El rendimiento puede depender de interacción táctil y tamaño de pantalla."],
  },
  "NF-E09": {
    id: "NF-E09", name: "Aprendizaje verbal", version: "2.0",
    primaryDomain: "memoria_verbal", secondaryDomains: ["lenguaje","atencion"],
    processes: ["codificacion","adquisicion","curva_aprendizaje","interferencia","evocacion_diferida","reconocimiento"],
    conceptualReferences: ["RAVLT/CVLT / aprendizaje de listas"],
    variables: ["correct","omissions","intrusions","perseverations","falseAlarms","blockPerformance","retentionRate"],
    estimatedMinutes: 7,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["word_recall"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Crear listas originales NeuroFlex; conservar ensayos y demora dentro del flujo.",
    allowedInterpretations: ["curva de aprendizaje observada","retención y reconocimiento observados"],
    limitations: ["No usar listas, criterios de puntuación ni baremos RAVLT/CVLT."],
  },
  "NF-E10": {
    id: "NF-E10", name: "Memoria visual", version: "3.0",
    primaryDomain: "memoria_visual", secondaryDomains: ["visuoespacial","gnosias"],
    processes: ["codificacion","organizacion","evocacion","reconocimiento","retencion_diferida"],
    conceptualReferences: ["Figura Compleja / paradigmas de aprendizaje visual"],
    variables: ["precision","errors","selfCorrections","retentionRate"],
    estimatedMinutes: 6,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["pe_patron","visual_matching"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Composiciones geométricas vectoriales originales; orden de reconocimiento fijo y tarea intermedia registrada sin incorporarse a la puntuación de memoria.",
    allowedInterpretations: ["codificación y recuperación visual observadas"],
    limitations: ["No reproducir figuras protegidas ni inferir capacidad motora a partir del dispositivo."],
  },
  "NF-E11": {
    id: "NF-E11", name: "Acuérdate después", version: "2.0",
    primaryDomain: "memoria_prospectiva", secondaryDomains: ["atencion","planificacion"],
    processes: ["intencion_futura","basada_eventos","doble_demanda"],
    conceptualReferences: ["Paradigmas de memoria prospectiva"],
    variables: ["spontaneousRecall","cuedRecall","latencyMs","errors"],
    estimatedMinutes: 1,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: [],
    implementationStatus: "new_task",
    scoringNote: "Insertar una intención al inicio y comprobarla después de tareas intermedias con una señal visual neutral, diferenciando recuperación espontánea y recuperación tras clave.",
    allowedInterpretations: ["recuerdo prospectivo espontáneo o tras señal"],
    limitations: ["Necesita integrarse longitudinalmente dentro de la batería."],
  },
  "NF-E12": {
    id: "NF-E12", name: "¿Qué es?", version: "2.0",
    primaryDomain: "lenguaje", secondaryDomains: ["gnosias"],
    processes: ["denominacion","acceso_lexico"],
    conceptualReferences: ["Boston Naming / paradigmas de denominación"],
    variables: ["precision","errors","latencyMs","selfCorrections"],
    estimatedMinutes: 3,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["naming"],
    implementationStatus: "reuse_candidate",
    scoringNote: "Usar dibujos vectoriales originales NeuroFlex con apariencia estable entre dispositivos y registrar latencia cuando sea fiable.",
    allowedInterpretations: ["acceso léxico y denominación observados"],
    limitations: ["No usar imágenes ni puntuaciones de pruebas de denominación comerciales; la claridad y familiaridad de los dibujos requiere validación empírica."],
  },
  "NF-E13": {
    id: "NF-E13", name: "Relaciones de significado", version: "2.0",
    primaryDomain: "lenguaje", secondaryDomains: ["razonamiento"],
    processes: ["procesamiento_semantico","relaciones_conceptuales","analogico"],
    conceptualReferences: ["Paradigmas semánticos","WAIS Semejanzas/Analogías, referencia conceptual"],
    variables: ["precision","errors","latencyMs"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["analogias_verbales","verbal_comprehension"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Crear relaciones, categorías y analogías originales.",
    allowedInterpretations: ["relaciones semánticas y conceptuales observadas"],
    limitations: ["No copiar reactivos WAIS."],
  },
  "NF-E14": {
    id: "NF-E14", name: "Fluidez", version: "2.0",
    primaryDomain: "lenguaje", secondaryDomains: ["funciones_exec"],
    processes: ["fluidez_verbal","acceso_lexico","estrategia"],
    conceptualReferences: ["Tareas de fluidez semántica/fonológica"],
    variables: ["correct","perseverations","intrusions","blockPerformance"],
    estimatedMinutes: 3,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["verbal_fluency"],
    implementationStatus: "reuse_candidate",
    scoringNote: "Ventanas fijas de 60 segundos por condición. Preferir respuesta oral o registro profesional cuando escritura/tecnología pueda sesgar.",
    allowedInterpretations: ["fluidez y estrategia de búsqueda verbal observadas"],
    limitations: ["La modalidad de respuesta debe registrarse; la escritura puede limitar la producción y requiere interpretación profesional."],
  },
  "NF-E15": {
    id: "NF-E15", name: "Completa el patrón", version: "2.0",
    primaryDomain: "razonamiento", secondaryDomains: ["visuoespacial"],
    processes: ["abstracto","inductivo","identificacion_reglas"],
    conceptualReferences: ["Razonamiento matricial / matrices, referencia conceptual"],
    variables: ["precision","errors","latencyMs"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["pe_patron","ra_series"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Todos los estímulos serán originales NeuroFlex.",
    allowedInterpretations: ["identificación de reglas y razonamiento fluido observado"],
    limitations: ["No copiar matrices ni reactivos WAIS u otras baterías."],
  },
  "NF-E16": {
    id: "NF-E16", name: "¿Qué tienen en común?", version: "2.0",
    primaryDomain: "razonamiento", secondaryDomains: ["lenguaje"],
    processes: ["abstracto","categorizacion","formacion_conceptos"],
    conceptualReferences: ["WAIS Semejanzas / formación de conceptos, referencia conceptual"],
    variables: ["precision","errors","latencyMs"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["analogias_verbales","ra_discordante"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Usar conceptos y criterios originales.",
    allowedInterpretations: ["abstracción verbal observada"],
    limitations: ["No copiar reactivos WAIS."],
  },
  "NF-E17": {
    id: "NF-E17", name: "Regla lógica", version: "2.0",
    primaryDomain: "razonamiento", secondaryDomains: ["memoria_trabajo"],
    processes: ["logico","inductivo","deductivo","cuantitativo"],
    conceptualReferences: ["Paradigmas de razonamiento lógico"],
    variables: ["precision","errors","latencyMs"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["ra_series","ra_verdadero_falso","calc_faltante"],
    implementationStatus: "reuse_candidate",
    scoringNote: "Problemas breves originales y separados por tipo de razonamiento.",
    allowedInterpretations: ["razonamiento lógico observado"],
    limitations: ["Una sola tarea no determina capacidad razonadora global."],
  },
  "NF-E18": {
    id: "NF-E18", name: "Planifica la ruta", version: "1.0",
    primaryDomain: "planificacion", secondaryDomains: ["flexibilidad","memoria_trabajo"],
    processes: ["anticipacion","planificacion","estrategia","monitorizacion","correccion"],
    conceptualReferences: ["Torre de Londres","BANFE / paradigmas de planificación, referencia conceptual"],
    variables: ["latencyMs","attempts","errors","selfCorrections","levelReached"],
    estimatedMinutes: 5,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: [],
    implementationStatus: "new_task",
    scoringNote: "Mecánica original; registrar latencia inicial, movimientos y correcciones.",
    allowedInterpretations: ["planificación y eficiencia estratégica observadas"],
    limitations: ["No equivale a Torre de Londres ni BANFE."],
  },
  "NF-E19": {
    id: "NF-E19", name: "Orden correcto", version: "1.0",
    primaryDomain: "planificacion", secondaryDomains: ["praxias","memoria_trabajo"],
    processes: ["secuenciacion","organizacion","ideatoria"],
    conceptualReferences: ["Secuenciación funcional / praxia ideatoria"],
    variables: ["precision","sequenceErrors","selfCorrections","latencyMs"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: [],
    implementationStatus: "new_task",
    scoringNote: "Secuencias cotidianas originales NeuroFlex.",
    allowedInterpretations: ["organización secuencial funcional observada"],
    limitations: ["No inferir apraxia a partir de una tarea digital aislada."],
  },
  "NF-E20": {
    id: "NF-E20", name: "Gira mentalmente", version: "2.0",
    primaryDomain: "visuoespacial", secondaryDomains: ["gnosias"],
    processes: ["rotacion_mental","relaciones_espaciales","comparacion_espacial"],
    conceptualReferences: ["Paradigmas de rotación mental"],
    variables: ["precision","errors","meanResponseMs"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["pe_rotacion"],
    implementationStatus: "reuse_candidate",
    scoringNote: "Estímulos geométricos originales dibujados por NeuroFlex mediante una retícula visual; no dependen de caracteres Unicode.",
    allowedInterpretations: ["rotación y comparación espacial observadas"],
    limitations: ["Considerar agudeza visual, tamaño de pantalla y familiaridad con la interfaz."],
  },
  "NF-E21": {
    id: "NF-E21", name: "Construye", version: "1.0",
    primaryDomain: "visuoespacial", secondaryDomains: ["planificacion","praxias"],
    processes: ["construccion","organizacion_espacial","analisis_configuraciones"],
    conceptualReferences: ["Paradigmas visuoconstructivos / cubos, referencia conceptual"],
    variables: ["precision","errors","attempts","latencyMs","selfCorrections"],
    estimatedMinutes: 5,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["pe_patron"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Piezas y configuraciones digitales originales.",
    allowedInterpretations: ["organización visuoconstructiva observada"],
    limitations: ["La interacción táctil no equivale a construcción manipulativa física."],
  },
  "NF-E22": {
    id: "NF-E22", name: "Figura incompleta", version: "2.0",
    primaryDomain: "gnosias", secondaryDomains: ["visuoespacial"],
    processes: ["cierre_visual","reconocimiento_visual"],
    conceptualReferences: ["Paradigmas de cierre visual / reconocimiento perceptual"],
    variables: ["precision","errors","latencyMs"],
    estimatedMinutes: 3,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["visual_matching"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Figuras vectoriales propias con segmentos omitidos y grados controlados de información parcial; no dependen de fuentes del dispositivo.",
    allowedInterpretations: ["cierre y reconocimiento visual observados"],
    limitations: ["No diagnostica agnosia; el rendimiento puede depender de agudeza visual y tamaño de pantalla."],
  },
  "NF-E23": {
    id: "NF-E23", name: "Figura y fondo", version: "2.0",
    primaryDomain: "gnosias", secondaryDomains: ["atencion","velocidad_proc"],
    processes: ["figura_fondo","discriminacion_visual","selectiva"],
    conceptualReferences: ["Figura-fondo / búsqueda visual"],
    variables: ["correct","omissions","commissions","meanResponseMs"],
    estimatedMinutes: 3,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["find_animal","pe_contar"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Escenas gráficas originales construidas por NeuroFlex con formas vectoriales simples y control de densidad visual.",
    allowedInterpretations: ["segregación figura-fondo observada"],
    limitations: ["El desempeño depende también de exploración visual, atención, agudeza visual y tamaño de pantalla."],
  },
  "NF-E24": {
    id: "NF-E24", name: "Organiza tu día", version: "2.0",
    primaryDomain: "cognicion_funcional", secondaryDomains: ["planificacion","memoria_trabajo","razonamiento"],
    processes: ["manejo_temporal","planificacion_cotidiana","resolucion_problemas"],
    conceptualReferences: ["Paradigmas de cognición funcional / planificación cotidiana"],
    variables: ["precision","sequenceErrors","attempts","selfCorrections","latencyMs"],
    estimatedMinutes: 5,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: [],
    implementationStatus: "new_task",
    scoringNote: "Agenda original con restricciones explícitas. Cada escenario registra la primera respuesta sin retroalimentación correctiva durante la evaluación.",
    allowedInterpretations: ["organización funcional dentro de la tarea"],
    limitations: ["No demuestra por sí sola desempeño real en actividades de la vida diaria."],
  },
  "NF-E25": {
    id: "NF-E25", name: "Compra inteligente", version: "2.0",
    primaryDomain: "cognicion_funcional", secondaryDomains: ["razonamiento","atencion","planificacion"],
    processes: ["calculo_funcional","planificacion_cotidiana","resolucion_problemas"],
    conceptualReferences: ["Paradigmas de cognición funcional / manejo de compras"],
    variables: ["precision","errors","attempts","latencyMs"],
    estimatedMinutes: 5,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["calc_operaciones","calc_faltante"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Precios, productos y restricciones originales. Posiciones de respuesta balanceadas para reducir sesgo de ubicación.",
    allowedInterpretations: ["manejo funcional de información numérica dentro de la tarea"],
    limitations: ["Los precios son ficticios y la tarea no equivale a independencia financiera cotidiana."],
  },
  "NF-E26": {
    id: "NF-E26", name: "Sigue las instrucciones", version: "2.0",
    primaryDomain: "cognicion_funcional", secondaryDomains: ["lenguaje","memoria_trabajo","atencion"],
    processes: ["seguimiento_instrucciones","secuenciacion","comprension","mantenimiento"],
    conceptualReferences: ["Paradigmas de seguimiento de instrucciones multietapa"],
    variables: ["precision","sequenceErrors","omissions","selfCorrections","latencyMs"],
    estimatedMinutes: 4,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: ["verbal_comprehension","letter_number"],
    implementationStatus: "adapt_candidate",
    scoringNote: "Instrucciones originales con dificultad gradual. La secuencia puede revisarse antes de confirmar y se registran omisiones, errores de orden y autocorrecciones observables.",
    allowedInterpretations: ["comprensión y ejecución secuencial observadas"],
    limitations: ["Debe separar fallos de comprensión de fallos tecnológicos cuando sea posible."],
  },
  "NF-E27": {
    id: "NF-E27", name: "Recuerda el pendiente", version: "2.0",
    primaryDomain: "cognicion_funcional", secondaryDomains: ["memoria_prospectiva","atencion","planificacion"],
    processes: ["intencion_futura","doble_tarea_funcional","basada_eventos"],
    conceptualReferences: ["Memoria prospectiva en contexto funcional"],
    variables: ["spontaneousRecall","cuedRecall","latencyMs","errors"],
    estimatedMinutes: 1,
    modes: ["adulto","adulto_mayor","rehabilitacion"],
    reuseExerciseIds: [],
    implementationStatus: "new_task",
    scoringNote: "Intención futura integrada dentro de otra actividad funcional. La señal no incluye un botón textual que revele la respuesta y la recuperación con clave verifica el contenido de la intención.",
    allowedInterpretations: ["memoria prospectiva funcional observada en la batería"],
    limitations: ["No demuestra automáticamente ejecución equivalente en la vida diaria; la señal visual sigue ofreciendo una oportunidad de respuesta dentro de la interfaz."],
  },
};

function getAssessmentTaskDefinition(taskId) {
  return ASSESSMENT_TASKS_V2[taskId] || null;
}

function getAssessmentDomainDefinition(domainId) {
  return ASSESSMENT_DOMAINS_V2[domainId] || null;
}

function getAssessmentTasksForDomain(domainId) {
  return Object.values(ASSESSMENT_TASKS_V2).filter(task =>
    task.primaryDomain === domainId || (task.secondaryDomains || []).includes(domainId)
  );
}

function getAssessmentReuseCandidates(taskId) {
  const task = getAssessmentTaskDefinition(taskId);
  if (!task) return [];
  return (task.reuseExerciseIds || [])
    .map(exId => {
      for (const [domId, exercises] of Object.entries(EX_ADULTO || {})) {
        const ex = (exercises || []).find(item => item.id === exId);
        if (ex) return { domId, exId, exercise: ex };
      }
      return null;
    })
    .filter(Boolean);
}

function getAssessmentArchitectureSummary() {
  const tasks = Object.values(ASSESSMENT_TASKS_V2);
  return {
    assessmentVersion: NEUROFLEX_ASSESSMENT_VERSION,
    schemaVersion: NEUROFLEX_ASSESSMENT_SCHEMA_VERSION,
    domains: Object.keys(ASSESSMENT_DOMAINS_V2).length,
    tasks: tasks.length,
    reuseCandidates: tasks.filter(t => t.implementationStatus === "reuse_candidate").length,
    adaptationCandidates: tasks.filter(t => t.implementationStatus === "adapt_candidate").length,
    newTasks: tasks.filter(t => t.implementationStatus === "new_task").length,
  };
}


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
        const sequenceSpokenRef = useRef(false);
        const speechAvailable = typeof window !== "undefined" && "speechSynthesis" in window;
        const t0 = useRef(Date.now());

        // La instrucción general la reproduce el contenedor de sesión. Cuando termina,
        // esta tarea reproduce la SECUENCIA concreta (p. ej. "A ... 3 ... B ... 1").
        // Si el navegador no dispone de voz, se conserva el apoyo visual como fallback.
        useEffect(() => {
          if (phase !== "show" || sequenceSpokenRef.current) return;

          if (!speechAvailable) {
            timerRef.current = setInterval(() => setTl(t => {
              if (t <= 1) { clearInterval(timerRef.current); setPhase("input"); return 0; }
              return t - 1;
            }), 1000);
            return () => clearInterval(timerRef.current);
          }

          let cancelled = false;
          let pollTimer;
          const waitForInstructionThenSpeak = () => {
            if (cancelled || sequenceSpokenRef.current) return;
            const synth = window.speechSynthesis;
            // speakInstruction inicia con un pequeño retraso; esperamos a que la voz
            // de la consigna termine para no cancelarla ni superponer la secuencia.
            if (synth.speaking || synth.pending) {
              pollTimer = setTimeout(waitForInstructionThenSpeak, 120);
              return;
            }
            sequenceSpokenRef.current = true;
            const utter = new SpeechSynthesisUtterance(item.seq.split(" ").join(" ... "));
            utter.lang = "es-ES";
            utter.rate = M ? 0.72 : 0.82;
            utter.pitch = 1;
            utter.volume = 1;
            utter.onend = () => { if (!cancelled) setPhase("input"); };
            utter.onerror = () => { if (!cancelled) setPhase("input"); };
            synth.speak(utter);
          };
          // Da tiempo a que el contenedor dispare la instrucción automática.
          pollTimer = setTimeout(waitForInstructionThenSpeak, 260);

          return () => {
            cancelled = true;
            clearTimeout(pollTimer);
          };
        }, [phase, speechAvailable, item.seq, M]);
        const check = () => {
          const ok = input.trim().toUpperCase() === item.correct.toUpperCase();
          onDone({ correct: ok ? 1 : 0, total: 1, errors: ok ? 0 : 1, seconds: Math.round((Date.now() - t0.current) / 1000) });
        };
        if (phase === "show") return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            {speechAvailable ? (
              <>
                <div aria-hidden="true" style={{width:M?72:60,height:M?72:60,margin:"0 auto 14px",borderRadius:"50%",background:COLORS.primary+"12",border:`2px solid ${COLORS.primary}35`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width={M?34:28} height={M?34:28} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 9v6h4l5 4V5L9 9H5Z" stroke={COLORS.primary} strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M17 9.5c.8.7 1.2 1.5 1.2 2.5s-.4 1.8-1.2 2.5M19 7.5c1.3 1.2 2 2.7 2 4.5s-.7 3.3-2 4.5" stroke={COLORS.primary} strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <p style={{fontWeight:750,marginBottom:6}}>Escucha con atención</p>
                <p style={{ color: COLORS.textMuted, margin:0, fontSize: M ? "1rem" : ".85rem" }}>La secuencia se reproducirá una sola vez.</p>
              </>
            ) : (
              <>
                <p style={{ color: COLORS.textMuted, marginBottom: 16, fontSize: M ? "1rem" : ".85rem" }}>Memoriza · {tl}s</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  {item.seq.split(" ").map((c, i) => <div key={i} style={{ width: M ? 64 : 52, height: M ? 64 : 52, borderRadius: M ? 16 : 12, background: COLORS.primary + "22", border: `2px solid ${COLORS.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 800, color: COLORS.primary }}>{c}</div>)}
                </div>
                <p style={{color:COLORS.textMuted,fontSize:".75rem",marginTop:12}}>Apoyo visual porque la voz no está disponible en este navegador.</p>
              </>
            )}
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
        const [ops] = useState(() => shuffle([
          { op: "3 + 4", ans: 7 }, { op: "8 - 3", ans: 5 }, { op: "6 × 2", ans: 12 },
          { op: "15 - 7", ans: 8 }, { op: "4 + 9", ans: 13 }, { op: "20 ÷ 4", ans: 5 },
        ]).slice(0, 4));
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
        const [WORDS] = useState(() => shuffle(["MANZANA", "CAMISA", "RÍO", "SILLA", "PERRO", "LIBRO", "MESA", "FLOR", "LLAVE", "NUBE", "PAN", "ZAPATO"]).slice(0, wordCount));
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
              {WORDS.map((w, i) => <div key={i} style={{ padding: M ? "10px 20px" : "8px 16px", background: COLORS.primary + "15", border: `1.5px solid ${COLORS.primary}30`, borderRadius: 20, fontWeight: 600, position: "static", transform: "none", animation: "none", fontSize: M ? "1.05rem" : ".9rem", color: COLORS.primary }}>{w}</div>)}
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
        const taskStart = useRef(Date.now());
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
          setTimeout(() => onDone({ correct: tapped.size, total: totalTargets, errors: wrong.size, seconds: Math.round((Date.now() - taskStart.current) / 1000) }), 500);
        };

        const tap = (i) => {
          if (done) return;
          if (grid[i] === TARGET) {
            const n = new Set([...tapped, i]);
            setTapped(n);
            if (n.size === totalTargets) { clearInterval(timerRef.current); setDone(true); setTimeout(() => onDone({ correct: n.size, total: totalTargets, errors: wrong.size, seconds: Math.round((Date.now() - taskStart.current) / 1000) }), 400); }
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
        const taskStart = useRef(Date.now());
        const tap = (i) => {
          if (isTarget(grid[i])) {
            const n = new Set([...tapped, i]);
            setTapped(n);
            if (n.size === totalTargets) setTimeout(() => onDone({ correct: n.size, total: totalTargets, errors: wrong.size, seconds: Math.round((Date.now() - taskStart.current) / 1000) }), 400);
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
            <BtnSecondary onClick={() => onDone({ correct: tapped.size, total: totalTargets, errors: wrong.size, seconds: Math.round((Date.now() - taskStart.current) / 1000) })} style={{ width: "100%", fontSize: ".85rem" }}>Terminar</BtnSecondary>
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
        const taskStart = useRef(Date.now());
        const tap = (cell) => {
          if (tapped.has(cell.id) || wrong.has(cell.id)) return;
          if (cell.isTarget) {
            const n = new Set([...tapped, cell.id]);
            setTapped(n);
            if (n.size === totalTargets) setTimeout(() => onDone({ correct: n.size, total: totalTargets, errors: wrong.size, seconds: Math.round((Date.now() - taskStart.current) / 1000) }), 500);
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
            <BtnSecondary onClick={() => onDone({ correct: tapped.size, total: totalTargets, errors: wrong.size, seconds: Math.round((Date.now() - taskStart.current) / 1000) })}
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
              // La finalización correcta de la secuencia se registra por pasos completados.
              // El tiempo y los errores quedan como métricas separadas; no se usan cortes arbitrarios.
              onDone({
                correct: sequence.length,
                total: sequence.length,
                errors,
                seconds: secs,
                sequenceLength: sequence.length,
                completion: true
              });
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
        const taskStart = useRef(Date.now());
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
              seconds: Math.round((Date.now() - taskStart.current) / 1000)
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
        const [ITEMS] = useState(() => shuffle(pool).slice(0, count));
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
        const M = modoMayor || false;
        const L = clampAdaptiveLevel(difficultyLevel);
        const EASY = [
          { enunciado: "El médico cura enfermos, el maestro ___", opts: ["cocina","enseña","construye","maneja"], ans: "enseña" },
          { enunciado: "El pájaro tiene alas, el pez tiene ___", opts: ["patas","escamas","aletas","plumas"], ans: "aletas" },
          { enunciado: "El día tiene sol, la noche tiene ___", opts: ["lluvia","luna","viento","nubes"], ans: "luna" },
          { enunciado: "El zapato va en el pie, el guante va en la ___", opts: ["cabeza","mano","rodilla","espalda"], ans: "mano" },
          { enunciado: "La abeja produce miel, la vaca produce ___", opts: ["lana","leche","huevos","carne"], ans: "leche" },
        ];
        const HARD = [
          { enunciado: "El libro tiene páginas, el cuaderno tiene ___", opts: ["capítulos","hojas","tapas","índice"], ans: "hojas" },
          { enunciado: "Brújula es a dirección como termómetro es a ___", opts: ["distancia","temperatura","peso","velocidad"], ans: "temperatura" },
          { enunciado: "Semilla es a planta como huevo es a ___", opts: ["nido","ave","pluma","árbol"], ans: "ave" },
        ];
        const count = [0, 3, 4, 5, 6, 7][L];
        const pool = L <= 2 ? EASY : L === 3 ? [...EASY, ...HARD.slice(0,1)] : [...EASY, ...HARD];
        const [ITEMS] = useState(() => shuffle(pool).slice(0, Math.min(count, pool.length)));
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
        const EASY = [
          { oracion: "El sol sale por el ___.", ans: "este", opts: ["norte", "sur", "este", "oeste"] },
          { oracion: "El hijo de mi hermana es mi ___.", ans: "sobrino", opts: ["primo", "sobrino", "nieto", "cuñado"] },
          { oracion: "El agua hierve a ___ grados centígrados.", ans: "100", opts: ["50", "75", "100", "120"] },
          { oracion: "El corazón ___ unas 70 veces por minuto.", ans: "late", opts: ["salta", "late", "bombea", "corre"] },
          { oracion: "Los peces respiran con ___.", ans: "branquias", opts: ["pulmones", "branquias", "escamas", "aletas"] },
        ];
        const HARD = [
          { oracion: "Cuando el río suena, piedras ___.", ans: "lleva", opts: ["trae", "lleva", "mueve", "rompe"] },
          { oracion: "Una persona prudente suele actuar con ___.", ans: "cautela", opts: ["prisa", "cautela", "enojo", "azar"] },
          { oracion: "Si una explicación es ambigua, puede resultar ___.", ans: "confusa", opts: ["exacta", "confusa", "breve", "visible"] },
        ];
        const count = [0, 3, 4, 5, 6, 7][L];
        const pool = L <= 2 ? EASY : L === 3 ? [...EASY, ...HARD.slice(0,1)] : [...EASY, ...HARD];
        const [ITEMS] = useState(() => shuffle(pool).slice(0, Math.min(count, pool.length)));
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
        const [PARES] = useState(() => shuffle([
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
        ]).slice(0, 8));
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
          return { target, items: shuffle(items), count, opts: shuffle([count, count + 1, Math.max(1, count - 1), count + 2]).slice(0, 4) };
        }));
        const [cur, setCur] = useState(0);
        const [score, setScore] = useState(0);
        const [sel, setSel] = useState(null);
        const [feedback, setFeedback] = useState(null);
        const t0 = useRef(Date.now());
        const d = data[cur];
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
                {d.opts.map((n, i) => (
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
        const [PATRONES] = useState(() => shuffle([
          { seq: ["🔴","🔵","🔴","🔵","🔴"], ans: "🔵", opts: ["🔵","🟡","🟢","🔴"] },
          { seq: ["⭐","⭐","🌙","⭐","⭐"], ans: "🌙", opts: ["🌙","⭐","☀️","🌟"] },
          { seq: ["🐕","🐈","🐕","🐈","🐕"], ans: "🐈", opts: ["🐕","🐈","🐦","🐇"] },
          { seq: ["🟥","🟦","🟩","🟥","🟦"], ans: "🟩", opts: ["🟥","🟦","🟩","🟨"] },
          { seq: ["1️⃣","2️⃣","3️⃣","1️⃣","2️⃣"], ans: "3️⃣", opts: ["1️⃣","2️⃣","3️⃣","4️⃣"] },
          { seq: ["🌞","🌙","🌞","🌙","🌞"], ans: "🌙", opts: ["🌞","🌙","⭐","☁️"] },
          { seq: ["🍎","🍊","🍋","🍎","🍊"], ans: "🍋", opts: ["🍎","🍊","🍋","🍇"] },
        ]).slice(0, 6));
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
        const [SERIES] = useState(() => shuffle(pool).slice(0, [0, 4, 5, 6, 7, 8][L]).map(item => ({ ...item, opts: shuffle(item.opts) })));
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
              {s.opts.map((opt, i) => (
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
        const [GRUPOS] = useState(() => shuffle(pool).slice(0, count));
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
        const [ITEMS] = useState(() => shuffle(pool).slice(0, count));
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
        const [ITEMS] = useState(() => shuffle(pool).slice(0, [0, 4, 5, 6, 7, 8][L]));
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
        const [PARES] = useState(() => shuffle(pool).slice(0, count));
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
        const [ITEMS] = useState(() => shuffle([
          { contexto: "Al salir de casa, Laura vio la calle mojada y a varias personas cerrando sus paraguas.", pregunta: "¿Qué es razonable inferir?", opts: ["Había llovido recientemente","Lavaron todas las calles","Era de noche","Había mucho viento"], ans: "Había llovido recientemente" },
          { contexto: "Carlos suele llegar diez minutos antes. Hoy la reunión comenzó hace quince minutos y todavía no ha llegado.", pregunta: "¿Qué es razonable inferir?", opts: ["Pudo ocurrirle un imprevisto","Nunca quiso asistir","La reunión fue cancelada","Olvidó para siempre la reunión"], ans: "Pudo ocurrirle un imprevisto" },
          { contexto: "El médico revisó los exámenes de Marta y le indicó que, según esos resultados, podía continuar con su plan actual de alimentación.", pregunta: "¿Qué podemos concluir del texto?", opts: ["El médico no indicó cambiar el plan actual","Marta no necesita controles futuros","La dieta cura cualquier enfermedad","Los exámenes nunca cambian"], ans: "El médico no indicó cambiar el plan actual" },
          { contexto: "Ana ahorró durante dos años para comprar un carro. Esta semana firmó los documentos de compra y recibió las llaves.", pregunta: "¿Qué podemos inferir con mayor seguridad?", opts: ["Ana adquirió un carro","Ana pidió un préstamo","El carro fue un regalo","Ana vendió su vivienda"], ans: "Ana adquirió un carro" },
          { contexto: "Pedro entró a la cocina con las manos llenas de harina y colocó una bandeja de masa junto al horno.", pregunta: "¿Qué actividad probablemente estaba realizando?", opts: ["Estaba preparando algo para hornear","Estaba reparando una bicicleta","Estaba regando plantas","Estaba pintando una pared"], ans: "Estaba preparando algo para hornear" },
        ]).slice(0, 4));
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
        const [TEXTOS] = useState(() => shuffle([
          { titulo: "El ejercicio y el cerebro", texto: "Estudios recientes demuestran que el ejercicio fisico regular beneficia al cerebro. Al caminar 30 minutos al dia, el hipocampo puede aumentar su volumen hasta en un 2%. Ademas, el ejercicio libera BDNF, una proteina que favorece nuevas conexiones neuronales. Los expertos recomiendan al menos 150 minutos de actividad moderada a la semana.", preguntas: [{ p: "Que region del cerebro se beneficia especialmente?", opts: ["El cerebelo","El hipocampo","El lobulo frontal","El bulbo raquideo"], ans: "El hipocampo" },{ p: "Cuantos minutos semanales recomiendan?", opts: ["30 minutos","60 minutos","120 minutos","150 minutos"], ans: "150 minutos" }] },
          { titulo: "La importancia del sueno", texto: "Durante el sueno el cerebro realiza procesos fundamentales. En la fase de sueno profundo se consolidan los recuerdos y se eliminan toxinas. La falta de sueno cronica se asocia con deterioro cognitivo. Los adultos necesitan entre 7 y 9 horas por noche.", preguntas: [{ p: "Cuantas horas de sueno necesitan los adultos?", opts: ["5-6 horas","6-7 horas","7-9 horas","9-11 horas"], ans: "7-9 horas" },{ p: "Que ocurre durante el sueno profundo?", opts: ["Se producen suenos vividos","Se consolidan recuerdos y eliminan toxinas","El cerebro descansa por completo","Aumenta la presion arterial"], ans: "Se consolidan recuerdos y eliminan toxinas" }] },
        ]).slice(0, 1));
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


// ─── FASE 26 · REEVALUACIÓN, HISTORIAL Y LÍNEA BASE ───────────────────────────
// Compatibilidad: paciente.eval sigue siendo la evaluación de referencia actual.
// evaluationHistory conserva las evaluaciones previas y activeEvaluationId indica
// cuál es la línea base vigente. Una evaluación inválida nunca puede ser línea base.
const NEUROFLEX_EVALUATION_VERSION = 2;

function makeEvaluationId(dateValue = null) {
  const stamp = dateValue ? new Date(dateValue).getTime() : Date.now();
  const safeStamp = Number.isFinite(stamp) ? stamp : Date.now();
  return `eval_${safeStamp}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEvaluationRecord(evalData, defaults = {}) {
  if (!evalData) return null;
  const date = evalData.date || defaults.date || new Date().toISOString();
  return {
    ...evalData,
    evaluationId: evalData.evaluationId || defaults.evaluationId || makeEvaluationId(date),
    date,
    validityStatus: evalData.validityStatus || defaults.validityStatus || "valid",
    validityReason: evalData.validityReason ?? defaults.validityReason ?? "",
    evaluationVersion: evalData.evaluationVersion || defaults.evaluationVersion || 1,
    assessmentVersion: evalData.assessmentVersion || defaults.assessmentVersion || null,
    assessmentSchemaVersion: evalData.assessmentSchemaVersion || defaults.assessmentSchemaVersion || null,
    recordedAt: evalData.recordedAt || defaults.recordedAt || date,
  };
}

function getEvaluationHistory(paciente) {
  const raw = Array.isArray(paciente?.evaluationHistory) ? paciente.evaluationHistory : [];
  const normalized = raw.map(r => normalizeEvaluationRecord(r)).filter(Boolean);
  const current = paciente?.eval ? normalizeEvaluationRecord(paciente.eval) : null;

  if (current && !normalized.some(r => r.evaluationId === current.evaluationId)) {
    normalized.push(current);
  }

  // También evita duplicar evaluaciones antiguas que aún no tenían evaluationId.
  const unique = [];
  normalized.forEach(r => {
    const same = unique.find(x =>
      x.evaluationId === r.evaluationId ||
      (x.date === r.date && x.globalPct === r.globalPct && JSON.stringify(x.hist || []) === JSON.stringify(r.hist || []))
    );
    if (!same) unique.push(r);
  });

  return unique.sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0));
}

function getActiveEvaluation(paciente) {
  if (!paciente?.eval) return null;
  const current = normalizeEvaluationRecord(paciente.eval);
  if (current.validityStatus === "invalid") return null;
  return current;
}

function isEvaluationValid(record) {
  return !!record && record.validityStatus !== "invalid";
}

function EvaluationHistoryManager({ paciente, onUpdate, onRepeat }) {
  const [busyId, setBusyId] = useState(null);
  const history = getEvaluationHistory(paciente);
  const active = getActiveEvaluation(paciente);
  const activeId = paciente?.activeEvaluationId || active?.evaluationId || null;

  const persist = async ({ nextHistory, nextEval, nextActiveId }) => {
    await updateDoc(doc(firestore, "pacientes", paciente.id), {
      evaluationHistory: nextHistory,
      eval: nextEval || null,
      activeEvaluationId: nextActiveId || null,
    });
    onUpdate?.({
      ...paciente,
      evaluationHistory: nextHistory,
      eval: nextEval || null,
      activeEvaluationId: nextActiveId || null,
    });
  };

  const markInvalid = async (record) => {
    const reason = window.prompt(
      "Motivo por el que esta evaluación no debe utilizarse como línea base:",
      "Incidencias técnicas durante la aplicación"
    );
    if (reason === null) return;

    const ok = window.confirm(
      "La evaluación se conservará en el historial, pero dejará de utilizarse como línea base, perfil cognitivo y planificación. ¿Continuar?"
    );
    if (!ok) return;

    try {
      setBusyId(record.evaluationId);
      const baseHistory = getEvaluationHistory(paciente);
      const nextHistory = baseHistory.map(r =>
        r.evaluationId === record.evaluationId
          ? { ...r, validityStatus: "invalid", validityReason: reason.trim() || "Sin motivo especificado" }
          : r
      );

      const wasActive = record.evaluationId === activeId;
      await persist({
        nextHistory,
        nextEval: wasActive ? null : paciente.eval,
        nextActiveId: wasActive ? null : activeId,
      });
    } catch (e) {
      console.error("Error invalidando evaluación:", e);
      alert("No se pudo actualizar la evaluación. Intenta nuevamente.");
    } finally {
      setBusyId(null);
    }
  };

  const markValid = async (record) => {
    try {
      setBusyId(record.evaluationId);
      const nextHistory = getEvaluationHistory(paciente).map(r =>
        r.evaluationId === record.evaluationId
          ? { ...r, validityStatus: "valid", validityReason: "" }
          : r
      );
      await persist({
        nextHistory,
        nextEval: paciente.eval,
        nextActiveId: activeId,
      });
    } catch (e) {
      console.error("Error restaurando validez:", e);
      alert("No se pudo actualizar la evaluación. Intenta nuevamente.");
    } finally {
      setBusyId(null);
    }
  };

  const useAsBaseline = async (record) => {
    if (record?.assessmentMode === "selective_reassessment") {
      alert("Una reevaluación selectiva se conserva como comparación de seguimiento y no puede sustituir por sí sola la línea base completa.");
      return;
    }
    if (!isEvaluationValid(record)) {
      alert("Una evaluación marcada como no válida no puede utilizarse como línea base.");
      return;
    }
    const ok = window.confirm(
      "Esta evaluación pasará a ser la línea base vigente para perfil cognitivo, planificación y comparación de evolución. ¿Continuar?"
    );
    if (!ok) return;

    try {
      setBusyId(record.evaluationId);
      const nextHistory = getEvaluationHistory(paciente);
      const nextEval = normalizeEvaluationRecord(record, { validityStatus: "valid" });
      await persist({
        nextHistory,
        nextEval,
        nextActiveId: nextEval.evaluationId,
      });
    } catch (e) {
      console.error("Error cambiando línea base:", e);
      alert("No se pudo cambiar la línea base. Intenta nuevamente.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card style={{ marginTop: 18 }}>
      <div style={{ display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap",marginBottom:14 }}>
        <div style={{ flex:1,minWidth:240 }}>
          <h3 style={{ margin:"0 0 4px",fontSize:".95rem" }}>🗂️ Historial de evaluaciones</h3>
          <p style={{ margin:0,color:COLORS.textMuted,fontSize:".73rem",lineHeight:1.5 }}>
            Las evaluaciones anteriores se conservan. Solo la evaluación marcada como línea base vigente alimenta el perfil cognitivo, el plan y la comparación de evolución.
          </p>
        </div>
        <BtnPrimary onClick={onRepeat} style={{ whiteSpace:"nowrap" }}>
          🔄 Repetir evaluación
        </BtnPrimary>
      </div>

      {!history.length ? (
        <p style={{ color:COLORS.textMuted,fontSize:".76rem",margin:0 }}>Aún no hay evaluaciones registradas.</p>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:9 }}>
          {[...history].reverse().map((record,index) => {
            const invalid = record.validityStatus === "invalid";
            const isActive = record.evaluationId === activeId && !invalid;
            return (
              <div key={record.evaluationId} style={{
                padding:12,borderRadius:11,
                border:`1.5px solid ${isActive ? COLORS.success : invalid ? COLORS.error+"55" : COLORS.border}`,
                background:isActive ? COLORS.success+"06" : invalid ? COLORS.error+"04" : COLORS.white
              }}>
                <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontWeight:800,fontSize:".8rem" }}>
                      {record.assessmentMode === "selective_reassessment" ? "Reevaluación selectiva" : `Evaluación ${history.length - index}`}
                      {isActive && <span style={{ marginLeft:7,color:COLORS.success }}>· Línea base vigente</span>}
                      {record.assessmentMode === "selective_reassessment" && <span style={{ marginLeft:7,color:COLORS.accent }}>· Seguimiento</span>}
                      {invalid && <span style={{ marginLeft:7,color:COLORS.error }}>· No válida</span>}
                    </div>
                    <div style={{ color:COLORS.textMuted,fontSize:".69rem",marginTop:3 }}>
                      {record.date ? new Date(record.date).toLocaleDateString("es") : "Fecha no registrada"}
                      {" · "}
                      {record.assessmentMode === "selective_reassessment"
                        ? `${record.selectedTaskIds?.length || record.taskResults?.length || 0} tareas reevaluadas`
                        : (record.assessmentVersion === NEUROFLEX_ASSESSMENT_VERSION
                            ? `${record.taskResults?.length || 0} tareas · Evaluation v2`
                            : (typeof record.globalPct === "number" ? `${record.globalPct}% indicador global` : "Valoración profesional"))}
                    </div>
                    {invalid && record.validityReason && (
                      <div style={{ color:COLORS.error,fontSize:".68rem",marginTop:4 }}>
                        Motivo: {record.validityReason}
                      </div>
                    )}
                  </div>

                  <div style={{ display:"flex",gap:7,flexWrap:"wrap" }}>
                    {!invalid && !isActive && record.assessmentMode !== "selective_reassessment" && (
                      <button type="button" disabled={busyId===record.evaluationId} onClick={() => useAsBaseline(record)}
                        style={{ padding:"6px 9px",borderRadius:8,border:`1px solid ${COLORS.primary}`,background:COLORS.white,color:COLORS.primary,fontSize:".68rem",fontWeight:700,cursor:"pointer" }}>
                        Usar como línea base
                      </button>
                    )}
                    {!invalid ? (
                      <button type="button" disabled={busyId===record.evaluationId} onClick={() => markInvalid(record)}
                        style={{ padding:"6px 9px",borderRadius:8,border:`1px solid ${COLORS.error}55`,background:COLORS.white,color:COLORS.error,fontSize:".68rem",fontWeight:700,cursor:"pointer" }}>
                        Marcar no válida
                      </button>
                    ) : (
                      <button type="button" disabled={busyId===record.evaluationId} onClick={() => markValid(record)}
                        style={{ padding:"6px 9px",borderRadius:8,border:`1px solid ${COLORS.success}55`,background:COLORS.white,color:COLORS.success,fontSize:".68rem",fontWeight:700,cursor:"pointer" }}>
                        Restaurar validez
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}



// ─── FASE 34 · NF-E01–NF-E06 · PRIMER BLOQUE EVALUATION v2 ─────────────────
function meanNum(values = []) {
  const xs = values.filter(v => Number.isFinite(v));
  return xs.length ? xs.reduce((a,b) => a + b, 0) / xs.length : null;
}
function medianNum(values = []) {
  const xs = values.filter(v => Number.isFinite(v)).slice().sort((a,b) => a-b);
  if (!xs.length) return null;
  const m = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[m] : (xs[m-1] + xs[m]) / 2;
}
function sdNum(values = []) {
  const xs = values.filter(v => Number.isFinite(v));
  if (xs.length < 2) return null;
  const m = meanNum(xs);
  return Math.sqrt(xs.reduce((s,x) => s + ((x-m)**2), 0) / xs.length);
}
function pctSafe(correct, total) {
  return total > 0 ? Math.round((correct / total) * 100) : null;
}
function nfTaskResult(taskId, metrics, extra = {}) {
  return makeAssessmentTaskResult(taskId, { metrics, ...extra });
}

function NeuroFlexMark({ size = 42 }) {
  return (
    <div aria-hidden="true" style={{width:size,height:size,borderRadius:14,background:`linear-gradient(145deg,${COLORS.primary},${COLORS.accent})`,display:'grid',placeItems:'center',boxShadow:'0 8px 22px rgba(45,78,138,.18)'}}>
      <svg width={Math.round(size*.58)} height={Math.round(size*.58)} viewBox="0 0 24 24" fill="none">
        <path d="M6 16.5V8.2L12 13l6-5v8.3" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="7" r="1.6" fill="white"/><circle cx="12" cy="14" r="1.6" fill="white"/><circle cx="18" cy="7" r="1.6" fill="white"/>
      </svg>
    </div>
  );
}

function NeuroFlexInstructionAudio({ text, autoPlay = true, paciente }) {
  const mayor = esModoMayor(paciente);
  useEffect(()=>{
    if (!autoPlay || !text) return;
    const t=setTimeout(()=>speakInstruction(text),180);
    return ()=>clearTimeout(t);
  },[text,autoPlay]);
  return <button onClick={()=>speakInstruction(text)} style={{display:'inline-flex',alignItems:'center',gap:8,padding:mayor?'11px 15px':'9px 13px',borderRadius:10,border:`1px solid ${COLORS.primary}28`,background:COLORS.primary+'08',color:COLORS.primary,fontWeight:750,fontSize:mayor?'.93rem':'.78rem'}}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M16 9c1.4 1.6 1.4 4.4 0 6M18.5 6.5c3 3 3 8 0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    Escuchar de nuevo
  </button>;
}

function NeuroFlexStepPill({ active, done, children }) {
  return <div style={{padding:'6px 10px',borderRadius:999,fontSize:'.68rem',fontWeight:800,letterSpacing:'.02em',border:`1px solid ${active?COLORS.primary:done?COLORS.accent+'70':COLORS.border}`,background:active?COLORS.primary+'10':done?COLORS.accent+'0D':'#fff',color:active?COLORS.primary:done?COLORS.accent:COLORS.textMuted}}>{children}</div>;
}

function NeuroFlexTaskIntro({ paciente, title, instruction, example, onContinue }) {
  const mayor=esModoMayor(paciente);
  return <div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:22}}><NeuroFlexStepPill active>1 · Instrucción</NeuroFlexStepPill><NeuroFlexStepPill>2 · Práctica</NeuroFlexStepPill><NeuroFlexStepPill>3 · Actividad</NeuroFlexStepPill></div>
    <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:18}}><NeuroFlexMark size={mayor?50:44}/><div><div style={{fontSize:'.68rem',fontWeight:850,letterSpacing:'.08em',color:COLORS.accent,textTransform:'uppercase'}}>NeuroFlex</div><h3 style={{fontSize:mayor?'1.35rem':'1.12rem',margin:'2px 0'}}>Antes de comenzar</h3></div></div>
    <p style={{fontSize:mayor?'1.08rem':'.92rem',lineHeight:1.7,color:COLORS.textPrimary,marginBottom:14}}>{instruction}</p>
    {example && <div style={{border:`1px solid ${COLORS.border}`,background:COLORS.bg,borderRadius:14,padding:16,margin:'16px 0 18px'}}>{example}</div>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><NeuroFlexInstructionAudio text={instruction} paciente={paciente}/><BtnPrimary onClick={onContinue}>Practicar primero</BtnPrimary></div>
  </div>;
}

function NeuroFlexReadyCheck({ paciente, instruction, onBack, onStart }) {
  const mayor=esModoMayor(paciente);
  return <div style={{textAlign:'center',padding:'12px 0'}}>
    <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:22}}><NeuroFlexStepPill done>1 · Instrucción</NeuroFlexStepPill><NeuroFlexStepPill done>2 · Práctica</NeuroFlexStepPill><NeuroFlexStepPill active>3 · Actividad</NeuroFlexStepPill></div>
    <NeuroFlexMark size={mayor?54:48}/><h3 style={{fontSize:mayor?'1.45rem':'1.2rem',margin:'16px 0 8px'}}>¿Entendiste qué debes hacer?</h3><p style={{color:COLORS.textMuted,fontSize:mayor?'.98rem':'.82rem',lineHeight:1.6,margin:'0 auto 18px',maxWidth:520}}>La práctica no cuenta para tu resultado. Cuando inicies, realiza la actividad con la misma regla.</p>
    <div style={{display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap'}}><BtnSecondary onClick={onBack}>Ver ejemplo otra vez</BtnSecondary><NeuroFlexInstructionAudio text={instruction} autoPlay={false} paciente={paciente}/><BtnPrimary onClick={onStart}>Sí, comenzar</BtnPrimary></div>
  </div>;
}

const NEUROFLEX_PHASE61_2_STABILITY = Object.freeze({
  version: "F61.2",
  scope: "Intervention stimulus stability + Evaluation v2 render-stability audit",
  safeguards: [
    "Stimuli and answer order are generated once per exercise instance when they must remain stable.",
    "Patient interaction must not regenerate the item being solved.",
    "Evaluation v2 NF-E01–NF-E27 audited for render-time Math.random/shuffle regeneration; none found in task components."
  ]
});

function AssessmentTaskShell({ taskId, paciente, children, note, patientFacing = false }) {
  const task = getAssessmentTaskDefinition(taskId);
  const mayor = esModoMayor(paciente);
  return (
    <div style={{maxWidth:760,margin:'0 auto'}}>
      <Card style={{padding:mayor?30:24,overflow:'hidden'}}>
        <div style={{height:4,background:`linear-gradient(90deg,${COLORS.primary},${COLORS.accent})`,margin:mayor?'-30px -30px 22px':'-24px -24px 20px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',marginBottom:18}}>
          <div>
            <div style={{fontSize:'.7rem',fontWeight:800,color:COLORS.primary,letterSpacing:'.06em'}}>{patientFacing?'ACTIVIDAD NEUROFLEX':`EVALUATION v2 · ${taskId}`}</div>
            <h2 style={{fontSize:mayor?'1.45rem':'1.25rem',margin:'5px 0'}}>{task?.name}</h2>
            {!patientFacing && <p style={{fontSize:mayor?'.96rem':'.8rem',color:COLORS.textMuted,lineHeight:1.55,margin:0}}>
              {ASSESSMENT_DOMAINS_V2[task?.primaryDomain]?.label}
              {task?.secondaryDomains?.length ? ` · También aporta información a ${task.secondaryDomains.map(x=>ASSESSMENT_DOMAINS_V2[x]?.label || x).join(', ')}` : ''}
            </p>}
          </div>
          {!patientFacing && <Badge label={`v${task?.version || '1.0'}`} color={COLORS.info}/>} 
        </div>
        {note && <div style={{background:COLORS.bg,borderRadius:10,padding:'10px 12px',fontSize:'.74rem',color:COLORS.textMuted,lineHeight:1.5,marginBottom:18}}>{note}</div>}
        {children}
      </Card>
    </div>
  );
}

function NFE01Orientation({ paciente, onDone }) {
  const now = new Date();
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const [month,setMonth]=useState('');
  const [year,setYear]=useState('');
  const [weekday,setWeekday]=useState('');
  const [pro,setPro]=useState({personal:null,spatial:null,contextual:null});
  const started=useRef(Date.now());
  const weekdays=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const complete = () => {
    const auto = [month===months[now.getMonth()], Number(year)===now.getFullYear(), weekday===weekdays[now.getDay()]];
    const professional = Object.values(pro).filter(v=>v!==null);
    const correct = auto.filter(Boolean).length + professional.filter(Boolean).length;
    const total = auto.length + professional.length;
    onDone(nfTaskResult('NF-E01', {
      precision:pctSafe(correct,total), correct,total, errors:total-correct,
      latencyMs:Date.now()-started.current,
      taskVersionAdministered:'NF-E01-1.0'
    }, { requiresProfessionalReview: professional.length < 3, notes:'Orientación temporal autocalculada; orientación personal, espacial y contextual registrada por observación profesional.' }));
  };
  return <AssessmentTaskShell taskId='NF-E01' paciente={paciente} note='Los elementos de lugar, persona y contexto se registran por observación profesional para no inventar una respuesta correcta sobre el entorno real.'>
    <p style={{fontWeight:700,marginBottom:12}}>Responde sin consultar reloj ni calendario.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10}}>
      <select value={month} onChange={e=>setMonth(e.target.value)} style={{padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`}}><option value=''>Mes actual…</option>{months.map(x=><option key={x}>{x}</option>)}</select>
      <input value={year} onChange={e=>setYear(e.target.value)} inputMode='numeric' placeholder='Año actual' style={{padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`}}/>
      <select value={weekday} onChange={e=>setWeekday(e.target.value)} style={{padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`}}><option value=''>Día de la semana…</option>{weekdays.map(x=><option key={x}>{x}</option>)}</select>
    </div>
    <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${COLORS.border}`}}>
      <p style={{fontWeight:700,fontSize:'.84rem',marginBottom:10}}>Registro del profesional</p>
      {[['personal','Reconoce adecuadamente su identidad / información personal básica'],['spatial','Reconoce adecuadamente el lugar o entorno actual'],['contextual','Comprende adecuadamente la situación actual de evaluación']].map(([k,label])=><div key={k} style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',padding:'9px 0'}}><span style={{fontSize:'.8rem'}}>{label}</span><div style={{display:'flex',gap:6}}><button onClick={()=>setPro(p=>({...p,[k]:true}))} style={{padding:'7px 12px',borderRadius:8,border:`1px solid ${pro[k]===true?COLORS.success:COLORS.border}`,background:pro[k]===true?COLORS.success+'12':'#fff'}}>Sí</button><button onClick={()=>setPro(p=>({...p,[k]:false}))} style={{padding:'7px 12px',borderRadius:8,border:`1px solid ${pro[k]===false?COLORS.warning:COLORS.border}`,background:pro[k]===false?COLORS.warning+'12':'#fff'}}>No</button></div></div>)}
    </div>
    <BtnPrimary disabled={!month||!year||!weekday} onClick={complete} style={{width:'100%',marginTop:18}}>Continuar</BtnPrimary>
  </AssessmentTaskShell>;
}

function NFE02Cancellation({ paciente, onDone }) {
  const [items] = useState(() => Array.from({length:48},(_,i)=>({id:i,target:[1,6,10,15,19,27,31,36,42,46].includes(i),symbol:[1,6,10,15,19,27,31,36,42,46].includes(i)?'◆':['◇','○','△','□','◌'][i%5]})));
  const [selected,setSelected]=useState([]);
  const clicks=useRef([]); const started=useRef(Date.now());
  const toggle=(id)=>{ const t=Date.now()-started.current; clicks.current.push(t); setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]); };
  const finish=()=>{
    const targetIds=items.filter(x=>x.target).map(x=>x.id);
    const correct=selected.filter(x=>targetIds.includes(x)).length;
    const commissions=selected.filter(x=>!targetIds.includes(x)).length;
    const omissions=targetIds.filter(x=>!selected.includes(x)).length;
    const rts=clicks.current.map((x,i)=>i===0?x:x-clicks.current[i-1]).filter(x=>x>80);
    const half=Math.floor(items.length/2);
    const block1Targets=items.slice(0,half).filter(x=>x.target).map(x=>x.id);
    const block2Targets=items.slice(half).filter(x=>x.target).map(x=>x.id);
    const b1=selected.filter(x=>block1Targets.includes(x)).length;
    const b2=selected.filter(x=>block2Targets.includes(x)).length;
    onDone(nfTaskResult('NF-E02',{precision:pctSafe(correct,targetIds.length+commissions),correct,total:targetIds.length,omissions,commissions,errors:omissions+commissions,meanResponseMs:meanNum(rts),medianResponseMs:medianNum(rts),responseVariabilityMs:sdNum(rts),blockPerformance:[pctSafe(b1,block1Targets.length),pctSafe(b2,block2Targets.length)],latencyMs:Date.now()-started.current,taskVersionAdministered:'NF-E02-1.0'}));
  };
  return <AssessmentTaskShell taskId='NF-E02' paciente={paciente} note='Busca únicamente todos los rombos negros ◆. Puedes revisar antes de finalizar.'>
    <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:8}}>{items.map(it=><button key={it.id} onClick={()=>toggle(it.id)} style={{aspectRatio:'1',borderRadius:9,border:`2px solid ${selected.includes(it.id)?COLORS.primary:COLORS.border}`,background:selected.includes(it.id)?COLORS.primary+'12':'#fff',fontSize:'1.25rem',fontWeight:800}}>{it.symbol}</button>)}</div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14,gap:10}}><span style={{fontSize:'.75rem',color:COLORS.textMuted}}>Seleccionados: {selected.length}</span><BtnPrimary onClick={finish}>Finalizar búsqueda</BtnPrimary></div>
  </AssessmentTaskShell>;
}

function TimedSignalTask({ taskId, paciente, mode, onDone }) {
  const isCpt=mode==='cpt';
  const instruction=isCpt
    ?'Presiona RESPONDER solamente cuando aparezca el círculo. Si aparece cualquier otra figura, no presiones nada: espera a que aparezca la siguiente.'
    :'Presiona RESPONDER cuando aparezca el círculo. Si aparece la X, no presiones nada: espera a que aparezca el siguiente símbolo.';
  const practiceTrials=isCpt
    ?[{symbol:'●',target:true},{symbol:'■',target:false},{symbol:'●',target:true},{symbol:'▲',target:false}]
    :[{symbol:'●',target:true},{symbol:'✕',target:false},{symbol:'●',target:true},{symbol:'✕',target:false}];
  const [stage,setStage]=useState('intro');
  const [practiceIdx,setPracticeIdx]=useState(0); const [practiceFeedback,setPracticeFeedback]=useState(null); const [practiceActive,setPracticeActive]=useState(false);
  const practiceTimer=useRef(null); const practiceResponded=useRef(false);
  const [trials] = useState(() => Array.from({length:isCpt?32:30},(_,i)=>{
    if(isCpt){ const targets=[2,5,9,13,18,22,26,30]; return {target:targets.includes(i),symbol:targets.includes(i)?'●':['■','▲','◆'][i%3]}; }
    const noGo=[4,9,15,21,27]; return {target:!noGo.includes(i),symbol:noGo.includes(i)?'✕':'●',noGo:noGo.includes(i)};
  }));
  const [idx,setIdx]=useState(-1); const [running,setRunning]=useState(false); const [done,setDone]=useState(false); const [registered,setRegistered]=useState(false);
  const records=useRef([]); const responded=useRef(false); const trialStart=useRef(0); const timer=useRef(null); const registeredTimer=useRef(null);
  const duration=isCpt?950:850;
  const startPracticeTrial=(i)=>{
    clearTimeout(practiceTimer.current); setPracticeIdx(i); setPracticeFeedback(null); setPracticeActive(true); practiceResponded.current=false;
    const tr=practiceTrials[i];
    practiceTimer.current=setTimeout(()=>{
      setPracticeActive(false);
      setPracticeFeedback(tr.target?'Aquí debías responder.':'Correcto. Aquí debías esperar sin presionar.');
    },1100);
  };
  const beginPractice=()=>{setStage('practice');setTimeout(()=>startPracticeTrial(0),80)};
  const practiceRespond=()=>{
    if(!practiceActive||practiceResponded.current) return;
    practiceResponded.current=true; clearTimeout(practiceTimer.current); setPracticeActive(false);
    const tr=practiceTrials[practiceIdx];
    setPracticeFeedback(tr.target?'Correcto. Aquí debías responder.':'Aquí debías esperar y no responder.');
  };
  const nextPractice=()=>{
    if(practiceIdx+1>=practiceTrials.length){setStage('ready');return;}
    startPracticeTrial(practiceIdx+1);
  };
  const finalizeTrial=(i)=>{ if(i<0||i>=trials.length) return; const tr=trials[i]; if(!responded.current){ if(tr.target) records.current.push({i,target:true,response:false,correct:false,omission:true,rt:null}); else records.current.push({i,target:false,response:false,correct:true,rt:null}); } };
  const advance=(next)=>{ setIdx(next); responded.current=false; setRegistered(false); trialStart.current=Date.now(); if(next>=trials.length){setRunning(false);setDone(true);return;} timer.current=setTimeout(()=>{finalizeTrial(next);advance(next+1)},duration); };
  const start=()=>{records.current=[];setDone(false);setStage('task');setRunning(true);advance(0)};
  useEffect(()=>()=>{clearTimeout(timer.current);clearTimeout(practiceTimer.current);clearTimeout(registeredTimer.current)},[]);
  const respond=()=>{ if(!running||idx<0||idx>=trials.length||responded.current) return; responded.current=true; const tr=trials[idx]; const rt=Date.now()-trialStart.current; records.current.push({i:idx,target:tr.target,response:true,correct:!!tr.target,commission:!tr.target,rt}); setRegistered(true); clearTimeout(registeredTimer.current); registeredTimer.current=setTimeout(()=>setRegistered(false),260); };
  const finish=()=>{
    const rs=records.current; const correct=rs.filter(r=>r.correct).length; const omissions=rs.filter(r=>r.omission).length; const commissions=rs.filter(r=>r.commission).length; const rts=rs.filter(r=>r.target&&r.response&&r.correct).map(r=>r.rt);
    const blockSize=Math.ceil(trials.length/4); const blocks=[0,1,2,3].map(b=>{const seg=rs.filter(r=>r.i>=b*blockSize&&r.i<(b+1)*blockSize);return pctSafe(seg.filter(r=>r.correct).length,seg.length)});
    const change=(Number.isFinite(blocks[0])&&Number.isFinite(blocks[3]))?blocks[3]-blocks[0]:null;
    const anticipatory=rts.filter(x=>x<180).length;
    onDone(nfTaskResult(taskId,{precision:pctSafe(correct,trials.length),correct,total:trials.length,omissions,commissions,errors:omissions+commissions,meanResponseMs:meanNum(rts),medianResponseMs:medianNum(rts),responseVariabilityMs:sdNum(rts),blockPerformance:blocks,performanceChange:change,anticipatoryResponses:anticipatory,taskVersionAdministered:`${taskId}-1.0`}));
  };
  const example=<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><div style={{padding:16,borderRadius:12,background:'#fff',border:`1px solid ${COLORS.border}`,textAlign:'center'}}><div style={{fontSize:'2.7rem',fontWeight:900}}>●</div><div style={{fontWeight:800,color:COLORS.accent}}>Presiona RESPONDER</div></div><div style={{padding:16,borderRadius:12,background:'#fff',border:`1px solid ${COLORS.border}`,textAlign:'center'}}><div style={{fontSize:'2.7rem',fontWeight:900}}>{isCpt?'▲':'✕'}</div><div style={{fontWeight:800,color:COLORS.textSecond}}>Espera. No presiones.</div></div></div>;
  return <AssessmentTaskShell taskId={taskId} paciente={paciente} patientFacing>
    {stage==='intro'&&<NeuroFlexTaskIntro paciente={paciente} title={getAssessmentTaskDefinition(taskId)?.name} instruction={instruction} example={example} onContinue={beginPractice}/>} 
    {stage==='practice'&&<div style={{textAlign:'center'}}><div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:18}}><NeuroFlexStepPill done>1 · Instrucción</NeuroFlexStepPill><NeuroFlexStepPill active>2 · Práctica</NeuroFlexStepPill><NeuroFlexStepPill>3 · Actividad</NeuroFlexStepPill></div><div style={{fontSize:'.72rem',fontWeight:800,color:COLORS.accent,letterSpacing:'.05em'}}>PRÁCTICA · NO CUENTA PARA EL RESULTADO</div><div style={{height:170,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'5rem',fontWeight:900}}>{practiceTrials[practiceIdx]?.symbol}</div><BtnPrimary disabled={!practiceActive} onClick={practiceRespond} style={{width:'100%',padding:18,fontSize:'1rem'}}>RESPONDER</BtnPrimary><div style={{minHeight:62,paddingTop:14}}>{practiceFeedback&&<div style={{padding:'12px 14px',borderRadius:12,background:practiceFeedback.startsWith('Correcto')?COLORS.success+'10':COLORS.warning+'12',color:practiceFeedback.startsWith('Correcto')?COLORS.success:'#9A6700',fontWeight:800}}>{practiceFeedback}</div>}</div>{practiceFeedback&&<BtnSecondary onClick={nextPractice}>{practiceIdx+1>=practiceTrials.length?'Terminar práctica':'Siguiente ejemplo'}</BtnSecondary>}</div>}
    {stage==='ready'&&<NeuroFlexReadyCheck paciente={paciente} instruction={instruction} onBack={()=>setStage('intro')} onStart={start}/>} 
    {stage==='task'&&running&&<div style={{textAlign:'center'}}><div style={{fontSize:'.68rem',fontWeight:800,color:COLORS.accent,letterSpacing:'.05em',marginBottom:8}}>ACTIVIDAD</div><ProgressBar value={Math.max(0,((idx+1)/trials.length)*100)}/><div style={{height:190,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'5rem',fontWeight:900}}>{idx<trials.length?trials[idx]?.symbol:''}</div><BtnPrimary onClick={respond} style={{width:'100%',padding:18,fontSize:'1rem',transform:registered?'scale(.985)':'scale(1)',transition:'transform .12s ease'}}>RESPONDER</BtnPrimary><div style={{height:30,paddingTop:8,fontSize:'.76rem',fontWeight:750,color:COLORS.accent,opacity:registered?1:0,transition:'opacity .12s ease'}}>Respuesta registrada</div></div>}
    {done&&<div style={{textAlign:'center',padding:'25px 0'}}><NeuroFlexMark size={48}/><h3 style={{margin:'14px 0 8px'}}>Actividad completada</h3><p style={{color:COLORS.textMuted,marginBottom:18}}>Tus respuestas quedaron registradas.</p><BtnPrimary onClick={finish}>Continuar</BtnPrimary></div>}
  </AssessmentTaskShell>;
}

function NFE05Interference({ paciente, onDone }) {
  const labels=['AZUL','VERDE','NARANJA','MORADO'];
  const css={AZUL:'#2563EB',VERDE:'#16845B',NARANJA:'#D97706',MORADO:'#7C3AED'};
  const [trials] = useState(()=>{
    const base=labels.concat(labels).map((x,i)=>({phase:'baseline',word:'████',ink:labels[(i*3)%4]}));
    const inter=Array.from({length:12},(_,i)=>{const ink=labels[(i*3+1)%4]; let word=labels[(i+2)%4]; if(word===ink) word=labels[(i+1)%4]; return {phase:'interference',word,ink};});
    return [...base,...inter];
  });
  const [idx,setIdx]=useState(0); const records=useRef([]); const started=useRef(Date.now()); const [picked,setPicked]=useState(null);
  const choose=(label)=>{
    if(picked) return; const rt=Date.now()-started.current; setPicked(label); const tr=trials[idx]; records.current.push({phase:tr.phase,correct:label===tr.ink,rt});
    setTimeout(()=>{ if(idx+1>=trials.length){setIdx(trials.length)} else {setIdx(i=>i+1);started.current=Date.now();setPicked(null)} },220);
  };
  const finish=()=>{const rs=records.current, base=rs.filter(r=>r.phase==='baseline'), inter=rs.filter(r=>r.phase==='interference'), brt=base.filter(r=>r.correct).map(r=>r.rt), irt=inter.filter(r=>r.correct).map(r=>r.rt); const correct=rs.filter(r=>r.correct).length; onDone(nfTaskResult('NF-E05',{precision:pctSafe(correct,rs.length),correct,total:rs.length,errors:rs.length-correct,meanResponseMs:meanNum(irt),medianResponseMs:medianNum(irt),responseVariabilityMs:sdNum(irt),interferenceCost:(meanNum(irt)!=null&&meanNum(brt)!=null)?Math.round(meanNum(irt)-meanNum(brt)):null,blockPerformance:[pctSafe(base.filter(r=>r.correct).length,base.length),pctSafe(inter.filter(r=>r.correct).length,inter.length)],taskVersionAdministered:'NF-E05-1.0'}));};
  if(idx>=trials.length) return <AssessmentTaskShell taskId='NF-E05' paciente={paciente}><div style={{textAlign:'center',padding:30}}><p style={{color:COLORS.textMuted}}>Condición simple e interferente completadas.</p><BtnPrimary onClick={finish}>Continuar</BtnPrimary></div></AssessmentTaskShell>;
  const tr=trials[idx];
  return <AssessmentTaskShell taskId='NF-E05' paciente={paciente} note={tr.phase==='baseline'?'Primero identifica el COLOR visual del estímulo.':'Ahora sigue respondiendo por el COLOR visual e ignora el significado de la palabra.'}>
    <div style={{textAlign:'center'}}><div style={{fontSize:'.72rem',color:COLORS.textMuted}}>Ensayo {idx+1}/{trials.length} · {tr.phase==='baseline'?'condición simple':'condición interferente'}</div><div style={{height:150,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.4rem',fontWeight:900,color:css[tr.ink]}}>{tr.word}</div><div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:9}}>{labels.map(l=><button key={l} onClick={()=>choose(l)} style={{padding:14,borderRadius:10,border:`2px solid ${picked===l?COLORS.primary:COLORS.border}`,background:'#fff',fontWeight:800}}>{l}</button>)}</div></div>
  </AssessmentTaskShell>;
}

function NFE06Switching({ paciente, onDone }) {
  const instruction='En esta actividad debes mirar primero la regla activa. Si la regla dice NÚMERO, usa el número: del 1 al 4 responde izquierda y del 5 al 9 responde derecha. Si la regla dice FORMA, usa la figura: círculo responde izquierda y triángulo responde derecha. La regla puede cambiar durante la actividad.';
  const [stage,setStage]=useState('intro');
  const practiceTrials=[
    {rule:'numero',n:3,shape:'triángulo',correct:'IZQUIERDA'},
    {rule:'numero',n:8,shape:'círculo',correct:'DERECHA'},
    {rule:'forma',n:2,shape:'triángulo',correct:'DERECHA'},
    {rule:'forma',n:7,shape:'círculo',correct:'IZQUIERDA'},
    {rule:'numero',n:6,shape:'círculo',correct:'DERECHA',switch:true},
    {rule:'forma',n:4,shape:'triángulo',correct:'DERECHA',switch:true},
  ];
  const [practiceIdx,setPracticeIdx]=useState(0); const [practiceFeedback,setPracticeFeedback]=useState(null);
  const [trials] = useState(()=>Array.from({length:24},(_,i)=>{ const rule=(i<6||i>=12&&i<15||i>=20)?'numero':'forma'; const n=[2,7,3,8,1,6,4,9][i%8]; const shape=i%3===0?'círculo':'triángulo'; const current=rule==='numero'?(n<=4?'IZQUIERDA':'DERECHA'):(shape==='círculo'?'IZQUIERDA':'DERECHA'); const other=rule==='numero'?(shape==='círculo'?'IZQUIERDA':'DERECHA'):(n<=4?'IZQUIERDA':'DERECHA'); return {rule,n,shape,current,other,switch:i>0&&rule!==((i-1<6||i-1>=12&&i-1<15||i-1>=20)?'numero':'forma')}; }));
  const [idx,setIdx]=useState(0); const [registered,setRegistered]=useState(false); const records=useRef([]); const started=useRef(Date.now()); const registeredTimer=useRef(null);
  useEffect(()=>()=>clearTimeout(registeredTimer.current),[]);
  const practicePick=(resp)=>{if(practiceFeedback)return;const tr=practiceTrials[practiceIdx];setPracticeFeedback(resp===tr.correct?'Correcto. Aplicaste la regla activa.':`Aquí debías responder ${tr.correct.toLowerCase()} porque la regla activa era ${tr.rule==='numero'?'NÚMERO':'FORMA'}.`)};
  const nextPractice=()=>{if(practiceIdx+1>=practiceTrials.length){setStage('ready');return;}setPracticeIdx(i=>i+1);setPracticeFeedback(null)};
  const startTask=()=>{setIdx(0);records.current=[];started.current=Date.now();setStage('task')};
  const pick=(resp)=>{const tr=trials[idx]; const rt=Date.now()-started.current; const correct=resp===tr.current; records.current.push({...tr,resp,correct,rt,perseveration:!correct&&tr.switch&&resp===tr.other}); setRegistered(true); clearTimeout(registeredTimer.current); registeredTimer.current=setTimeout(()=>setRegistered(false),260); if(idx+1>=trials.length)setIdx(trials.length);else{setIdx(i=>i+1);started.current=Date.now();}};
  const finish=()=>{const rs=records.current, sw=rs.filter(r=>r.switch&&r.correct).map(r=>r.rt), rep=rs.filter(r=>!r.switch&&r.correct).map(r=>r.rt), correct=rs.filter(r=>r.correct).length;onDone(nfTaskResult('NF-E06',{precision:pctSafe(correct,rs.length),correct,total:rs.length,errors:rs.length-correct,perseverations:rs.filter(r=>r.perseveration).length,meanResponseMs:meanNum(rs.filter(r=>r.correct).map(r=>r.rt)),medianResponseMs:medianNum(rs.filter(r=>r.correct).map(r=>r.rt)),responseVariabilityMs:sdNum(rs.filter(r=>r.correct).map(r=>r.rt)),switchCost:(meanNum(sw)!=null&&meanNum(rep)!=null)?Math.round(meanNum(sw)-meanNum(rep)):null,blockPerformance:[pctSafe(rs.slice(0,6).filter(r=>r.correct).length,6),pctSafe(rs.slice(6,12).filter(r=>r.correct).length,6),pctSafe(rs.slice(12,18).filter(r=>r.correct).length,6),pctSafe(rs.slice(18,24).filter(r=>r.correct).length,6)],taskVersionAdministered:'NF-E06-1.0'}));};
  const example=<div style={{display:'grid',gap:12}}><div style={{display:'grid',gridTemplateColumns:'110px 1fr',gap:12,alignItems:'center',padding:13,border:`1px solid ${COLORS.border}`,borderRadius:12,background:'#fff'}}><Badge label="REGLA: NÚMERO" color={COLORS.primary}/><div style={{fontSize:'.82rem',lineHeight:1.6}}><strong>1–4</strong> → izquierda &nbsp; · &nbsp; <strong>5–9</strong> → derecha</div></div><div style={{display:'grid',gridTemplateColumns:'110px 1fr',gap:12,alignItems:'center',padding:13,border:`1px solid ${COLORS.border}`,borderRadius:12,background:'#fff'}}><Badge label="REGLA: FORMA" color={COLORS.accent}/><div style={{fontSize:'.82rem',lineHeight:1.6}}><strong>● círculo</strong> → izquierda &nbsp; · &nbsp; <strong>▲ triángulo</strong> → derecha</div></div><div style={{fontSize:'.78rem',fontWeight:750,color:COLORS.warning,padding:'8px 2px 0'}}>Importante: responde según la regla que aparezca arriba, aunque el otro estímulo indique algo diferente.</div></div>;
  const practice=practiceTrials[practiceIdx];
  if(stage==='task'&&idx>=trials.length)return <AssessmentTaskShell taskId='NF-E06' paciente={paciente} patientFacing><div style={{textAlign:'center',padding:30}}><NeuroFlexMark size={48}/><h3 style={{margin:'14px 0 8px'}}>Actividad completada</h3><p style={{color:COLORS.textMuted,marginBottom:18}}>Tus respuestas quedaron registradas.</p><BtnPrimary onClick={finish}>Continuar</BtnPrimary></div></AssessmentTaskShell>;
  const tr=trials[idx];
  return <AssessmentTaskShell taskId='NF-E06' paciente={paciente} patientFacing>
    {stage==='intro'&&<NeuroFlexTaskIntro paciente={paciente} title="Cambia la regla" instruction={instruction} example={example} onContinue={()=>setStage('practice')}/>} 
    {stage==='practice'&&<div style={{textAlign:'center'}}><div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:18}}><NeuroFlexStepPill done>1 · Instrucción</NeuroFlexStepPill><NeuroFlexStepPill active>2 · Práctica</NeuroFlexStepPill><NeuroFlexStepPill>3 · Actividad</NeuroFlexStepPill></div><div style={{fontSize:'.72rem',fontWeight:800,color:COLORS.accent,letterSpacing:'.05em',marginBottom:14}}>PRÁCTICA · NO CUENTA PARA EL RESULTADO</div><Badge label={`REGLA: ${practice.rule.toUpperCase()}`} color={practice.switch?COLORS.warning:practice.rule==='numero'?COLORS.primary:COLORS.accent}/>{practice.switch&&<div style={{fontSize:'.74rem',fontWeight:850,color:COLORS.warning,marginTop:8}}>La regla cambió. Mira cuál está activa.</div>}<div style={{height:150,display:'flex',alignItems:'center',justifyContent:'center',gap:24}}><span style={{fontSize:'3rem',fontWeight:900}}>{practice.n}</span><span style={{fontSize:'3rem'}}>{practice.shape==='círculo'?'●':'▲'}</span></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><BtnSecondary disabled={!!practiceFeedback} onClick={()=>practicePick('IZQUIERDA')} style={{padding:16}}>← IZQUIERDA</BtnSecondary><BtnSecondary disabled={!!practiceFeedback} onClick={()=>practicePick('DERECHA')} style={{padding:16}}>DERECHA →</BtnSecondary></div><div style={{minHeight:66,paddingTop:14}}>{practiceFeedback&&<div style={{padding:'12px 14px',borderRadius:12,background:practiceFeedback.startsWith('Correcto')?COLORS.success+'10':COLORS.warning+'12',color:practiceFeedback.startsWith('Correcto')?COLORS.success:'#9A6700',fontWeight:800,lineHeight:1.5}}>{practiceFeedback}</div>}</div>{practiceFeedback&&<BtnSecondary onClick={nextPractice}>{practiceIdx+1>=practiceTrials.length?'Terminar práctica':'Siguiente ejemplo'}</BtnSecondary>}</div>}
    {stage==='ready'&&<NeuroFlexReadyCheck paciente={paciente} instruction={instruction} onBack={()=>{setPracticeIdx(0);setPracticeFeedback(null);setStage('intro')}} onStart={startTask}/>} 
    {stage==='task'&&idx<trials.length&&<div style={{textAlign:'center'}}><div style={{fontSize:'.68rem',fontWeight:800,color:COLORS.accent,letterSpacing:'.05em',marginBottom:10}}>ACTIVIDAD</div><Badge label={`REGLA: ${tr.rule.toUpperCase()}`} color={tr.switch?COLORS.warning:tr.rule==='numero'?COLORS.primary:COLORS.accent}/>{tr.switch&&<div style={{fontSize:'.72rem',fontWeight:800,color:COLORS.warning,marginTop:7}}>CAMBIO DE REGLA</div>}<div style={{height:150,display:'flex',alignItems:'center',justifyContent:'center',gap:24}}><span style={{fontSize:'3rem',fontWeight:900}}>{tr.n}</span><span style={{fontSize:'3rem'}}>{tr.shape==='círculo'?'●':'▲'}</span></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><BtnSecondary onClick={()=>pick('IZQUIERDA')} style={{padding:16,transform:registered?'scale(.99)':'scale(1)',transition:'transform .12s ease'}}>← IZQUIERDA</BtnSecondary><BtnSecondary onClick={()=>pick('DERECHA')} style={{padding:16,transform:registered?'scale(.99)':'scale(1)',transition:'transform .12s ease'}}>DERECHA →</BtnSecondary></div><div style={{height:28,paddingTop:8,fontSize:'.76rem',fontWeight:750,color:COLORS.accent,opacity:registered?1:0,transition:'opacity .12s ease'}}>Respuesta registrada</div><ProgressBar value={((idx+1)/trials.length)*100}/></div>}
  </AssessmentTaskShell>;
}

function EvaluationV2Phase34Block({ paciente, onExit }) {
  const ids=['NF-E01','NF-E02','NF-E03','NF-E04','NF-E05','NF-E06'];
  const [idx,setIdx]=useState(0); const [results,setResults]=useState([]);
  const components={
    'NF-E01':NFE01Orientation,
    'NF-E02':NFE02Cancellation,
    'NF-E03':(p)=><TimedSignalTask {...p} taskId='NF-E03' mode='cpt'/>,
    'NF-E04':(p)=><TimedSignalTask {...p} taskId='NF-E04' mode='gonogo'/>,
    'NF-E05':NFE05Interference,
    'NF-E06':NFE06Switching,
  };
  if(idx>=ids.length){
    return <div style={{maxWidth:820,margin:'0 auto'}}><Card><div style={{fontSize:'.7rem',fontWeight:800,color:COLORS.primary,letterSpacing:'.06em'}}>FASE 34 · BLOQUE PILOTO</div><h2 style={{margin:'6px 0'}}>NF-E01 a NF-E06 completados</h2><p style={{color:COLORS.textMuted,lineHeight:1.6,fontSize:'.82rem'}}>Estos resultados sirven para verificar el nuevo motor. Este bloque todavía no sustituye la evaluación clínica completa ni se guarda como línea base NF‑EVAL‑2.0.</p><div style={{marginTop:16}}>{results.map(r=><div key={r.taskId} style={{padding:'12px 0',borderBottom:`1px solid ${COLORS.border}`,display:'grid',gridTemplateColumns:'100px 1fr',gap:10}}><strong>{r.taskId}</strong><div style={{fontSize:'.78rem',color:COLORS.textSecond}}>Precisión: {r.metrics?.precision ?? '—'}% · Errores: {r.metrics?.errors ?? '—'} · TR medio: {r.metrics?.meanResponseMs?Math.round(r.metrics.meanResponseMs)+' ms':'—'}{r.metrics?.interferenceCost!=null?` · Costo interferencia: ${r.metrics.interferenceCost} ms`:''}{r.metrics?.switchCost!=null?` · Costo cambio: ${r.metrics.switchCost} ms`:''}</div></div>)}</div><BtnPrimary onClick={onExit} style={{width:'100%',marginTop:20}}>Volver a evaluación</BtnPrimary></Card></div>;
  }
  const id=ids[idx], Comp=components[id];
  return <div><div style={{maxWidth:760,margin:'0 auto 12px'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:'.72rem',color:COLORS.textMuted,marginBottom:6}}><span>Bloque Fase 34</span><span>{idx+1}/{ids.length}</span></div><ProgressBar value={(idx/ids.length)*100}/></div><Comp paciente={paciente} onDone={(r)=>{setResults(x=>[...x,r]);setIdx(i=>i+1)}}/></div>;
}


// ─── FASE 35 · NF-E07–NF-E11 · MEMORIA ──────────────────────────────────────
function normalizeRecallToken(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitRecallWords(value = "") {
  return normalizeRecallToken(value)
    .split(" ")
    .map(x => x.trim())
    .filter(Boolean);
}

function countUniqueTargets(responseWords = [], targets = []) {
  const targetSet = new Set(targets.map(normalizeRecallToken));
  const unique = [...new Set(responseWords.map(normalizeRecallToken))];
  return unique.filter(x => targetSet.has(x)).length;
}

function countIntrusions(responseWords = [], targets = []) {
  const targetSet = new Set(targets.map(normalizeRecallToken));
  return responseWords.map(normalizeRecallToken).filter(x => x && !targetSet.has(x)).length;
}

function countPerseverations(responseWords = []) {
  const xs = responseWords.map(normalizeRecallToken).filter(Boolean);
  return Math.max(0, xs.length - new Set(xs).size);
}

function NFE07ActiveSpan({ paciente, onDone }) {
  const mayor = esModoMayor(paciente);
  const [speechAvailable] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [trials] = useState(() => [
    { condition:"directo", seq:[4,1,7,3] },
    { condition:"directo", seq:[8,2,5,9,3] },
    { condition:"inverso", seq:[6,2,9] },
    { condition:"inverso", seq:[3,8,1,6] },
    { condition:"ordenar", seq:[7,2,5,1] },
    { condition:"ordenar", seq:[9,4,1,6,3] },
  ]);
  const [idx,setIdx] = useState(0);
  const [phase,setPhase] = useState("ready"); // ready | presenting | response
  const [input,setInput] = useState("");
  const records = useRef([]);
  const trialStart = useRef(Date.now());

  const tr = trials[idx];

  const expectedFor = (trial) => {
    if (trial.condition === "directo") return trial.seq;
    if (trial.condition === "inverso") return [...trial.seq].reverse();
    return [...trial.seq].sort((a,b)=>a-b);
  };

  const present = () => {
    setInput("");
    setPhase("presenting");
    trialStart.current = Date.now();
    if (speechAvailable) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(tr.seq.join(" ... "));
        utter.lang = "es-ES";
        utter.rate = mayor ? 0.7 : 0.82;
        utter.onend = () => setPhase("response");
        window.speechSynthesis.speak(utter);
        return;
      } catch(e) {}
    }
    setTimeout(() => setPhase("response"), 1400 + tr.seq.length * 300);
  };

  useEffect(() => () => {
    try { window.speechSynthesis?.cancel(); } catch(e) {}
  }, []);

  const submit = () => {
    const digits = input.replace(/\D/g,"").split("").map(Number);
    const expected = expectedFor(tr);
    const correct = digits.length === expected.length && digits.every((n,i)=>n===expected[i]);
    records.current.push({
      condition: tr.condition,
      length: tr.seq.length,
      correct,
      rt: Date.now()-trialStart.current,
      modality: speechAvailable ? "auditiva_sintetizada" : "visual_apoyo",
    });
    if (idx + 1 >= trials.length) {
      const rs = records.current;
      const ok = rs.filter(r=>r.correct);
      const maxByCond = {};
      ["directo","inverso","ordenar"].forEach(c=>{
        const lengths = ok.filter(r=>r.condition===c).map(r=>r.length);
        maxByCond[c] = lengths.length ? Math.max(...lengths) : 0;
      });
      onDone(nfTaskResult("NF-E07", {
        precision: pctSafe(ok.length, rs.length),
        correct: ok.length,
        total: rs.length,
        errors: rs.length-ok.length,
        levelReached: Math.max(...ok.map(r=>r.length),0),
        meanResponseMs: meanNum(rs.map(r=>r.rt)),
        medianResponseMs: medianNum(rs.map(r=>r.rt)),
        responseVariabilityMs: sdNum(rs.map(r=>r.rt)),
        blockPerformance: [
          pctSafe(rs.filter(r=>r.condition==="directo"&&r.correct).length,2),
          pctSafe(rs.filter(r=>r.condition==="inverso"&&r.correct).length,2),
          pctSafe(rs.filter(r=>r.condition==="ordenar"&&r.correct).length,2),
        ],
        taskVersionAdministered: speechAvailable ? "NF-E07-1.0-audio" : "NF-E07-1.0-visual-fallback",
      }, {
        notes: `Amplitud observada — directo ${maxByCond.directo}, inverso ${maxByCond.inverso}, ordenamiento ${maxByCond.ordenar}.`
      }));
      return;
    }
    setIdx(i=>i+1);
    setPhase("ready");
    setInput("");
  };

  const instruction = tr.condition==="directo"
    ? "Repite los números en el mismo orden."
    : tr.condition==="inverso"
      ? "Repite los números en orden inverso."
      : "Ordena los números de menor a mayor.";

  return <AssessmentTaskShell taskId="NF-E07" paciente={paciente} note="Secuencias generadas para NeuroFlex. No utiliza reactivos ni puntuaciones WAIS.">
    <div style={{textAlign:"center"}}>
      <Badge label={tr.condition==="directo"?"ORDEN DIRECTO":tr.condition==="inverso"?"ORDEN INVERSO":"REORDENAMIENTO"} color={COLORS.primary}/>
      <p style={{fontWeight:700,margin:"16px 0 8px"}}>{instruction}</p>
      <p style={{fontSize:".75rem",color:COLORS.textMuted}}>Ensayo {idx+1}/{trials.length}</p>

      {phase==="ready" && <BtnPrimary onClick={present} style={{padding:mayor?16:13,minWidth:210}}>
        {speechAvailable ? "🔊 Escuchar secuencia" : "Mostrar secuencia"}
      </BtnPrimary>}

      {phase==="presenting" && (
        <div style={{padding:30}}>
          {speechAvailable
            ? <div style={{fontSize:"2rem"}}>🔊</div>
            : <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>{tr.seq.map((n,i)=><span key={i} style={{fontSize:"1.8rem",fontWeight:850,padding:"8px 12px",border:`1px solid ${COLORS.border}`,borderRadius:10}}>{n}</span>)}</div>}
          <p style={{fontSize:".76rem",color:COLORS.textMuted}}>Atiende a la secuencia…</p>
        </div>
      )}

      {phase==="response" && (
        <div style={{maxWidth:430,margin:"18px auto 0"}}>
          <input
            autoFocus
            inputMode="numeric"
            value={input}
            onChange={e=>setInput(e.target.value)}
            placeholder="Escribe los números"
            style={{width:"100%",boxSizing:"border-box",padding:14,borderRadius:10,border:`2px solid ${COLORS.border}`,fontSize:mayor?"1.25rem":"1.05rem",textAlign:"center"}}
          />
          <BtnPrimary disabled={!input.trim()} onClick={submit} style={{width:"100%",marginTop:10,padding:13}}>Confirmar</BtnPrimary>
        </div>
      )}
    </div>
  </AssessmentTaskShell>;
}

function NFE08SpatialSpan({ paciente, onDone }) {
  const mayor = esModoMayor(paciente);
  const [trials] = useState(() => [
    [0,4,8],
    [2,5,1,7],
    [6,3,0,4,8],
    [1,5,8,2,6,3],
  ]);
  const [idx,setIdx] = useState(0);
  const [phase,setPhase] = useState("ready");
  const [active,setActive] = useState(null);
  const [response,setResponse] = useState([]);
  const records = useRef([]);
  const responseStart = useRef(Date.now());
  const timers = useRef([]);

  const clearTimers=()=>{timers.current.forEach(clearTimeout);timers.current=[]};
  useEffect(()=>()=>clearTimers(),[]);

  const showSequence=()=>{
    clearTimers();
    setResponse([]);
    setPhase("show");
    const seq=trials[idx];
    seq.forEach((cell,i)=>{
      timers.current.push(setTimeout(()=>setActive(cell), i*(mayor?850:650)));
      timers.current.push(setTimeout(()=>setActive(null), i*(mayor?850:650)+(mayor?520:380)));
    });
    timers.current.push(setTimeout(()=>{setPhase("respond");responseStart.current=Date.now()}, seq.length*(mayor?850:650)+250));
  };

  const clickCell=(cell)=>{
    if(phase!=="respond")return;
    const next=[...response,cell];
    setResponse(next);
    if(next.length===trials[idx].length){
      const expected=trials[idx];
      const correct=next.every((x,i)=>x===expected[i]);
      records.current.push({length:expected.length,correct,sequenceErrors:next.filter((x,i)=>x!==expected[i]).length,rt:Date.now()-responseStart.current});
      if(idx+1>=trials.length){
        const rs=records.current, ok=rs.filter(r=>r.correct);
        onDone(nfTaskResult("NF-E08",{
          precision:pctSafe(ok.length,rs.length),
          correct:ok.length,total:rs.length,errors:rs.length-ok.length,
          sequenceErrors:rs.reduce((s,r)=>s+r.sequenceErrors,0),
          levelReached:Math.max(...ok.map(r=>r.length),0),
          meanResponseMs:meanNum(rs.map(r=>r.rt)),
          responseVariabilityMs:sdNum(rs.map(r=>r.rt)),
          taskVersionAdministered:"NF-E08-1.0"
        }));
      } else {
        setTimeout(()=>{setIdx(i=>i+1);setPhase("ready");setResponse([])},300);
      }
    }
  };

  return <AssessmentTaskShell taskId="NF-E08" paciente={paciente} note="Tarea visuoespacial original inspirada conceptualmente en paradigmas de span espacial tipo Corsi.">
    <div style={{textAlign:"center"}}>
      <p style={{fontWeight:700}}>Observa el recorrido y después repítelo tocando las casillas en el mismo orden.</p>
      <p style={{fontSize:".74rem",color:COLORS.textMuted}}>Secuencia {idx+1}/{trials.length} · longitud {trials[idx].length}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:360,margin:"18px auto"}}>
        {Array.from({length:9},(_,cell)=><button key={cell} onClick={()=>clickCell(cell)} disabled={phase!=="respond"}
          style={{aspectRatio:"1",borderRadius:14,border:`2px solid ${active===cell?COLORS.primary:response.includes(cell)&&phase==="respond"?COLORS.info:COLORS.border}`,background:active===cell?COLORS.primary+"30":"#fff",fontSize:"1rem",cursor:phase==="respond"?"pointer":"default"}}>{phase==="respond"&&response.includes(cell)?"•":""}</button>)}
      </div>
      {phase==="ready" && <BtnPrimary onClick={showSequence}>Mostrar recorrido</BtnPrimary>}
      {phase==="show" && <p style={{fontSize:".76rem",color:COLORS.textMuted}}>Memoriza…</p>}
      {phase==="respond" && <p style={{fontSize:".76rem",color:COLORS.textMuted}}>Tu turno · {response.length}/{trials[idx].length}</p>}
    </div>
  </AssessmentTaskShell>;
}

const NF_E09_TARGETS = ["puente","limón","camisa","bosque","moneda","ventana","caballo","nube","cuchara","radio"];
const NF_E09_INTERFERENCE = ["jardín","botella","zapato","estrella","reloj","pan","barco","lápiz"];

function NFE09LearningPhase({ paciente, onEncoded }) {
  const mayor=esModoMayor(paciente);
  const [phase,setPhase]=useState("study");
  const [trial,setTrial]=useState(0);
  const [input,setInput]=useState("");
  const learning=useRef([]);
  const interferenceRecord=useRef(null);
  const started=useRef(Date.now());

  const targetWords = NF_E09_TARGETS;
  const interference = NF_E09_INTERFERENCE;

  const registerRecall=(kind)=>{
    const words=splitRecallWords(input);
    if(kind==="learning"){
      learning.current.push({
        correct:countUniqueTargets(words,targetWords),
        intrusions:countIntrusions(words,targetWords),
        perseverations:countPerseverations(words)
      });
      if(trial<2){setTrial(t=>t+1);setInput("");setPhase("study");}
      else{setInput("");setPhase("interferenceStudy");}
      return;
    }
    if(kind==="interference"){
      const intRec={
        correct:countUniqueTargets(words,interference),
        intrusions:countIntrusions(words,interference),
        perseverations:countPerseverations(words)
      };
      setInput("");
      setPhase("immediate");
      interferenceRecord.current=intRec;
      return;
    }
    const immediate={
      words,
      correct:countUniqueTargets(words,targetWords),
      intrusions:countIntrusions(words,targetWords),
      perseverations:countPerseverations(words)
    };
    onEncoded({
      targets:targetWords,
      learning:[...learning.current],
      interference:interferenceRecord.current,
      immediate,
      taskVersionAdministered:"NF-E09-2.0",
      recognitionOrderId:"NF-E09-R2-FIXED-A",

      startedAt:new Date(started.current).toISOString(),
      delayStartedAt:Date.now(),
    });
  };

  const wordCard=(w,i)=><span key={`${w}-${i}`} style={{padding:mayor?"11px 14px":"9px 12px",borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff",fontWeight:700}}>{w}</span>;

  return <AssessmentTaskShell taskId="NF-E09" paciente={paciente} note="Lista original de NeuroFlex. Se realizan tres ensayos de aprendizaje, una lista interferente y evocación inmediata. La evocación diferida y el reconocimiento aparecerán después de otras tareas.">
    {phase==="study" && <div style={{textAlign:"center"}}>
      <Badge label={`APRENDIZAJE ${trial+1}/3`} color={COLORS.primary}/>
      <p style={{fontWeight:700}}>Memoriza estas palabras.</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:9,justifyContent:"center",margin:"18px 0"}}>{targetWords.map(wordCard)}</div>
      <BtnPrimary onClick={()=>{setInput("");setPhase("learningRecall")}}>Ya las memoricé</BtnPrimary>
    </div>}

    {phase==="learningRecall" && <div>
      <p style={{fontWeight:700}}>Escribe todas las palabras que recuerdes, separadas por espacios.</p>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4} style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,fontFamily:"inherit"}}/>
      <BtnPrimary onClick={()=>registerRecall("learning")} style={{width:"100%",marginTop:10}}>Confirmar recuerdo</BtnPrimary>
    </div>}

    {phase==="interferenceStudy" && <div style={{textAlign:"center"}}>
      <Badge label="LISTA INTERFERENTE" color={COLORS.warning}/>
      <p style={{fontWeight:700}}>Ahora memoriza esta lista diferente.</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:9,justifyContent:"center",margin:"18px 0"}}>{interference.map(wordCard)}</div>
      <BtnPrimary onClick={()=>{setInput("");setPhase("interferenceRecall")}}>Continuar</BtnPrimary>
    </div>}

    {phase==="interferenceRecall" && <div>
      <p style={{fontWeight:700}}>Escribe las palabras de la lista que acabas de ver.</p>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4} style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,fontFamily:"inherit"}}/>
      <BtnPrimary onClick={()=>registerRecall("interference")} style={{width:"100%",marginTop:10}}>Confirmar</BtnPrimary>
    </div>}

    {phase==="immediate" && <div>
      <p style={{fontWeight:700}}>Sin volver a verla, recuerda ahora la <strong>primera lista</strong>.</p>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4} style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,fontFamily:"inherit"}}/>
      <BtnPrimary onClick={()=>registerRecall("immediate")} style={{width:"100%",marginTop:10}}>Guardar y continuar</BtnPrimary>
    </div>}
  </AssessmentTaskShell>;
}

function NFE09DelayedPhase({ paciente, memoryData, onDone }) {
  const [phase,setPhase]=useState("recall");
  const [input,setInput]=useState("");
  const [selected,setSelected]=useState([]);
  const [delayed,setDelayed]=useState(null);
  const recognitionItems = [
    {word:NF_E09_TARGETS[0],target:true},{word:"mesa",target:false},
    {word:"flor",target:false},{word:NF_E09_TARGETS[1],target:true},
    {word:NF_E09_TARGETS[2],target:true},{word:"avión",target:false},
    {word:"queso",target:false},{word:NF_E09_TARGETS[3],target:true},
    {word:NF_E09_TARGETS[4],target:true},{word:"río",target:false},
    {word:"llave",target:false},{word:NF_E09_TARGETS[5],target:true},
    {word:NF_E09_TARGETS[6],target:true},{word:"perro",target:false},
    {word:"vaso",target:false},{word:NF_E09_TARGETS[7],target:true},
    {word:NF_E09_TARGETS[8],target:true},{word:"sombrero",target:false},
    {word:"carta",target:false},{word:NF_E09_TARGETS[9],target:true},
  ];

  const submitDelayed=()=>{
    const words=splitRecallWords(input);
    setDelayed({
      words,
      correct:countUniqueTargets(words,NF_E09_TARGETS),
      intrusions:countIntrusions(words,NF_E09_TARGETS),
      perseverations:countPerseverations(words)
    });
    setPhase("recognition");
  };

  const finish=()=>{
    const selectedSet=new Set(selected);
    const hits=recognitionItems.filter(x=>x.target&&selectedSet.has(x.word)).length;
    const falseAlarms=recognitionItems.filter(x=>!x.target&&selectedSet.has(x.word)).length;
    const learn=memoryData?.learning || [];
    const best=Math.max(...learn.map(x=>x.correct),0);
    const correctLearn=learn.reduce((s,x)=>s+x.correct,0);
    const learningTotal=NF_E09_TARGETS.length*learn.length;
    const delayedCorrect=delayed?.correct || 0;
    const totalIntrusions=learn.reduce((s,x)=>s+(x.intrusions||0),0)+(memoryData?.interference?.intrusions||0)+(memoryData?.immediate?.intrusions||0)+(delayed?.intrusions||0);
    const totalPersev=learn.reduce((s,x)=>s+(x.perseverations||0),0)+(memoryData?.interference?.perseverations||0)+(memoryData?.immediate?.perseverations||0)+(delayed?.perseverations||0);
    onDone(nfTaskResult("NF-E09",{
      precision:pctSafe(hits, NF_E09_TARGETS.length + falseAlarms),
      correct:hits,
      total:NF_E09_TARGETS.length,
      errors:(NF_E09_TARGETS.length-hits)+falseAlarms,
      omissions:NF_E09_TARGETS.length-hits,
      intrusions:totalIntrusions,
      perseverations:totalPersev,
      falseAlarms,
      blockPerformance:[
        ...learn.map(x=>pctSafe(x.correct,NF_E09_TARGETS.length)),
        pctSafe(memoryData?.immediate?.correct||0,NF_E09_TARGETS.length),
        pctSafe(delayedCorrect,NF_E09_TARGETS.length),
      ],
      retentionRate:best>0?Math.round((delayedCorrect/best)*100):null,
      latencyMs:memoryData?.delayStartedAt?Date.now()-memoryData.delayStartedAt:null,
      taskVersionAdministered:"NF-E09-2.0"
    },{
      notes:`Versión 2.0 · orden de reconocimiento NF-E09-R2-FIXED-A. Aprendizaje total ${correctLearn}/${learningTotal}; evocación inmediata ${memoryData?.immediate?.correct||0}/${NF_E09_TARGETS.length}; evocación diferida ${delayedCorrect}/${NF_E09_TARGETS.length}; reconocimiento ${hits}/${NF_E09_TARGETS.length}; falsas alarmas ${falseAlarms}.`
    }));
  };

  return <AssessmentTaskShell taskId="NF-E09" paciente={paciente} note="Esta parte aparece después de tareas intermedias para obtener una medida descriptiva de retención. No utiliza listas ni baremos RAVLT/CVLT.">
    {phase==="recall" && <div>
      <Badge label="EVOCACIÓN DIFERIDA" color={COLORS.primary}/>
      <p style={{fontWeight:700}}>Recuerda nuevamente todas las palabras que puedas de la primera lista.</p>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4} style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,fontFamily:"inherit"}}/>
      <BtnPrimary onClick={submitDelayed} style={{width:"100%",marginTop:10}}>Continuar a reconocimiento</BtnPrimary>
    </div>}
    {phase==="recognition" && <div>
      <Badge label="RECONOCIMIENTO" color={COLORS.info}/>
      <p style={{fontWeight:700}}>Selecciona únicamente las palabras que pertenecían a la primera lista.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
        {recognitionItems.map(x=><button key={x.word} onClick={()=>setSelected(s=>s.includes(x.word)?s.filter(w=>w!==x.word):[...s,x.word])}
          style={{padding:11,borderRadius:9,border:`2px solid ${selected.includes(x.word)?COLORS.primary:COLORS.border}`,background:selected.includes(x.word)?COLORS.primary+"10":"#fff",fontWeight:700}}>{x.word}</button>)}
      </div>
      <BtnPrimary onClick={finish} style={{width:"100%",marginTop:14}}>Finalizar aprendizaje verbal</BtnPrimary>
    </div>}
  </AssessmentTaskShell>;
}

function NFVisualMemoryShape({ kind, filled = false, size = 34 }) {
  const stroke=COLORS.primary;
  const fill=filled?COLORS.primary+"55":"#fff";
  const common={fill,stroke,strokeWidth:3.5,strokeLinecap:"round",strokeLinejoin:"round"};
  const style={width:size,height:size,display:"block"};
  if(kind==="circle") return <svg viewBox="0 0 50 50" style={style} aria-hidden="true"><circle cx="25" cy="25" r="15" {...common}/></svg>;
  if(kind==="triangle") return <svg viewBox="0 0 50 50" style={style} aria-hidden="true"><path d="M25 8 L43 40 H7 Z" {...common}/></svg>;
  if(kind==="diamond") return <svg viewBox="0 0 50 50" style={style} aria-hidden="true"><path d="M25 6 L44 25 L25 44 L6 25 Z" {...common}/></svg>;
  return <svg viewBox="0 0 50 50" style={style} aria-hidden="true"><rect x="9" y="9" width="32" height="32" rx="3" {...common}/></svg>;
}

function NFVisualMemoryCard({ item, size = 42 }) {
  const vertical=item.layout==="vertical";
  return <div style={{
    display:"flex",flexDirection:vertical?"column":"row",
    alignItems:"center",justifyContent:"center",
    gap:vertical?2:5,minHeight:size*1.7
  }}>
    <NFVisualMemoryShape kind={item.a} filled={!!item.fillA} size={size}/>
    <NFVisualMemoryShape kind={item.b} filled={!!item.fillB} size={size}/>
  </div>;
}

function NFE10VisualMemory({ paciente, onDone }) {
  const mayor=esModoMayor(paciente);

  const targets=[
    {id:"T1",a:"circle",b:"triangle",fillA:true,fillB:false,layout:"horizontal"},
    {id:"T2",a:"square",b:"diamond",fillA:false,fillB:true,layout:"horizontal"},
    {id:"T3",a:"triangle",b:"circle",fillA:true,fillB:false,layout:"vertical"},
    {id:"T4",a:"diamond",b:"square",fillA:true,fillB:false,layout:"vertical"},
    {id:"T5",a:"circle",b:"square",fillA:false,fillB:true,layout:"horizontal"},
    {id:"T6",a:"square",b:"triangle",fillA:true,fillB:false,layout:"vertical"},
    {id:"T7",a:"diamond",b:"circle",fillA:false,fillB:true,layout:"horizontal"},
    {id:"T8",a:"triangle",b:"diamond",fillA:false,fillB:true,layout:"vertical"},
  ];

  const distractors=[
    {id:"D1",a:"circle",b:"square",fillA:true,fillB:false,layout:"horizontal"},
    {id:"D2",a:"diamond",b:"triangle",fillA:true,fillB:false,layout:"horizontal"},
    {id:"D3",a:"circle",b:"triangle",fillA:false,fillB:true,layout:"vertical"},
    {id:"D4",a:"triangle",b:"square",fillA:true,fillB:false,layout:"horizontal"},
    {id:"D5",a:"diamond",b:"triangle",fillA:false,fillB:true,layout:"vertical"},
    {id:"D6",a:"square",b:"circle",fillA:true,fillB:false,layout:"vertical"},
    {id:"D7",a:"circle",b:"diamond",fillA:false,fillB:true,layout:"horizontal"},
    {id:"D8",a:"triangle",b:"circle",fillA:false,fillB:true,layout:"horizontal"},
  ];

  const recognitionItems=[
    {...targets[0],target:true},{...distractors[0],target:false},
    {...distractors[1],target:false},{...targets[1],target:true},
    {...targets[2],target:true},{...distractors[2],target:false},
    {...distractors[3],target:false},{...targets[3],target:true},
    {...targets[4],target:true},{...distractors[4],target:false},
    {...distractors[5],target:false},{...targets[5],target:true},
    {...targets[6],target:true},{...distractors[6],target:false},
    {...distractors[7],target:false},{...targets[7],target:true},
  ];

  const studySeconds=mayor?14:11;
  const versionId=mayor?"NF-E10-3.0-14s":"NF-E10-3.0-11s";
  const [phase,setPhase]=useState("study");
  const [seconds,setSeconds]=useState(studySeconds);
  const [selected,setSelected]=useState([]);
  const [fillerIndex,setFillerIndex]=useState(0);
  const fillerRecords=useRef([]);
  const start=useRef(Date.now());
  const filler=[8,3,6,5];

  useEffect(()=>{
    if(phase!=="study") return;
    const timer=setInterval(()=>setSeconds(s=>{
      if(s<=1){clearInterval(timer);setPhase("filler");return 0}
      return s-1;
    }),1000);
    return ()=>clearInterval(timer);
  },[phase]);

  const answerFiller=(saysEven)=>{
    const n=filler[fillerIndex];
    const correct=(n%2===0)===saysEven;
    fillerRecords.current.push({number:n,answer:saysEven?"par":"impar",correct});
    if(fillerIndex+1>=filler.length)setPhase("recognition");
    else setFillerIndex(i=>i+1);
  };

  const finish=()=>{
    const hits=recognitionItems.filter(i=>i.target&&selected.includes(i.id)).length;
    const falseAlarms=recognitionItems.filter(i=>!i.target&&selected.includes(i.id)).length;
    const fillerCorrect=fillerRecords.current.filter(r=>r.correct).length;
    onDone(nfTaskResult("NF-E10",{
      precision:pctSafe(hits,targets.length+falseAlarms),
      correct:hits,total:targets.length,errors:(targets.length-hits)+falseAlarms,
      omissions:targets.length-hits,falseAlarms,
      retentionRate:pctSafe(hits,targets.length),
      latencyMs:Date.now()-start.current,
      taskVersionAdministered:versionId
    },{
      notes:`Versión 3.0 · estímulos vectoriales propios · reconocimiento NF-E10-R3-FIXED-A · exposición ${studySeconds}s. Tarea intermedia par/impar: ${fillerCorrect}/${filler.length} correctas; se registra como contexto y no modifica la puntuación de memoria visual.`
    }));
  };

  return <AssessmentTaskShell taskId="NF-E10" paciente={paciente} note={`Versión 3.0: composiciones geométricas vectoriales propias de NeuroFlex, orden fijo de reconocimiento y exposición de ${studySeconds} segundos identificada en la versión administrada.`}>
    {phase==="study" && <div style={{textAlign:"center"}}>
      <Badge label={`MEMORIZA · ${seconds}s`} color={COLORS.primary}/>
      <p style={{fontWeight:700}}>Observa cuidadosamente estas configuraciones.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,maxWidth:500,margin:"18px auto"}}>
        {targets.map(item=><div key={item.id} style={{padding:mayor?15:12,borderRadius:12,border:`1px solid ${COLORS.border}`,background:"#fff"}}>
          <NFVisualMemoryCard item={item} size={mayor?44:36}/>
        </div>)}
      </div>
    </div>}

    {phase==="filler" && <div style={{textAlign:"center",padding:"16px 0"}}>
      <Badge label={`TAREA INTERMEDIA ${fillerIndex+1}/${filler.length}`} color={COLORS.warning}/>
      <p style={{fontWeight:700}}>Indica si el número central es par o impar.</p>
      <div style={{fontSize:"3rem",fontWeight:900,margin:24}}>{filler[fillerIndex]}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,maxWidth:420,margin:"0 auto"}}>
        <BtnPrimary onClick={()=>answerFiller(true)}>PAR</BtnPrimary>
        <BtnSecondary onClick={()=>answerFiller(false)}>IMPAR</BtnSecondary>
      </div>
    </div>}

    {phase==="recognition" && <div>
      <Badge label="RECONOCIMIENTO VISUAL" color={COLORS.info}/>
      <p style={{fontWeight:700}}>Selecciona únicamente las configuraciones que viste al inicio.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9}}>
        {recognitionItems.map(item=>{
          const active=selected.includes(item.id);
          return <button key={item.id} onClick={()=>setSelected(s=>s.includes(item.id)?s.filter(v=>v!==item.id):[...s,item.id])}
            aria-pressed={active}
            style={{padding:10,borderRadius:10,border:`2px solid ${active?COLORS.primary:COLORS.border}`,background:active?COLORS.primary+"10":"#fff",cursor:"pointer"}}>
            <NFVisualMemoryCard item={item} size={mayor?42:34}/>
          </button>;
        })}
      </div>
      <BtnPrimary onClick={finish} style={{width:"100%",marginTop:14}}>Finalizar memoria visual</BtnPrimary>
    </div>}
  </AssessmentTaskShell>;
}

function NFProspectiveCueIcon({ size = 92 }) {
  return <svg viewBox="0 0 120 120" style={{width:size,height:size,display:"block",margin:"0 auto"}} role="img" aria-label="Tarjeta con punto">
    <rect x="18" y="24" width="84" height="72" rx="12" fill="#fff" stroke={COLORS.primary} strokeWidth="5"/>
    <circle cx="60" cy="60" r="10" fill={COLORS.primary+"55"} stroke={COLORS.primary} strokeWidth="4"/>
  </svg>;
}

function NFE11ProspectiveEncode({ paciente, onEncoded }) {
  const mayor=esModoMayor(paciente);
  const [confirmed,setConfirmed]=useState(false);
  return <AssessmentTaskShell taskId="NF-E11" paciente={paciente} note="Versión 2.0: la intención se introduce ahora y se comprobará después de otras tareas. La señal visual no contiene el nombre de la acción.">
    <div style={{textAlign:"center",padding:"12px 0"}}>
      <Badge label="RECUERDA ESTO PARA DESPUÉS" color={COLORS.warning}/>
      <div style={{margin:"16px 0"}}><NFProspectiveCueIcon size={mayor?108:92}/></div>
      <p style={{fontWeight:750,lineHeight:1.6,maxWidth:540,margin:"0 auto"}}>
        Más adelante aparecerá esta <strong>tarjeta con un punto</strong>. Cuando la veas, recuerda <strong>tocar la tarjeta</strong>.
      </p>
      <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,margin:"22px 0 14px",fontSize:mayor?".95rem":".82rem"}}>
        <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
        Comprendí lo que debo recordar
      </label>
      <BtnPrimary disabled={!confirmed} onClick={()=>onEncoded({
        encodedAt:Date.now(),
        version:"NF-E11-2.0",
        cueId:"NF-E11-CARD-DOT-A",
        intendedAction:"touch_cue_card"
      })}>Continuar con otras tareas</BtnPrimary>
    </div>
  </AssessmentTaskShell>;
}

function NFE11ProspectiveRetrieve({ paciente, prospectiveData, onDone }) {
  const mayor=esModoMayor(paciente);
  const [phase,setPhase]=useState("event");
  const start=useRef(Date.now());

  const finish=(spontaneousRecall,cuedRecall,cueLevel)=>{
    const delaySeconds=Math.round((Date.now()-(prospectiveData?.encodedAt||Date.now()))/1000);
    onDone(nfTaskResult("NF-E11",{
      spontaneousRecall:spontaneousRecall?1:0,
      cuedRecall:cuedRecall?1:0,
      correct:spontaneousRecall||cuedRecall?1:0,
      total:1,
      errors:spontaneousRecall||cuedRecall?0:1,
      latencyMs:Date.now()-start.current,
      taskVersionAdministered:"NF-E11-2.0"
    },{
      notes:`Versión 2.0 · señal NF-E11-CARD-DOT-A · intervalo aproximado ${delaySeconds}s · recuperación ${spontaneousRecall?"espontánea":cuedRecall?`tras clave nivel ${cueLevel}`:"no recuperada"}.`
    }));
  };

  if(phase==="event") return <AssessmentTaskShell taskId="NF-E11" paciente={paciente} note="Se observa si la intención se ejecuta espontáneamente ante la señal prevista. La tarjeta es la señal y también el objetivo táctil.">
    <div style={{textAlign:"center"}}>
      <p style={{fontWeight:700}}>Última pantalla del bloque de memoria.</p>
      <button
        type="button"
        aria-label="Tarjeta con punto"
        onClick={()=>finish(true,false,0)}
        style={{display:"block",margin:"22px auto",padding:14,borderRadius:16,border:"none",background:"transparent",cursor:"pointer"}}
      >
        <NFProspectiveCueIcon size={mayor?120:100}/>
      </button>
      <BtnSecondary onClick={()=>setPhase("cue_general")}>Continuar</BtnSecondary>
    </div>
  </AssessmentTaskShell>;

  if(phase==="cue_general") return <AssessmentTaskShell taskId="NF-E11" paciente={paciente} note="Primera clave: pregunta por la existencia de una intención sin revelar su contenido.">
    <div style={{textAlign:"center"}}>
      <p style={{fontWeight:700}}>¿Había algo que debías recordar hacer cuando apareciera una señal durante esta evaluación?</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,maxWidth:420,margin:"18px auto 0"}}>
        <BtnPrimary onClick={()=>setPhase("cue_content")}>Sí</BtnPrimary>
        <BtnSecondary onClick={()=>finish(false,false,1)}>No</BtnSecondary>
      </div>
    </div>
  </AssessmentTaskShell>;

  return <AssessmentTaskShell taskId="NF-E11" paciente={paciente} note="Segunda clave: verifica el contenido de la intención y evita dar por válido únicamente recordar que existía un pendiente.">
    <div style={{textAlign:"center"}}>
      <p style={{fontWeight:700}}>¿Qué debías hacer cuando apareciera la tarjeta con un punto?</p>
      <div style={{display:"grid",gap:9,maxWidth:460,margin:"18px auto"}}>
        <BtnPrimary onClick={()=>finish(false,true,2)}>Tocar la tarjeta</BtnPrimary>
        <BtnSecondary onClick={()=>finish(false,false,2)}>Solo mirar la tarjeta</BtnSecondary>
        <BtnSecondary onClick={()=>finish(false,false,2)}>Esperar y continuar</BtnSecondary>
      </div>
    </div>
  </AssessmentTaskShell>;
}

function EvaluationV2Phase35Block({ paciente, onExit }) {
  const [step,setStep]=useState(0);
  const [results,setResults]=useState([]);
  const [verbalMemory,setVerbalMemory]=useState(null);
  const [prospective,setProspective]=useState(null);

  const pushResult=(r,nextStep)=>{setResults(x=>[...x,r]);setStep(nextStep)};

  if(step===0) return <NFE07ActiveSpan paciente={paciente} onDone={r=>pushResult(r,1)}/>;
  if(step===1) return <NFE08SpatialSpan paciente={paciente} onDone={r=>pushResult(r,2)}/>;
  if(step===2) return <NFE09LearningPhase paciente={paciente} onEncoded={data=>{setVerbalMemory(data);setStep(3)}}/>;
  if(step===3) return <NFE11ProspectiveEncode paciente={paciente} onEncoded={data=>{setProspective(data);setStep(4)}}/>;
  if(step===4) return <NFE10VisualMemory paciente={paciente} onDone={r=>pushResult(r,5)}/>;
  if(step===5) return <NFE09DelayedPhase paciente={paciente} memoryData={verbalMemory} onDone={r=>pushResult(r,6)}/>;
  if(step===6) return <NFE11ProspectiveRetrieve paciente={paciente} prospectiveData={prospective} onDone={r=>pushResult(r,7)}/>;

  return <div style={{maxWidth:860,margin:"0 auto"}}>
    <Card>
      <div style={{fontSize:".7rem",fontWeight:800,color:COLORS.primary,letterSpacing:".06em"}}>FASE 35 · BLOQUE DE MEMORIA</div>
      <h2 style={{margin:"6px 0"}}>NF-E07 a NF-E11 completados</h2>
      <p style={{color:COLORS.textMuted,lineHeight:1.6,fontSize:".82rem"}}>
        Este bloque separa memoria de trabajo, span visuoespacial, aprendizaje verbal, memoria visual y memoria prospectiva. Sigue siendo un bloque de prueba y todavía no se guarda como línea base NF‑EVAL‑2.0.
      </p>
      <div style={{marginTop:16}}>
        {results.map(r=><div key={r.taskId} style={{padding:"12px 0",borderBottom:`1px solid ${COLORS.border}`,display:"grid",gridTemplateColumns:"90px 1fr",gap:10}}>
          <strong>{r.taskId}</strong>
          <div style={{fontSize:".78rem",color:COLORS.textSecond}}>
            Precisión: {r.metrics?.precision ?? "—"}%
            {r.metrics?.levelReached!=null?` · Nivel máximo: ${r.metrics.levelReached}`:""}
            {r.metrics?.retentionRate!=null?` · Retención: ${r.metrics.retentionRate}%`:""}
            {r.metrics?.intrusions!=null?` · Intrusiones: ${r.metrics.intrusions}`:""}
            {r.metrics?.falseAlarms!=null?` · Falsas alarmas: ${r.metrics.falseAlarms}`:""}
            {r.metrics?.spontaneousRecall!=null?` · Recuerdo prospectivo espontáneo: ${r.metrics.spontaneousRecall?"sí":"no"}`:""}
          </div>
        </div>)}
      </div>
      <BtnPrimary onClick={onExit} style={{width:"100%",marginTop:20}}>Volver a evaluación</BtnPrimary>
    </Card>
  </div>;
}


// ─── FASE 36 · NF-E12–NF-E17 · LENGUAJE Y RAZONAMIENTO ─────────────────────
function NFNamingObject({ kind, size = 150 }) {
  const stroke=COLORS.primary;
  const common={fill:"none",stroke,strokeWidth:5,strokeLinecap:"round",strokeLinejoin:"round"};
  const style={display:"block",width:size,height:size,margin:"0 auto"};

  if(kind==="umbrella") return <svg viewBox="0 0 160 160" style={style} role="img" aria-label="Objeto para denominar">
    <path d="M25 75 Q80 25 135 75 Q122 65 108 75 Q94 65 80 75 Q66 65 52 75 Q38 65 25 75 Z" {...common}/>
    <path d="M80 75 V125 Q80 142 95 142 Q107 142 107 130" {...common}/>
  </svg>;

  if(kind==="anchor") return <svg viewBox="0 0 160 160" style={style} role="img" aria-label="Objeto para denominar">
    <circle cx="80" cy="28" r="12" {...common}/>
    <path d="M80 40 V120 M52 66 H108 M34 100 Q42 130 80 136 Q118 130 126 100 M34 100 L22 94 M126 100 L138 94" {...common}/>
  </svg>;

  if(kind==="bell") return <svg viewBox="0 0 160 160" style={style} role="img" aria-label="Objeto para denominar">
    <path d="M48 104 H112 Q104 92 104 66 Q104 40 80 40 Q56 40 56 66 Q56 92 48 104 Z" {...common}/>
    <path d="M67 112 Q80 130 93 112" {...common}/>
    <path d="M75 35 Q80 25 85 35" {...common}/>
  </svg>;

  if(kind==="key") return <svg viewBox="0 0 160 160" style={style} role="img" aria-label="Objeto para denominar">
    <circle cx="48" cy="70" r="24" {...common}/>
    <path d="M68 82 L125 125 M102 102 L118 86 M116 116 L132 100" {...common}/>
  </svg>;

  if(kind==="compass") return <svg viewBox="0 0 160 160" style={style} role="img" aria-label="Objeto para denominar">
    <circle cx="80" cy="80" r="52" {...common}/>
    <path d="M80 38 L97 91 L80 122 L63 69 Z" {...common}/>
    <circle cx="80" cy="80" r="5" fill={stroke}/>
  </svg>;

  if(kind==="feather") return <svg viewBox="0 0 160 160" style={style} role="img" aria-label="Objeto para denominar">
    <path d="M38 128 Q42 62 116 28 Q120 82 62 119 Q50 126 38 128 Z" {...common}/>
    <path d="M42 126 L104 48 M70 86 L52 78 M84 70 L103 67 M58 103 L43 99" {...common}/>
  </svg>;

  if(kind==="ladder") return <svg viewBox="0 0 160 160" style={style} role="img" aria-label="Objeto para denominar">
    <path d="M48 25 L38 136 M112 25 L122 136" {...common}/>
    {[48,68,88,108,128].map(y=><path key={y} d={`M46 ${y} H114`} {...common}/>)}
  </svg>;

  return <svg viewBox="0 0 160 160" style={style} role="img" aria-label="Objeto para denominar">
    <path d="M42 35 V95 Q42 125 70 125 Q96 125 96 98 V35 M42 35 H62 V82 Q62 96 76 96 Q90 96 90 82 V35 H110" {...common}/>
    <path d="M42 35 V22 H62 V35 M90 35 V22 H110 V35" {...common}/>
  </svg>;
}

function NFE12Naming({ paciente, onDone }) {
  const mayor=esModoMayor(paciente);
  const items=[
    {kind:"umbrella",answer:"paraguas",accepted:["paraguas","sombrilla"]},
    {kind:"anchor",answer:"ancla",accepted:["ancla"]},
    {kind:"bell",answer:"campana",accepted:["campana"]},
    {kind:"key",answer:"llave",accepted:["llave"]},
    {kind:"compass",answer:"brújula",accepted:["brujula"]},
    {kind:"feather",answer:"pluma",accepted:["pluma"]},
    {kind:"ladder",answer:"escalera",accepted:["escalera"]},
    {kind:"magnet",answer:"imán",accepted:["iman"]},
  ];
  const [idx,setIdx]=useState(0);
  const [input,setInput]=useState("");
  const records=useRef([]);
  const started=useRef(Date.now());

  const submit=()=>{
    const norm=normalizeRecallToken(input);
    const accepted=items[idx].accepted.map(normalizeRecallToken);
    const correct=accepted.includes(norm);
    records.current.push({
      correct,
      rt:Date.now()-started.current,
      response:input,
      stimulusId:`NF-E12-${items[idx].kind}`
    });
    if(idx+1>=items.length){
      const rs=records.current;
      const ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E12",{
        precision:pctSafe(ok,rs.length),
        correct:ok,total:rs.length,errors:rs.length-ok,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),
        medianResponseMs:medianNum(rs.map(r=>r.rt)),
        responseVariabilityMs:sdNum(rs.map(r=>r.rt)),
        taskVersionAdministered:"NF-E12-2.0"
      },{
        notes:"Versión 2.0 con ocho dibujos vectoriales originales NeuroFlex. La apariencia no depende de emojis o pictogramas del sistema operativo. Las respuestas se comparan con términos aceptados predefinidos y la interpretación sigue siendo descriptiva."
      }));
      return;
    }
    setIdx(i=>i+1);
    setInput("");
    started.current=Date.now();
  };

  return <AssessmentTaskShell taskId="NF-E12" paciente={paciente} note="Versión 2.0: dibujos vectoriales originales NeuroFlex. No utiliza láminas del Boston Naming Test ni pictogramas dependientes del dispositivo.">
    <div style={{textAlign:"center"}}>
      <p style={{fontWeight:700}}>Escribe el nombre del objeto.</p>
      <div style={{
        width:mayor?210:180,
        height:mayor?210:180,
        margin:"18px auto",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        borderRadius:16,
        border:`1px solid ${COLORS.border}`,
        background:"#fff"
      }}>
        <NFNamingObject kind={items[idx].kind} size={mayor?180:150}/>
      </div>
      <p style={{fontSize:".73rem",color:COLORS.textMuted}}>Elemento {idx+1}/{items.length}</p>
      <input
        autoFocus
        value={input}
        onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"&&input.trim())submit()}}
        placeholder="Nombre del objeto"
        style={{
          width:"100%",maxWidth:380,padding:13,borderRadius:10,
          border:`2px solid ${COLORS.border}`,
          fontSize:mayor?"1.15rem":"1rem",textAlign:"center"
        }}
      />
      <div><BtnPrimary disabled={!input.trim()} onClick={submit} style={{marginTop:12,minWidth:180}}>Confirmar</BtnPrimary></div>
    </div>
  </AssessmentTaskShell>;
}

function NFE13SemanticRelations({ paciente, onDone }) {
  const items=[
    {q:"¿Cuál pertenece a la misma categoría que MANZANA?",opts:["mesa","pera","reloj","camisa"],ans:1},
    {q:"LLAVE se relaciona con CERRADURA como CONTRASEÑA se relaciona con…",opts:["puerta","papel","cuenta","ventana"],ans:2},
    {q:"¿Cuál palabra se relaciona mejor con NAVEGAR?",opts:["almohada","tenedor","zapato","mapa"],ans:3},
    {q:"FRÍO es a ABRIGO como LLUVIA es a…",opts:["sombrilla","libro","vaso","silla"],ans:0},
    {q:"¿Cuál NO pertenece al grupo?",opts:["martillo","plátano","alicate","destornillador"],ans:1},
    {q:"MÉDICO se relaciona con HOSPITAL como DOCENTE se relaciona con…",opts:["mercado","estadio","escuela","puente"],ans:2},
    {q:"¿Cuál palabra se relaciona mejor con MEDIR?",opts:["regla","almohada","plato","bufanda"],ans:0},
    {q:"SEMILLA se relaciona con PLANTA como HUEVO se relaciona con…",opts:["nido","ave","rama","tierra"],ans:1},
  ];
  const [idx,setIdx]=useState(0);
  const records=useRef([]);
  const t=useRef(Date.now());
  const pick=(i)=>{
    records.current.push({correct:i===items[idx].ans,rt:Date.now()-t.current});
    if(idx+1>=items.length){
      const rs=records.current,ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E13",{
        precision:pctSafe(ok,rs.length),correct:ok,total:rs.length,errors:rs.length-ok,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),responseVariabilityMs:sdNum(rs.map(r=>r.rt)),
        taskVersionAdministered:"NF-E13-2.0"
      }));
      return;
    }
    setIdx(i=>i+1);t.current=Date.now();
  };
  return <AssessmentTaskShell taskId="NF-E13" paciente={paciente} note="Versión 2.0: relaciones semánticas y analogías originales NeuroFlex con posición de respuesta correcta distribuida; no reproduce reactivos WAIS.">
    <div>
      <p style={{fontSize:".74rem",color:COLORS.textMuted}}>Ítem {idx+1}/{items.length}</p>
      <p style={{fontWeight:750,lineHeight:1.6}}>{items[idx].q}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:9}}>
        {items[idx].opts.map((o,i)=><button key={o} onClick={()=>pick(i)} style={{padding:13,borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff",fontWeight:650,cursor:"pointer"}}>{o}</button>)}
      </div>
    </div>
  </AssessmentTaskShell>;
}

function NFE14Fluency({ paciente, onDone }) {
  const mayor=esModoMayor(paciente);
  const LIMIT=60;
  const [phase,setPhase]=useState("semantic_ready");
  const [semantic,setSemantic]=useState("");
  const [phonemic,setPhonemic]=useState("");
  const [secondsLeft,setSecondsLeft]=useState(LIMIT);
  const started=useRef(null);
  const phaseStarted=useRef(null);

  const analyze=(value)=>{
    const words=splitRecallWords(value);
    const normalized=words.map(w=>w.toLocaleLowerCase("es"));
    const unique=[...new Set(normalized)];
    return {words,uniqueCount:unique.length,perseverations:Math.max(0,words.length-unique.length)};
  };

  const finish=()=>{
    const a=analyze(semantic),b=analyze(phonemic);
    const totalUnique=a.uniqueCount+b.uniqueCount;
    const totalWords=a.words.length+b.words.length;
    onDone(nfTaskResult("NF-E14",{
      precision:null,
      correct:totalUnique,total:totalWords || null,
      perseverations:a.perseverations+b.perseverations,
      latencyMs:started.current?Date.now()-started.current:null,
      blockPerformance:[a.uniqueCount,b.uniqueCount],
      taskVersionAdministered:"NF-E14-2.0"
    },{
      requiresProfessionalReview:true,
      notes:`Versión 2.0 con 60 segundos por condición. Fluidez semántica: ${a.uniqueCount} respuestas únicas. Fluidez fonológica: ${b.uniqueCount} respuestas únicas. Repeticiones detectadas automáticamente: ${a.perseverations+b.perseverations}. La pertinencia de las respuestas y el posible efecto de la modalidad escrita requieren revisión profesional.`
    }));
  };

  const startTimed=(nextPhase)=>{
    if(!started.current) started.current=Date.now();
    phaseStarted.current=Date.now();
    setSecondsLeft(LIMIT);
    setPhase(nextPhase);
  };

  useEffect(()=>{
    if(phase!=="semantic_active" && phase!=="phonemic_active") return;
    const timer=setInterval(()=>{
      const elapsed=Math.floor((Date.now()-phaseStarted.current)/1000);
      const left=Math.max(0,LIMIT-elapsed);
      setSecondsLeft(left);
      if(left<=0){
        clearInterval(timer);
        if(phase==="semantic_active"){
          setSecondsLeft(LIMIT);
          setPhase("phonemic_ready");
        }else{
          setPhase("done");
        }
      }
    },250);
    return ()=>clearInterval(timer);
  },[phase]);

  useEffect(()=>{
    if(phase==="done") finish();
  },[phase]);

  return <AssessmentTaskShell taskId="NF-E14" paciente={paciente} note="Versión 2.0: cada condición dura 60 segundos. La app cuenta producciones y repeticiones; la pertinencia semántica/fonológica y el posible sesgo por escritura requieren revisión profesional.">
    {phase==="semantic_ready"&&<div style={{textAlign:"center"}}>
      <Badge label="FLUIDEZ SEMÁNTICA · 60 s" color={COLORS.primary}/>
      <p style={{fontWeight:700,lineHeight:1.6}}>Durante 60 segundos escribe tantos <strong>animales</strong> como puedas. Separa cada palabra con un espacio.</p>
      <BtnPrimary onClick={()=>startTimed("semantic_active")} style={{width:"100%",marginTop:10}}>Comenzar 60 segundos</BtnPrimary>
    </div>}

    {phase==="semantic_active"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <Badge label="FLUIDEZ SEMÁNTICA" color={COLORS.primary}/>
        <strong style={{fontSize:mayor?"1.25rem":"1rem",color:secondsLeft<=10?COLORS.warning:COLORS.textPrimary}}>{secondsLeft} s</strong>
      </div>
      <p style={{fontWeight:700,lineHeight:1.6}}>Animales:</p>
      <textarea autoFocus value={semantic} onChange={e=>setSemantic(e.target.value)} rows={mayor?7:6} style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,fontFamily:"inherit",fontSize:mayor?"1rem":".88rem"}}/>
      <p style={{fontSize:".7rem",color:COLORS.textMuted}}>La condición cambiará automáticamente cuando termine el tiempo.</p>
    </div>}

    {phase==="phonemic_ready"&&<div style={{textAlign:"center"}}>
      <Badge label="FLUIDEZ FONOLÓGICA · 60 s" color={COLORS.info}/>
      <p style={{fontWeight:700,lineHeight:1.6}}>Ahora tendrás otros 60 segundos para escribir palabras que comiencen por <strong>M</strong>. Evita nombres propios.</p>
      <BtnPrimary onClick={()=>startTimed("phonemic_active")} style={{width:"100%",marginTop:10}}>Comenzar segunda condición</BtnPrimary>
    </div>}

    {phase==="phonemic_active"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <Badge label="FLUIDEZ FONOLÓGICA" color={COLORS.info}/>
        <strong style={{fontSize:mayor?"1.25rem":"1rem",color:secondsLeft<=10?COLORS.warning:COLORS.textPrimary}}>{secondsLeft} s</strong>
      </div>
      <p style={{fontWeight:700,lineHeight:1.6}}>Palabras con M:</p>
      <textarea autoFocus value={phonemic} onChange={e=>setPhonemic(e.target.value)} rows={mayor?7:6} style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,fontFamily:"inherit",fontSize:mayor?"1rem":".88rem"}}/>
      <p style={{fontSize:".7rem",color:COLORS.textMuted}}>La tarea finalizará automáticamente al terminar el tiempo.</p>
    </div>}

    {phase==="done"&&<div style={{textAlign:"center",padding:24}}><p style={{fontWeight:750}}>Tiempo completado. Preparando el registro…</p></div>}
  </AssessmentTaskShell>;
}

function NFE15MatrixReasoning({ paciente, onDone }) {
  const items=[
    {grid:["●","○","●","○","●","?"],opts:["●","○","▲","■"],ans:1,rule:"alternancia"},
    {grid:["▲","▲▲","▲▲▲","■","■■","?"],opts:["■","▲▲▲","■■■","■■■■"],ans:2,rule:"incremento"},
    {grid:["○","●","○○","●●","○○○","?"],opts:["○○○○","●●","○●○","●●●"],ans:3,rule:"cantidad_tipo"},
    {grid:["▲","■","▲■","○","◆","?"],opts:["○◆","◆○◆","▲■","○○"],ans:0,rule:"combinacion"},
    {grid:["□","□□","□□□","◇","◇◇","?"],opts:["□□□","◇◇◇","◇◇","□□□□"],ans:1,rule:"progresion"},
    {grid:["●○","○●","●○","○●","●○","?"],opts:["●●","○○","○●","●○"],ans:2,rule:"alternancia_pares"},
  ];
  const [idx,setIdx]=useState(0);
  const records=useRef([]);
  const t=useRef(Date.now());
  const pick=(i)=>{
    records.current.push({correct:i===items[idx].ans,rt:Date.now()-t.current,rule:items[idx].rule});
    if(idx+1>=items.length){
      const rs=records.current,ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E15",{
        precision:pctSafe(ok,rs.length),correct:ok,total:rs.length,errors:rs.length-ok,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),medianResponseMs:medianNum(rs.map(r=>r.rt)),
        responseVariabilityMs:sdNum(rs.map(r=>r.rt)),taskVersionAdministered:"NF-E15-2.0"
      }));
      return;
    }
    setIdx(i=>i+1);t.current=Date.now();
  };
  return <AssessmentTaskShell taskId="NF-E15" paciente={paciente} note="Versión 2.0: matrices simbólicas originales NeuroFlex con posición de respuesta correcta distribuida; no son reactivos WAIS ni Raven.">
    <p style={{fontWeight:700}}>Identifica qué opción completa mejor el patrón.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,maxWidth:430,margin:"18px auto"}}>
      {items[idx].grid.map((x,i)=><div key={i} style={{minHeight:70,borderRadius:10,border:`1px solid ${COLORS.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.45rem",fontWeight:850,background:i===5?COLORS.bg:"#fff"}}>{x}</div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,maxWidth:500,margin:"0 auto"}}>
      {items[idx].opts.map((o,i)=><button key={i} onClick={()=>pick(i)} style={{padding:15,borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff",fontSize:"1.25rem",fontWeight:800}}>{o}</button>)}
    </div>
  </AssessmentTaskShell>;
}

function NFE16Similarities({ paciente, onDone }) {
  const items=[
    {q:"¿Qué tienen en común un tren y un autobús?",opts:["Tienen exactamente el mismo tamaño","Son medios de transporte","Siempre viajan por rieles","Se usan solo de noche"],ans:1},
    {q:"¿Qué tienen en común una brújula y un mapa?",opts:["Sirven para cocinar","Miden temperatura","Ayudan a orientarse","Son prendas de vestir"],ans:2},
    {q:"¿Qué tienen en común una promesa y un contrato?",opts:["Son objetos metálicos","Siempre son secretos","Son lugares","Implican un compromiso"],ans:3},
    {q:"¿Qué tienen en común una semilla y una idea?",opts:["Pueden desarrollarse con el tiempo","Pesan lo mismo","Se guardan siempre en cajas","Son alimentos"],ans:0},
    {q:"¿Qué tienen en común una regla y una norma?",opts:["Son animales","Orientan o delimitan una conducta","Solo existen en la escuela","Siempre están escritas"],ans:1},
    {q:"¿Qué tienen en común una causa y una explicación?",opts:["Son números","Son objetos para medir","Ayudan a comprender por qué ocurre algo","Son lugares físicos"],ans:2},
    {q:"¿Qué tienen en común un borrador y una revisión?",opts:["Siempre eliminan todo el contenido","Son lugares de trabajo","Solo se usan en matemáticas","Permiten modificar o mejorar algo antes de finalizarlo"],ans:3},
    {q:"¿Qué tienen en común una señal y una advertencia?",opts:["Comunican información para orientar una acción","Siempre son sonidos","Son alimentos","Solo aparecen en carreteras"],ans:0},
  ];
  const [idx,setIdx]=useState(0);
  const records=useRef([]);
  const t=useRef(Date.now());
  const pick=(i)=>{
    records.current.push({correct:i===items[idx].ans,rt:Date.now()-t.current});
    if(idx+1>=items.length){
      const rs=records.current,ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E16",{
        precision:pctSafe(ok,rs.length),correct:ok,total:rs.length,errors:rs.length-ok,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),responseVariabilityMs:sdNum(rs.map(r=>r.rt)),
        taskVersionAdministered:"NF-E16-2.0"
      },{notes:"Versión 2.0: tarea de abstracción conceptual con reactivos originales, respuesta cerrada y posición correcta distribuida. La modalidad cerrada sigue limitando la observación de formulación espontánea."}));
      return;
    }
    setIdx(i=>i+1);t.current=Date.now();
  };
  return <AssessmentTaskShell taskId="NF-E16" paciente={paciente} note="Versión 2.0: conceptos originales con alternativas balanceadas por posición. No reproduce reactivos ni criterios WAIS.">
    <p style={{fontSize:".74rem",color:COLORS.textMuted}}>Concepto {idx+1}/{items.length}</p>
    <p style={{fontWeight:750,lineHeight:1.6}}>{items[idx].q}</p>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {items[idx].opts.map((o,i)=><button key={i} onClick={()=>pick(i)} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff",textAlign:"left",fontWeight:620}}>{o}</button>)}
    </div>
  </AssessmentTaskShell>;
}

function NFE17Logic({ paciente, onDone }) {
  const items=[
    {type:"deductivo",q:"Todos los tulos son azules. Ningún objeto azul es rojo. ¿Puede un tulo ser rojo?",opts:["No","Sí","No se puede saber"],ans:0},
    {type:"inductivo",q:"2, 5, 8, 11, … ¿qué número sigue?",opts:["12","14","13","15"],ans:1},
    {type:"deductivo",q:"Si todas las cajas A tienen una etiqueta y esta caja es A, ¿qué podemos concluir?",opts:["Está vacía","Es grande","Tiene una etiqueta","No se puede concluir nada"],ans:2},
    {type:"cuantitativo",q:"Ana compra 3 artículos de $4 cada uno y paga con $20. ¿Cuánto cambio recibe?",opts:["$6","$10","$12","$8"],ans:3},
    {type:"inductivo",q:"A, C, E, G, … ¿qué letra sigue?",opts:["I","H","J","K"],ans:0},
    {type:"logico",q:"Si Marta llega antes que Luis, y Luis llega antes que Pedro, ¿quién llega último?",opts:["Marta","Pedro","Luis","No se puede saber"],ans:1},
  ];
  const [idx,setIdx]=useState(0);
  const records=useRef([]);
  const t=useRef(Date.now());
  const pick=(i)=>{
    records.current.push({correct:i===items[idx].ans,rt:Date.now()-t.current,type:items[idx].type});
    if(idx+1>=items.length){
      const rs=records.current,ok=rs.filter(r=>r.correct).length;
      const byType={};
      rs.forEach(r=>{byType[r.type]=byType[r.type]||{ok:0,n:0};byType[r.type].n++;if(r.correct)byType[r.type].ok++});
      onDone(nfTaskResult("NF-E17",{
        precision:pctSafe(ok,rs.length),correct:ok,total:rs.length,errors:rs.length-ok,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),responseVariabilityMs:sdNum(rs.map(r=>r.rt)),
        blockPerformance:Object.entries(byType).map(([type,v])=>({type,precision:pctSafe(v.ok,v.n)})),
        taskVersionAdministered:"NF-E17-2.0"
      },{notes:"Versión 2.0: problemas originales de razonamiento deductivo, inductivo y cuantitativo breve con posición de respuesta correcta distribuida."}));
      return;
    }
    setIdx(i=>i+1);t.current=Date.now();
  };
  return <AssessmentTaskShell taskId="NF-E17" paciente={paciente} note="Versión 2.0: problemas originales NeuroFlex con posición correcta distribuida. El rendimiento se describe por tipo de razonamiento y no como una medida global de inteligencia.">
    <Badge label={items[idx].type.toUpperCase()} color={COLORS.primary}/>
    <p style={{fontWeight:750,lineHeight:1.65,marginTop:15}}>{items[idx].q}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8}}>
      {items[idx].opts.map((o,i)=><button key={i} onClick={()=>pick(i)} style={{padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff",fontWeight:650}}>{o}</button>)}
    </div>
  </AssessmentTaskShell>;
}

function EvaluationV2Phase36Block({ paciente, onExit }) {
  const [step,setStep]=useState(0);
  const [results,setResults]=useState([]);
  const push=(r)=>{setResults(x=>[...x,r]);setStep(s=>s+1)};

  if(step===0)return <NFE12Naming paciente={paciente} onDone={push}/>;
  if(step===1)return <NFE13SemanticRelations paciente={paciente} onDone={push}/>;
  if(step===2)return <NFE14Fluency paciente={paciente} onDone={push}/>;
  if(step===3)return <NFE15MatrixReasoning paciente={paciente} onDone={push}/>;
  if(step===4)return <NFE16Similarities paciente={paciente} onDone={push}/>;
  if(step===5)return <NFE17Logic paciente={paciente} onDone={push}/>;

  return <div style={{maxWidth:860,margin:"0 auto"}}>
    <Card>
      <div style={{fontSize:".7rem",fontWeight:800,color:COLORS.primary,letterSpacing:".06em"}}>FASE 36 · LENGUAJE Y RAZONAMIENTO</div>
      <h2 style={{margin:"6px 0"}}>NF-E12 a NF-E17 completados</h2>
      <p style={{color:COLORS.textMuted,lineHeight:1.6,fontSize:".82rem"}}>
        Este bloque separa denominación, relaciones semánticas, fluidez, razonamiento matricial, abstracción conceptual y razonamiento lógico. Sigue siendo un bloque de prueba y no se guarda todavía como línea base NF‑EVAL‑2.0.
      </p>
      <div style={{marginTop:16}}>
        {results.map(r=><div key={r.taskId} style={{padding:"12px 0",borderBottom:`1px solid ${COLORS.border}`,display:"grid",gridTemplateColumns:"90px 1fr",gap:10}}>
          <strong>{r.taskId}</strong>
          <div style={{fontSize:".78rem",color:COLORS.textSecond}}>
            {typeof r.metrics?.precision==="number"?`Precisión: ${r.metrics.precision}%`:"Revisión profesional"}
            {r.metrics?.correct!=null?` · Respuestas registradas/correctas: ${r.metrics.correct}`:""}
            {r.metrics?.perseverations!=null?` · Repeticiones: ${r.metrics.perseverations}`:""}
          </div>
        </div>)}
      </div>
      <BtnPrimary onClick={onExit} style={{width:"100%",marginTop:20}}>Volver a evaluación</BtnPrimary>
    </Card>
  </div>;
}


// ─── FASE 37 · NF-E18–NF-E23 · EJECUTIVO, VISUOESPACIAL Y GNÓSICO ──────────
function NFE18PlanningRoute({ paciente, onDone }) {
  const levels=[
    {start:0,goal:8,blocked:[4],optimal:4},
    {start:6,goal:2,blocked:[4,7],optimal:4},
    {start:0,goal:7,blocked:[1,4],optimal:3},
  ];
  const [level,setLevel]=useState(0);
  const [pos,setPos]=useState(levels[0].start);
  const [moves,setMoves]=useState(0);
  const records=useRef([]);
  const t=useRef(Date.now());
  const firstMove=useRef(null);
  const neighbors=(p)=>[p-3,p+3,p%3?p-1:null,p%3<2?p+1:null].filter(x=>x!=null&&x>=0&&x<9);
  const move=(cell)=>{
    const cfg=levels[level];
    if(!neighbors(pos).includes(cell)||cfg.blocked.includes(cell))return;
    if(firstMove.current==null) firstMove.current=Date.now()-t.current;
    const nm=moves+1; setMoves(nm); setPos(cell);
    if(cell===cfg.goal){
      records.current.push({moves:nm,optimal:cfg.optimal,extra:Math.max(0,nm-cfg.optimal),latency:Date.now()-t.current,planningLatency:firstMove.current||0});
      if(level+1>=levels.length){
        const rs=records.current;
        onDone(nfTaskResult("NF-E18",{
          precision:Math.round(meanNum(rs.map(r=>Math.max(0,100-r.extra*20)))),
          correct:rs.filter(r=>r.extra===0).length,total:rs.length,
          errors:rs.reduce((s,r)=>s+r.extra,0),attempts:rs.reduce((s,r)=>s+r.moves,0),
          selfCorrections:rs.reduce((s,r)=>s+r.extra,0),
          meanResponseMs:meanNum(rs.map(r=>r.latency)),
          latencyMs:meanNum(rs.map(r=>r.planningLatency)),
          levelReached:rs.length,taskVersionAdministered:"NF-E18-1.0"
        },{notes:"Planificación digital original: se registran latencia antes del primer movimiento, movimientos totales y movimientos por encima de la ruta mínima."}));
      } else {
        const n=level+1; setLevel(n);setPos(levels[n].start);setMoves(0);firstMove.current=null;t.current=Date.now();
      }
    }
  };
  const cfg=levels[level];
  return <AssessmentTaskShell taskId="NF-E18" paciente={paciente} note="Mecánica original inspirada conceptualmente en paradigmas de planificación tipo Torre/BANFE. No reproduce sus reactivos ni puntuaciones.">
    <p style={{fontWeight:700}}>Lleva ● hasta ★ usando la menor cantidad de movimientos. No puedes pasar por las casillas bloqueadas.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,maxWidth:360,margin:"18px auto"}}>
      {Array.from({length:9},(_,i)=><button key={i} onClick={()=>move(i)} style={{aspectRatio:"1",borderRadius:12,border:`2px solid ${i===pos?COLORS.primary:COLORS.border}`,background:cfg.blocked.includes(i)?COLORS.bg:"#fff",fontSize:"1.7rem",fontWeight:800}}>{cfg.blocked.includes(i)?"×":i===pos?"●":i===cfg.goal?"★":""}</button>)}
    </div>
    <p style={{fontSize:".75rem",color:COLORS.textMuted,textAlign:"center"}}>Problema {level+1}/{levels.length} · movimientos: {moves}</p>
  </AssessmentTaskShell>;
}

function NFE19FunctionalSequence({ paciente, onDone }) {
  const items=[
    {title:"Preparar una bebida caliente",steps:["Servir la bebida","Calentar el agua","Colocar la bebida en la taza","Beber"],answer:["Calentar el agua","Colocar la bebida en la taza","Servir la bebida","Beber"]},
    {title:"Salir de casa",steps:["Cerrar la puerta","Tomar las llaves","Salir","Verificar que llevas lo necesario"],answer:["Verificar que llevas lo necesario","Tomar las llaves","Salir","Cerrar la puerta"]},
    {title:"Enviar un documento",steps:["Adjuntar el archivo","Escribir el mensaje","Enviar","Abrir un nuevo correo"],answer:["Abrir un nuevo correo","Escribir el mensaje","Adjuntar el archivo","Enviar"]},
  ];
  const [idx,setIdx]=useState(0); const [chosen,setChosen]=useState([]);
  const rec=useRef([]); const start=useRef(Date.now());
  const choose=(s)=>{if(!chosen.includes(s))setChosen(x=>[...x,s])};
  const undo=()=>setChosen(x=>x.slice(0,-1));
  const submit=()=>{
    const ans=items[idx].answer; const seqErr=chosen.filter((x,i)=>x!==ans[i]).length;
    rec.current.push({correct:seqErr===0,sequenceErrors:seqErr,rt:Date.now()-start.current});
    if(idx+1>=items.length){
      const rs=rec.current,ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E19",{precision:pctSafe(ok,rs.length),correct:ok,total:rs.length,errors:rs.length-ok,sequenceErrors:rs.reduce((s,r)=>s+r.sequenceErrors,0),selfCorrections:null,meanResponseMs:meanNum(rs.map(r=>r.rt)),taskVersionAdministered:"NF-E19-1.0"},{notes:"Secuencias funcionales originales. La tarea describe organización secuencial digital y no permite diagnosticar apraxia."}));
    } else {setIdx(i=>i+1);setChosen([]);start.current=Date.now()}
  };
  const remaining=items[idx].steps.filter(s=>!chosen.includes(s));
  return <AssessmentTaskShell taskId="NF-E19" paciente={paciente} note="Secuenciación cotidiana original; se interpreta con cautela porque una tarea digital no sustituye evaluación práxica presencial.">
    <p style={{fontWeight:750}}>{items[idx].title}</p>
    <p style={{fontSize:".78rem",color:COLORS.textMuted}}>Toca los pasos en el orden correcto.</p>
    <div style={{padding:12,borderRadius:10,background:COLORS.bg,minHeight:48,marginBottom:10}}>{chosen.length?chosen.map((x,i)=><span key={x} style={{display:"inline-block",margin:"3px",padding:"6px 8px",background:"#fff",borderRadius:8,border:`1px solid ${COLORS.border}`}}>{i+1}. {x}</span>):"Tu secuencia aparecerá aquí"}</div>
    <div style={{display:"grid",gap:8}}>{remaining.map(s=><button key={s} onClick={()=>choose(s)} style={{padding:11,borderRadius:9,border:`1px solid ${COLORS.border}`,background:"#fff",textAlign:"left"}}>{s}</button>)}</div>
    <div style={{display:"flex",gap:8,marginTop:12}}><BtnSecondary disabled={!chosen.length} onClick={undo}>Deshacer</BtnSecondary><BtnPrimary disabled={chosen.length!==items[idx].steps.length} onClick={submit} style={{flex:1}}>Confirmar orden</BtnPrimary></div>
  </AssessmentTaskShell>;
}

function NFGridShape({ cells = [], rotation = 0, mirrored = false, size = 118 }) {
  const cell=size/3;
  return <div style={{
    width:size,height:size,position:"relative",margin:"0 auto",
    transform:`rotate(${rotation}deg) scaleX(${mirrored?-1:1})`,
    transformOrigin:"center center"
  }}>
    {cells.map(([r,c],i)=><span key={`${r}_${c}_${i}`} style={{
      position:"absolute",
      left:c*cell+2,top:r*cell+2,
      width:cell-4,height:cell-4,
      borderRadius:Math.max(4,size/24),
      border:`2px solid ${COLORS.primary}`,
      background:COLORS.primary+"22",
      boxSizing:"border-box"
    }}/>)}
  </div>;
}

function NFE20MentalRotation({ paciente, onDone }) {
  const mayor=esModoMayor(paciente);
  const shapes={
    stair:[[0,0],[1,0],[1,1],[2,1]],
    hook:[[0,0],[1,0],[2,0],[2,1]],
    zig:[[0,0],[0,1],[1,1],[1,2]],
    chair:[[0,0],[1,0],[1,1],[1,2]],
    corner:[[0,0],[1,0],[2,0],[2,1],[2,2]],
    fork:[[0,1],[1,0],[1,1],[1,2],[2,1]],
  };
  const items=[
    {shape:"stair",baseRot:0,opts:[
      {rotation:90,mirrored:false},{rotation:90,mirrored:true},{shape:"hook",rotation:90},{shape:"zig",rotation:180}
    ],ans:0},
    {shape:"hook",baseRot:0,opts:[
      {shape:"chair",rotation:90},{rotation:180,mirrored:false},{rotation:180,mirrored:true},{shape:"corner",rotation:270}
    ],ans:1},
    {shape:"zig",baseRot:90,opts:[
      {rotation:270,mirrored:true},{shape:"stair",rotation:180},{rotation:270,mirrored:false},{shape:"hook",rotation:90}
    ],ans:2},
    {shape:"chair",baseRot:180,opts:[
      {shape:"fork",rotation:0},{rotation:90,mirrored:true},{shape:"corner",rotation:90},{rotation:90,mirrored:false}
    ],ans:3},
    {shape:"corner",baseRot:270,opts:[
      {rotation:90,mirrored:false},{shape:"chair",rotation:270},{rotation:90,mirrored:true},{shape:"hook",rotation:180}
    ],ans:0},
    {shape:"fork",baseRot:0,opts:[
      {shape:"corner",rotation:180},{rotation:180,mirrored:false},{shape:"zig",rotation:90},{rotation:90,mirrored:true}
    ],ans:1},
  ];
  const [idx,setIdx]=useState(0);
  const rec=useRef([]);
  const t=useRef(Date.now());

  const pick=(i)=>{
    rec.current.push({correct:i===items[idx].ans,rt:Date.now()-t.current,selected:i});
    if(idx+1>=items.length){
      const rs=rec.current,ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E20",{
        precision:pctSafe(ok,rs.length),
        correct:ok,total:rs.length,errors:rs.length-ok,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),
        medianResponseMs:medianNum(rs.map(r=>r.rt)),
        responseVariabilityMs:sdNum(rs.map(r=>r.rt)),
        taskVersionAdministered:"NF-E20-2.0"
      },{
        notes:"Versión 2.0 con figuras de retícula dibujadas por NeuroFlex. La alternativa correcta conserva la configuración y cambia únicamente la rotación; los distractores introducen reflexión o cambio estructural."
      }));
    }else{
      setIdx(i=>i+1);
      t.current=Date.now();
    }
  };

  const item=items[idx];
  const baseCells=shapes[item.shape];
  return <AssessmentTaskShell taskId="NF-E20" paciente={paciente} note="Versión 2.0: figuras geométricas propias construidas con una retícula visual. No utiliza caracteres Unicode ni reactivos de baterías comerciales.">
    <p style={{fontWeight:700}}>¿Cuál opción representa exactamente la misma forma después de girarla?</p>
    <div style={{padding:mayor?22:16,borderRadius:14,background:COLORS.bg,maxWidth:170,margin:"18px auto"}}>
      <NFGridShape cells={baseCells} rotation={item.baseRot} size={mayor?138:118}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(120px,1fr))",gap:10,maxWidth:560,margin:"0 auto"}}>
      {item.opts.map((o,i)=>{
        const cells=shapes[o.shape || item.shape];
        return <button key={i} type="button" onClick={()=>pick(i)} style={{
          padding:mayor?16:12,borderRadius:12,border:`1.5px solid ${COLORS.border}`,
          background:"#fff",cursor:"pointer",minHeight:mayor?176:150
        }}>
          <NFGridShape cells={cells} rotation={o.rotation || 0} mirrored={!!o.mirrored} size={mayor?126:104}/>
        </button>;
      })}
    </div>
    <p style={{fontSize:".68rem",color:COLORS.textMuted,textAlign:"center",marginTop:10}}>
      Una figura reflejada como en un espejo no cuenta como la misma rotación.
    </p>
  </AssessmentTaskShell>;
}

function NFE21Construction({ paciente, onDone }) {
  const patterns=[
    {target:[1,0,0,1],options:[[1,0,0,1],[1,1,0,0],[0,1,1,0],[1,0,1,0]],ans:0},
    {target:[1,1,0,1],options:[[0,1,1,1],[1,1,0,1],[1,0,1,1],[1,1,1,0]],ans:1},
    {target:[0,1,1,0],options:[[1,0,0,1],[0,1,1,0],[1,1,0,0],[0,0,1,1]],ans:1},
    {target:[1,0,1,1],options:[[1,1,1,0],[1,0,1,1],[0,1,1,1],[1,1,0,1]],ans:1},
  ];
  const [idx,setIdx]=useState(0);const rec=useRef([]);const t=useRef(Date.now());
  const mini=(arr)=><span style={{display:"grid",gridTemplateColumns:"repeat(2,22px)",gap:2,justifyContent:"center"}}>{arr.map((v,i)=><i key={i} style={{width:22,height:22,display:"block",border:`1px solid ${COLORS.border}`,background:v?COLORS.primary+"55":"#fff"}}/>)}</span>;
  const pick=(i)=>{
    rec.current.push({correct:i===patterns[idx].ans,rt:Date.now()-t.current});
    if(idx+1>=patterns.length){const rs=rec.current,ok=rs.filter(r=>r.correct).length;onDone(nfTaskResult("NF-E21",{precision:pctSafe(ok,rs.length),correct:ok,total:rs.length,errors:rs.length-ok,attempts:rs.length,meanResponseMs:meanNum(rs.map(r=>r.rt)),taskVersionAdministered:"NF-E21-1.0"},{notes:"Comparación visuoconstructiva digital original. No equivale a construcción manipulativa física."}))}
    else{setIdx(i=>i+1);t.current=Date.now()}
  };
  return <AssessmentTaskShell taskId="NF-E21" paciente={paciente} note="Configuraciones digitales originales inspiradas conceptualmente en tareas visuoconstructivas.">
    <p style={{fontWeight:700}}>Observa el modelo y elige la construcción idéntica.</p>
    <div style={{padding:20,borderRadius:12,background:COLORS.bg,maxWidth:120,margin:"16px auto"}}>{mini(patterns[idx].target)}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9}}>{patterns[idx].options.map((o,i)=><button key={i} onClick={()=>pick(i)} style={{padding:14,borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff"}}>{mini(o)}</button>)}</div>
  </AssessmentTaskShell>;
}

function NFClosureStimulus({ kind, size = 190 }) {
  const common={fill:"none",stroke:COLORS.primary,strokeWidth:7,strokeLinecap:"round",strokeLinejoin:"round"};
  const svgStyle={display:"block",margin:"0 auto",width:size,height:size};
  if(kind==="circle") return <svg viewBox="0 0 200 200" style={svgStyle} role="img" aria-label="Figura circular incompleta">
    <path d="M100 24 A76 76 0 0 1 168 66" {...common}/>
    <path d="M176 100 A76 76 0 0 1 134 168" {...common}/>
    <path d="M100 176 A76 76 0 0 1 32 134" {...common}/>
    <path d="M24 100 A76 76 0 0 1 66 32" {...common}/>
  </svg>;
  if(kind==="triangle") return <svg viewBox="0 0 200 200" style={svgStyle} role="img" aria-label="Figura triangular incompleta">
    <path d="M100 25 L132 80" {...common}/><path d="M146 104 L174 153" {...common}/>
    <path d="M162 166 L111 166" {...common}/><path d="M87 166 L37 166" {...common}/>
    <path d="M28 151 L55 104" {...common}/><path d="M68 81 L100 25" {...common}/>
  </svg>;
  if(kind==="square") return <svg viewBox="0 0 200 200" style={svgStyle} role="img" aria-label="Figura cuadrada incompleta">
    <path d="M34 34 H82" {...common}/><path d="M118 34 H166 V82" {...common}/>
    <path d="M166 118 V166 H118" {...common}/><path d="M82 166 H34 V118" {...common}/>
    <path d="M34 82 V58" {...common}/>
  </svg>;
  if(kind==="arrow") return <svg viewBox="0 0 200 200" style={svgStyle} role="img" aria-label="Figura de flecha incompleta">
    <path d="M100 24 L146 72" {...common}/><path d="M163 90 L100 90" {...common}/>
    <path d="M100 90 V164" {...common}/><path d="M78 164 V90" {...common}/>
    <path d="M78 90 H38" {...common}/><path d="M52 72 L100 24" {...common}/>
  </svg>;
  return <svg viewBox="0 0 200 200" style={svgStyle} role="img" aria-label="Figura de estrella incompleta">
    <path d="M100 24 L117 72" {...common}/><path d="M130 78 L181 80" {...common}/>
    <path d="M163 98 L125 128" {...common}/><path d="M119 141 L132 178" {...common}/>
    <path d="M107 157 L100 140 L91 164" {...common}/><path d="M72 178 L84 140" {...common}/>
    <path d="M75 128 L39 100" {...common}/><path d="M20 80 L70 78" {...common}/>
    <path d="M83 70 L100 24" {...common}/>
  </svg>;
}

function NFE22VisualClosure({ paciente, onDone }) {
  const mayor=esModoMayor(paciente);
  const items=[
    {kind:"circle",opts:["triángulo","círculo","flecha","cuadrado"],ans:1},
    {kind:"triangle",opts:["círculo","estrella","triángulo","cuadrado"],ans:2},
    {kind:"square",opts:["cuadrado","flecha","círculo","estrella"],ans:0},
    {kind:"arrow",opts:["estrella","cuadrado","flecha","círculo"],ans:2},
    {kind:"star",opts:["flecha","estrella","triángulo","círculo"],ans:1},
  ];
  const [idx,setIdx]=useState(0);
  const rec=useRef([]);
  const t=useRef(Date.now());

  const pick=(i)=>{
    rec.current.push({correct:i===items[idx].ans,rt:Date.now()-t.current,selected:i});
    if(idx+1>=items.length){
      const rs=rec.current,ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E22",{
        precision:pctSafe(ok,rs.length),
        correct:ok,total:rs.length,errors:rs.length-ok,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),
        medianResponseMs:medianNum(rs.map(r=>r.rt)),
        responseVariabilityMs:sdNum(rs.map(r=>r.rt)),
        taskVersionAdministered:"NF-E22-2.0"
      },{
        notes:"Versión 2.0 con figuras vectoriales incompletas propias de NeuroFlex. Los fragmentos se dibujan mediante SVG y no dependen de la fuente o símbolos instalados en el dispositivo."
      }));
    }else{
      setIdx(i=>i+1);
      t.current=Date.now();
    }
  };

  const item=items[idx];
  return <AssessmentTaskShell taskId="NF-E22" paciente={paciente} note="Versión 2.0: estímulos vectoriales propios con partes omitidas. La tarea describe cierre visual observado y no constituye diagnóstico de agnosia.">
    <p style={{fontWeight:700}}>Observa los fragmentos. ¿Qué figura formarían si estuviera completa?</p>
    <div style={{
      padding:mayor?18:12,background:COLORS.bg,borderRadius:14,
      maxWidth:mayor?260:230,margin:"18px auto",border:`1px solid ${COLORS.border}`
    }}>
      <NFClosureStimulus kind={item.kind} size={mayor?220:190}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:9,maxWidth:520,margin:"0 auto"}}>
      {item.opts.map((o,i)=><button key={i} onClick={()=>pick(i)} style={{
        padding:mayor?16:13,borderRadius:10,border:`1px solid ${COLORS.border}`,
        background:"#fff",fontWeight:700,fontSize:mayor?"1rem":".85rem",cursor:"pointer"
      }}>{o}</button>)}
    </div>
  </AssessmentTaskShell>;
}

function NFFigureGroundShape({ kind, size = 42, selected = false }) {
  const stroke=selected?COLORS.primary:COLORS.textSecond;
  const fill=selected?COLORS.primary+"18":"#fff";
  const common={fill,stroke,strokeWidth:4,strokeLinecap:"round",strokeLinejoin:"round"};
  const style={display:"block",width:size,height:size,margin:"0 auto"};
  if(kind==="circle") return <svg viewBox="0 0 60 60" style={style} aria-hidden="true"><circle cx="30" cy="30" r="18" {...common}/></svg>;
  if(kind==="triangle") return <svg viewBox="0 0 60 60" style={style} aria-hidden="true"><path d="M30 10 L50 47 H10 Z" {...common}/></svg>;
  if(kind==="diamond") return <svg viewBox="0 0 60 60" style={style} aria-hidden="true"><path d="M30 8 L52 30 L30 52 L8 30 Z" {...common}/></svg>;
  if(kind==="cross") return <svg viewBox="0 0 60 60" style={style} aria-hidden="true"><path d="M24 10 H36 V24 H50 V36 H36 V50 H24 V36 H10 V24 H24 Z" {...common}/></svg>;
  if(kind==="ring") return <svg viewBox="0 0 60 60" style={style} aria-hidden="true"><circle cx="30" cy="30" r="19" {...common}/><circle cx="30" cy="30" r="8" fill="#fff" stroke={stroke} strokeWidth="3"/></svg>;
  return <svg viewBox="0 0 60 60" style={style} aria-hidden="true"><path d="M12 18 H48 V42 H12 Z M21 9 V51 M39 9 V51" {...common}/></svg>;
}

function NFE23FigureGround({ paciente, onDone }) {
  const mayor=esModoMayor(paciente);
  const trials=[
    {
      target:"triangle",
      grid:["circle","diamond","cross","triangle","ring","circle","diamond","cross","circle","ring","diamond","circle"],
      count:1
    },
    {
      target:"circle",
      grid:["ring","circle","diamond","cross","circle","ring","cross","circle","diamond","ring","cross","diamond","circle","ring","diamond","cross"],
      count:4
    },
    {
      target:"diamond",
      grid:["ring","cross","diamond","circle","ring","diamond","cross","circle","diamond","ring","cross","circle","ring","cross","diamond","circle","ring","cross","circle","diamond"],
      count:5
    },
  ];
  const labels={
    circle:"círculo",
    triangle:"triángulo",
    diamond:"rombo",
    cross:"cruz",
    ring:"anillo",
    grid:"rejilla",
  };
  const [idx,setIdx]=useState(0);
  const [selected,setSelected]=useState([]);
  const rec=useRef([]);
  const t=useRef(Date.now());

  const toggle=(i)=>{
    setSelected(s=>s.includes(i)?s.filter(v=>v!==i):[...s,i]);
  };

  const finishTrial=()=>{
    const tr=trials[idx];
    const hits=selected.filter(i=>tr.grid[i]===tr.target).length;
    const commissions=selected.filter(i=>tr.grid[i]!==tr.target).length;
    const omissions=Math.max(0,tr.count-hits);
    rec.current.push({
      hits,commissions,omissions,
      rt:Date.now()-t.current,
      totalTargets:tr.count,
      selectedCount:selected.length
    });

    if(idx+1>=trials.length){
      const rs=rec.current;
      const correct=rs.reduce((s,r)=>s+r.hits,0);
      const targets=rs.reduce((s,r)=>s+r.totalTargets,0);
      const comm=rs.reduce((s,r)=>s+r.commissions,0);
      const om=rs.reduce((s,r)=>s+r.omissions,0);
      onDone(nfTaskResult("NF-E23",{
        precision:pctSafe(correct,targets+comm),
        correct,
        total:targets,
        errors:comm+om,
        omissions:om,
        commissions:comm,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),
        medianResponseMs:medianNum(rs.map(r=>r.rt)),
        responseVariabilityMs:sdNum(rs.map(r=>r.rt)),
        blockPerformance:rs.map(r=>pctSafe(r.hits,r.totalTargets+r.commissions)),
        taskVersionAdministered:"NF-E23-2.0"
      },{
        notes:"Versión 2.0 con formas vectoriales propias de NeuroFlex. La búsqueda figura-fondo registra aciertos, omisiones, comisiones y tiempo por bloque. El desempeño integra percepción visual, exploración y atención selectiva."
      }));
    }else{
      setIdx(i=>i+1);
      setSelected([]);
      t.current=Date.now();
    }
  };

  const tr=trials[idx];
  const cellSize=mayor?58:48;
  return <AssessmentTaskShell taskId="NF-E23" paciente={paciente} note="Versión 2.0: la escena utiliza formas vectoriales dibujadas por NeuroFlex, evitando símbolos dependientes de fuentes o del sistema operativo.">
    <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12}}>
      <p style={{fontWeight:700,margin:0}}>Marca todas las figuras iguales al modelo:</p>
      <div style={{padding:6,borderRadius:10,border:`2px solid ${COLORS.primary}`,background:COLORS.primary+"08"}}>
        <NFFigureGroundShape kind={tr.target} size={mayor?54:44}/>
      </div>
      <span style={{fontSize:".72rem",color:COLORS.textMuted}}>({labels[tr.target]})</span>
    </div>

    <div style={{
      display:"grid",
      gridTemplateColumns:"repeat(4,1fr)",
      gap:mayor?10:7,
      maxWidth:mayor?510:440,
      margin:"16px auto",
      padding:mayor?12:9,
      borderRadius:14,
      background:COLORS.bg,
      border:`1px solid ${COLORS.border}`
    }}>
      {tr.grid.map((kind,i)=>{
        const active=selected.includes(i);
        return <button
          key={i}
          type="button"
          aria-pressed={active}
          aria-label={`Figura ${i+1}`}
          onClick={()=>toggle(i)}
          style={{
            minHeight:cellSize+18,
            padding:8,
            borderRadius:10,
            border:`2px solid ${active?COLORS.primary:COLORS.border}`,
            background:active?COLORS.primary+"0D":"#fff",
            cursor:"pointer"
          }}
        >
          <NFFigureGroundShape kind={kind} size={cellSize} selected={active}/>
        </button>;
      })}
    </div>

    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:".7rem",color:COLORS.textMuted}}>Seleccionadas: {selected.length}</span>
      <BtnPrimary onClick={finishTrial}>Confirmar búsqueda</BtnPrimary>
    </div>
  </AssessmentTaskShell>;
}

function EvaluationV2Phase37Block({ paciente, onExit }) {
  const [step,setStep]=useState(0);const [results,setResults]=useState([]);
  const push=r=>{setResults(x=>[...x,r]);setStep(s=>s+1)};
  if(step===0)return <NFE18PlanningRoute paciente={paciente} onDone={push}/>;
  if(step===1)return <NFE19FunctionalSequence paciente={paciente} onDone={push}/>;
  if(step===2)return <NFE20MentalRotation paciente={paciente} onDone={push}/>;
  if(step===3)return <NFE21Construction paciente={paciente} onDone={push}/>;
  if(step===4)return <NFE22VisualClosure paciente={paciente} onDone={push}/>;
  if(step===5)return <NFE23FigureGround paciente={paciente} onDone={push}/>;
  return <div style={{maxWidth:860,margin:"0 auto"}}><Card>
    <div style={{fontSize:".7rem",fontWeight:800,color:COLORS.primary,letterSpacing:".06em"}}>FASE 37 · EJECUTIVO, VISUOESPACIAL Y GNÓSICO</div>
    <h2 style={{margin:"6px 0"}}>NF-E18 a NF-E23 completados</h2>
    <p style={{color:COLORS.textMuted,lineHeight:1.6,fontSize:".82rem"}}>Se registraron planificación, secuenciación, rotación mental, organización visuoconstructiva, cierre visual y figura-fondo. Este bloque sigue siendo de prueba y no se guarda todavía como línea base NF‑EVAL‑2.0.</p>
    {results.map(r=><div key={r.taskId} style={{padding:"11px 0",borderBottom:`1px solid ${COLORS.border}`,display:"grid",gridTemplateColumns:"85px 1fr",gap:10}}><strong>{r.taskId}</strong><span style={{fontSize:".78rem",color:COLORS.textSecond}}>Precisión: {r.metrics?.precision ?? "—"}% · Errores: {r.metrics?.errors ?? "—"}{r.metrics?.omissions!=null?` · Omisiones: ${r.metrics.omissions}`:""}{r.metrics?.commissions!=null?` · Comisiones: ${r.metrics.commissions}`:""}</span></div>)}
    <BtnPrimary onClick={onExit} style={{width:"100%",marginTop:18}}>Volver a evaluación</BtnPrimary>
  </Card></div>;
}


// ─── FASE 38 · NF-E24–NF-E27 · COGNICIÓN FUNCIONAL ─────────────────────────
function NFE24OrganizeDay({ paciente, onDone }) {
  const mayor=esModoMayor(paciente);
  const scenarios=[
    {
      title:"Mañana con citas",
      rules:["La cita médica es a las 10:00.","Debes desayunar antes de tomar el medicamento.","El trayecto hasta la cita tarda 30 minutos.","Debes llegar 15 minutos antes."],
      options:[
        "08:00 Desayunar → 08:30 medicamento → 09:15 salir → 09:45 llegar",
        "09:30 salir → 10:00 desayunar → 10:15 cita → medicamento",
        "08:30 medicamento → 09:00 desayunar → 09:45 salir → 10:15 llegar",
        "09:45 salir → 09:50 desayunar → 10:00 cita → medicamento"
      ],ans:0
    },
    {
      title:"Tarde de diligencias",
      rules:["El banco cierra a las 16:00.","La farmacia permanece abierta hasta las 20:00.","Debes recoger un documento antes de ir al banco.","Recoger el documento tarda 20 minutos."],
      options:["Farmacia → banco → documento","Documento → banco → farmacia","Banco → farmacia → documento","Farmacia → documento → banco después de las 16:00"],ans:1
    },
    {
      title:"Organizar una visita",
      rules:["La visita llega a las 18:00.","La comida tarda 45 minutos en prepararse.","Quieres terminar de ordenar antes de cocinar.","Ordenar tarda 30 minutos."],
      options:["17:30 ordenar → 18:00 cocinar","16:40 ordenar → 17:10 cocinar → 17:55 terminar","17:20 cocinar → 18:05 ordenar","18:00 ordenar → 18:30 cocinar"],ans:1
    }
  ];
  const [idx,setIdx]=useState(0);
  const rec=useRef([]);
  const t=useRef(Date.now());

  const pick=(i)=>{
    const sc=scenarios[idx];
    rec.current.push({correct:i===sc.ans,selectedIndex:i,correctIndex:sc.ans,rt:Date.now()-t.current});
    if(idx+1>=scenarios.length){
      const rs=rec.current,ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E24",{
        precision:pctSafe(ok,rs.length),correct:ok,total:rs.length,errors:rs.length-ok,
        attempts:rs.length,selfCorrections:0,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),
        medianResponseMs:medianNum(rs.map(r=>r.rt)),
        taskVersionAdministered:"NF-E24-2.0"
      },{notes:"Versión 2.0: cada escenario registra una única respuesta inicial y no ofrece retroalimentación correctiva durante la evaluación. Describe planificación funcional simulada dentro de NeuroFlex."}));
    }else{
      setIdx(i=>i+1);t.current=Date.now();
    }
  };
  const sc=scenarios[idx];
  return <AssessmentTaskShell taskId="NF-E24" paciente={paciente} note="Versión 2.0: se registra la primera elección en cada escenario, sin indicar durante la evaluación si fue correcta o incorrecta.">
    <Badge label={`ESCENARIO ${idx+1}/${scenarios.length}`} color={COLORS.primary}/>
    <h3 style={{margin:"12px 0 8px"}}>{sc.title}</h3>
    <div style={{padding:mayor?16:13,borderRadius:10,background:COLORS.bg}}>
      {sc.rules.map((r,i)=><div key={i} style={{margin:"5px 0",fontSize:mayor?".98rem":".82rem"}}>• {r}</div>)}
    </div>
    <p style={{fontWeight:700}}>¿Cuál plan cumple mejor todas las condiciones?</p>
    <div style={{display:"grid",gap:8}}>{sc.options.map((o,i)=><button key={i} onClick={()=>pick(i)} style={{padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff",textAlign:"left",lineHeight:1.5,fontWeight:620}}>{o}</button>)}</div>
  </AssessmentTaskShell>;
}

function NFE25SmartShopping({ paciente, onDone }) {
  const cases=[
    {budget:30,need:"1 pan, 2 leches y 1 fruta",options:[
      {label:"Pan $8 + 2 leches de $9 + fruta $6",cost:32,valid:false},
      {label:"Pan $6 + 1 leche $7 + fruta $5",cost:18,valid:false},
      {label:"Pan $6 + 2 leches de $7 + fruta $5",cost:25,valid:true},
      {label:"2 panes $12 + 2 leches $14 + fruta $7",cost:33,valid:false}],ans:2},
    {budget:50,need:"2 productos de aseo y 1 alimento",options:[
      {label:"Jabón $12 + arroz $10 + pasta $8",cost:30,valid:false},
      {label:"Jabón $12 + champú $24 + arroz $10",cost:46,valid:true},
      {label:"Champú $30 + crema $25 + arroz $10",cost:65,valid:false},
      {label:"Arroz $10 + pasta $8 + pan $6",cost:24,valid:false}],ans:1},
    {budget:40,need:"1 bebida, 1 alimento y conservar al menos $8",options:[
      {label:"Bebida $14 + alimento $20",cost:34,valid:false},
      {label:"Dos bebidas $18",cost:18,valid:false},
      {label:"Alimento $25 + bebida $10",cost:35,valid:false},
      {label:"Bebida $9 + alimento $18",cost:27,valid:true}],ans:3}
  ];
  const [idx,setIdx]=useState(0);
  const rec=useRef([]);
  const t=useRef(Date.now());

  const pick=(i)=>{
    const c=cases[idx],correct=i===c.ans;
    rec.current.push({correct,rt:Date.now()-t.current,selectedIndex:i,correctIndex:c.ans});
    if(idx+1>=cases.length){
      const rs=rec.current,ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E25",{
        precision:pctSafe(ok,rs.length),correct:ok,total:rs.length,errors:rs.length-ok,
        attempts:rs.length,
        meanResponseMs:meanNum(rs.map(r=>r.rt)),
        taskVersionAdministered:"NF-E25-2.0"
      },{
        notes:"Versión 2.0 con posiciones correctas balanceadas entre alternativas. Simulación con precios ficticios y restricciones originales NeuroFlex. No equivale a desempeño financiero cotidiano."
      }));
    }else{
      setIdx(i=>i+1);
      t.current=Date.now();
    }
  };

  const c=cases[idx];
  return <AssessmentTaskShell taskId="NF-E25" paciente={paciente} note="Versión 2.0: los precios son ficticios y la posición de la respuesta correcta varía entre casos para reducir sesgo por ubicación.">
    <Badge label={`PRESUPUESTO FICTICIO $${c.budget}`} color={COLORS.info}/>
    <p style={{fontWeight:750,lineHeight:1.6}}>Necesitas: {c.need}.</p>
    <p style={{fontSize:".78rem",color:COLORS.textMuted}}>Elige la opción que cumple todas las condiciones sin superar el presupuesto.</p>
    <div style={{display:"grid",gap:8}}>{c.options.map((o,i)=><button key={i} onClick={()=>pick(i)} style={{padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff",textAlign:"left",fontWeight:620}}>{o.label}</button>)}</div>
  </AssessmentTaskShell>;
}

function NFE26FollowInstructions({ paciente, onDone }) {
  const mayor=esModoMayor(paciente);
  const tasks=[
    {instruction:"Primero toca CÍRCULO, después CUADRADO y al final TRIÁNGULO.",expected:["CÍRCULO","CUADRADO","TRIÁNGULO"],buttons:["TRIÁNGULO","CÍRCULO","CUADRADO"]},
    {instruction:"Toca AZUL, luego VERDE, vuelve a AZUL y termina en ROJO.",expected:["AZUL","VERDE","AZUL","ROJO"],buttons:["ROJO","VERDE","AZUL"]},
    {instruction:"Empieza por 2, continúa con 4, después 1 y termina con 3.",expected:["2","4","1","3"],buttons:["1","2","3","4"]}
  ];
  const [idx,setIdx]=useState(0);
  const [seq,setSeq]=useState([]);
  const [edits,setEdits]=useState(0);
  const rec=useRef([]);
  const t=useRef(Date.now());

  const press=x=>setSeq(s=>s.length<tasks[idx].expected.length?[...s,x]:s);
  const undo=()=>{
    if(!seq.length)return;
    setSeq(s=>s.slice(0,-1));
    setEdits(e=>e+1);
  };
  const confirm=()=>{
    const task=tasks[idx],exp=task.expected;
    const omissions=Math.max(0,exp.length-seq.length);
    const compareLen=Math.min(seq.length,exp.length);
    const sequenceErrors=Array.from({length:compareLen},(_,i)=>seq[i]!==exp[i]?1:0).reduce((a,b)=>a+b,0);
    const correct=omissions===0&&sequenceErrors===0;
    rec.current.push({correct,sequenceErrors,omissions,selfCorrections:edits,rt:Date.now()-t.current});
    if(idx+1>=tasks.length){
      const rs=rec.current,ok=rs.filter(r=>r.correct).length;
      onDone(nfTaskResult("NF-E26",{
        precision:pctSafe(ok,rs.length),correct:ok,total:rs.length,errors:rs.length-ok,
        sequenceErrors:rs.reduce((s,r)=>s+r.sequenceErrors,0),
        omissions:rs.reduce((s,r)=>s+r.omissions,0),
        selfCorrections:rs.reduce((s,r)=>s+r.selfCorrections,0),
        meanResponseMs:meanNum(rs.map(r=>r.rt)),
        medianResponseMs:medianNum(rs.map(r=>r.rt)),
        taskVersionAdministered:"NF-E26-2.0"
      },{notes:"Versión 2.0: registra secuencia confirmada, omisiones y autocorrecciones mediante deshacer. Los errores pueden relacionarse con comprensión, mantenimiento o ejecución y requieren interpretación profesional."}));
    }else{
      setIdx(i=>i+1);setSeq([]);setEdits(0);t.current=Date.now();
    }
  };
  const task=tasks[idx];
  return <AssessmentTaskShell taskId="NF-E26" paciente={paciente} note="Versión 2.0: construye la secuencia y confirma cuando hayas terminado. Puedes deshacer el último toque antes de confirmar.">
    <Badge label={`INSTRUCCIÓN ${idx+1}/${tasks.length}`} color={COLORS.primary}/>
    <div style={{padding:mayor?18:16,borderRadius:10,background:COLORS.bg,fontWeight:750,lineHeight:1.7,margin:"14px 0",fontSize:mayor?"1rem":".88rem"}}>{task.instruction}</div>
    <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(4,task.buttons.length)},1fr)`,gap:9}}>
      {task.buttons.map(x=><button key={x} onClick={()=>press(x)} disabled={seq.length>=task.expected.length} style={{padding:15,borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff",fontWeight:800}}>{x}</button>)}
    </div>
    <div style={{margin:"14px 0",padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,minHeight:48}}>
      <div style={{fontSize:".7rem",color:COLORS.textMuted,marginBottom:5}}>Secuencia construida</div>
      <strong>{seq.length?seq.join(" → "):"Aún no has seleccionado pasos"}</strong>
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      <BtnSecondary onClick={undo} disabled={!seq.length}>Deshacer último</BtnSecondary>
      <BtnPrimary onClick={confirm}>Confirmar secuencia</BtnPrimary>
    </div>
    <p style={{fontSize:".72rem",color:COLORS.textMuted}}>Pasos seleccionados: {seq.length}/{task.expected.length} · autocorrecciones: {edits}</p>
  </AssessmentTaskShell>;
}

function NFE27FunctionalProspective({ paciente, onDone }) {
  const [phase,setPhase]=useState("encode");
  const [confirmed,setConfirmed]=useState(false);
  const [mini,setMini]=useState(0);
  const encodedAt=useRef(null);
  const eventStart=useRef(null);
  const miniErrors=useRef(0);

  const miniItems=[
    {q:"Una cita es a las 15:00 y el trayecto tarda 20 minutos. ¿Cuál salida es más segura?",opts:["14:30","14:55"],ans:0},
    {q:"Tienes $20 y compras algo de $12. ¿Cuánto queda?",opts:["$8","$10"],ans:0},
    {q:"Si debes llamar después de terminar una tarea, ¿qué ocurre primero?",opts:["Terminar la tarea","Hacer la llamada"],ans:0}
  ];

  const chooseMini=(i)=>{
    if(i!==miniItems[mini].ans){
      miniErrors.current+=1;
      return;
    }
    if(mini+1<miniItems.length)setMini(x=>x+1);
    else{
      setPhase("event");
      eventStart.current=Date.now();
    }
  };

  const finish=(spontaneous,cued=0)=>{
    onDone(nfTaskResult("NF-E27",{
      spontaneousRecall:spontaneous?1:0,
      cuedRecall:cued,
      correct:spontaneous||cued?1:0,total:1,errors:spontaneous||cued?0:1,
      latencyMs:eventStart.current?Date.now()-eventStart.current:null,
      taskVersionAdministered:"NF-E27-2.0"
    },{
      notes:`Versión 2.0. Intención mantenida durante ${encodedAt.current?Math.round((Date.now()-encodedAt.current)/1000):0} s. La señal de evento no mostró un botón textual con la respuesta. Errores en actividad intermedia: ${miniErrors.current}. La recuperación con clave verificó el contenido de la intención.`
    }));
  };

  if(phase==="encode")return <AssessmentTaskShell taskId="NF-E27" paciente={paciente} note="Versión 2.0: se registra una intención antes de una actividad intermedia y se comprueba posteriormente sin mostrar el nombre de la acción en el evento.">
    <div style={{textAlign:"center"}}>
      <Badge label="PENDIENTE PARA DESPUÉS" color={COLORS.warning}/>
      <p style={{fontWeight:750,lineHeight:1.7}}>Cuando más adelante aparezca un <strong>sobre ✉</strong>, recuerda <strong>tocar el sobre</strong> para registrar el pendiente.</p>
      <label style={{display:"flex",justifyContent:"center",gap:8,margin:18}}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Comprendí el pendiente</label>
      <BtnPrimary disabled={!confirmed} onClick={()=>{encodedAt.current=Date.now();setPhase("distractor")}}>Continuar</BtnPrimary>
    </div>
  </AssessmentTaskShell>;

  if(phase==="distractor"){
    const m=miniItems[mini];
    return <AssessmentTaskShell taskId="NF-E27" paciente={paciente} note="Actividad intermedia para mantener otra demanda mientras permanece una intención futura.">
      <p style={{fontWeight:750}}>{m.q}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        {m.opts.map((o,i)=><button key={i} onClick={()=>chooseMini(i)} style={{padding:14,borderRadius:10,border:`1px solid ${COLORS.border}`,background:"#fff",fontWeight:700}}>{o}</button>)}
      </div>
    </AssessmentTaskShell>;
  }

  if(phase==="event")return <AssessmentTaskShell taskId="NF-E27" paciente={paciente} note="Se observa si la intención se ejecuta espontáneamente ante la señal prevista. El sobre es la señal y también el objetivo táctil; no aparece una etiqueta textual que revele la respuesta.">
    <div style={{textAlign:"center"}}>
      <p style={{fontWeight:700}}>Has terminado la actividad.</p>
      <button
        type="button"
        aria-label="Sobre"
        onClick={()=>finish(true,0)}
        style={{display:"block",margin:"22px auto",fontSize:"4.2rem",background:"transparent",border:"none",cursor:"pointer",padding:14,borderRadius:16}}
      >✉</button>
      <BtnSecondary onClick={()=>setPhase("cue")}>Continuar</BtnSecondary>
    </div>
  </AssessmentTaskShell>;

  if(phase==="cue")return <AssessmentTaskShell taskId="NF-E27" paciente={paciente} note="Primera clave general: pregunta si existía una intención, sin revelar su contenido.">
    <div style={{textAlign:"center"}}>
      <p style={{fontWeight:750}}>¿Había algo que debías hacer cuando apareciera una señal durante esta actividad?</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,maxWidth:420,margin:"18px auto"}}>
        <BtnPrimary onClick={()=>setPhase("cue_content")}>Sí</BtnPrimary>
        <BtnSecondary onClick={()=>finish(false,0)}>No</BtnSecondary>
      </div>
    </div>
  </AssessmentTaskShell>;

  return <AssessmentTaskShell taskId="NF-E27" paciente={paciente} note="La segunda comprobación verifica si la persona recuerda el contenido de la intención y no solo que existía un pendiente.">
    <div style={{textAlign:"center"}}>
      <p style={{fontWeight:750}}>¿Qué debías hacer cuando apareciera el sobre?</p>
      <div style={{display:"grid",gap:9,maxWidth:460,margin:"18px auto"}}>
        <BtnPrimary onClick={()=>finish(false,1)}>Tocar el sobre para registrar el pendiente</BtnPrimary>
        <BtnSecondary onClick={()=>finish(false,0)}>Solo mirar el sobre</BtnSecondary>
        <BtnSecondary onClick={()=>finish(false,0)}>Esperar sin hacer nada</BtnSecondary>
      </div>
    </div>
  </AssessmentTaskShell>;
}

function EvaluationV2Phase38Block({ paciente, onExit }) {
  const [step,setStep]=useState(0);const [results,setResults]=useState([]);
  const push=r=>{setResults(x=>[...x,r]);setStep(s=>s+1)};
  if(step===0)return <NFE24OrganizeDay paciente={paciente} onDone={push}/>;
  if(step===1)return <NFE25SmartShopping paciente={paciente} onDone={push}/>;
  if(step===2)return <NFE26FollowInstructions paciente={paciente} onDone={push}/>;
  if(step===3)return <NFE27FunctionalProspective paciente={paciente} onDone={push}/>;
  return <div style={{maxWidth:860,margin:"0 auto"}}><Card>
    <div style={{fontSize:".7rem",fontWeight:800,color:COLORS.primary,letterSpacing:".06em"}}>FASE 38 · COGNICIÓN FUNCIONAL</div>
    <h2 style={{margin:"6px 0"}}>NF-E24 a NF-E27 completados</h2>
    <p style={{color:COLORS.textMuted,lineHeight:1.6,fontSize:".82rem"}}>Este bloque observa desempeño en situaciones funcionales simuladas: organización temporal, compras, seguimiento de instrucciones y memoria prospectiva en doble demanda. No demuestra automáticamente funcionamiento equivalente en la vida diaria.</p>
    {results.map(r=><div key={r.taskId} style={{padding:"11px 0",borderBottom:`1px solid ${COLORS.border}`,display:"grid",gridTemplateColumns:"85px 1fr",gap:10}}><strong>{r.taskId}</strong><span style={{fontSize:".78rem",color:COLORS.textSecond}}>{typeof r.metrics?.precision==="number"?`Precisión: ${r.metrics.precision}%`:"Medida específica"}{r.metrics?.errors!=null?` · Errores: ${r.metrics.errors}`:""}{r.metrics?.sequenceErrors!=null?` · Errores de secuencia: ${r.metrics.sequenceErrors}`:""}{r.metrics?.spontaneousRecall!=null?` · Pendiente espontáneo: ${r.metrics.spontaneousRecall?"sí":"no"}`:""}</span></div>)}
    <div style={{marginTop:16,padding:12,borderRadius:10,background:COLORS.bg,fontSize:".76rem",color:COLORS.textMuted,lineHeight:1.55}}>Con esta fase ya existen componentes funcionales para <strong>NF-E01 a NF-E27</strong>. Los bloques continúan separados deliberadamente hasta construir el protocolo completo, sus pausas, almacenamiento y perfil multidimensional.</div>
    <BtnPrimary onClick={onExit} style={{width:"100%",marginTop:18}}>Volver a evaluación</BtnPrimary>
  </Card></div>;
}


// ─── FASE 39 · PROTOCOLO INTEGRADO + PERFIL MULTIDIMENSIONAL ────────────────

const ASSESSMENT_PROFILE_VERSION = "NF-PROFILE-2.0";

function assessmentScoreFromTaskResult(result) {
  const m=result?.metrics||{};
  if(typeof m.precision==="number"&&Number.isFinite(m.precision)) return Math.max(0,Math.min(100,Math.round(m.precision)));
  if(m.spontaneousRecall!=null||m.cuedRecall!=null) return null;
  if(typeof m.correct==="number"&&typeof m.total==="number"&&m.total>0) return Math.max(0,Math.min(100,Math.round((m.correct/m.total)*100)));
  return null;
}
function assessmentPerformanceBand(score,evidenceQuality=null){
  if(typeof score!=="number"||Number.isNaN(score)) return {id:"review",label:"Revisión profesional",color:COLORS.accent};
  if(evidenceQuality==="limited") return {id:"review",label:"Evidencia limitada · revisar",color:COLORS.accent};
  if(score>=80)return {id:"strength",label:"Rendimiento relativamente alto observado",color:COLORS.success};
  if(score>=60)return {id:"intermediate",label:"Rendimiento intermedio observado",color:COLORS.warning};
  return {id:"difficulty",label:"Rendimiento relativamente bajo observado",color:COLORS.error};
}
function nfAssessmentEvidenceQuality({quantifiedPrimary=0,reviewCount=0,discrepant=false}={}){
  if(!quantifiedPrimary)return {id:"limited",label:"Evidencia limitada",reason:"No hay tareas primarias cuantificables automáticamente."};
  if(quantifiedPrimary===1)return {id:"limited",label:"Evidencia limitada",reason:"El dominio dispone de una sola tarea primaria cuantificable."};
  if(discrepant)return {id:"mixed",label:"Evidencia heterogénea",reason:"Las tareas primarias muestran diferencias internas amplias."};
  if(reviewCount>0)return {id:"mixed",label:"Variación interna entre resultados primarios",reason:"Parte de la evidencia requiere revisión profesional."};
  return {id:"multiple",label:"Múltiples fuentes primarias",reason:"El dominio dispone de más de una tarea primaria cuantificable."};
}
function buildAssessmentProfilesV2(taskResults=[]){
  const validResults=(taskResults||[]).filter(Boolean),domainBuckets={};
  validResults.forEach(result=>{
    const def=getAssessmentTaskDefinition(result.taskId);if(!def)return;
    const domainId=def.primaryDomain,score=assessmentScoreFromTaskResult(result);
    if(!domainBuckets[domainId])domainBuckets[domainId]={domainId,taskEvidence:[],professionalReviewTasks:[],secondaryEvidenceFrom:[]};
    const evidence={taskId:result.taskId,taskName:def.name,score,metrics:result.metrics,processes:[...(def.processes||[])],requiresProfessionalReview:!!result.requiresProfessionalReview||score===null,taskVersionId:getAdministeredTaskVersionId(result)};
    domainBuckets[domainId].taskEvidence.push(evidence);
    if(evidence.requiresProfessionalReview)domainBuckets[domainId].professionalReviewTasks.push(result.taskId);
    (def.secondaryDomains||[]).forEach(sec=>{
      if(!domainBuckets[sec])domainBuckets[sec]={domainId:sec,taskEvidence:[],professionalReviewTasks:[],secondaryEvidenceFrom:[]};
      domainBuckets[sec].secondaryEvidenceFrom.push({taskId:result.taskId,taskName:def.name,primaryDomain:domainId,score});
    });
  });
  const processProfile=[];
  const domainProfile=Object.values(domainBuckets).map(d=>{
    const quantified=d.taskEvidence.filter(e=>nfFinite(e.score)),taskScores=quantified.map(e=>e.score);
    const descriptiveIndex=taskScores.length?Math.round(meanNum(taskScores)):null;
    const spread=taskScores.length>1?Math.max(...taskScores)-Math.min(...taskScores):null;
    const quality=nfAssessmentEvidenceQuality({quantifiedPrimary:quantified.length,reviewCount:d.professionalReviewTasks.length,discrepant:nfFinite(spread)&&spread>=ASSESSMENT_INTERNAL_HEURISTICS.discrepancyRange});
    const processIds=[...new Set(d.taskEvidence.flatMap(e=>e.processes||[]))];
    const processes=processIds.map(processId=>{
      const evidence=d.taskEvidence.filter(e=>(e.processes||[]).includes(processId)),numeric=evidence.filter(e=>nfFinite(e.score));
      const processIndex=numeric.length>=2?Math.round(meanNum(numeric.map(e=>e.score))):null,processQuality=numeric.length>=2?"multiple":"limited";
      const item={id:`${d.domainId}:${processId}`,domainId:d.domainId,processId,evidence:evidence.map(e=>({taskId:e.taskId,taskName:e.taskName,score:e.score})),descriptiveIndex:processIndex,band:assessmentPerformanceBand(processIndex,processQuality).id,evidenceCount:numeric.length,evidenceQuality:processQuality,provisional:true};
      processProfile.push(item);return item;
    });
    return {...d,label:ASSESSMENT_DOMAINS_V2[d.domainId]?.label||d.domainId,descriptiveIndex,band:assessmentPerformanceBand(descriptiveIndex,quality.id).id,evidenceQuality:quality,primaryTaskSpread:spread,processes,quantifiedTaskCount:quantified.length,reviewTaskCount:d.professionalReviewTasks.length,provisional:true};
  }).sort((a,b)=>{const order=Object.keys(ASSESSMENT_DOMAINS_V2);return order.indexOf(a.domainId)-order.indexOf(b.domainId)});
  return {processProfile,domainProfile};
}

const ASSESSMENT_TO_INTERVENTION_BRIDGE = {
  memoria_trabajo:["memoria_trabajo"],
  memoria_episodica:["memoria_verbal","memoria_visual","memoria_prospectiva"],
  atencion:["atencion"],
  funciones_exec:["inhibicion","planificacion","praxias"],
  velocidad_proc:["velocidad_proc"],
  lenguaje:["lenguaje"],
  percepcion_visual:["visuoespacial","gnosias"],
  orientacion:["orientacion"],
  razonamiento:["razonamiento"],
  flexibilidad:["flexibilidad"],
};

function buildLegacyInterventionBridge(domainProfile = []) {
  const byId = Object.fromEntries((domainProfile || []).map(d => [d.domainId,d]));
  return Object.entries(ASSESSMENT_TO_INTERVENTION_BRIDGE).map(([legacyId, sourceIds]) => {
    const sources = sourceIds
      .map(id => byId[id])
      .filter(Boolean);
    const scores = sources
      .map(s => s.descriptiveIndex)
      .filter(v => typeof v === "number" && Number.isFinite(v));
    return {
      id:legacyId,
      pct:scores.length ? Math.round(meanNum(scores)) : null,
      requiresReview:!scores.length,
      assessmentBridge:true,
      sourceAssessmentDomains:sourceIds,
      exName:"Evaluation v2 · puente de compatibilidad",
    };
  });
}

function makeFullAssessmentRecordV2({ taskResults, familiarization, pauses, interruptions, startedAt }) {
  const profiles = buildAssessmentProfilesV2(taskResults);
  const interpretation=buildAssessmentInterpretationV2(taskResults || [], profiles.domainProfile);
  const date = new Date().toISOString();
  return {
    assessmentVersion:NEUROFLEX_ASSESSMENT_VERSION,
    assessmentSchemaVersion:NEUROFLEX_ASSESSMENT_SCHEMA_VERSION,
    assessmentProfileVersion:ASSESSMENT_PROFILE_VERSION,
    assessmentInterpretationVersion:ASSESSMENT_INTERPRETATION_VERSION,
    assessmentRecommendationVersion:ASSESSMENT_RECOMMENDATION_VERSION,
    taskVersionPolicy:ASSESSMENT_TASK_VERSION_POLICY,
    taskVersionRegistry:getAssessmentTaskVersionRegistrySnapshot(),
    assessmentMode:"full",
    assessmentProtocol:"NF-E01-NF-E27-full",
    taskResults:[...(taskResults || [])],
    processProfile:profiles.processProfile,
    domainProfile:profiles.domainProfile,
    interpretation,
    interventionRecommendations:buildAssessmentInterventionRecommendationsV2(
      taskResults || [],
      profiles.domainProfile,
      interpretation
    ),
    administration:{
      familiarization:familiarization || null,
      pauses:pauses || [],
      interruptions:interruptions || [],
      startedAt:startedAt || null,
      completedAt:date,
      taskCount:(taskResults || []).length,
    },
    // Puente conservador para los módulos terapéuticos antiguos.
    // No representa la nueva taxonomía completa y no se usa para interpretar Evaluation v2.
    hist:buildLegacyInterventionBridge(profiles.domainProfile),
    globalPct:null,
    date,
    seconds:startedAt ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000) : null,
    evaluationId:makeEvaluationId(date),
    evaluationVersion:NEUROFLEX_EVALUATION_VERSION,
    validityStatus:"valid",
    validityReason:"",
    recordedAt:date,
  };
}

function AssessmentPauseScreen({ number, total, onContinue }) {
  const started=useRef(Date.now());
  const [note,setNote]=useState("");
  return <div style={{maxWidth:680,margin:"0 auto"}}><Card style={{textAlign:"center",padding:34}}>
    <div style={{fontSize:"2.7rem",marginBottom:10}}>☕</div>
    <div style={{fontSize:".72rem",fontWeight:800,color:COLORS.primary,letterSpacing:".05em"}}>PAUSA {number}/{total}</div>
    <h2 style={{margin:"7px 0"}}>Pausa entre bloques</h2>
    <p style={{color:COLORS.textMuted,lineHeight:1.6,fontSize:".84rem"}}>Puedes descansar unos minutos. La pausa no afecta el desempeño cognitivo.</p>
    <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Opcional: registrar interrupción extraordinaria, llamada, ruido, malestar, etc."
      style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:10,border:`1px solid ${COLORS.border}`,fontFamily:"inherit",margin:"12px 0"}}/>
    <BtnPrimary onClick={()=>onContinue({
      pauseNumber:number,
      durationMs:Date.now()-started.current,
      interruptionNote:note.trim() || "",
      recordedAt:new Date().toISOString(),
    })} style={{width:"100%",padding:13}}>Continuar evaluación</BtnPrimary>
  </Card></div>;
}

function AssessmentV2ProfileView({ evalData, paciente, onIniciarSesion }) {
  const domains=evalData?.domainProfile || [];
  const tasks=evalData?.taskResults || [];
  const strengths=domains.filter(d=>d.band==="strength");
  const intermediate=domains.filter(d=>d.band==="intermediate");
  const difficulty=domains.filter(d=>d.band==="difficulty");
  const review=domains.filter(d=>d.band==="review");

  const domainCard=(d)=>{
    const band=assessmentPerformanceBand(d.descriptiveIndex,d.evidenceQuality?.id || null);
    return <details key={d.domainId} style={{border:`1px solid ${COLORS.border}`,borderRadius:12,padding:"12px 14px",background:"#fff"}}>
      <summary style={{cursor:"pointer",fontWeight:750,listStyle:"none",display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}>
        <span>{d.label}</span>
        <Badge label={typeof d.descriptiveIndex==="number"?`${d.descriptiveIndex} · ${band.label}`:band.label} color={band.color}/>
      </summary>
      <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${COLORS.border}`}}>
        <p style={{fontSize:".73rem",color:COLORS.textMuted,lineHeight:1.55,margin:"0 0 10px"}}>
          Índice descriptivo interno construido a partir de tareas primarias NeuroFlex. No es una puntuación normativa ni un percentil.</p>{d.evidenceQuality&&<div style={{fontSize:".71rem",padding:"8px 10px",borderRadius:9,background:COLORS.bg,marginBottom:10}}><strong>Calidad de evidencia: {d.evidenceQuality.label}.</strong> {d.evidenceQuality.reason}</div>}<p style={{display:"none"}}>
        </p>
        {(d.processes || []).map(p=>{
          const pb=assessmentPerformanceBand(p.descriptiveIndex);
          return <div key={p.id} style={{padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
              <span style={{fontSize:".8rem",fontWeight:650}}>{formatAssessmentProcessLabelV2(p.processId)}</span>
              <span style={{fontSize:".76rem",fontWeight:700,color:pb.color}}>{typeof p.descriptiveIndex==="number"?p.descriptiveIndex:"Revisar"}</span>
            </div>
            <div style={{fontSize:".69rem",color:COLORS.textMuted,marginTop:3}}>
              Evidencia: {p.evidence?.map(e=>e.taskId).join(", ") || "sin medida automática"}
              {p.reviewOnlyEvidence?.length ? ` · revisión: ${p.reviewOnlyEvidence.join(", ")}`:""}
            </div>
          </div>
        })}
        <div style={{fontSize:".72rem",color:COLORS.textMuted,marginTop:9}}>
          Tareas principales: {d.taskEvidence?.map(e=>e.taskId).join(", ") || "—"}
          {d.secondaryEvidenceFrom?.length ? ` · evidencia secundaria: ${[...new Set(d.secondaryEvidenceFrom)].join(", ")}`:""}
        </div>
      </div>
    </details>;
  };

  return <div>
    <Card style={{marginBottom:18,background:COLORS.primary+"06",border:`1px solid ${COLORS.primary}18`}}>
      <div style={{fontSize:".72rem",fontWeight:850,color:COLORS.primary,letterSpacing:".05em"}}>NEUROFLEX EVALUATION v2</div>
      <h2 style={{margin:"6px 0 8px"}}>Perfil cognitivo multidimensional</h2>
      <p style={{margin:0,fontSize:".79rem",lineHeight:1.65,color:COLORS.textSecond}}>
        Este perfil describe el desempeño observado en {tasks.length} tareas de NeuroFlex por dominio y subproceso,
        e integra patrones de error, variación temporal y evidencia entre tareas. Los índices son internos y provisionales:
        no corresponden a baremos, percentiles ni puntuaciones de WAIS, Stroop, TMT, BANFE u otras pruebas de referencia.
      </p>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:20}}>
      <Card style={{padding:16}}><div style={{fontSize:"1.5rem",fontWeight:900}}>{strengths.length}</div><div style={{fontSize:".74rem",color:COLORS.textMuted}}>Fortalezas relativas</div></Card>
      <Card style={{padding:16}}><div style={{fontSize:"1.5rem",fontWeight:900}}>{intermediate.length}</div><div style={{fontSize:".74rem",color:COLORS.textMuted}}>Desempeños intermedios</div></Card>
      <Card style={{padding:16}}><div style={{fontSize:"1.5rem",fontWeight:900}}>{difficulty.length}</div><div style={{fontSize:".74rem",color:COLORS.textMuted}}>Mayores dificultades relativas</div></Card>
      <Card style={{padding:16}}><div style={{fontSize:"1.5rem",fontWeight:900}}>{review.length}</div><div style={{fontSize:".74rem",color:COLORS.textMuted}}>Dominios para revisión</div></Card>
    </div>

    <Card style={{marginBottom:20}}>
      <p style={{fontWeight:800,margin:"0 0 4px"}}>Dominios y subprocesos</p>
      <p style={{fontSize:".74rem",color:COLORS.textMuted,lineHeight:1.5,margin:"0 0 14px"}}>Abre cada dominio para revisar procesos y las tareas que aportaron evidencia.</p>
      <div style={{display:"grid",gap:9}}>{domains.map(domainCard)}</div>
    </Card>

    <AssessmentVersionTracePanelV2 evalData={evalData} />
    <AssessmentV2InterpretationPanel evalData={evalData} />
    <AssessmentV2RecommendationsPanel evalData={evalData} />

    {onIniciarSesion && <BtnPrimary onClick={onIniciarSesion} style={{width:"100%",padding:14}}>▶ Configurar intervención</BtnPrimary>}
  </div>;
}

function EvaluationV2FullProtocol({ paciente, familiarization, onSave, onExit }) {
  const protocol=[
    {type:"task",id:"NF-E01"},
    {type:"task",id:"NF-E02"},
    {type:"task",id:"NF-E03"},
    {type:"task",id:"NF-E04"},
    {type:"task",id:"NF-E05"},
    {type:"task",id:"NF-E06"},
    {type:"pause",number:1},

    {type:"task",id:"NF-E07"},
    {type:"task",id:"NF-E08"},
    {type:"special",id:"NF-E09-encode",taskId:"NF-E09"},
    {type:"special",id:"NF-E11-encode",taskId:"NF-E11"},
    {type:"task",id:"NF-E10"},
    {type:"task",id:"NF-E12"},
    {type:"task",id:"NF-E13"},
    {type:"task",id:"NF-E14"},
    {type:"special",id:"NF-E09-delayed",taskId:"NF-E09"},
    {type:"special",id:"NF-E11-retrieve",taskId:"NF-E11"},
    {type:"pause",number:2},

    {type:"task",id:"NF-E15"},
    {type:"task",id:"NF-E16"},
    {type:"task",id:"NF-E17"},
    {type:"task",id:"NF-E18"},
    {type:"task",id:"NF-E19"},
    {type:"task",id:"NF-E20"},
    {type:"task",id:"NF-E21"},
    {type:"pause",number:3},

    {type:"task",id:"NF-E22"},
    {type:"task",id:"NF-E23"},
    {type:"task",id:"NF-E24"},
    {type:"task",id:"NF-E25"},
    {type:"task",id:"NF-E26"},
    {type:"task",id:"NF-E27"},
  ];

  const components={
    "NF-E01":NFE01Orientation,
    "NF-E02":NFE02Cancellation,
    "NF-E03":(p)=><TimedSignalTask {...p} taskId="NF-E03" mode="cpt"/>,
    "NF-E04":(p)=><TimedSignalTask {...p} taskId="NF-E04" mode="gonogo"/>,
    "NF-E05":NFE05Interference,
    "NF-E06":NFE06Switching,
    "NF-E07":NFE07ActiveSpan,
    "NF-E08":NFE08SpatialSpan,
    "NF-E10":NFE10VisualMemory,
    "NF-E12":NFE12Naming,
    "NF-E13":NFE13SemanticRelations,
    "NF-E14":NFE14Fluency,
    "NF-E15":NFE15MatrixReasoning,
    "NF-E16":NFE16Similarities,
    "NF-E17":NFE17Logic,
    "NF-E18":NFE18PlanningRoute,
    "NF-E19":NFE19FunctionalSequence,
    "NF-E20":NFE20MentalRotation,
    "NF-E21":NFE21Construction,
    "NF-E22":NFE22VisualClosure,
    "NF-E23":NFE23FigureGround,
    "NF-E24":NFE24OrganizeDay,
    "NF-E25":NFE25SmartShopping,
    "NF-E26":NFE26FollowInstructions,
    "NF-E27":NFE27FunctionalProspective,
  };

  const [step,setStep]=useState(0);
  const [taskResults,setTaskResults]=useState([]);
  const [verbalMemory,setVerbalMemory]=useState(null);
  const [prospective,setProspective]=useState(null);
  const [pauses,setPauses]=useState([]);
  const [interruptions,setInterruptions]=useState([]);
  const [finalRecord,setFinalRecord]=useState(null);
  const startedAt=useRef(new Date().toISOString());

  const advance=()=>setStep(s=>s+1);
  const pushResult=(r)=>{
    setTaskResults(prev=>[...prev.filter(x=>x?.taskId!==r?.taskId),r]);
    advance();
  };

  useEffect(()=>{
    if(step<protocol.length || finalRecord) return;
    const record=makeFullAssessmentRecordV2({
      taskResults,
      familiarization,
      pauses,
      interruptions,
      startedAt:startedAt.current,
    });
    setFinalRecord(record);
  },[step,finalRecord,taskResults,familiarization,pauses,interruptions]);

  if(finalRecord){
    return <div style={{maxWidth:940,margin:"0 auto"}}>
      <AssessmentV2ProfileView evalData={finalRecord} paciente={paciente}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
        <BtnSecondary onClick={onExit}>Salir sin guardar</BtnSecondary>
        <BtnPrimary onClick={()=>onSave(finalRecord)}>Guardar como evaluación activa</BtnPrimary>
      </div>
    </div>;
  }

  if(step>=protocol.length){
    return <div style={{maxWidth:680,margin:"0 auto"}}><Card style={{textAlign:"center",padding:34}}>Construyendo perfil multidimensional…</Card></div>;
  }

  const current=protocol[step];
  const completed=taskResults.filter(Boolean).length;
  const progress=Math.round((completed/27)*100);

  if(current.type==="pause"){
    return <AssessmentPauseScreen number={current.number} total={3} onContinue={(data)=>{
      setPauses(p=>[...p,data]);
      if(data.interruptionNote) setInterruptions(x=>[...x,{...data,type:"pause_interruption"}]);
      advance();
    }}/>;
  }

  const wrapper=(child)=><div>
    <div style={{maxWidth:760,margin:"0 auto 12px"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:".72rem",color:COLORS.textMuted,marginBottom:6}}>
        <span>Evaluation v2 completa · {completed}/27 tareas registradas</span><span>{progress}%</span>
      </div>
      <ProgressBar value={progress} color={COLORS.primary}/>
    </div>
    {child}
  </div>;

  if(current.id==="NF-E09-encode"){
    return wrapper(<NFE09LearningPhase paciente={paciente} onEncoded={data=>{setVerbalMemory(data);advance()}}/>);
  }
  if(current.id==="NF-E11-encode"){
    return wrapper(<NFE11ProspectiveEncode paciente={paciente} onEncoded={data=>{setProspective(data);advance()}}/>);
  }
  if(current.id==="NF-E09-delayed"){
    return wrapper(<NFE09DelayedPhase paciente={paciente} memoryData={verbalMemory} onDone={pushResult}/>);
  }
  if(current.id==="NF-E11-retrieve"){
    return wrapper(<NFE11ProspectiveRetrieve paciente={paciente} prospectiveData={prospective} onDone={pushResult}/>);
  }

  const Comp=components[current.id];
  return wrapper(<Comp paciente={paciente} onDone={pushResult}/>);
}


// ─── FASE 40 · INTERPRETACIÓN DESCRIPTIVA AVANZADA · EVIDENCIA CONVERGENTE ─
const ASSESSMENT_INTERPRETATION_VERSION = "NF-INTERP-2.0";
const ASSESSMENT_INTERNAL_HEURISTICS = {
  convergenceRange: 15,
  discrepancyRange: 25,
  blockChange: 15,
  rtVariabilityRatio: 0.40,
};

function nfFinite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function nfTaskResultMap(taskResults = []) {
  return Object.fromEntries((taskResults || []).filter(Boolean).map(r => [r.taskId, r]));
}

function nfBlockNumericValues(blockPerformance) {
  if (!Array.isArray(blockPerformance)) return [];
  return blockPerformance
    .map(v => {
      if (nfFinite(v)) return v;
      if (v && nfFinite(v.precision)) return v.precision;
      if (v && nfFinite(v.score)) return v.score;
      return null;
    })
    .filter(nfFinite);
}

function describeTaskPatternV2(result) {
  const def = getAssessmentTaskDefinition(result?.taskId);
  const m = result?.metrics || {};
  const observations = [];

  if (nfFinite(m.precision)) {
    observations.push(`Precisión observada: ${Math.round(m.precision)}%.`);
  }

  if (nfFinite(m.meanResponseMs)) {
    const median = nfFinite(m.medianResponseMs) ? `; mediana ${Math.round(m.medianResponseMs)} ms` : "";
    observations.push(`Tiempo de respuesta registrado: media ${Math.round(m.meanResponseMs)} ms${median}.`);
  }

  if (nfFinite(m.responseVariabilityMs) && nfFinite(m.meanResponseMs) && m.meanResponseMs > 0) {
    const ratio = m.responseVariabilityMs / m.meanResponseMs;
    if (ratio >= ASSESSMENT_INTERNAL_HEURISTICS.rtVariabilityRatio) {
      observations.push("Se observó variación interna amplia entre tiempos de respuesta; este patrón es descriptivo y no normativo.");
    } else {
      observations.push("Los tiempos de respuesta mostraron una variación interna relativamente acotada dentro de esta tarea.");
    }
  } else if (nfFinite(m.responseVariabilityMs)) {
    observations.push(`Variabilidad temporal registrada: ${Math.round(m.responseVariabilityMs)} ms.`);
  }

  const errorParts = [];
  if (nfFinite(m.omissions) && m.omissions > 0) errorParts.push(`${m.omissions} omisión${m.omissions===1?"":"es"}`);
  if (nfFinite(m.commissions) && m.commissions > 0) errorParts.push(`${m.commissions} comisión${m.commissions===1?"":"es"}`);
  if (nfFinite(m.perseverations) && m.perseverations > 0) errorParts.push(`${m.perseverations} perseveración${m.perseverations===1?"":"es"}`);
  if (nfFinite(m.intrusions) && m.intrusions > 0) errorParts.push(`${m.intrusions} intrusión${m.intrusions===1?"":"es"}`);
  if (nfFinite(m.falseAlarms) && m.falseAlarms > 0) errorParts.push(`${m.falseAlarms} falsa${m.falseAlarms===1?"":"s"} alarma${m.falseAlarms===1?"":"s"}`);
  if (nfFinite(m.sequenceErrors) && m.sequenceErrors > 0) errorParts.push(`${m.sequenceErrors} error${m.sequenceErrors===1?"":"es"} de secuencia`);
  if (errorParts.length) observations.push(`Patrón de errores: ${errorParts.join(", ")}.`);

  if (nfFinite(m.selfCorrections) && m.selfCorrections > 0) {
    observations.push(`Se registraron ${m.selfCorrections} autocorrección${m.selfCorrections===1?"":"es"} durante la ejecución.`);
  }

  if (nfFinite(m.interferenceCost)) {
    const direction = m.interferenceCost > 0 ? "mayor tiempo en la condición de interferencia" : m.interferenceCost < 0 ? "menor tiempo en la condición de interferencia" : "sin diferencia temporal";
    observations.push(`Costo interno de interferencia: ${Math.round(m.interferenceCost)} ms (${direction}).`);
  }

  if (nfFinite(m.switchCost)) {
    const direction = m.switchCost > 0 ? "mayor tiempo en ensayos de cambio" : m.switchCost < 0 ? "menor tiempo en ensayos de cambio" : "sin diferencia temporal";
    observations.push(`Costo interno de cambio de regla: ${Math.round(m.switchCost)} ms (${direction}).`);
  }

  if (nfFinite(m.retentionRate)) {
    observations.push(`Retención descriptiva dentro de la tarea: ${Math.round(m.retentionRate)}%.`);
  }

  if (m.spontaneousRecall === 1) {
    observations.push("La intención futura fue recuperada espontáneamente ante la señal prevista.");
  } else if (m.spontaneousRecall === 0 && m.cuedRecall === 1) {
    observations.push("La intención futura no apareció espontáneamente, pero se recuperó después de una clave general.");
  } else if (m.spontaneousRecall === 0 && m.cuedRecall === 0) {
    observations.push("La intención futura no se recuperó espontáneamente ni después de la clave general.");
  }

  if (nfFinite(m.levelReached)) {
    observations.push(`Nivel máximo alcanzado dentro del formato administrado: ${m.levelReached}.`);
  }

  if (nfFinite(m.supportsUsed) && m.supportsUsed > 0) {
    observations.push(`Se utilizaron ${m.supportsUsed} apoyo${m.supportsUsed===1?"":"s"} durante la tarea.`);
  }

  if (nfFinite(m.attempts) && m.attempts > 1) {
    observations.push(`La tarea requirió ${m.attempts} intentos/movimientos registrados según su mecánica.`);
  }

  const blocks = nfBlockNumericValues(m.blockPerformance);
  if (blocks.length >= 2) {
    const change = blocks[blocks.length - 1] - blocks[0];
    if (Math.abs(change) >= ASSESSMENT_INTERNAL_HEURISTICS.blockChange) {
      observations.push(
        change > 0
          ? `El desempeño aumentó ${Math.round(change)} puntos entre el primer y el último bloque registrado.`
          : `El desempeño disminuyó ${Math.abs(Math.round(change))} puntos entre el primer y el último bloque registrado.`
      );
      observations.push("El cambio entre bloques se describe sin atribuirlo automáticamente a aprendizaje, fatiga u otra causa clínica.");
    }
  }

  if (result?.requiresProfessionalReview) {
    observations.push("Esta tarea contiene información que requiere revisión profesional antes de integrarse clínicamente.");
  }

  return {
    taskId: result?.taskId,
    taskName: def?.name || result?.taskId,
    primaryDomain: def?.primaryDomain || null,
    observations,
  };
}

function buildDomainConvergenceV2(domainId, taskResults = []) {
  const evidence = (taskResults || []).filter(result => {
    const def = getAssessmentTaskDefinition(result?.taskId);
    return def && (def.primaryDomain === domainId || (def.secondaryDomains || []).includes(domainId));
  }).map(result => {
    const def = getAssessmentTaskDefinition(result.taskId);
    return {
      taskId: result.taskId,
      taskName: def?.name || result.taskId,
      role: def?.primaryDomain === domainId ? "principal" : "secundaria",
      score: assessmentScoreFromTaskResult(result),
      requiresProfessionalReview: !!result.requiresProfessionalReview,
    };
  });

  const primaryNumeric = evidence.filter(e => e.role==="principal" && nfFinite(e.score));
  const secondaryNumeric = evidence.filter(e => e.role==="secundaria" && nfFinite(e.score));
  const numeric = primaryNumeric;
  if (!numeric.length) {
    return {
      status:"review",
      label:"Evidencia no cuantificable automáticamente",
      evidence,
      range:null,
      note:secondaryNumeric.length?"No hay evidencia primaria cuantificable suficiente; existe evidencia secundaria contextual que requiere integración profesional.":"La interpretación depende de revisión profesional y de la integración clínica.",
    };
  }

  if (numeric.length === 1) {
    return {
      status:"single",
      label:"Evidencia de una sola fuente cuantificable",
      evidence,
      range:0,
      note:"No se considera evidencia convergente porque solo hay una fuente primaria cuantificable para este dominio. La evidencia secundaria se conserva como contexto y no se usa para declarar convergencia.",
    };
  }

  const scores = numeric.map(e=>e.score);
  const range = Math.max(...scores) - Math.min(...scores);
  if (range <= ASSESSMENT_INTERNAL_HEURISTICS.convergenceRange) {
    return {
      status:"convergent",
      label:"Resultados primarios relativamente próximos",
      evidence,
      range,
      note:"Las tareas primarias cuantificables muestran resultados internos relativamente próximos. Esta proximidad es descriptiva y no demuestra equivalencia psicométrica ni convergencia clínica.",
    };
  }
  if (range >= ASSESSMENT_INTERNAL_HEURISTICS.discrepancyRange) {
    return {
      status:"discrepant",
      label:"Separación amplia entre resultados primarios",
      evidence,
      range,
      note:"Las tareas primarias muestran una separación interna amplia. Debe conservarse la diferencia entre demandas específicas y evitar atribuirla automáticamente a un único subproceso.",
    };
  }
  return {
    status:"mixed",
    label:"Evidencia mixta",
    evidence,
    range,
    note:"Las tareas primarias muestran cierta variación interna. El rango es un descriptor auxiliar y no un índice psicométrico de discrepancia.",
  };
}


function nfInterpretationEvidenceLabel(domain) {
  const q=domain?.evidenceQuality;
  if(!q) return "Calidad de evidencia no especificada.";
  return `${q.label}. ${q.reason || ""}`.trim();
}

function nfTaskAccuracyTimeObservation(result) {
  const m=result?.metrics || {};
  const precision=nfFinite(m.precision)?Math.round(m.precision):null;
  const rt=nfFinite(m.medianResponseMs)?Math.round(m.medianResponseMs):
    nfFinite(m.meanResponseMs)?Math.round(m.meanResponseMs):
    nfFinite(m.latencyMs)?Math.round(m.latencyMs):null;
  if(precision==null || rt==null) return null;
  return {
    taskId:result.taskId,
    precision,
    responseMs:rt,
    text:`${result.taskId}: precisión ${precision}% y tiempo de respuesta interno ${rt} ms. Se muestran conjuntamente; NeuroFlex no clasifica este tiempo como lento o rápido sin referencia válida para esa tarea.`
  };
}

function buildAssessmentInterpretationV2(taskResults = [], domainProfile = []) {
  const taskPatterns = (taskResults || []).filter(Boolean).map(describeTaskPatternV2);
  const byTask = nfTaskResultMap(taskResults);

  const domainInterpretations = (domainProfile || []).map(domain => {
    const convergence = buildDomainConvergenceV2(domain.domainId, taskResults);
    const qualityId=domain?.evidenceQuality?.id || "limited";
    const band = assessmentPerformanceBand(domain.descriptiveIndex, qualityId);
    const processScores = (domain.processes || [])
      .filter(p=>nfFinite(p.descriptiveIndex) && p.evidenceCount>=2)
      .sort((a,b)=>a.descriptiveIndex-b.descriptiveIndex);
    const lower = processScores[0] || null;
    const higher = processScores[processScores.length-1] || null;
    const processSpread = lower && higher && lower.processId!==higher.processId
      ? higher.descriptiveIndex-lower.descriptiveIndex
      : null;

    const narrative = [];
    if (!nfFinite(domain.descriptiveIndex)) {
      narrative.push(`${domain.label}: no hay un índice cuantitativo primario suficiente para resumir el dominio.`);
    } else if (qualityId==="limited") {
      narrative.push(`${domain.label}: índice descriptivo interno ${Math.round(domain.descriptiveIndex)}, con evidencia limitada. No se clasifica como rendimiento alto o bajo.`);
    } else {
      narrative.push(`${domain.label}: índice descriptivo interno ${Math.round(domain.descriptiveIndex)} · ${band.label.toLowerCase()}.`);
    }

    narrative.push(`Calidad de evidencia: ${nfInterpretationEvidenceLabel(domain)}`);
    narrative.push(convergence.note);

    if (nfFinite(processSpread) && processSpread >= ASSESSMENT_INTERNAL_HEURISTICS.discrepancyRange) {
      narrative.push(
        `Dos subprocesos con evidencia repetida muestran una separación interna de ${Math.round(processSpread)} puntos. Se conserva como observación descriptiva y no se atribuye automáticamente a una función cognitiva aislada.`
      );
    }

    const taskIds = convergence.evidence.map(e=>e.taskId);
    const patterns = taskPatterns.filter(t=>taskIds.includes(t.taskId));
    const errorObservations = patterns
      .flatMap(t=>t.observations.filter(x =>
        x.startsWith("Patrón de errores") ||
        x.includes("interferencia") ||
        x.includes("cambio de regla") ||
        x.includes("intención futura") ||
        x.includes("autocorrección") ||
        x.includes("primer y el último bloque")
      ))
      .slice(0,6);

    return {
      domainId:domain.domainId,
      label:domain.label,
      descriptiveIndex:domain.descriptiveIndex,
      band:qualityId==="limited"?"review":domain.band,
      evidenceQuality:domain.evidenceQuality || null,
      convergence,
      processSpread,
      lowerProcess:lower?.processId || null,
      higherProcess:higher?.processId || null,
      narrative,
      errorObservations,
      provisional:true,
    };
  });

  const crossPatterns = [];
  const accuracyTimeObservations=(taskResults || [])
    .map(nfTaskAccuracyTimeObservation)
    .filter(Boolean);
  if(accuracyTimeObservations.length){
    crossPatterns.push({
      id:"accuracy-time-joint-reading",
      title:"Precisión y tiempo: lectura conjunta",
      text:"Cuando una tarea dispone de precisión y tiempo, NeuroFlex conserva ambas variables sin convertir automáticamente un mayor tiempo en peor rendimiento. El significado del tiempo depende de la tarea, la precisión y las condiciones de administración.",
      tasks:accuracyTimeObservations.map(x=>x.taskId),
      observations:accuracyTimeObservations,
    });
  }

  const e03=byTask["NF-E03"]?.metrics || {};
  if (nfFinite(e03.omissions) || nfFinite(e03.commissions)) {
    crossPatterns.push({
      id:"sustained-attention-errors",
      title:"Atención sostenida: tipo de error",
      text:`En NF-E03 se registraron ${e03.omissions || 0} omisiones y ${e03.commissions || 0} comisiones. La distribución de estos errores se conserva por separado para evitar resumirlos en un único porcentaje.`,
      tasks:["NF-E03"],
    });
  }

  const e04=byTask["NF-E04"]?.metrics || {};
  const e05=byTask["NF-E05"]?.metrics || {};
  const e06=byTask["NF-E06"]?.metrics || {};
  if (nfFinite(e04.commissions) || nfFinite(e05.interferenceCost) || nfFinite(e06.switchCost)) {
    const parts=[];
    if (nfFinite(e04.commissions)) parts.push(`Go/No-Go: ${e04.commissions} comisiones`);
    if (nfFinite(e05.interferenceCost)) parts.push(`interferencia: ${Math.round(e05.interferenceCost)} ms`);
    if (nfFinite(e06.switchCost)) parts.push(`cambio de regla: ${Math.round(e06.switchCost)} ms`);
    crossPatterns.push({
      id:"executive-control-pattern",
      title:"Control ejecutivo: inhibición, interferencia y cambio",
      text:`Se observaron medidas diferenciadas de control ejecutivo (${parts.join("; ")}). Estas variables no se fusionan automáticamente porque describen demandas distintas.`,
      tasks:["NF-E04","NF-E05","NF-E06"],
    });
  }

  const e07=byTask["NF-E07"]?.metrics || {};
  const e08=byTask["NF-E08"]?.metrics || {};
  if (nfFinite(e07.levelReached) && nfFinite(e08.levelReached)) {
    crossPatterns.push({
      id:"working-memory-modalities",
      title:"Memoria de trabajo por modalidad",
      text:`La amplitud máxima registrada fue ${e07.levelReached} en la tarea verbal/activa NF-E07 y ${e08.levelReached} en la tarea visuoespacial NF-E08. La comparación es descriptiva porque las dos tareas no son métricamente equivalentes.`,
      tasks:["NF-E07","NF-E08"],
    });
  }

  const e09=byTask["NF-E09"]?.metrics || {};
  if (nfFinite(e09.retentionRate) || nfFinite(e09.intrusions) || nfFinite(e09.falseAlarms)) {
    const p=[];
    if (nfFinite(e09.retentionRate)) p.push(`retención ${Math.round(e09.retentionRate)}%`);
    if (nfFinite(e09.intrusions)) p.push(`${e09.intrusions} intrusiones`);
    if (nfFinite(e09.falseAlarms)) p.push(`${e09.falseAlarms} falsas alarmas`);
    crossPatterns.push({
      id:"verbal-learning-pattern",
      title:"Aprendizaje y memoria verbal",
      text:`NF-E09 conserva por separado aprendizaje/retención y errores de recuperación (${p.join("; ")}), en lugar de reducir la memoria verbal a un solo resultado.`,
      tasks:["NF-E09"],
    });
  }

  const e11=byTask["NF-E11"]?.metrics || {};
  const e27=byTask["NF-E27"]?.metrics || {};
  if (e11.spontaneousRecall != null || e27.spontaneousRecall != null) {
    const describe=(m,id)=>m.spontaneousRecall===1?`${id}: recuerdo espontáneo`:m.cuedRecall===1?`${id}: recuerdo con clave`:`${id}: sin recuperación`;
    crossPatterns.push({
      id:"prospective-memory-convergence",
      title:"Memoria prospectiva en dos contextos",
      text:`${describe(e11,"NF-E11")}; ${describe(e27,"NF-E27")}. La presencia de dos tareas permite observar si el patrón se repite en una demanda más básica y otra funcional.`,
      tasks:["NF-E11","NF-E27"],
    });
  }

  const interpretableDomains=domainInterpretations.filter(d=>d.evidenceQuality?.id && d.evidenceQuality.id!=="limited");
  const difficultyDomains = interpretableDomains.filter(d=>d.band==="difficulty");
  const strengths = interpretableDomains.filter(d=>d.band==="strength");
  const discrepancies = domainInterpretations.filter(d=>d.convergence.status==="discrepant" || (nfFinite(d.processSpread) && d.processSpread>=ASSESSMENT_INTERNAL_HEURISTICS.discrepancyRange));
  const limitedDomains = domainInterpretations.filter(d=>d.evidenceQuality?.id==="limited");

  return {
    version:ASSESSMENT_INTERPRETATION_VERSION,
    generatedAt:new Date().toISOString(),
    heuristics:{...ASSESSMENT_INTERNAL_HEURISTICS},
    taskPatterns,
    domainInterpretations,
    crossPatterns,
    summary:{
      strengthDomainIds:strengths.map(d=>d.domainId),
      difficultyDomainIds:difficultyDomains.map(d=>d.domainId),
      discrepancyDomainIds:discrepancies.map(d=>d.domainId),
      limitedEvidenceDomainIds:limitedDomains.map(d=>d.domainId),
      professionalReviewTaskIds:(taskResults || []).filter(r=>r?.requiresProfessionalReview).map(r=>r.taskId),
    },
    limitations:[
      "Interpretación descriptiva basada exclusivamente en tareas NeuroFlex.",
      "Los rangos internos usados para señalar proximidad o separación entre tareas son heurísticos auxiliares; no son puntos de corte clínicos ni pruebas de significación.",
      "Los índices de distintas tareas no se asumen psicométricamente equivalentes aunque estén expresados en una escala de 0 a 100.",
      "No se infiere diagnóstico, deterioro, déficit, percentil ni generalización automática a la vida diaria.",
      "Precisión, velocidad y variabilidad se conservan por separado. Un tiempo mayor no se interpreta automáticamente como peor rendimiento sin una referencia válida para esa tarea.",
    ],
  };
}

function AssessmentV2InterpretationPanel({ evalData }) {
  const interpretation = evalData?.interpretation ||
    buildAssessmentInterpretationV2(evalData?.taskResults || [], evalData?.domainProfile || []);
  const [showTasks,setShowTasks]=useState(false);

  return <div style={{marginBottom:20}}>
    <Card style={{marginBottom:14,border:`1px solid ${COLORS.primary}20`}}>
      <div style={{fontSize:".7rem",fontWeight:850,color:COLORS.primary,letterSpacing:".05em"}}>INTERPRETACIÓN DESCRIPTIVA · {interpretation.version}</div>
      <h3 style={{margin:"6px 0 7px"}}>Lectura integrada de patrones</h3>
      <p style={{fontSize:".76rem",color:COLORS.textMuted,lineHeight:1.6,margin:0}}>
        NeuroFlex integra evidencia entre tareas sin emitir diagnóstico. Cuando dos tareas difieren, la discrepancia se conserva como información clínica en lugar de ocultarla mediante un promedio.
      </p>
    </Card>

    {(interpretation.crossPatterns || []).length>0 && <Card style={{marginBottom:14}}>
      <p style={{fontWeight:800,margin:"0 0 10px"}}>Patrones transversales relevantes</p>
      <div style={{display:"grid",gap:9}}>
        {interpretation.crossPatterns.map(p=><div key={p.id} style={{padding:11,borderRadius:10,background:COLORS.bg}}>
          <div style={{fontWeight:700,fontSize:".8rem"}}>{p.title}</div>
          <div style={{fontSize:".73rem",color:COLORS.textSecond,lineHeight:1.55,marginTop:3}}>{p.text}</div>
          <div style={{fontSize:".66rem",color:COLORS.textMuted,marginTop:4}}>Evidencia: {p.tasks.join(", ")}</div>
          {Array.isArray(p.observations) && p.observations.length>0 && <details style={{marginTop:6}}>
            <summary style={{fontSize:".68rem",cursor:"pointer",color:COLORS.primary}}>Ver precisión y tiempo por tarea</summary>
            <div style={{marginTop:5}}>
              {p.observations.map((o,i)=><div key={i} style={{fontSize:".68rem",lineHeight:1.45,color:COLORS.textMuted,marginTop:3}}>{o.text}</div>)}
            </div>
          </details>}
        </div>)}
      </div>
    </Card>}

    <Card style={{marginBottom:14}}>
      <p style={{fontWeight:800,margin:"0 0 4px"}}>Consistencia interna de la evidencia por dominio</p>
      <p style={{fontSize:".72rem",color:COLORS.textMuted,lineHeight:1.5,margin:"0 0 12px"}}>Los rangos describen proximidad o separación interna entre resultados primarios. No demuestran equivalencia psicométrica ni constituyen categorías clínicas.</p>
      <div style={{display:"grid",gap:8}}>
        {(interpretation.domainInterpretations || []).map(d=>{
          const statusColor=d.convergence.status==="convergent"?COLORS.success:d.convergence.status==="discrepant"?COLORS.warning:d.convergence.status==="review"?COLORS.accent:COLORS.info;
          return <details key={d.domainId} style={{border:`1px solid ${COLORS.border}`,borderRadius:10,padding:"10px 12px"}}>
            <summary style={{cursor:"pointer",listStyle:"none",display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}>
              <span style={{fontWeight:700,fontSize:".8rem"}}>{d.label}</span>
              <Badge label={d.convergence.label} color={statusColor}/>
            </summary>
            <div style={{paddingTop:9,marginTop:9,borderTop:`1px solid ${COLORS.border}`}}>
              {d.narrative.map((x,i)=><p key={i} style={{fontSize:".73rem",lineHeight:1.55,color:COLORS.textSecond,margin:"4px 0"}}>{x}</p>)}
              {d.errorObservations.length>0 && <div style={{marginTop:8,padding:9,borderRadius:8,background:COLORS.bg}}>
                <strong style={{fontSize:".7rem"}}>Patrones específicos</strong>
                {d.errorObservations.map((x,i)=><div key={i} style={{fontSize:".7rem",color:COLORS.textMuted,lineHeight:1.5,marginTop:3}}>{x}</div>)}
              </div>}
              <div style={{fontSize:".67rem",color:COLORS.textMuted,marginTop:7}}>
                Fuentes: {d.convergence.evidence.map(e=>`${e.taskId} (${e.role})`).join(", ") || "—"}
                {nfFinite(d.convergence.range)?` · rango interno ${Math.round(d.convergence.range)} pts`:""}
              </div>
            </div>
          </details>
        })}
      </div>
    </Card>

    <Card style={{marginBottom:14}}>
      <button onClick={()=>setShowTasks(v=>!v)} style={{width:"100%",border:"none",background:"transparent",padding:0,cursor:"pointer",display:"flex",justifyContent:"space-between",fontFamily:"inherit",fontWeight:800}}>
        <span>Detalle descriptivo por tarea</span><span>{showTasks?"Ocultar":"Mostrar"}</span>
      </button>
      {showTasks && <div style={{marginTop:12,display:"grid",gap:8}}>
        {(interpretation.taskPatterns || []).map(t=><div key={t.taskId} style={{padding:10,borderRadius:9,background:COLORS.bg}}>
          <div style={{fontWeight:750,fontSize:".76rem"}}>{t.taskId} · {t.taskName}</div>
          {t.observations.length
            ? t.observations.map((o,i)=><div key={i} style={{fontSize:".69rem",lineHeight:1.5,color:COLORS.textSecond,marginTop:3}}>• {o}</div>)
            : <div style={{fontSize:".69rem",color:COLORS.textMuted,marginTop:3}}>Sin patrón adicional automatizable; conservar resultados para revisión profesional.</div>}
        </div>)}
      </div>}
    </Card>

    <Card style={{border:`1px solid ${COLORS.accent}25`}}>
      <p style={{fontWeight:750,margin:"0 0 6px",color:COLORS.accent}}>Límites de interpretación</p>
      {(interpretation.limitations || []).map((x,i)=><div key={i} style={{fontSize:".72rem",color:COLORS.textMuted,lineHeight:1.55,marginTop:3}}>• {x}</div>)}
    </Card>
  </div>;
}


// ─── FASE 41 · PRIORIDADES DE INTERVENCIÓN BASADAS EN PERFIL v2 ─────────────
const ASSESSMENT_RECOMMENDATION_VERSION = "NF-REC-2.0";

const ASSESSMENT_DOMAIN_TO_TRAINING = {
  orientacion:{trainingDomains:["orientacion"],exerciseIds:["temporal_orientation","spatial_orientation","or_personas","or_situacion"]},
  atencion:{trainingDomains:["atencion"],exerciseIds:["sustained_attention","divided_attention","find_animal"]},
  velocidad_proc:{trainingDomains:["velocidad_proc"],exerciseIds:["reaction_time","color_naming"]},
  inhibicion:{trainingDomains:["flexibilidad","funciones_exec"],exerciseIds:["flex_opuesto","flex_regla","trail_making"]},
  flexibilidad:{trainingDomains:["flexibilidad","funciones_exec"],exerciseIds:["flex_regla","flex_opuesto","trail_making"]},
  memoria_trabajo:{trainingDomains:["memoria_trabajo"],exerciseIds:["digits_forward","digits_backward","letter_number","operation_span","nback_1"]},
  memoria_verbal:{trainingDomains:["memoria_episodica"],exerciseIds:["word_recall","story_recall"]},
  memoria_visual:{trainingDomains:["percepcion_visual","memoria_episodica"],exerciseIds:["visual_matching","pe_patron","word_recall"]},
  memoria_prospectiva:{trainingDomains:["memoria_episodica","memoria_trabajo"],exerciseIds:["word_recall","letter_number","operation_span"]},
  lenguaje:{trainingDomains:["lenguaje","comprension"],exerciseIds:["naming","analogias_verbales","verbal_comprehension","cp_inferencia","cp_texto"]},
  razonamiento:{trainingDomains:["razonamiento"],exerciseIds:["ra_series","ra_discordante","ra_verdadero_falso"]},
  planificacion:{trainingDomains:["funciones_exec","flexibilidad"],exerciseIds:["trail_making","flex_regla","verbal_fluency"]},
  visuoespacial:{trainingDomains:["percepcion_visual"],exerciseIds:["pe_rotacion","pe_patron","visual_matching","pe_contar"]},
  gnosias:{trainingDomains:["percepcion_visual"],exerciseIds:["visual_matching","find_animal","pe_contar","pe_patron"]},
  praxias:{trainingDomains:["funciones_exec","comprension"],exerciseIds:["trail_making","verbal_comprehension"]},
  cognicion_social_metacognicion:{trainingDomains:["comprension","lenguaje"],exerciseIds:["cp_inferencia","verbal_comprehension","analogias_verbales"]},
  cognicion_funcional:{trainingDomains:["funciones_exec","calculo","comprension"],exerciseIds:["calc_operaciones","calc_faltante","verbal_comprehension","trail_making"]},
};

function nfRecommendationPriority(rank) {
  if (rank === "high") return {label:"Prioridad sugerida · evidencia repetida",color:COLORS.error,order:0};
  if (rank === "medium") return {label:"Considerar como objetivo",color:COLORS.warning,order:1};
  return {label:"Mantenimiento / seguimiento",color:COLORS.success,order:2};
}

function nfRecommendationEvidenceLevel({independentSources=0,qualityId=null,reviewRequired=false}={}) {
  if(reviewRequired || qualityId==="limited") return {
    id:"limited",
    label:"Evidencia limitada",
    note:"La sugerencia necesita revisión profesional antes de convertirse en objetivo."
  };
  if(independentSources>=2) return {
    id:"repeated",
    label:"Evidencia repetida",
    note:"El patrón aparece en más de una fuente independiente dentro de NeuroFlex."
  };
  return {
    id:"single",
    label:"Una fuente",
    note:"La sugerencia procede de una sola fuente y no debe interpretarse como hallazgo convergente."
  };
}

function nfPriorityFromEvidence({domainBand=null,qualityId=null,independentSources=0,patternRepeated=false}={}) {
  if(qualityId==="limited") return "medium";
  if(patternRepeated && independentSources>=2) return "high";
  if(domainBand==="strength") return "low";
  return "medium";
}

function nfDomainRecommendationBase(domain) {
  if (!domain) return "Mantener seguimiento clínico del desempeño observado.";
  const processNames=(domain.processes || [])
    .filter(p=>nfFinite(p.descriptiveIndex))
    .sort((a,b)=>a.descriptiveIndex-b.descriptiveIndex)
    .slice(0,2)
    .map(p=>formatAssessmentProcessLabelV2(p.processId));
  if (processNames.length) {
    return `Priorizar tareas dirigidas a ${processNames.join(" y ")} dentro de este dominio, con dificultad graduada y registro de precisión antes de aumentar velocidad o carga.`;
  }
  return `Mantener seguimiento del dominio ${domain.label?.toLowerCase() || domain.domainId} y ajustar el objetivo después de revisión profesional.`;
}

function buildAssessmentInterventionRecommendationsV2(taskResults = [], domainProfile = [], interpretationInput = null) {
  const interpretation=interpretationInput || buildAssessmentInterpretationV2(taskResults,domainProfile);
  const byTask=nfTaskResultMap(taskResults);
  const recommendations=[];

  (domainProfile || []).forEach(domain=>{
    const bridge=ASSESSMENT_DOMAIN_TO_TRAINING[domain.domainId] || {trainingDomains:[],exerciseIds:[]};
    const interp=(interpretation.domainInterpretations || []).find(x=>x.domainId===domain.domainId);
    const qualityId=domain?.evidenceQuality?.id || "limited";
    const independentSources=domain?.quantifiedTaskCount || 0;
    const evidenceLevel=nfRecommendationEvidenceLevel({
      independentSources,
      qualityId,
      reviewRequired:domain.band==="review"
    });
    const priority=nfPriorityFromEvidence({
      domainBand:domain.band,
      qualityId,
      independentSources,
      patternRepeated:false
    });

    const rationale=[];
    if(nfFinite(domain.descriptiveIndex)) rationale.push(`${domain.label}: índice descriptivo interno ${domain.descriptiveIndex}.`);
    else rationale.push(`${domain.label}: no dispone de resumen cuantitativo primario suficiente.`);
    rationale.push(`Calidad de evidencia: ${domain?.evidenceQuality?.label || evidenceLevel.label}.`);
    if(interp?.convergence?.status==="discrepant") rationale.push("Los resultados primarios muestran separación interna amplia; no se recomienda decidir a partir del promedio del dominio.");
    if(interp?.errorObservations?.length) rationale.push(interp.errorObservations[0]);

    recommendations.push({
      id:`domain:${domain.domainId}`,
      source:"domain_profile",
      assessmentDomain:domain.domainId,
      title:domain.label,
      priority,
      priorityBasis:priority==="low"
        ?"Seguimiento de un dominio con rendimiento relativamente alto observado."
        :"Objetivo posible sujeto a revisión profesional; la prioridad no deriva de un punto de corte clínico.",
      evidenceLevel,
      rationale,
      objective:nfDomainRecommendationBase(domain),
      trainingDomains:[...bridge.trainingDomains],
      suggestedExerciseIds:[...bridge.exerciseIds],
      professionalDecisionRequired:true,
      automaticPrescription:false,
    });
  });

  const addSpecific=(item)=>{
    if(!recommendations.some(r=>r.id===item.id)) recommendations.push({
      ...item,
      professionalDecisionRequired:true,
      automaticPrescription:false,
    });
  };

  // Atención sostenida: una sola tarea puede sugerir un objetivo, pero no lo escala
  // automáticamente por número de omisiones o por un cociente temporal.
  const e03=byTask["NF-E03"]?.metrics || {};
  if((e03.omissions||0)>0 || (e03.commissions||0)>0 || nfFinite(e03.responseVariabilityMs)){
    const evidenceLevel=nfRecommendationEvidenceLevel({independentSources:1});
    addSpecific({
      id:"pattern:attention-stability",
      source:"task_pattern",
      assessmentDomain:"atencion",
      title:"Mantenimiento del foco y estabilidad de respuesta",
      priority:"medium",
      priorityBasis:"Patrón observado en NF-E03; no se escala por un número fijo de errores o por un umbral de variabilidad.",
      evidenceLevel,
      rationale:[
        `NF-E03 registró ${e03.omissions||0} omisiones y ${e03.commissions||0} comisiones.`,
        nfFinite(e03.responseVariabilityMs)?`Variabilidad interna registrada: ${Math.round(e03.responseVariabilityMs)} ms.`:"",
        "La precisión y la estabilidad temporal se conservan como variables separadas."
      ],
      objective:"Considerar entrenamiento de mantenimiento del foco y consistencia de respuesta, priorizando precisión antes que rapidez.",
      trainingDomains:["atencion"],
      suggestedExerciseIds:["sustained_attention","find_animal","divided_attention"],
    });
  }

  // Inhibición/interferencia: prioridad alta solo cuando dos tareas independientes
  // muestran un patrón relevante; no depende de 300 ms ni de >=2 comisiones.
  const e04=byTask["NF-E04"]?.metrics || {};
  const e05=byTask["NF-E05"]?.metrics || {};
  const inhibitionSources=[
    (e04.commissions||0)>0 ? "NF-E04" : null,
    nfFinite(e05.interferenceCost)&&e05.interferenceCost>0 ? "NF-E05" : null,
  ].filter(Boolean);
  if(inhibitionSources.length){
    const repeated=inhibitionSources.length>=2;
    const evidenceLevel=nfRecommendationEvidenceLevel({independentSources:inhibitionSources.length});
    addSpecific({
      id:"pattern:inhibition-interference",
      source:"cross_task",
      assessmentDomain:"inhibicion",
      title:"Control inhibitorio bajo interferencia",
      priority:repeated?"high":"medium",
      priorityBasis:repeated
        ?"El patrón aparece en dos tareas independientes del bloque ejecutivo."
        :"El patrón procede de una sola tarea y se mantiene como objetivo posible.",
      evidenceLevel,
      rationale:[
        `NF-E04: ${e04.commissions||0} respuestas de comisión.`,
        nfFinite(e05.interferenceCost)?`NF-E05: costo interno de interferencia ${Math.round(e05.interferenceCost)} ms.`:"NF-E05: costo temporal no disponible.",
        "No se utiliza un número fijo de comisiones ni un corte temporal para establecer prioridad."
      ],
      objective:"Considerar trabajo de control de respuesta e interferencia preservando precisión, sin convertir la reducción del tiempo en el objetivo principal.",
      trainingDomains:["flexibilidad","funciones_exec"],
      suggestedExerciseIds:["flex_opuesto","flex_regla","trail_making"],
    });
  }

  const e06=byTask["NF-E06"]?.metrics || {};
  if((e06.perseverations||0)>0 || nfFinite(e06.switchCost)){
    const evidenceLevel=nfRecommendationEvidenceLevel({independentSources:1});
    addSpecific({
      id:"pattern:flexibility-switch",
      source:"task_pattern",
      assessmentDomain:"flexibilidad",
      title:"Cambio de criterio y flexibilidad",
      priority:"medium",
      priorityBasis:"Observación procedente de NF-E06; el número de perseveraciones no funciona como punto de corte clínico.",
      evidenceLevel,
      rationale:[
        `NF-E06 registró ${e06.perseverations||0} perseveraciones.`,
        nfFinite(e06.switchCost)?`Costo interno de cambio: ${Math.round(e06.switchCost)} ms.`:"",
      ],
      objective:"Considerar práctica de cambios de regla, monitoreo de la regla vigente y corrección de respuestas previas antes de aumentar velocidad o complejidad.",
      trainingDomains:["flexibilidad","funciones_exec"],
      suggestedExerciseIds:["flex_regla","flex_opuesto","trail_making"],
    });
  }

  // Memoria de trabajo: no se usa una diferencia >=20 como corte.
  // Las dos modalidades se describen juntas solo si el dominio ya requiere seguimiento.
  const e07=byTask["NF-E07"]?.metrics || {};
  const e08=byTask["NF-E08"]?.metrics || {};
  const wmDomain=(domainProfile||[]).find(d=>d.domainId==="memoria_trabajo");
  if(nfFinite(e07.precision)&&nfFinite(e08.precision)&&wmDomain?.band!=="strength"){
    const evidenceLevel=nfRecommendationEvidenceLevel({
      independentSources:2,
      qualityId:wmDomain?.evidenceQuality?.id || null
    });
    addSpecific({
      id:"pattern:working-memory-modalities",
      source:"cross_task",
      assessmentDomain:"memoria_trabajo",
      title:"Memoria de trabajo por modalidad",
      priority:"medium",
      priorityBasis:"Dos modalidades se consideran conjuntamente porque el dominio requiere seguimiento; no se exige una diferencia fija entre porcentajes.",
      evidenceLevel,
      rationale:[
        `NF-E07: ${Math.round(e07.precision)}% · NF-E08: ${Math.round(e08.precision)}%.`,
        "Las tareas no son métricamente equivalentes; la diferencia se conserva como descripción y no define por sí sola una modalidad alterada."
      ],
      objective:"Considerar entrenamiento multimodal de memoria de trabajo y ajustar el énfasis según observación profesional, estrategia utilizada y desempeño durante las sesiones.",
      trainingDomains:["memoria_trabajo"],
      suggestedExerciseIds:["digits_forward","digits_backward","letter_number","operation_span","nback_1"],
    });
  }

  // Memoria verbal: se eliminan retención <70 y <60. Los errores observables
  // generan seguimiento; la retención se informa, no funciona como corte.
  const e09=byTask["NF-E09"]?.metrics || {};
  const verbalErrorPattern=(e09.intrusions||0)>0 || (e09.falseAlarms||0)>0 || (e09.omissions||0)>0;
  if(verbalErrorPattern){
    const evidenceLevel=nfRecommendationEvidenceLevel({independentSources:1});
    const focus=[];
    if((e09.intrusions||0)>0) focus.push("manejo de intrusiones");
    if((e09.falseAlarms||0)>0) focus.push("discriminación en reconocimiento");
    if((e09.omissions||0)>0) focus.push("recuperación de elementos objetivo");
    addSpecific({
      id:"pattern:verbal-memory",
      source:"task_pattern",
      assessmentDomain:"memoria_verbal",
      title:"Aprendizaje y recuperación verbal",
      priority:"medium",
      priorityBasis:"Se observaron errores cualitativamente relevantes en NF-E09; la retención porcentual no se usa como punto de corte.",
      evidenceLevel,
      rationale:[
        nfFinite(e09.retentionRate)?`Retención interna registrada: ${Math.round(e09.retentionRate)}%.`:"",
        `Intrusiones: ${e09.intrusions||0} · falsas alarmas: ${e09.falseAlarms||0} · omisiones: ${e09.omissions||0}.`
      ],
      objective:`Considerar estrategias explícitas de codificación y recuperación con énfasis en ${focus.join(", ") || "aprendizaje verbal"}, manteniendo separados aprendizaje, evocación y reconocimiento.`,
      trainingDomains:["memoria_episodica"],
      suggestedExerciseIds:["word_recall","story_recall"],
    });
  }

  // Memoria prospectiva: la repetición del patrón en dos contextos sí aumenta
  // la prioridad, porque no depende de un porcentaje arbitrario.
  const e11=byTask["NF-E11"]?.metrics || {};
  const e27=byTask["NF-E27"]?.metrics || {};
  const prospectiveSources=[
    e11.spontaneousRecall===0 ? "NF-E11" : null,
    e27.spontaneousRecall===0 ? "NF-E27" : null,
  ].filter(Boolean);
  if(prospectiveSources.length){
    const repeated=prospectiveSources.length>=2;
    const evidenceLevel=nfRecommendationEvidenceLevel({independentSources:prospectiveSources.length});
    addSpecific({
      id:"pattern:prospective-memory",
      source:"cross_task",
      assessmentDomain:"memoria_prospectiva",
      title:"Recuerdo de intenciones futuras",
      priority:repeated?"high":"medium",
      priorityBasis:repeated
        ?"La recuperación no fue espontánea en dos contextos prospectivos independientes."
        :"La observación procede de uno de los dos contextos prospectivos.",
      evidenceLevel,
      rationale:[
        e11.spontaneousRecall===1?"NF-E11: recuerdo espontáneo.":e11.cuedRecall===1?"NF-E11: recuperación con clave.":"NF-E11: no recuperado.",
        e27.spontaneousRecall===1?"NF-E27: recuerdo espontáneo.":e27.cuedRecall===1?"NF-E27: recuperación con clave.":"NF-E27: no recuperado."
      ],
      objective:"Considerar entrenamiento de creación de claves internas y externas para recordar intenciones, graduando los apoyos según respuesta en sesión.",
      trainingDomains:["memoria_episodica","memoria_trabajo"],
      suggestedExerciseIds:["word_recall","letter_number","operation_span"],
    });
  }

  const e18=byTask["NF-E18"]?.metrics || {};
  if((e18.errors||0)>0 || (e18.selfCorrections||0)>0){
    const evidenceLevel=nfRecommendationEvidenceLevel({independentSources:1});
    addSpecific({
      id:"pattern:planning",
      source:"task_pattern",
      assessmentDomain:"planificacion",
      title:"Planificación antes de ejecutar",
      priority:"medium",
      priorityBasis:"Patrón observado en una tarea de planificación; no se escala por alcanzar un número fijo de errores.",
      evidenceLevel,
      rationale:[`NF-E18: ${e18.errors||0} movimientos adicionales/errores y ${e18.selfCorrections||0} autocorrecciones.`],
      objective:"Considerar práctica de anticipación de pasos, formulación de un plan antes de actuar y revisión del resultado.",
      trainingDomains:["funciones_exec","flexibilidad"],
      suggestedExerciseIds:["trail_making","flex_regla","verbal_fluency"],
    });
  }

  // Cognición funcional: se elimina la media <70. Se observa cuántas tareas
  // funcionales distintas contienen errores, sin promediar constructos heterogéneos.
  const functionalIds=["NF-E24","NF-E25","NF-E26","NF-E27"];
  const functionalEvidence=functionalIds.map(id=>{
    const r=byTask[id],m=r?.metrics||{};
    if(!r)return null;
    const hasObservedDifficulty=(m.errors||0)>0 || (m.omissions||0)>0 || (m.falseAlarms||0)>0 || m.spontaneousRecall===0;
    return {taskId:id,hasObservedDifficulty,metrics:m};
  }).filter(Boolean);
  const functionalDifficultySources=functionalEvidence.filter(x=>x.hasObservedDifficulty);
  if(functionalDifficultySources.length){
    const repeated=functionalDifficultySources.length>=2;
    const evidenceLevel=nfRecommendationEvidenceLevel({independentSources:functionalDifficultySources.length});
    addSpecific({
      id:"pattern:functional-cognition",
      source:"cross_task",
      assessmentDomain:"cognicion_funcional",
      title:"Aplicación cognitiva en situaciones funcionales simuladas",
      priority:repeated?"high":"medium",
      priorityBasis:repeated
        ?"Se observaron dificultades en más de una tarea funcional simulada."
        :"La observación procede de una sola tarea funcional simulada.",
      evidenceLevel,
      rationale:[
        `Tareas funcionales con errores observables: ${functionalDifficultySources.map(x=>x.taskId).join(", ")}.`,
        "No se calcula una media única para decidir prioridad porque las tareas funcionales representan demandas diferentes.",
        "El resultado no demuestra desempeño equivalente en actividades reales de la vida diaria."
      ],
      objective:"Considerar práctica de planificación cotidiana, seguimiento de instrucciones y resolución de problemas funcionales con apoyos graduados y comprobación explícita.",
      trainingDomains:["funciones_exec","calculo","comprension"],
      suggestedExerciseIds:["trail_making","calc_operaciones","calc_faltante","verbal_comprehension"],
    });
  }

  return recommendations
    .filter(r=>r.priority!=="low" || r.source==="domain_profile")
    .sort((a,b)=>{
      const pa=nfRecommendationPriority(a.priority).order;
      const pb=nfRecommendationPriority(b.priority).order;
      if(pa!==pb)return pa-pb;
      return String(a.title).localeCompare(String(b.title));
    })
    .map((r,index)=>({...r,rank:index+1,version:ASSESSMENT_RECOMMENDATION_VERSION}));
}

function AssessmentV2RecommendationsPanel({ evalData }) {
  const recommendations=evalData?.interventionRecommendations ||
    buildAssessmentInterventionRecommendationsV2(
      evalData?.taskResults || [],
      evalData?.domainProfile || [],
      evalData?.interpretation || null
    );
  const actionable=recommendations.filter(r=>r.priority==="high"||r.priority==="medium");
  const maintenance=recommendations.filter(r=>r.priority==="low");

  const renderRec=(r)=>{
    const p=nfRecommendationPriority(r.priority);
    return <details key={r.id} style={{border:`1px solid ${COLORS.border}`,borderRadius:11,padding:"11px 13px",background:"#fff"}}>
      <summary style={{cursor:"pointer",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <span style={{fontWeight:750,fontSize:".82rem"}}>{r.rank}. {r.title}</span>
        <Badge label={p.label} color={p.color}/>
      </summary>
      <div style={{paddingTop:10,marginTop:10,borderTop:`1px solid ${COLORS.border}`}}>
        <p style={{fontSize:".74rem",lineHeight:1.6,color:COLORS.textSecond,margin:"0 0 8px"}}><strong>Objetivo sugerido:</strong> {r.objective}</p>
        {r.evidenceLevel && <div style={{fontSize:".7rem",padding:"8px 9px",borderRadius:8,background:COLORS.bg,marginBottom:8}}>
          <strong>{r.evidenceLevel.label}.</strong> {r.evidenceLevel.note}
        </div>}
        {r.priorityBasis && <div style={{fontSize:".69rem",color:COLORS.textMuted,lineHeight:1.5,marginBottom:6}}><strong>Base de prioridad:</strong> {r.priorityBasis}</div>}
        {(r.rationale||[]).filter(Boolean).map((x,i)=><div key={i} style={{fontSize:".7rem",color:COLORS.textMuted,lineHeight:1.5,marginTop:3}}>• {x}</div>)}
        <div style={{marginTop:9,fontSize:".7rem",color:COLORS.textMuted}}>
          Áreas terapéuticas relacionadas: {(r.trainingDomains||[]).map(id=>DOMINIOS_ADULTO[id]?.label || id).join(", ") || "Definir profesionalmente"}
        </div>
        {(r.suggestedExerciseIds||[]).length>0 && <div style={{marginTop:4,fontSize:".7rem",color:COLORS.textMuted}}>
          Ejercicios candidatos: {r.suggestedExerciseIds.join(", ")}
        </div>}
        <div style={{marginTop:8,padding:8,borderRadius:8,background:COLORS.bg,fontSize:".68rem",color:COLORS.textMuted,lineHeight:1.5}}>
          Sugerencia de apoyo a la decisión. No constituye una prescripción automática; el profesional decide si se incorpora al plan, su frecuencia, dificultad y modalidad.
        </div>
      </div>
    </details>;
  };

  return <Card style={{marginBottom:20,border:`1px solid ${COLORS.primary}20`}}>
    <div style={{fontSize:".7rem",fontWeight:850,color:COLORS.primary,letterSpacing:".05em"}}>FASE 41 · {ASSESSMENT_RECOMMENDATION_VERSION}</div>
    <h3 style={{margin:"6px 0 6px"}}>Prioridades sugeridas para intervención</h3>
    <p style={{fontSize:".75rem",color:COLORS.textMuted,lineHeight:1.6,margin:"0 0 14px"}}>
      Las recomendaciones se generan a partir de calidad de evidencia, repetición de patrones y errores observables. Las cifras internas se muestran como descripción, no como puntos de corte clínicos. La decisión final sigue siendo profesional.
    </p>
    {actionable.length?<div style={{display:"grid",gap:8}}>{actionable.map(renderRec)}</div>:<div style={{fontSize:".76rem",color:COLORS.textMuted,padding:12,background:COLORS.bg,borderRadius:9}}>No se generaron prioridades automáticas altas o medias. Revisar el perfil antes de definir objetivos.</div>}
    {maintenance.length>0 && <details style={{marginTop:12}}>
      <summary style={{cursor:"pointer",fontSize:".75rem",fontWeight:750,color:COLORS.textSecond}}>Ver áreas sugeridas para mantenimiento ({maintenance.length})</summary>
      <div style={{display:"grid",gap:8,marginTop:8}}>{maintenance.map(renderRec)}</div>
    </details>}
  </Card>;
}


// ─── FASE 42 · PRESCRIPCIÓN TERAPÉUTICA INTELIGENTE Y EDITABLE ──────────────
const THERAPEUTIC_PRESCRIPTION_VERSION = "NF-RX-2.0";

function nfExerciseExistsInDomain(domainId, exerciseId) {
  return (EX_ADULTO[domainId] || []).some(ex=>ex.id===exerciseId);
}

function nfFindTrainingDomainForExercise(exerciseId, allowedDomains = []) {
  const preferred=(allowedDomains || []).find(domId=>nfExerciseExistsInDomain(domId,exerciseId));
  if(preferred) return preferred;
  return Object.keys(EX_ADULTO).find(domId=>nfExerciseExistsInDomain(domId,exerciseId)) || null;
}

function nfPrescriptionInitialLevel(paciente, domainId, exerciseId, recommendationPriority) {
  const ex=(EX_ADULTO[domainId] || []).find(e=>e.id===exerciseId);
  if(!ex) return 2;
  const historyLevel=getRecommendedLevel(paciente,domainId,ex);
  // En prioridades altas se inicia cerca del nivel conocido, evitando escalar
  // automáticamente por el hecho de que el área sea prioritaria.
  if(recommendationPriority==="high") return clampAdaptiveLevel(Math.min(historyLevel,3));
  if(recommendationPriority==="medium") return clampAdaptiveLevel(historyLevel);
  return clampAdaptiveLevel(Math.max(2,historyLevel));
}

function nfPrescriptionProgressionRule(priority) {
  if(priority==="high"){
    return {
      success:"Aumentar una sola dimensión de dificultad después de desempeño estable en al menos 2 exposiciones comparables.",
      difficulty:"Mantener o reducir una dimensión; priorizar estrategia, comprensión y precisión antes de aumentar velocidad.",
      support:"Retirar apoyos gradualmente solo cuando la ejecución se mantenga estable.",
    };
  }
  if(priority==="medium"){
    return {
      success:"Progresar de forma gradual si mantiene precisión y autonomía.",
      difficulty:"Mantener nivel y variar estímulos antes de aumentar carga.",
      support:"Usar apoyos puntuales y comprobar si puede retirarlos.",
    };
  }
  return {
    success:"Mantener variabilidad y seguimiento periódico sin escalada automática.",
    difficulty:"Reducir complejidad si aparecen errores nuevos o dependencia de apoyos.",
    support:"Favorecer ejecución autónoma y registrar cambios.",
  };
}

function buildTherapeuticPrescriptionBlueprintV2(paciente, config = {}) {
  const baseline=getActiveEvaluation(paciente);
  if(baseline?.assessmentVersion!==NEUROFLEX_ASSESSMENT_VERSION) return null;

  const recommendations=baseline.interventionRecommendations ||
    buildAssessmentInterventionRecommendationsV2(
      baseline.taskResults || [],
      baseline.domainProfile || [],
      baseline.interpretation || null
    );

  const requestedCount=Math.max(1,Number(config.duracion)||6);
  const active=recommendations
    .filter(r=>r.priority==="high"||r.priority==="medium")
    .filter(r=>(r.trainingDomains||[]).some(id=>EX_ADULTO[id]?.length));

  const high=active.filter(r=>r.priority==="high");
  const medium=active.filter(r=>r.priority==="medium");
  const weighted=[
    ...high.flatMap(r=>[r,r,r]),
    ...medium.flatMap(r=>[r,r]),
  ];

  if(!weighted.length) return null;

  const slots=[];
  const usedExerciseIds=[];
  let cursor=0;

  while(slots.length<requestedCount && cursor<requestedCount*12){
    const rec=weighted[cursor%weighted.length];
    cursor++;

    const allowed=(rec.trainingDomains||[]).filter(id=>EX_ADULTO[id]?.length);
    if(!allowed.length) continue;

    const candidates=(rec.suggestedExerciseIds||[])
      .map(exId=>({exId,domainId:nfFindTrainingDomainForExercise(exId,allowed)}))
      .filter(x=>x.domainId && allowed.includes(x.domainId));

    let chosen=candidates.find(x=>!usedExerciseIds.includes(x.exId)) || candidates[0] || null;
    if(!chosen){
      const domainId=allowed[slots.length%allowed.length];
      const exs=EX_ADULTO[domainId] || [];
      const ex=exs.find(e=>!usedExerciseIds.includes(e.id)) || exs[0];
      if(ex) chosen={domainId,exId:ex.id};
    }
    if(!chosen) continue;

    const level=nfPrescriptionInitialLevel(paciente,chosen.domainId,chosen.exId,rec.priority);
    slots.push({
      slot:slots.length+1,
      recommendationId:rec.id,
      assessmentDomain:rec.assessmentDomain,
      priority:rec.priority,
      rationale:(rec.rationale||[]).filter(Boolean),
      objective:rec.objective,
      domId:chosen.domainId,
      exId:chosen.exId,
      adaptiveLevel:level,
      progression:nfPrescriptionProgressionRule(rec.priority),
      estimatedMinutes:4,
      selectedBy:"evaluation_v2_prescription",
      professionalOverride:false,
    });
    usedExerciseIds.push(chosen.exId);
  }

  const counts={};
  slots.forEach(s=>{counts[s.domId]=(counts[s.domId]||0)+1});
  const distribution=Object.entries(counts).map(([domainId,count])=>({
    domainId,
    count,
    pct:Math.round((count/Math.max(1,slots.length))*100),
    estimatedMinutes:count*4,
  }));

  return {
    version:THERAPEUTIC_PRESCRIPTION_VERSION,
    assessmentEvaluationId:baseline.evaluationId || null,
    generatedAt:new Date().toISOString(),
    targetMinutes:Math.max(20,slots.length*4),
    exerciseCount:slots.length,
    distribution,
    slots,
    rules:{
      preserveAccuracyBeforeSpeed:true,
      oneDifficultyDimensionAtATime:true,
      professionalReviewRequired:true,
      automaticStart:false,
      adaptiveChangesRequireComparablePerformance:true,
    },
    note:"Propuesta terapéutica derivada de Evaluation v2. Debe ser revisada por el profesional antes de iniciar la sesión.",
  };
}

function TherapeuticPrescriptionPreviewV2({ paciente, config }) {
  const blueprint=buildTherapeuticPrescriptionBlueprintV2(paciente,config);
  if(!blueprint) return null;
  return <Card style={{marginBottom:20,border:`1px solid ${COLORS.primary}22`,background:COLORS.primary+"04"}}>
    <div style={{fontSize:".68rem",fontWeight:850,color:COLORS.primary,letterSpacing:".05em"}}>FASE 42 · {THERAPEUTIC_PRESCRIPTION_VERSION}</div>
    <h3 style={{margin:"5px 0 5px"}}>Propuesta terapéutica desde Evaluation v2</h3>
    <p style={{fontSize:".73rem",color:COLORS.textMuted,lineHeight:1.55,margin:"0 0 12px"}}>
      Distribuye las prioridades de la evaluación dentro de la sesión y propone un nivel inicial. No inicia ni prescribe nada sin revisión profesional.
    </p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:8,marginBottom:12}}>
      <div style={{padding:10,borderRadius:9,background:"#fff",textAlign:"center"}}><strong>{blueprint.exerciseCount}</strong><div style={{fontSize:".66rem",color:COLORS.textMuted}}>ejercicios</div></div>
      <div style={{padding:10,borderRadius:9,background:"#fff",textAlign:"center"}}><strong>~{blueprint.targetMinutes} min</strong><div style={{fontSize:".66rem",color:COLORS.textMuted}}>duración prevista</div></div>
      <div style={{padding:10,borderRadius:9,background:"#fff",textAlign:"center"}}><strong>{blueprint.distribution.length}</strong><div style={{fontSize:".66rem",color:COLORS.textMuted}}>áreas terapéuticas</div></div>
    </div>
    <div style={{display:"grid",gap:7}}>
      {blueprint.distribution.map(d=><div key={d.domainId} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",padding:"8px 10px",background:"#fff",borderRadius:9,border:`1px solid ${COLORS.border}`}}>
        <span style={{fontSize:".73rem",fontWeight:650}}>{DOMINIOS_ADULTO[d.domainId]?.emoji} {DOMINIOS_ADULTO[d.domainId]?.label || d.domainId}</span>
        <span style={{fontSize:".69rem",color:COLORS.textMuted}}>{d.count} ejercicio(s) · ~{d.estimatedMinutes} min · {d.pct}%</span>
      </div>)}
    </div>
  </Card>;
}


// ─── FASE 43 · SEGUIMIENTO TERAPÉUTICO INTELIGENTE ──────────────────────────
const THERAPEUTIC_FOLLOWUP_VERSION = "NF-FOLLOW-1.0";
const THERAPEUTIC_FOLLOWUP_RULES = {
  minComparableSessions:2,
  reviewAfterSessions:3,
  stableAccuracy:80,
  intermediateAccuracy:65,
  autonomyForProgression:70,
  meaningfulChange:10,
  reviewDrop:15,
};

function nfSessionDomainSnapshot(session, domId) {
  const d=session?.byDom?.[domId];
  if(!d) return null;
  const pct=nfFinite(d.pct)
    ? d.pct
    : (nfFinite(d.total)&&d.total>0&&nfFinite(d.correct)?Math.round((d.correct/d.total)*100):null);
  return {
    sessionNumber:session?.numero ?? null,
    date:session?.date || null,
    pct,
    level:nfFinite(d.averageAdaptiveLevel)?d.averageAdaptiveLevel:null,
    autonomy:nfFinite(d.autonomyRate)?d.autonomyRate:null,
    support:nfFinite(d.averageSupportLevel)?d.averageSupportLevel:null,
    exerciseCount:d.count || 0,
    prescriptionVersion:session?.prescriptionVersion || null,
  };
}

function nfComparableExerciseSeries(sessions = [], domId, maxSessions = 5) {
  const byExercise={};
  sessions.forEach(s=>{
    (s?.results || []).forEach(r=>{
      if(r?.domId!==domId || !r?.exId || !nfFinite(r?.pct)) return;
      if(!byExercise[r.exId]) byExercise[r.exId]=[];
      byExercise[r.exId].push({
        sessionNumber:s.numero,
        pct:r.pct,
        level:nfFinite(r.adaptiveLevel)?r.adaptiveLevel:null,
        support:getTrackedSupportLevel(r),
      });
    });
  });
  return Object.entries(byExercise)
    .map(([exId,rows])=>({exId,rows:rows.slice(-maxSessions)}))
    .filter(x=>x.rows.length>=2)
    .sort((a,b)=>b.rows.length-a.rows.length);
}

function nfFollowUpActionLabel(action) {
  const map={
    progress:{label:"Progresar gradualmente",color:COLORS.success},
    maintain:{label:"Mantener y consolidar",color:COLORS.info},
    adjust_strategy:{label:"Ajustar estrategia / apoyos",color:COLORS.warning},
    review_reassessment:{label:"Revisar objetivo o reevaluar",color:COLORS.accent},
    insufficient:{label:"Aún sin evidencia suficiente",color:COLORS.textMuted},
  };
  return map[action] || map.insufficient;
}

function buildTherapeuticFollowUpV2(paciente) {
  const baseline=getActiveEvaluation(paciente);
  const sessions=[...(paciente?.sesiones || [])]
    .filter(Boolean)
    .sort((a,b)=>(a.numero||0)-(b.numero||0));
  const planAreas=paciente?.interventionPlan?.areas || buildRehabilitationPlanFromEvaluation(paciente);
  const recs=baseline?.interventionRecommendations ||
    (baseline?.assessmentVersion===NEUROFLEX_ASSESSMENT_VERSION
      ? buildAssessmentInterventionRecommendationsV2(
          baseline.taskResults || [],
          baseline.domainProfile || [],
          baseline.interpretation || null
        )
      : []);

  const activeDomainIds=[...new Set(
    planAreas
      .filter(a=>a.estado==="objetivo"||a.estado==="seguimiento"||a.prioridad==="alta"||a.prioridad==="media")
      .map(a=>a.id)
      .filter(id=>DOMINIOS_ADULTO[id])
  )];

  const domainFollowUp=activeDomainIds.map(domId=>{
    const snapshots=sessions.map(s=>nfSessionDomainSnapshot(s,domId)).filter(Boolean).slice(-5);
    const numeric=snapshots.filter(x=>nfFinite(x.pct));
    const comparableSeries=nfComparableExerciseSeries(sessions,domId,5);
    const latest=numeric[numeric.length-1] || null;
    const previous=numeric[numeric.length-2] || null;
    const firstRecent=numeric[0] || null;
    const recentMean=numeric.length?Math.round(meanNum(numeric.map(x=>x.pct))):null;
    const recentDelta=latest&&firstRecent&&numeric.length>=2?latest.pct-firstRecent.pct:null;
    const autonomy=latest?.autonomy ?? null;
    const level=latest?.level ?? null;
    const support=latest?.support ?? null;

    let action="insufficient";
    const reasons=[];

    if(numeric.length<THERAPEUTIC_FOLLOWUP_RULES.minComparableSessions){
      reasons.push("Se requieren al menos dos sesiones con datos cuantificables para sugerir un cambio terapéutico.");
    } else {
      const lastTwo=numeric.slice(-2);
      const lastTwoMean=Math.round(meanNum(lastTwo.map(x=>x.pct)));
      const stableHigh=lastTwo.length>=2 && lastTwo.every(x=>x.pct>=THERAPEUTIC_FOLLOWUP_RULES.stableAccuracy);
      const autonomyReady=autonomy===null || autonomy>=THERAPEUTIC_FOLLOWUP_RULES.autonomyForProgression;
      const levelStableOrUp=!previous || level===null || previous.level===null || level>=previous.level;

      if(stableHigh && autonomyReady && levelStableOrUp){
        action="progress";
        reasons.push(`Las dos sesiones más recientes mantienen un desempeño medio de ${lastTwoMean}% con autonomía compatible con progresión.`);
        if(level!==null) reasons.push(`Nivel adaptativo reciente: ${level}/5.`);
      } else if(
        numeric.length>=THERAPEUTIC_FOLLOWUP_RULES.reviewAfterSessions &&
        recentDelta!==null &&
        recentDelta<=-THERAPEUTIC_FOLLOWUP_RULES.reviewDrop
      ){
        action="review_reassessment";
        reasons.push(`En las sesiones recientes el indicador disminuyó ${Math.abs(Math.round(recentDelta))} puntos.`);
        reasons.push("Conviene revisar el objetivo, la dificultad, los apoyos y considerar reevaluación selectiva si el patrón persiste.");
      } else if(
        (latest?.pct ?? 100)<THERAPEUTIC_FOLLOWUP_RULES.intermediateAccuracy ||
        (support!==null && previous?.support!==null && support>previous.support)
      ){
        action="adjust_strategy";
        reasons.push(`El desempeño reciente fue ${latest?.pct ?? "no cuantificable"}%${support!==null?` con apoyo medio ${support}`:""}.`);
        reasons.push("Se sugiere mantener o reducir carga, reforzar estrategia y revisar comprensión antes de aumentar dificultad.");
      } else {
        action="maintain";
        reasons.push(`El desempeño reciente se mantiene en un rango intermedio/estable (${recentMean ?? "—"}% en la ventana reciente).`);
        reasons.push("Conviene consolidar el nivel y variar estímulos antes de aumentar carga.");
      }
    }

    if(comparableSeries.length){
      const best=comparableSeries[0];
      const first=best.rows[0], last=best.rows[best.rows.length-1];
      const delta=last.pct-first.pct;
      reasons.push(`Evidencia comparable en ${best.exId}: ${first.pct}% → ${last.pct}% (${delta>0?"+":""}${delta} pts) en ${best.rows.length} exposiciones.`);
    } else {
      reasons.push("No hay todavía suficiente repetición del mismo ejercicio para estimar cambio comparable por tarea.");
    }

    const relatedRecs=recs.filter(r=>(r.trainingDomains||[]).includes(domId));
    const primaryRec=relatedRecs.find(r=>r.priority==="high") || relatedRecs.find(r=>r.priority==="medium") || relatedRecs[0] || null;

    return {
      domainId:domId,
      label:DOMINIOS_ADULTO[domId]?.label || domId,
      action,
      reasons,
      latest,
      recentMean,
      recentDelta,
      comparableExercise:comparableSeries[0] || null,
      recommendationIds:relatedRecs.map(r=>r.id),
      objective:primaryRec?.objective || planAreas.find(a=>a.id===domId)?.objetivo || null,
      professionalDecisionRequired:true,
      automaticChange:false,
    };
  });

  const actionCounts=domainFollowUp.reduce((acc,d)=>{
    acc[d.action]=(acc[d.action]||0)+1;
    return acc;
  },{});

  return {
    version:THERAPEUTIC_FOLLOWUP_VERSION,
    generatedAt:new Date().toISOString(),
    sourceEvaluationId:baseline?.evaluationId || null,
    sessionsAnalyzed:sessions.length,
    rules:{...THERAPEUTIC_FOLLOWUP_RULES},
    domainFollowUp,
    summary:{
      progress:actionCounts.progress||0,
      maintain:actionCounts.maintain||0,
      adjustStrategy:actionCounts.adjust_strategy||0,
      reviewReassessment:actionCounts.review_reassessment||0,
      insufficient:actionCounts.insufficient||0,
    },
    limitations:[
      "Las tendencias se interpretan dentro de NeuroFlex y no equivalen a cambio neuropsicológico normativo.",
      "Una variación entre sesiones puede depender de dificultad, apoyos, comprensión, contexto o familiaridad con la tarea.",
      "La sugerencia de reevaluación no implica deterioro ni diagnóstico; indica necesidad de revisión profesional.",
      "NeuroFlex no cambia automáticamente objetivos, niveles ni prescripciones a partir de este seguimiento.",
    ],
  };
}

function TherapeuticFollowUpPanel({ paciente }) {
  const data=buildTherapeuticFollowUpV2(paciente);
  if(!data?.domainFollowUp?.length) return null;

  return <div style={{marginBottom:20}}>
    <Card style={{marginBottom:14,border:`1px solid ${COLORS.primary}22`,background:COLORS.primary+"04"}}>
      <div style={{fontSize:".68rem",fontWeight:850,color:COLORS.primary,letterSpacing:".05em"}}>FASE 43 · {data.version}</div>
      <h3 style={{margin:"5px 0 5px"}}>Seguimiento terapéutico inteligente</h3>
      <p style={{fontSize:".73rem",color:COLORS.textMuted,lineHeight:1.55,margin:0}}>
        Compara desempeño, nivel adaptativo, autonomía y apoyos entre sesiones. Las sugerencias orientan la revisión clínica; no modifican automáticamente el plan.
      </p>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:8,marginBottom:14}}>
      {[
        ["Progresar",data.summary.progress,COLORS.success],
        ["Mantener",data.summary.maintain,COLORS.info],
        ["Ajustar",data.summary.adjustStrategy,COLORS.warning],
        ["Revisar",data.summary.reviewReassessment,COLORS.accent],
      ].map(([label,value,color])=><Card key={label} style={{padding:13,textAlign:"center"}}>
        <div style={{fontWeight:900,fontSize:"1.25rem",color}}>{value}</div>
        <div style={{fontSize:".67rem",color:COLORS.textMuted}}>{label}</div>
      </Card>)}
    </div>

    <Card style={{marginBottom:14}}>
      <p style={{fontWeight:800,margin:"0 0 10px"}}>Decisiones sugeridas por área</p>
      <div style={{display:"grid",gap:8}}>
        {data.domainFollowUp.map(d=>{
          const action=nfFollowUpActionLabel(d.action);
          return <details key={d.domainId} style={{border:`1px solid ${COLORS.border}`,borderRadius:10,padding:"10px 12px"}}>
            <summary style={{cursor:"pointer",listStyle:"none",display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}>
              <span style={{fontSize:".8rem",fontWeight:750}}>{DOMINIOS_ADULTO[d.domainId]?.emoji} {d.label}</span>
              <Badge label={action.label} color={action.color}/>
            </summary>
            <div style={{paddingTop:9,marginTop:9,borderTop:`1px solid ${COLORS.border}`}}>
              {d.objective&&<p style={{fontSize:".72rem",lineHeight:1.55,color:COLORS.textSecond,margin:"0 0 7px"}}><strong>Objetivo vigente:</strong> {d.objective}</p>}
              {d.reasons.map((r,i)=><div key={i} style={{fontSize:".7rem",lineHeight:1.5,color:COLORS.textMuted,marginTop:3}}>• {r}</div>)}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:9,fontSize:".67rem",color:COLORS.textMuted}}>
                {d.latest?.pct!==null&&d.latest?.pct!==undefined&&<span>Último indicador: {d.latest.pct}%</span>}
                {d.latest?.level!==null&&d.latest?.level!==undefined&&<span>Nivel: {d.latest.level}/5</span>}
                {d.latest?.autonomy!==null&&d.latest?.autonomy!==undefined&&<span>Autonomía: {d.latest.autonomy}%</span>}
              </div>
              <div style={{marginTop:8,padding:8,borderRadius:8,background:COLORS.bg,fontSize:".68rem",color:COLORS.textMuted}}>
                Requiere decisión profesional. No se aplicó ningún cambio automático.
              </div>
            </div>
          </details>
        })}
      </div>
    </Card>

    <Card style={{border:`1px solid ${COLORS.accent}22`}}>
      <p style={{fontWeight:750,margin:"0 0 6px",color:COLORS.accent}}>Límites del seguimiento</p>
      {data.limitations.map((x,i)=><div key={i} style={{fontSize:".7rem",color:COLORS.textMuted,lineHeight:1.5,marginTop:3}}>• {x}</div>)}
    </Card>
  </div>;
}


// ─── FASE 44 · REEVALUACIÓN SELECTIVA + MEDICIÓN DESCRIPTIVA DE CAMBIO ──────
const SELECTIVE_REASSESSMENT_VERSION = "NF-RETEST-2.0";

function nfTasksForAssessmentDomainV2(domainId, maxTasks = 3) {
  const primary=Object.values(ASSESSMENT_TASKS_V2).filter(t=>t.primaryDomain===domainId);
  const secondary=Object.values(ASSESSMENT_TASKS_V2).filter(t=>(t.secondaryDomains||[]).includes(domainId));
  const ordered=[...primary,...secondary.filter(t=>!primary.some(p=>p.id===t.id))];
  return ordered.slice(0,maxTasks).map(t=>t.id);
}

function nfAssessmentDomainsForTrainingDomainV2(trainingDomainId, baseline = null) {
  const fromBaseline=(baseline?.interventionRecommendations || [])
    .filter(r=>(r.trainingDomains || []).includes(trainingDomainId))
    .map(r=>r.assessmentDomain)
    .filter(id=>ASSESSMENT_DOMAINS_V2[id]);

  if(fromBaseline.length) {
    return {
      assessmentDomainIds:[...new Set(fromBaseline)],
      source:"baseline_recommendations",
      safe:true,
    };
  }

  const fallback=Object.entries(ASSESSMENT_DOMAIN_TO_TRAINING)
    .filter(([,bridge])=>(bridge.trainingDomains || []).includes(trainingDomainId))
    .map(([assessmentDomainId])=>assessmentDomainId)
    .filter(id=>ASSESSMENT_DOMAINS_V2[id]);

  return {
    assessmentDomainIds:[...new Set(fallback)],
    source:fallback.length?"static_reverse_bridge":"unmapped",
    safe:fallback.length>0,
  };
}

function buildSelectiveReassessmentPlanV2(paciente) {
  const baseline=getActiveEvaluation(paciente);
  if(baseline?.assessmentVersion!==NEUROFLEX_ASSESSMENT_VERSION) {
    return {
      version:SELECTIVE_REASSESSMENT_VERSION,
      sourceEvaluationId:null,
      recommended:false,
      reason:"Se requiere una línea base Evaluation v2 para construir una reevaluación selectiva comparable.",
      triggerTreatmentDomainIds:[],
      assessmentDomainIds:[],
      domains:[],
      taskIds:[],
      mappingTrace:[],
      professionalDecisionRequired:true,
      automaticAdministration:false,
    };
  }

  const follow=buildTherapeuticFollowUpV2(paciente);
  const reviewDomains=(follow?.domainFollowUp || [])
    .filter(d=>d.action==="review_reassessment")
    .map(d=>d.domainId);

  const persistentAdjust=(follow?.domainFollowUp || [])
    .filter(d=>d.action==="adjust_strategy")
    .filter(d=>{
      const recent=(paciente?.sesiones || []).slice(-3).filter(s=>s?.byDom?.[d.domainId]);
      return recent.length>=3;
    })
    .map(d=>d.domainId);

  const triggerTreatmentDomainIds=[...new Set([...reviewDomains,...persistentAdjust])];
  const mappingTrace=triggerTreatmentDomainIds.map(trainingDomainId=>{
    const mapped=nfAssessmentDomainsForTrainingDomainV2(trainingDomainId,baseline);
    return {
      trainingDomainId,
      assessmentDomainIds:mapped.assessmentDomainIds,
      source:mapped.source,
      safe:mapped.safe,
    };
  });

  const unmappedTreatmentDomainIds=mappingTrace.filter(x=>!x.safe).map(x=>x.trainingDomainId);
  const assessmentDomainIds=[...new Set(mappingTrace.flatMap(x=>x.assessmentDomainIds))];

  const candidateTaskIds=[];
  assessmentDomainIds.forEach(domainId=>{
    nfTasksForAssessmentDomainV2(domainId,3).forEach(id=>{
      if(!candidateTaskIds.includes(id)) candidateTaskIds.push(id);
    });
  });

  // La reevaluación selectiva solo propone tareas directamente vinculadas a los
  // dominios de evaluación mapeados. No añade tareas de memoria como relleno.
  const taskIds=candidateTaskIds.slice(0,8);
  const needsProfessionalMappingReview=unmappedTreatmentDomainIds.length>0;

  return {
    version:SELECTIVE_REASSESSMENT_VERSION,
    sourceEvaluationId:baseline.evaluationId || null,
    recommended:taskIds.length>0 && !needsProfessionalMappingReview,
    reason:needsProfessionalMappingReview
      ?"Hay áreas terapéuticas sin una correspondencia segura con dominios de Evaluation v2. La reevaluación no se inicia automáticamente hasta revisión profesional."
      :taskIds.length
        ?"El seguimiento terapéutico identificó áreas candidatas y NeuroFlex las tradujo explícitamente a dominios de Evaluation v2 antes de seleccionar tareas."
        :"El seguimiento actual no muestra una indicación selectiva con correspondencia evaluativa suficiente.",
    triggerTreatmentDomainIds,
    assessmentDomainIds,
    domains:assessmentDomainIds,
    taskIds,
    candidateTaskIds,
    mappingTrace,
    unmappedTreatmentDomainIds,
    estimatedMinutes:taskIds.reduce((sum,id)=>sum+(getAssessmentTaskDefinition(id)?.estimatedMinutes||3),0),
    generatedAt:new Date().toISOString(),
    professionalDecisionRequired:true,
    automaticAdministration:false,
    mappingReviewRequired:needsProfessionalMappingReview,
  };
}

function buildSelectiveChangeProfileV2(baseline, newTaskResults = [], selectedDomains = []) {
  const baseMap=nfTaskResultMap(baseline?.taskResults || []);
  const comparisons=(newTaskResults || []).map(current=>{
    const previous=baseMap[current.taskId] || null;
    const previousScore=assessmentScoreFromTaskResult(previous);
    const currentScore=assessmentScoreFromTaskResult(current);
    const pm=previous?.metrics || {};
    const cm=current?.metrics || {};
    const comparability=getTaskComparabilityV2(previous,current);
    const taskVersionPrevious=comparability.previousVersion;
    const taskVersionCurrent=comparability.currentVersion;
    const versionComparable=comparability.status==="exact";
    const comparable=comparability.comparable;
    const delta=comparable&&nfFinite(previousScore)&&nfFinite(currentScore)?currentScore-previousScore:null;
    return {
      taskId:current.taskId,
      taskName:getAssessmentTaskDefinition(current.taskId)?.name || current.taskId,
      previousScore,
      currentScore,
      delta,
      errorDelta:comparable&&nfFinite(pm.errors)&&nfFinite(cm.errors)?cm.errors-pm.errors:null,
      responseTimeDeltaMs:comparable&&nfFinite(pm.meanResponseMs)&&nfFinite(cm.meanResponseMs)?Math.round(cm.meanResponseMs-pm.meanResponseMs):null,
      supportDelta:comparable&&nfFinite(pm.supportsUsed)&&nfFinite(cm.supportsUsed)?cm.supportsUsed-pm.supportsUsed:null,
      comparable,
      versionComparable,
      comparabilityStatus:comparability.status,
      comparabilityReason:comparability.reason,
      taskVersionPrevious,
      taskVersionCurrent,
    };
  });

  const domainChanges=(selectedDomains || []).map(domainId=>{
    const taskChanges=comparisons
      .filter(c=>{
        const def=getAssessmentTaskDefinition(c.taskId);
        return def && def.primaryDomain===domainId;
      })
      .filter(c=>c.comparable && nfFinite(c.delta));

    const deltas=taskChanges.map(c=>c.delta);
    const meanDelta=deltas.length?Math.round(meanNum(deltas)):null;
    let direction="insufficient";
    if(deltas.length){
      const positives=deltas.filter(x=>x>0).length;
      const negatives=deltas.filter(x=>x<0).length;
      const zeros=deltas.filter(x=>x===0).length;
      if(positives===deltas.length) direction="higher";
      else if(negatives===deltas.length) direction="lower";
      else if(zeros===deltas.length) direction="same";
      else direction="mixed";
    }

    return {
      domainId,
      label:ASSESSMENT_DOMAINS_V2[domainId]?.label || domainId,
      meanTaskDelta:meanDelta,
      direction,
      comparableTasks:taskChanges.length,
      taskIds:taskChanges.map(t=>t.taskId),
      taskDeltas:taskChanges.map(t=>({taskId:t.taskId,delta:t.delta})),
      interpretationRule:"Dirección descriptiva basada en consistencia del signo entre tareas primarias comparables; no usa un corte de ±10 puntos.",
    };
  });

  return {
    version:SELECTIVE_REASSESSMENT_VERSION,
    sourceEvaluationId:baseline?.evaluationId || null,
    comparisons,
    domainChanges,
    limitations:[
      "El cambio se calcula únicamente entre tareas NeuroFlex comparables administradas en ambos momentos.",
      "Las diferencias son descriptivas y no representan cambio clínicamente significativo, puntuación normativa ni efecto terapéutico demostrado. No se usa un umbral fijo de ±10 puntos para clasificar cambio.",
      "El tiempo de respuesta se compara solo cuando la versión administrada conserva condiciones suficientemente semejantes.",
      "Una reevaluación selectiva no sustituye una evaluación completa cuando el profesional necesita actualizar el perfil global.",
    ],
  };
}

function SelectiveReassessmentChangeView({ record, onSave, onExit }) {
  const change=record?.changeProfile;
  return <div style={{maxWidth:900,margin:"0 auto"}}>
    <Card style={{marginBottom:16,border:`1px solid ${COLORS.primary}20`}}>
      <div style={{fontSize:".68rem",fontWeight:850,color:COLORS.primary,letterSpacing:".05em"}}>FASE 44 · {SELECTIVE_REASSESSMENT_VERSION}</div>
      <h2 style={{margin:"6px 0 7px"}}>Comparación selectiva completada</h2>
      <p style={{fontSize:".76rem",lineHeight:1.6,color:COLORS.textMuted,margin:0}}>
        Se comparan únicamente las mismas tareas administradas en la línea base y en esta reevaluación. El resultado no reemplaza automáticamente la línea base vigente.
      </p>
    </Card>

    <Card style={{marginBottom:16}}>
      <p style={{fontWeight:800,margin:"0 0 10px"}}>Cambio por tarea comparable</p>
      <div style={{display:"grid",gap:8}}>
        {(change?.comparisons||[]).map(c=>{
          const color=!nfFinite(c.delta)?COLORS.textMuted:c.delta>0?COLORS.success:c.delta<0?COLORS.warning:COLORS.info;
          return <div key={c.taskId} style={{padding:11,borderRadius:10,border:`1px solid ${COLORS.border}`,display:"grid",gridTemplateColumns:"1fr auto",gap:10}}>
            <div>
              <div style={{fontWeight:750,fontSize:".79rem"}}>{c.taskId} · {c.taskName}</div>
              <div style={{fontSize:".69rem",color:COLORS.textMuted,marginTop:3}}>
                Línea base: {nfFinite(c.previousScore)?c.previousScore:"—"} · Reevaluación: {nfFinite(c.currentScore)?c.currentScore:"—"}
                {nfFinite(c.errorDelta)?` · Δ errores ${c.errorDelta>0?"+":""}${c.errorDelta}`:""}
                {nfFinite(c.responseTimeDeltaMs)?` · Δ TR ${c.responseTimeDeltaMs>0?"+":""}${c.responseTimeDeltaMs} ms`:""}
                {c.comparable===false?` · ${c.comparabilityReason || "comparación cuantitativa suspendida"}`:""}
              </div>
            </div>
            <Badge label={nfFinite(c.delta)?`${c.delta>0?"+":""}${c.delta} pts`:"No comparable"} color={color}/>
          </div>
        })}
      </div>
    </Card>

    <Card style={{marginBottom:16}}>
      <p style={{fontWeight:800,margin:"0 0 10px"}}>Lectura por dominio reevaluado</p>
      {(change?.domainChanges||[]).map(d=>{
        const label=d.direction==="higher"?"Resultados mayores en todas las tareas comparables":d.direction==="lower"?"Resultados menores en todas las tareas comparables":d.direction==="same"?"Resultados sin diferencia numérica":d.direction==="mixed"?"Cambios en direcciones distintas":"Evidencia insuficiente";
        const color=d.direction==="higher"?COLORS.success:d.direction==="lower"?COLORS.warning:(d.direction==="same"||d.direction==="mixed")?COLORS.info:COLORS.textMuted;
        return <div key={d.domainId} style={{padding:"10px 0",borderBottom:`1px solid ${COLORS.border}`,display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}>
          <div><strong style={{fontSize:".78rem"}}>{d.label}</strong><div style={{fontSize:".67rem",color:COLORS.textMuted}}>{d.comparableTasks} tarea(s) comparable(s) · {d.taskIds.join(", ") || "—"}</div></div>
          <Badge label={nfFinite(d.meanTaskDelta)?`${label} · ${d.meanTaskDelta>0?"+":""}${d.meanTaskDelta}`:label} color={color}/>
        </div>
      })}
    </Card>

    <Card style={{marginBottom:16,border:`1px solid ${COLORS.accent}20`}}>
      <p style={{fontWeight:750,margin:"0 0 6px",color:COLORS.accent}}>Interpretación prudente</p>
      {(change?.limitations||[]).map((x,i)=><div key={i} style={{fontSize:".7rem",lineHeight:1.5,color:COLORS.textMuted,marginTop:3}}>• {x}</div>)}
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <BtnSecondary onClick={onExit}>Salir sin guardar</BtnSecondary>
      <BtnPrimary onClick={()=>onSave(record)}>Guardar en historial</BtnPrimary>
    </div>
  </div>;
}

function SelectiveReassessmentProtocolV2({ paciente, familiarization, onSave, onExit }) {
  const plan=buildSelectiveReassessmentPlanV2(paciente);
  const baseline=getActiveEvaluation(paciente);
  const [step,setStep]=useState(0);
  const [taskResults,setTaskResults]=useState([]);
  const [verbalMemory,setVerbalMemory]=useState(null);
  const [prospective,setProspective]=useState(null);
  const [finalRecord,setFinalRecord]=useState(null);
  const startedAt=useRef(new Date().toISOString());

  const sequence=[];
  (plan.taskIds || []).forEach(id=>{
    if(id==="NF-E09"){
      sequence.push({kind:"special",id:"NF-E09-encode"});
      sequence.push({kind:"special",id:"NF-E09-delayed"});
    } else if(id==="NF-E11"){
      sequence.push({kind:"special",id:"NF-E11-encode"});
      sequence.push({kind:"special",id:"NF-E11-retrieve"});
    } else {
      sequence.push({kind:"task",id});
    }
  });

  const pushResult=r=>{
    setTaskResults(prev=>[...prev.filter(x=>x?.taskId!==r?.taskId),r]);
    setStep(s=>s+1);
  };

  useEffect(()=>{
    if(!plan.recommended || step<sequence.length || finalRecord) return;
    const date=new Date().toISOString();
    const profiles=buildAssessmentProfilesV2(taskResults);
    const changeProfile=buildSelectiveChangeProfileV2(baseline,taskResults,plan.assessmentDomainIds || plan.domains);
    const record={
      assessmentVersion:NEUROFLEX_ASSESSMENT_VERSION,
      assessmentSchemaVersion:NEUROFLEX_ASSESSMENT_SCHEMA_VERSION,
      assessmentProfileVersion:ASSESSMENT_PROFILE_VERSION,
      assessmentInterpretationVersion:ASSESSMENT_INTERPRETATION_VERSION,
      taskVersionPolicy:ASSESSMENT_TASK_VERSION_POLICY,
      taskVersionRegistry:getAssessmentTaskVersionRegistrySnapshot(),
      assessmentMode:"selective_reassessment",
      selectiveReassessmentVersion:SELECTIVE_REASSESSMENT_VERSION,
      parentEvaluationId:baseline?.evaluationId || null,
      reassessedDomainIds:[...(plan.assessmentDomainIds || plan.domains || [])],
      triggerTreatmentDomainIds:[...(plan.triggerTreatmentDomainIds || [])],
      reassessmentMappingTrace:[...(plan.mappingTrace || [])],
      selectedTaskIds:[...(plan.taskIds || [])],
      taskResults:[...taskResults],
      processProfile:profiles.processProfile,
      domainProfile:profiles.domainProfile,
      changeProfile,
      familiarization:familiarization || null,
      date,
      recordedAt:date,
      evaluationId:makeEvaluationId(date),
      evaluationVersion:NEUROFLEX_EVALUATION_VERSION,
      validityStatus:"valid",
      validityReason:"",
      globalPct:null,
      seconds:Math.round((Date.now()-new Date(startedAt.current).getTime())/1000),
      preserveCurrentBaseline:true,
    };
    setFinalRecord(record);
  },[step,finalRecord,taskResults,familiarization,baseline,plan.recommended]);

  if(!plan.recommended){
    return <div style={{maxWidth:680,margin:"0 auto"}}><Card style={{textAlign:"center",padding:32}}>
      <div style={{fontSize:"2.5rem",marginBottom:10}}>🔎</div>
      <h3 style={{margin:"0 0 8px"}}>No hay una reevaluación selectiva sugerida</h3>
      <p style={{fontSize:".78rem",lineHeight:1.6,color:COLORS.textMuted}}>{plan.reason}</p>
      <BtnSecondary onClick={onExit}>Volver</BtnSecondary>
    </Card></div>;
  }

  if(finalRecord){
    return <SelectiveReassessmentChangeView record={finalRecord} onSave={onSave} onExit={onExit}/>;
  }

  if(step>=sequence.length){
    return <Card style={{maxWidth:650,margin:"0 auto",textAlign:"center"}}>Construyendo comparación selectiva…</Card>;
  }

  const item=sequence[step];
  const progress=Math.round((step/Math.max(1,sequence.length))*100);
  const wrap=child=><div><div style={{maxWidth:760,margin:"0 auto 12px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:".7rem",color:COLORS.textMuted,marginBottom:5}}><span>Reevaluación selectiva · {plan.taskIds.length} tareas objetivo</span><span>{progress}%</span></div><ProgressBar value={progress}/></div>{child}</div>;

  if(item.id==="NF-E09-encode")return wrap(<NFE09LearningPhase paciente={paciente} onEncoded={data=>{setVerbalMemory(data);setStep(s=>s+1)}}/>);
  if(item.id==="NF-E09-delayed")return wrap(<NFE09DelayedPhase paciente={paciente} memoryData={verbalMemory} onDone={pushResult}/>);
  if(item.id==="NF-E11-encode")return wrap(<NFE11ProspectiveEncode paciente={paciente} onEncoded={data=>{setProspective(data);setStep(s=>s+1)}}/>);
  if(item.id==="NF-E11-retrieve")return wrap(<NFE11ProspectiveRetrieve paciente={paciente} prospectiveData={prospective} onDone={pushResult}/>);

  const id=item.id;
  if(id==="NF-E01")return wrap(<NFE01Orientation paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E02")return wrap(<NFE02Cancellation paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E03")return wrap(<TimedSignalTask paciente={paciente} onDone={pushResult} taskId="NF-E03" mode="cpt"/>);
  if(id==="NF-E04")return wrap(<TimedSignalTask paciente={paciente} onDone={pushResult} taskId="NF-E04" mode="gonogo"/>);
  if(id==="NF-E05")return wrap(<NFE05Interference paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E06")return wrap(<NFE06Switching paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E07")return wrap(<NFE07ActiveSpan paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E08")return wrap(<NFE08SpatialSpan paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E10")return wrap(<NFE10VisualMemory paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E12")return wrap(<NFE12Naming paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E13")return wrap(<NFE13SemanticRelations paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E14")return wrap(<NFE14Fluency paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E15")return wrap(<NFE15MatrixReasoning paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E16")return wrap(<NFE16Similarities paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E17")return wrap(<NFE17Logic paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E18")return wrap(<NFE18PlanningRoute paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E19")return wrap(<NFE19FunctionalSequence paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E20")return wrap(<NFE20MentalRotation paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E21")return wrap(<NFE21Construction paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E22")return wrap(<NFE22VisualClosure paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E23")return wrap(<NFE23FigureGround paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E24")return wrap(<NFE24OrganizeDay paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E25")return wrap(<NFE25SmartShopping paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E26")return wrap(<NFE26FollowInstructions paciente={paciente} onDone={pushResult}/>);
  if(id==="NF-E27")return wrap(<NFE27FunctionalProspective paciente={paciente} onDone={pushResult}/>);

  return <Card><p>No se pudo cargar {id}.</p><BtnSecondary onClick={()=>setStep(s=>s+1)}>Omitir</BtnSecondary></Card>;
}

function SelectiveReassessmentSuggestionCard({ paciente, onStart }) {
  const plan=buildSelectiveReassessmentPlanV2(paciente);
  if(getActiveEvaluation(paciente)?.assessmentVersion!==NEUROFLEX_ASSESSMENT_VERSION) return null;
  return <Card style={{marginBottom:18,border:`1px solid ${plan.recommended?COLORS.accent+"30":COLORS.border}`}}>
    <div style={{fontSize:".68rem",fontWeight:850,color:COLORS.accent,letterSpacing:".05em"}}>FASE 44 · REEVALUACIÓN SELECTIVA</div>
    <h3 style={{margin:"5px 0 5px"}}>{plan.recommended?"Hay áreas candidatas para reevaluación":"Seguimiento sin indicación selectiva actual"}</h3>
    <p style={{fontSize:".73rem",lineHeight:1.55,color:COLORS.textMuted,margin:"0 0 10px"}}>{plan.reason}</p>
    {plan.mappingReviewRequired && <div style={{fontSize:".7rem",padding:9,borderRadius:8,background:COLORS.bg,marginBottom:10,color:COLORS.textSecond}}>
      <strong>Revisión de mapeo requerida.</strong> Áreas sin correspondencia segura: {(plan.unmappedTreatmentDomainIds||[]).map(id=>DOMINIOS_ADULTO[id]?.label || id).join(", ")}.
    </div>}
    {plan.recommended&&<>
      <div style={{fontSize:".71rem",color:COLORS.textSecond,marginBottom:5}}>
        Áreas terapéuticas que activaron la revisión: {(plan.triggerTreatmentDomainIds||[]).map(id=>DOMINIOS_ADULTO[id]?.label || id).join(", ") || "—"}
      </div>
      <div style={{fontSize:".71rem",color:COLORS.textSecond,marginBottom:8}}>
        Dominios de evaluación resultantes: {(plan.assessmentDomainIds||[]).map(id=>ASSESSMENT_DOMAINS_V2[id]?.label || id).join(", ") || "—"}
      </div>
      <div style={{fontSize:".69rem",color:COLORS.textMuted,marginBottom:12}}>
        Tareas sugeridas: {plan.taskIds.join(", ")} · ~{plan.estimatedMinutes} min
      </div>
      <BtnPrimary onClick={onStart} style={{width:"100%"}}>Iniciar reevaluación selectiva</BtnPrimary>
    </>}
  </Card>;
}


// ─── FASE 45 · REPORTES LONGITUDINALES INTEGRADOS v2 ────────────────────────
const LONGITUDINAL_REPORT_VERSION = "NF-REPORT-LONG-1.0";

function getValidSelectiveReassessmentsV2(paciente, baseline = null) {
  const base=baseline || getActiveEvaluation(paciente);
  if(!base) return [];
  return getEvaluationHistory(paciente)
    .filter(r=>isEvaluationValid(r))
    .filter(r=>r.assessmentMode==="selective_reassessment")
    .filter(r=>!r.parentEvaluationId || r.parentEvaluationId===base.evaluationId)
    .sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
}

function buildLongitudinalClinicalTimelineV2(paciente) {
  const baseline=getActiveEvaluation(paciente);
  const sessions=[...(paciente?.sesiones || [])].filter(Boolean).sort((a,b)=>(a.numero||0)-(b.numero||0));
  const reassessments=getValidSelectiveReassessmentsV2(paciente,baseline);
  const follow=buildTherapeuticFollowUpV2(paciente);

  const events=[];
  if(baseline){
    events.push({
      type:"baseline",
      date:baseline.date || null,
      title:"Línea base cognitiva",
      detail:baseline.assessmentVersion===NEUROFLEX_ASSESSMENT_VERSION
        ? `Evaluation v2 completa · ${baseline.taskResults?.length || 0} tareas`
        : "Evaluación de referencia",
      id:baseline.evaluationId || null,
    });
  }

  sessions.forEach(s=>events.push({
    type:"session",
    date:s.date || null,
    title:`Sesión ${s.numero ?? "—"}`,
    detail:[
      nfFinite(getSessionMetric(s,"taskIndicator"))?`${getSessionMetric(s,"taskIndicator")}% indicador de tareas`:null,
      nfFinite(getSessionMetric(s,"averageAdaptiveLevel"))?`nivel ${getSessionMetric(s,"averageAdaptiveLevel")}/5`:null,
      nfFinite(getSessionMetric(s,"autonomyRate"))?`autonomía ${getSessionMetric(s,"autonomyRate")}%`:null,
    ].filter(Boolean).join(" · ") || "Sesión registrada",
    id:`session_${s.numero}`,
  }));

  reassessments.forEach(r=>events.push({
    type:"reassessment",
    date:r.date || null,
    title:"Reevaluación selectiva",
    detail:`${r.selectedTaskIds?.length || r.taskResults?.length || 0} tareas · ${(r.reassessedDomainIds||[]).map(id=>ASSESSMENT_DOMAINS_V2[id]?.label||id).join(", ") || "dominios seleccionados"}`,
    id:r.evaluationId || null,
  }));

  return {
    version:LONGITUDINAL_REPORT_VERSION,
    baseline,
    sessions,
    reassessments,
    followUp:follow,
    events:events.sort((a,b)=>new Date(a.date||0)-new Date(b.date||0)),
  };
}

function buildAssessmentDomainLongitudinalV2(paciente) {
  const baseline=getActiveEvaluation(paciente);
  if(baseline?.assessmentVersion!==NEUROFLEX_ASSESSMENT_VERSION) return [];
  const reassessments=getValidSelectiveReassessmentsV2(paciente,baseline);
  const latestByDomain={};

  reassessments.forEach(r=>{
    (r.changeProfile?.domainChanges || []).forEach(d=>{
      latestByDomain[d.domainId]={
        ...d,
        date:r.date || null,
        evaluationId:r.evaluationId || null,
      };
    });
  });

  return (baseline.domainProfile || []).map(d=>{
    const latest=latestByDomain[d.domainId] || null;
    return {
      domainId:d.domainId,
      label:d.label || ASSESSMENT_DOMAINS_V2[d.domainId]?.label || d.domainId,
      baselineIndex:nfFinite(d.descriptiveIndex)?d.descriptiveIndex:null,
      baselineBand:d.band || null,
      latestSelective:latest,
      taskCount:d.quantifiedTaskCount || d.taskEvidence?.length || 0,
      processCount:d.processes?.length || 0,
    };
  });
}

function buildIntegratedLongitudinalSynthesisV2(paciente) {
  const timeline=buildLongitudinalClinicalTimelineV2(paciente);
  const baseline=timeline.baseline;
  const observations=[];

  if(baseline?.assessmentVersion===NEUROFLEX_ASSESSMENT_VERSION){
    observations.push(`La línea base activa corresponde a Evaluation v2 con ${baseline.taskResults?.length || 0} tareas registradas y perfil multidimensional por dominios y subprocesos.`);
    const strengths=(baseline.domainProfile||[]).filter(d=>d.band==="strength").length;
    const difficulty=(baseline.domainProfile||[]).filter(d=>d.band==="difficulty").length;
    observations.push(`En la línea base se identificaron ${strengths} dominio(s) con fortaleza relativa y ${difficulty} dominio(s) con mayor dificultad relativa dentro de las tareas administradas.`);
  }

  if(timeline.sessions.length){
    const follow=timeline.followUp;
    observations.push(`Se registran ${timeline.sessions.length} sesión(es) de intervención posteriores o asociadas al proceso actual.`);
    if(follow?.summary){
      observations.push(`El seguimiento terapéutico actual sugiere: progresar ${follow.summary.progress||0} área(s), mantener ${follow.summary.maintain||0}, ajustar estrategia/apoyos ${follow.summary.adjustStrategy||0} y revisar/considerar reevaluación ${follow.summary.reviewReassessment||0}.`);
    }
  }

  if(timeline.reassessments.length){
    observations.push(`Se conservan ${timeline.reassessments.length} reevaluación(es) selectiva(s) vinculadas a la línea base, sin sustituirla automáticamente.`);
    const latest=timeline.reassessments[timeline.reassessments.length-1];
    const higher=(latest.changeProfile?.domainChanges||[]).filter(d=>d.direction==="higher").length;
    const similar=(latest.changeProfile?.domainChanges||[]).filter(d=>d.direction==="similar").length;
    const lower=(latest.changeProfile?.domainChanges||[]).filter(d=>d.direction==="lower").length;
    observations.push(`En la reevaluación selectiva más reciente: ${higher} dominio(s) mostraron desempeño mayor en esa administración, ${similar} similar y ${lower} menor, según comparaciones internas de tareas equivalentes.`);
  } else {
    observations.push("No se registran reevaluaciones selectivas válidas vinculadas a la línea base actual.");
  }

  observations.push("La evolución se describe integrando línea base, sesiones, dificultad administrada, autonomía, apoyos y reevaluaciones comparables; no se atribuye automáticamente causalidad terapéutica ni cambio neuropsicológico normativo.");
  return observations;
}

function LongitudinalV2ReportOverview({ paciente }) {
  const timeline=buildLongitudinalClinicalTimelineV2(paciente);
  const baseline=timeline.baseline;
  if(!baseline || baseline.assessmentVersion!==NEUROFLEX_ASSESSMENT_VERSION) return null;
  const domainRows=buildAssessmentDomainLongitudinalV2(paciente);
  const recentEvents=timeline.events.slice(-8);

  return <section style={{marginBottom:22,padding:14,border:"1px solid #dfe3ea",borderRadius:10,background:"#fbfcfe"}}>
    <div style={{fontSize:".68rem",fontWeight:850,color:"#5b5bd6",letterSpacing:".05em"}}>FASE 45 · {LONGITUDINAL_REPORT_VERSION}</div>
    <h3 style={{fontSize:"1rem",margin:"5px 0 8px"}}>Integración longitudinal Evaluation v2</h3>
    <p style={{fontSize:".73rem",lineHeight:1.55,color:"#667085",margin:"0 0 12px"}}>
      Resume la trayectoria entre línea base, intervención y reevaluaciones selectivas. Las diferencias son descriptivas y no constituyen por sí solas evidencia de cambio clínicamente significativo.
    </p>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(125px,1fr))",gap:8,marginBottom:12}}>
      {[
        ["Tareas línea base",baseline.taskResults?.length || 0],
        ["Sesiones",timeline.sessions.length],
        ["Reevaluaciones",timeline.reassessments.length],
        ["Eventos trazados",timeline.events.length],
      ].map(([label,value])=><div key={label} style={{padding:9,border:"1px solid #eceef3",borderRadius:8,textAlign:"center",background:"#fff"}}>
        <div style={{fontWeight:900}}>{value}</div><div style={{fontSize:".64rem",color:"#667085"}}>{label}</div>
      </div>)}
    </div>

    <div style={{marginBottom:12}}>
      <div style={{fontWeight:800,fontSize:".78rem",marginBottom:6}}>Cronología reciente</div>
      {recentEvents.map((e,i)=><div key={`${e.id}_${i}`} style={{display:"grid",gridTemplateColumns:"95px 1fr",gap:8,padding:"5px 0",borderBottom:"1px solid #eceef3"}}>
        <div style={{fontSize:".66rem",color:"#667085"}}>{e.date?new Date(e.date).toLocaleDateString("es"):"—"}</div>
        <div><strong style={{fontSize:".7rem"}}>{e.title}</strong><div style={{fontSize:".67rem",color:"#667085"}}>{e.detail}</div></div>
      </div>)}
    </div>

    {timeline.reassessments.length>0 && <div>
      <div style={{fontWeight:800,fontSize:".78rem",marginBottom:6}}>Cambios selectivos por dominio</div>
      {domainRows.filter(r=>r.latestSelective).map(r=>{
        const c=r.latestSelective;
        const label=c.direction==="higher"?"Mayor en última reevaluación":c.direction==="lower"?"Menor en última reevaluación":c.direction==="similar"?"Similar":"Evidencia insuficiente";
        return <div key={r.domainId} style={{display:"flex",justifyContent:"space-between",gap:10,padding:"6px 0",borderBottom:"1px solid #eceef3"}}>
          <span style={{fontSize:".7rem",fontWeight:700}}>{r.label}</span>
          <span style={{fontSize:".67rem",color:"#667085"}}>{label}{nfFinite(c.meanTaskDelta)?` · ${c.meanTaskDelta>0?"+":""}${c.meanTaskDelta} pts`:""}</span>
        </div>
      })}
    </div>}

    <ClinicalSynthesisBlock title="Síntesis longitudinal integrada" observations={buildIntegratedLongitudinalSynthesisV2(paciente)} />
  </section>;
}

function SessionFollowUpReportBlock({ sesion }) {
  const follow=sesion?.therapeuticFollowUp;
  if(!follow?.domainFollowUp?.length) return null;
  return <section style={{marginTop:20,marginBottom:20}}>
    <h3 style={{fontSize:"1rem",marginBottom:8}}>Seguimiento terapéutico posterior a la sesión</h3>
    <p style={{fontSize:".72rem",color:"#667085",lineHeight:1.5}}>
      Snapshot generado al guardar la sesión. No modifica automáticamente objetivos ni prescripción.
    </p>
    {follow.domainFollowUp.map(d=>{
      const a=nfFollowUpActionLabel(d.action);
      return <div key={d.domainId} style={{display:"flex",justifyContent:"space-between",gap:10,padding:"7px 0",borderBottom:"1px solid #eceef3"}}>
        <span style={{fontSize:".72rem",fontWeight:700}}>{DOMINIOS_ADULTO[d.domainId]?.label || d.domainId}</span>
        <span style={{fontSize:".68rem",color:a.color}}>{a.label}</span>
      </div>
    })}
  </section>;
}


// ─── FASE 46 · AUDITORÍA INTEGRAL Y ESTABILIDAD DE EVALUATION v2 ────────────
const NEUROFLEX_PHASE46_AUDIT = {
  version:"NF-AUDIT-1.0",
  scope:"Evaluation v2 + seguimiento longitudinal",
  resolved:[
    "Finalización de Evaluation v2 movida fuera del render mediante useEffect.",
    "Finalización de reevaluación selectiva movida fuera del render mediante useEffect.",
    "Etiquetas de subprocesos presentadas en español clínico legible.",
    "Comparación selectiva verifica compatibilidad de versión antes de calcular diferencias.",
    "Se mantiene separación entre línea base completa y reevaluaciones selectivas.",
  ],
  pendingValidation:[
    "NF-E25 fue corregida en F48 como versión 2.0; conservar validación empírica pendiente.",
    "NF-E27 fue rediseñada en F48 como versión 2.0; validar sensibilidad de la nueva señal y clave.",
    "NF-E14 utiliza desde F48 ventanas fijas de 60 segundos en versión 2.0; validar modalidad oral/escrita en uso real.",
    "NF-E20 y NF-E22 fueron migradas en F49 a estímulos gráficos propios; queda pendiente validación empírica de dificultad.",
    "Duración total objetivo de 35–50 minutos requiere validación real en aplicación desplegada.",
    "Los umbrales internos de perfil, convergencia y seguimiento siguen siendo heurísticos provisionales.",
  ],
};

function formatAssessmentProcessLabelV2(processId) {
  const replacements={
    lexico:"léxico",
    analogico:"analógico",
    logico:"lógico",
    semantico:"semántico",
    discriminacion:"discriminación",
    denominacion:"denominación",
    codificacion:"codificación",
    evocacion:"evocación",
    retencion:"retención",
    organizacion:"organización",
    planificacion:"planificación",
    secuenciacion:"secuenciación",
    comprension:"comprensión",
    inhibicion:"inhibición",
    impulsividad:"impulsividad",
    atencion:"atención",
    adaptacion:"adaptación",
    adquisicion:"adquisición",
    anticipacion:"anticipación",
    categorizacion:"categorización",
    correccion:"corrección",
    construccion:"construcción",
    intencion:"intención",
    monitorizacion:"monitorización",
    perseveracion:"perseveración",
    resolucion:"resolución",
    rotacion:"rotación",
    seleccion:"selección",
    sostenida:"sostenida",
    visuoespacial:"visuoespacial",
    espacial:"espacial",
    temporal:"temporal",
    verbal:"verbal",
    auditiva:"auditiva",
  };
  return String(processId || "")
    .split("_")
    .map(word=>replacements[word] || word)
    .join(" ")
    .replace(/^./,c=>c.toUpperCase());
}


// ─── FASE 47 · VERSIONADO Y COMPARABILIDAD DE TAREAS ────────────────────────
const ASSESSMENT_TASK_VERSION_POLICY = "NF-TASK-VERSION-1.0";

function getCanonicalAssessmentTaskVersionId(taskId) {
  const task=getAssessmentTaskDefinition(taskId);
  return task ? `${taskId}-${task.version}` : null;
}

function getAdministeredTaskVersionId(result) {
  return result?.metrics?.taskVersionAdministered ||
    result?.taskVersionId ||
    (result?.taskId && result?.taskVersion ? `${result.taskId}-${result.taskVersion}` : null);
}

function getAssessmentTaskVersionRegistrySnapshot() {
  return Object.values(ASSESSMENT_TASKS_V2).map(task=>({
    taskId:task.id,
    taskVersion:task.version,
    canonicalVersionId:getCanonicalAssessmentTaskVersionId(task.id),
    primaryDomain:task.primaryDomain,
  }));
}

function getTaskComparabilityV2(previous, current) {
  if(!previous || !current || previous.taskId!==current.taskId){
    return {
      status:"not_comparable",
      comparable:false,
      reason:"No corresponde a la misma tarea.",
      previousVersion:getAdministeredTaskVersionId(previous),
      currentVersion:getAdministeredTaskVersionId(current),
    };
  }

  const previousVersion=getAdministeredTaskVersionId(previous);
  const currentVersion=getAdministeredTaskVersionId(current);
  if(!previousVersion || !currentVersion){
    return {
      status:"uncertain_legacy",
      comparable:false,
      reason:"Falta información suficiente de versión administrada; se suspende la comparación cuantitativa.",
      previousVersion,
      currentVersion,
    };
  }

  if(previousVersion!==currentVersion){
    return {
      status:"version_mismatch",
      comparable:false,
      reason:`Versiones administradas diferentes: ${previousVersion} vs ${currentVersion}.`,
      previousVersion,
      currentVersion,
    };
  }

  return {
    status:"exact",
    comparable:true,
    reason:`Misma tarea y misma versión administrada (${currentVersion}).`,
    previousVersion,
    currentVersion,
  };
}

function buildAssessmentVersionTraceV2(evalData) {
  const rows=(evalData?.taskResults || []).filter(Boolean).map(result=>{
    const canonical=getCanonicalAssessmentTaskVersionId(result.taskId);
    const administered=getAdministeredTaskVersionId(result);
    const exact=!!canonical && !!administered && (
      administered===canonical ||
      administered.startsWith(`${canonical}-`)
    );
    return {
      taskId:result.taskId,
      taskName:getAssessmentTaskDefinition(result.taskId)?.name || result.taskId,
      canonicalVersionId:canonical,
      administeredVersionId:administered,
      traceStatus:!administered?"missing":exact?"registered":"custom_or_newer",
    };
  });

  return {
    policyVersion:ASSESSMENT_TASK_VERSION_POLICY,
    assessmentVersion:evalData?.assessmentVersion || null,
    assessmentSchemaVersion:evalData?.assessmentSchemaVersion || null,
    assessmentProfileVersion:evalData?.assessmentProfileVersion || null,
    interpretationVersion:evalData?.interpretation?.version || evalData?.assessmentInterpretationVersion || null,
    recommendationVersion:evalData?.interventionRecommendations?.[0]?.version || evalData?.assessmentRecommendationVersion || null,
    selectiveReassessmentVersion:evalData?.selectiveReassessmentVersion || null,
    rows,
    complete:rows.length>0 && rows.every(r=>r.traceStatus!=="missing"),
    customOrNewerCount:rows.filter(r=>r.traceStatus==="custom_or_newer").length,
    missingCount:rows.filter(r=>r.traceStatus==="missing").length,
  };
}

function AssessmentVersionTracePanelV2({ evalData }) {
  const trace=buildAssessmentVersionTraceV2(evalData);
  if(!evalData?.assessmentVersion) return null;

  return <Card style={{marginBottom:18,border:`1px solid ${COLORS.border}`}}>
    <details>
      <summary style={{cursor:"pointer",listStyle:"none",display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}>
        <div>
          <div style={{fontSize:".68rem",fontWeight:850,color:COLORS.primary,letterSpacing:".05em"}}>FASE 47 · {trace.policyVersion}</div>
          <div style={{fontWeight:800,fontSize:".86rem",marginTop:3}}>Trazabilidad de versiones</div>
        </div>
        <Badge
          label={trace.complete?"Versiones registradas":`${trace.missingCount} sin versión`}
          color={trace.complete?COLORS.success:COLORS.warning}
        />
      </summary>
      <div style={{paddingTop:12,marginTop:12,borderTop:`1px solid ${COLORS.border}`}}>
        <p style={{fontSize:".72rem",color:COLORS.textMuted,lineHeight:1.55,margin:"0 0 10px"}}>
          Esta información protege la comparabilidad longitudinal. Si una tarea cambia de estímulos, reglas, temporización o forma de respuesta, debe conservar una nueva versión administrada.
        </p>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
          <Badge label={`Evaluation ${trace.assessmentVersion || "—"}`} color={COLORS.primary}/>
          {trace.assessmentProfileVersion&&<Badge label={trace.assessmentProfileVersion} color={COLORS.info}/>}
          {trace.interpretationVersion&&<Badge label={trace.interpretationVersion} color={COLORS.info}/>}
          {trace.recommendationVersion&&<Badge label={trace.recommendationVersion} color={COLORS.info}/>}
        </div>
        <div style={{display:"grid",gap:6,maxHeight:320,overflowY:"auto"}}>
          {trace.rows.map(r=><div key={r.taskId} style={{display:"grid",gridTemplateColumns:"90px 1fr auto",gap:8,alignItems:"center",padding:"7px 9px",borderRadius:8,background:COLORS.bg}}>
            <strong style={{fontSize:".68rem"}}>{r.taskId}</strong>
            <div style={{fontSize:".68rem",color:COLORS.textSecond}}>
              {r.taskName} · {r.administeredVersionId || "versión administrada no registrada"}
            </div>
            <span style={{fontSize:".64rem",fontWeight:700,color:r.traceStatus==="missing"?COLORS.warning:r.traceStatus==="custom_or_newer"?COLORS.accent:COLORS.success}}>
              {r.traceStatus==="missing"?"REVISAR":r.traceStatus==="custom_or_newer"?"VARIANTE":"OK"}
            </span>
          </div>)}
        </div>
      </div>
    </details>
  </Card>;
}

const ASSESSMENT_FUTURE_VERSIONING_RULES = [
  "Cambios de estímulos, cantidad de ensayos, reglas de respuesta o temporización requieren nueva versión de tarea.",
  "Cambios únicamente visuales que no alteren demanda, estímulo ni respuesta pueden conservar versión, dejando registro de interfaz.",
  "Las variantes de modalidad relevantes para el constructo deben identificarse en taskVersionAdministered.",
  "Una reevaluación solo calcula diferencias cuantitativas cuando coinciden tarea y versión administrada.",
  "Las evaluaciones históricas nunca se reescriben para aparentar una versión que no fue registrada al administrarse.",
];


// ─── FASE 48 · MEJORA VERSIONADA DE TAREAS PRIORITARIAS ─────────────────────
const NEUROFLEX_PHASE48_TASK_UPGRADES = {
  version:"NF-TASK-UPGRADE-1.0",
  upgraded:{
    "NF-E14":{
      from:"1.0",to:"2.0",
      change:"Ventanas fijas de 60 s para fluidez semántica y fonológica.",
      comparability:"No comparar cuantitativamente con NF-E14-1.0 como si fuera la misma administración.",
    },
    "NF-E25":{
      from:"1.0",to:"2.0",
      change:"Posiciones correctas balanceadas y precios explícitamente ficticios.",
      comparability:"La disposición de alternativas cambió; los registros 1.0 y 2.0 quedan versionados por separado.",
    },
    "NF-E27":{
      from:"1.0",to:"2.0",
      change:"Se elimina el botón textual que revelaba la acción y la recuperación con clave verifica el contenido de la intención.",
      comparability:"El nivel de facilitación cambió; no mezclar 1.0 y 2.0 en deltas longitudinales.",
    },
  },
  unchangedByDesign:[],
  note:"NF-E20 y NF-E22 fueron posteriormente actualizadas en F49 como versiones 2.0 con estímulos visuales propios.",
};


// ─── FASE 49 · ESTÍMULOS VISUALES PROPIOS Y ESTABLES ───────────────────────
const NEUROFLEX_PHASE49_VISUAL_UPGRADES = {
  version:"NF-VISUAL-STIM-1.0",
  upgraded:{
    "NF-E20":{
      from:"1.0",to:"2.0",
      change:"Sustituye caracteres tipográficos por configuraciones geométricas de retícula dibujadas por NeuroFlex.",
      comparability:"NF-E20-1.0 y NF-E20-2.0 no se comparan mediante delta cuantitativo automático.",
    },
    "NF-E22":{
      from:"1.0",to:"2.0",
      change:"Sustituye fragmentos Unicode/ASCII por figuras vectoriales SVG propias con segmentos omitidos.",
      comparability:"NF-E22-1.0 y NF-E22-2.0 representan administraciones distintas y permanecen separadas.",
    },
  },
  safety:[
    "Los estímulos son originales de NeuroFlex y no reproducen reactivos protegidos.",
    "Las figuras se dibujan en la interfaz y no dependen de fuentes instaladas.",
    "El tamaño aumenta en modo adulto mayor sin cambiar la regla de respuesta.",
  ],
  pending:[
    "NF-E23 fue migrada en F50 a formas vectoriales propias; queda pendiente validación empírica de dificultad.",
    "La equivalencia de dificultad entre los nuevos estímulos requiere validación empírica.",
  ],
};


// ─── FASE 50 · FIGURA-FONDO VECTORIAL Y CONSISTENCIA VISUAL ─────────────────
const NEUROFLEX_PHASE50_VISUAL_SEARCH = {
  version:"NF-VISUAL-SEARCH-1.0",
  upgraded:{
    "NF-E23":{
      from:"1.0",
      to:"2.0",
      change:"Sustituye símbolos tipográficos por formas vectoriales propias y conserva registro separado de aciertos, omisiones, comisiones y tiempo.",
      comparability:"NF-E23-1.0 y NF-E23-2.0 no se comparan mediante delta cuantitativo automático.",
    },
  },
  design:[
    "Modelo objetivo y distractores se dibujan mediante SVG/figuras propias de NeuroFlex.",
    "El usuario puede seleccionar y deseleccionar antes de confirmar el bloque.",
    "Modo adulto mayor aumenta tamaño y separación sin modificar la regla de respuesta.",
    "La posición de los objetivos varía entre bloques.",
  ],
  limitations:[
    "La dificultad de la versión 2.0 requiere validación empírica.",
    "El desempeño integra percepción visual, exploración y atención; no permite atribuir automáticamente el resultado a un único proceso.",
  ],
};


// ─── FASE 51 · RESPUESTA ÚNICA Y TRAZABILIDAD FUNCIONAL ─────────────────────
const NEUROFLEX_PHASE51_FUNCTIONAL_TASKS = {
  version:"NF-FUNCTIONAL-TASKS-1.0",
  upgraded:{
    "NF-E24":{
      from:"1.0",to:"2.0",
      change:"Elimina el reintento hasta acertar y registra la primera decisión sin retroalimentación correctiva.",
      comparability:"NF-E24-1.0 y NF-E24-2.0 permanecen separadas porque cambió la regla de administración y puntuación.",
    },
    "NF-E26":{
      from:"1.0",to:"2.0",
      change:"Permite confirmar secuencias incompletas, registra omisiones y añade deshacer para observar autocorrecciones antes de confirmar.",
      comparability:"NF-E26-1.0 y NF-E26-2.0 no se mezclan automáticamente en comparaciones longitudinales.",
    },
  },
  rationale:[
    "Una evaluación no debe enseñar la respuesta correcta mediante reintentos obligatorios cuando esa retroalimentación altera la medida.",
    "Las omisiones y autocorrecciones deben derivarse de conducta observable y no quedar fijadas artificialmente en cero.",
  ],
  limitations:[
    "Las tareas siguen siendo simulaciones funcionales dentro de la app y no equivalen a independencia cotidiana.",
    "La interpretación de NF-E26 debe separar, cuando sea posible, comprensión, mantenimiento de la consigna y ejecución secuencial.",
  ],
};


// ─── FASE 52 · MEMORIA REPRODUCIBLE Y TRAZABILIDAD DE ADMINISTRACIÓN ────────
const NEUROFLEX_PHASE52_MEMORY_QUALITY = {
  version:"NF-MEM-QUALITY-1.0",
  upgraded:{
    "NF-E09":{
      from:"1.0",to:"2.0",
      change:"Elimina sort(Math.random) del reconocimiento, usa orden fijo trazable y separa el registro de interferencia del arreglo de ensayos.",
      comparability:"NF-E09-1.0 y NF-E09-2.0 permanecen separadas.",
    },
    "NF-E10":{
      from:"1.0",to:"2.0",
      change:"Usa orden fijo de reconocimiento y reemplaza la tarea intermedia ambigua por decisiones par/impar registradas.",
      comparability:"La versión administrada distingue exposición de 11 s y 14 s para no tratarlas como idénticas.",
    },
  },
  safeguards:[
    "La ejecución de la tarea intermedia de NF-E10 queda registrada como contexto y no se incorpora automáticamente a la puntuación de memoria.",
    "Los órdenes de reconocimiento tienen identificadores fijos para facilitar auditoría y reproducibilidad.",
    "Los tiempos distintos por modo se conservan, pero quedan explicitados en taskVersionAdministered.",
  ],
  pending:[
    "NF-E10 fue migrada en F53 a estímulos vectoriales propios; queda pendiente validación empírica de dificultad.",
    "NF-E09 y NF-E10 requieren validación empírica de dificultad y efecto de práctica.",
  ],
};


// ─── FASE 53 · MEMORIA VISUAL GRÁFICA PROPIA ────────────────────────────────
const NEUROFLEX_PHASE53_VISUAL_MEMORY = {
  version:"NF-VISUAL-MEM-1.0",
  upgraded:{
    "NF-E10":{
      from:"2.0",to:"3.0",
      change:"Sustituye pares de símbolos tipográficos por configuraciones geométricas SVG propias de NeuroFlex, manteniendo el reconocimiento fijo y la tarea intermedia controlada.",
      comparability:"NF-E10-2.0 y NF-E10-3.0 no se comparan mediante delta cuantitativo automático porque cambió el material visual.",
    },
  },
  safeguards:[
    "Los ocho estímulos objetivo y ocho distractores tienen identificadores propios y orden de reconocimiento fijo NF-E10-R3-FIXED-A.",
    "La exposición de 11 s y 14 s continúa identificada en taskVersionAdministered.",
    "La tarea intermedia permanece fuera de la puntuación de memoria visual.",
    "El tamaño aumenta en modo adulto mayor sin cambiar la regla de reconocimiento.",
  ],
  limitations:[
    "La equivalencia de dificultad entre las configuraciones requiere validación empírica.",
    "La tarea describe reconocimiento visual dentro de NeuroFlex y no equivale a una prueba neuropsicológica estandarizada.",
  ],
};


// ─── FASE 54 · MEMORIA PROSPECTIVA SIN RESPUESTA EXPLÍCITA ──────────────────
const NEUROFLEX_PHASE54_PROSPECTIVE_MEMORY = {
  version:"NF-PROSPECTIVE-MEM-1.0",
  upgraded:{
    "NF-E11":{
      from:"1.0",to:"2.0",
      change:"Reemplaza estrella + botón textual PENDIENTE por una señal gráfica propia que debe tocarse espontáneamente y añade verificación escalonada de la intención.",
      comparability:"NF-E11-1.0 y NF-E11-2.0 permanecen separadas porque cambió el nivel de facilitación de la señal.",
    },
  },
  safeguards:[
    "La señal de evento no contiene el nombre de la respuesta.",
    "La primera clave pregunta solo si existía una intención.",
    "La segunda clave verifica el contenido exacto de la acción.",
    "Se registra el intervalo aproximado entre codificación y recuperación.",
  ],
  limitations:[
    "La tarea describe memoria prospectiva observada dentro de la batería y no demuestra ejecución equivalente en la vida diaria.",
    "La saliencia visual de la señal gráfica requiere validación empírica.",
  ],
};


// ─── FASE 55 · DENOMINACIÓN CON DIBUJOS VECTORIALES PROPIOS ─────────────────
const NEUROFLEX_PHASE55_NAMING = {
  version:"NF-NAMING-STIM-1.0",
  upgraded:{
    "NF-E12":{
      from:"1.0",to:"2.0",
      change:"Sustituye emojis y pictogramas del sistema por ocho dibujos SVG originales y estables entre dispositivos.",
      comparability:"NF-E12-1.0 y NF-E12-2.0 no se comparan automáticamente porque cambió el material visual administrado.",
    },
  },
  safeguards:[
    "Cada estímulo tiene un identificador propio de NeuroFlex.",
    "Los dibujos no reproducen láminas protegidas de pruebas comerciales.",
    "El modo adulto mayor aumenta el tamaño del dibujo y del campo de respuesta sin cambiar la regla de denominación.",
  ],
  limitations:[
    "La familiaridad y reconocibilidad de cada dibujo requiere validación empírica.",
    "Una respuesta incorrecta puede reflejar factores visuales, léxicos, lingüísticos o de interacción y no se atribuye automáticamente a un único proceso.",
  ],
};


// ─── FASE 56 · BALANCE DE RESPUESTAS EN LENGUAJE Y RAZONAMIENTO ─────────────
const NEUROFLEX_PHASE56_RESPONSE_BALANCE = {
  version:"NF-RESPONSE-BALANCE-1.0",
  upgraded:{
    "NF-E13":{from:"1.0",to:"2.0",change:"Amplía a ocho reactivos originales y distribuye la posición correcta entre las alternativas.",comparability:"Separada de 1.0 por cambio de reactivos y orden de opciones."},
    "NF-E15":{from:"1.0",to:"2.0",change:"Conserva las reglas originales pero redistribuye la posición de la alternativa correcta.",comparability:"Separada de 1.0 por cambio de presentación de alternativas."},
    "NF-E16":{from:"1.0",to:"2.0",change:"Amplía a ocho conceptos originales y distribuye las respuestas correctas por posición.",comparability:"Separada de 1.0 por cambio de reactivos y alternativas."},
    "NF-E17":{from:"1.0",to:"2.0",change:"Conserva los seis problemas y redistribuye la posición de las respuestas correctas.",comparability:"Separada de 1.0 por cambio de presentación de alternativas."},
  },
  safeguards:[
    "La respuesta correcta deja de concentrarse sistemáticamente en la primera alternativa.",
    "Los reactivos continúan siendo originales de NeuroFlex y no reproducen material WAIS, Raven u otras pruebas protegidas.",
    "Los tiempos y errores continúan registrándose por tarea.",
  ],
  limitations:[
    "Balancear posiciones reduce una fuente de sesgo de interfaz, pero no establece equivalencia psicométrica entre reactivos.",
    "NF-E16 continúa siendo una tarea de respuesta cerrada y no sustituye una evaluación profesional de abstracción verbal espontánea.",
  ],
};

// ─── FASE 57 · PERFIL COGNITIVO BASADO EN CALIDAD DE EVIDENCIA ──────────────
const NEUROFLEX_PHASE57_PROFILE_EVIDENCE={version:"NF-PROFILE-EVIDENCE-1.0",changes:[
"El perfil deja de asignar automáticamente el mismo porcentaje de una tarea a todos sus subprocesos.",
"Los subprocesos solo reciben índice numérico cuando al menos dos tareas primarias independientes aportan evidencia cuantificable.",
"La evidencia secundaria se conserva como contexto y no declara convergencia cuantitativa.",
"Los dominios con una sola fuente primaria cuantificable se marcan como evidencia limitada.",
"Memoria prospectiva deja de convertirse artificialmente en 100 puntos por recuerdo espontáneo o 65 por recuerdo con clave.",
"Las bandas son descriptivas internas y no puntos de corte clínicos."
],safeguards:["No genera percentiles ni diagnósticos.","Los nuevos registros usan NF-PROFILE-2.0; los históricos conservan su versión previa."]};


// ─── FASE 58 · INTERPRETACIÓN CONSERVADORA Y TRAZABLE ───────────────────────
const NEUROFLEX_PHASE58_INTERPRETATION = {
  version:"NF-INTERP-SAFETY-1.0",
  upgraded:{
    interpretation:{from:"NF-INTERP-1.0",to:"NF-INTERP-2.0"},
  },
  changes:[
    "La calidad de evidencia controla si un dominio puede recibir una etiqueta descriptiva alto/intermedio/bajo.",
    "Los dominios con evidencia limitada conservan su índice disponible, pero se presentan como revisión profesional y no como fortaleza o dificultad.",
    "La proximidad o separación entre tareas se describe como rango interno exploratorio, no como convergencia psicométrica.",
    "Precisión y tiempo se muestran conjuntamente cuando ambas variables existen, sin clasificar automáticamente el tiempo como lento o rápido.",
    "La interpretación se construye una sola vez al guardar la evaluación y se reutiliza para recomendaciones, evitando dos instantáneas temporales distintas.",
  ],
  safeguards:[
    "No se generan percentiles, diagnósticos ni puntos de corte clínicos.",
    "La evidencia secundaria continúa siendo contextual y no declara convergencia cuantitativa.",
    "Las diferencias entre subprocesos solo se narran cuando esos subprocesos cuentan con evidencia repetida.",
  ],
};


// ─── FASE 59 · RECOMENDACIONES BASADAS EN EVIDENCIA, NO EN CORTES ───────────
const NEUROFLEX_PHASE59_RECOMMENDATIONS = {
  version:"NF-REC-SAFETY-1.0",
  upgraded:{recommendations:{from:"NF-REC-1.0",to:"NF-REC-2.0"}},
  removedDecisionCutoffs:[
    "NF-E03: >=2 omisiones para prioridad alta.",
    "NF-E04/NF-E05: >=2 comisiones o >300 ms para prioridad alta.",
    "NF-E07/NF-E08: diferencia >=20 puntos para generar recomendación.",
    "NF-E09: retención <70 y <60 para activar/escalar prioridad.",
    "NF-E18: >=3 errores para prioridad alta.",
    "Cognición funcional: media interna <70.",
  ],
  decisionLogic:[
    "Una sola tarea puede generar un objetivo a considerar, pero no prioridad alta solo por cruzar una cifra.",
    "La prioridad alta se reserva a patrones repetidos en fuentes independientes dentro de NeuroFlex.",
    "La calidad de evidencia y la base de prioridad quedan visibles en cada recomendación.",
    "Las métricas numéricas permanecen disponibles como descripción y trazabilidad.",
  ],
  limitations:[
    "La repetición entre tareas aumenta la confianza interna, pero no equivale a validación clínica o psicométrica.",
    "Toda recomendación continúa requiriendo decisión profesional antes de incorporarse al plan terapéutico.",
  ],
};


// ─── FASE 60 · REEVALUACIÓN SELECTIVA CON MAPEO SEGURO ──────────────────────
const NEUROFLEX_PHASE60_SELECTIVE_REASSESSMENT = {
  version:"NF-RETEST-SAFETY-1.0",
  upgraded:{selectiveReassessment:{from:"NF-RETEST-1.0",to:"NF-RETEST-2.0"}},
  changes:[
    "Distingue explícitamente dominios terapéuticos que activan revisión de dominios cognitivos que serán reevaluados.",
    "Primero utiliza recomendaciones de la línea base para traducir tratamiento → evaluación; si no existen, usa un puente inverso explícito y trazable.",
    "Si un área terapéutica no tiene correspondencia segura, bloquea la sugerencia automática y exige revisión profesional.",
    "Elimina el agregado automático de NF-E10 como tarea de relleno para NF-E09 o NF-E11.",
    "La comparación por dominio utiliza únicamente tareas donde el dominio es primario.",
    "Elimina el corte ±10 puntos para clasificar cambio; la dirección se describe por consistencia entre tareas comparables.",
  ],
  safeguards:[
    "La línea base Evaluation v2 continúa siendo obligatoria.",
    "La reevaluación selectiva no reemplaza la línea base.",
    "Se guardan triggerTreatmentDomainIds, reassessedDomainIds y reassessmentMappingTrace por separado.",
  ],
};

// ─── FASE 33 · FAMILIARIZACIÓN TECNOLÓGICA NO PUNTUABLE ─────────────────────
const NEUROFLEX_FAMILIARIZATION_VERSION = "NF-FAM-1.0";

function FamiliarizacionEvaluacion({ paciente, onComplete, onCancel }) {
  const mayor = esModoMayor(paciente);
  const [step, setStep] = useState(0);
  const [attempts, setAttempts] = useState({
    touch: 0,
    select: 0,
    drag: 0,
    listen: 0,
    respondConfirm: 0,
  });
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [response, setResponse] = useState("");
  const [heard, setHeard] = useState(false);
  const [speechAvailable] = useState(() =>
    typeof window !== "undefined" && "speechSynthesis" in window
  );
  const startedAt = useRef(new Date().toISOString());

  const steps = [
    { id: "touch", title: "Tocar", instruction: "Toca el botón grande una vez." },
    { id: "select", title: "Seleccionar", instruction: "Selecciona el círculo." },
    { id: "drag", title: "Arrastrar", instruction: "Arrastra la tarjeta hasta el recuadro. Si tu dispositivo no permite arrastrar con facilidad, puedes tocar la tarjeta y luego el recuadro." },
    { id: "listen", title: "Escuchar", instruction: "Escucha una instrucción breve y confirma cuando la hayas oído." },
    { id: "respondConfirm", title: "Responder y confirmar", instruction: "Selecciona una respuesta y después confírmala." },
  ];
  const current = steps[step];

  const addAttempt = (key) => {
    setAttempts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const finish = (status = "completed") => {
    const completedAt = new Date().toISOString();
    const totalAttempts = Object.values(attempts).reduce((a,b) => a + b, 0);
    const repeatedSteps = Object.entries(attempts)
      .filter(([,n]) => n > 1)
      .map(([id]) => id);
    onComplete?.({
      version: NEUROFLEX_FAMILIARIZATION_VERSION,
      status,
      startedAt: startedAt.current,
      completedAt,
      attempts,
      totalAttempts,
      repeatedSteps,
      requiredRepetition: repeatedSteps.length > 0,
      speechAvailable,
      scored: false,
      note: status === "completed"
        ? "Familiarización completada. Estos datos describen manejo de la interfaz y no forman parte del rendimiento cognitivo."
        : "Familiarización omitida por decisión profesional. No se asigna puntuación cognitiva.",
    });
  };

  const next = () => {
    if (step >= steps.length - 1) finish("completed");
    else setStep(s => s + 1);
  };

  const playInstruction = () => {
    addAttempt("listen");
    if (!speechAvailable) {
      setHeard(true);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Cuando escuches esta frase, toca el botón que dice Escuché la instrucción.");
      u.lang = "es-ES";
      u.rate = mayor ? 0.82 : 0.95;
      window.speechSynthesis.speak(u);
      setHeard(true);
    } catch (e) {
      setHeard(true);
    }
  };

  const completeDrag = () => {
    addAttempt("drag");
    setDragging(false);
    setDragOver(false);
    setTimeout(next, 250);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <Card style={{ padding: mayor ? 32 : 26 }}>
        <div style={{ display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",marginBottom:18 }}>
          <div>
            <div style={{ fontSize:".72rem",fontWeight:800,color:COLORS.primary,letterSpacing:".04em",textTransform:"uppercase" }}>
              Familiarización · No puntuable
            </div>
            <h2 style={{ margin:"5px 0 6px",fontSize:mayor?"1.45rem":"1.25rem" }}>{current.title}</h2>
            <p style={{ margin:0,color:COLORS.textMuted,lineHeight:1.6,fontSize:mayor?"1rem":".86rem" }}>
              {current.instruction}
            </p>
          </div>
          <div style={{ fontSize:".76rem",color:COLORS.textMuted,whiteSpace:"nowrap" }}>{step+1}/{steps.length}</div>
        </div>

        <ProgressBar value={Math.round(((step + 1) / steps.length) * 100)} color={COLORS.primary} />

        <div style={{ marginTop:24,minHeight:210,display:"flex",alignItems:"center",justifyContent:"center" }}>
          {current.id === "touch" && (
            <button
              onClick={() => { addAttempt("touch"); next(); }}
              style={{
                width:mayor?190:160,height:mayor?90:74,borderRadius:18,
                border:`2px solid ${COLORS.primary}`,background:COLORS.primary+"12",
                color:COLORS.primary,fontWeight:800,fontSize:mayor?"1.15rem":"1rem",cursor:"pointer"
              }}
            >
              Tócame
            </button>
          )}

          {current.id === "select" && (
            <div style={{ display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center" }}>
              {[
                { id:"square", shape:"■", label:"Cuadrado" },
                { id:"circle", shape:"●", label:"Círculo" },
                { id:"triangle", shape:"▲", label:"Triángulo" },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    addAttempt("select");
                    setSelected(opt.id);
                    if (opt.id === "circle") setTimeout(next, 300);
                  }}
                  style={{
                    minWidth:mayor?130:112,padding:mayor?"18px 16px":"14px",
                    borderRadius:14,border:`2px solid ${selected===opt.id?COLORS.primary:COLORS.border}`,
                    background:selected===opt.id?COLORS.primary+"10":"#fff",cursor:"pointer"
                  }}
                >
                  <div style={{ fontSize:mayor?"2rem":"1.65rem",lineHeight:1 }}>{opt.shape}</div>
                  <div style={{ marginTop:7,fontSize:mayor?".95rem":".8rem",fontWeight:700 }}>{opt.label}</div>
                </button>
              ))}
            </div>
          )}

          {current.id === "drag" && (
            <div style={{ width:"100%",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:18,alignItems:"center" }}>
              <div
                draggable
                onDragStart={() => setDragging(true)}
                onDragEnd={() => setDragging(false)}
                onClick={() => setDragging(true)}
                style={{
                  padding:18,borderRadius:14,border:`2px solid ${dragging?COLORS.primary:COLORS.border}`,
                  background:dragging?COLORS.primary+"10":"#fff",textAlign:"center",fontWeight:800,
                  cursor:"grab",userSelect:"none"
                }}
              >
                ↔ Tarjeta
                <div style={{fontSize:".7rem",color:COLORS.textMuted,marginTop:5}}>Arrastra o toca</div>
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); completeDrag(); }}
                onClick={() => { if (dragging) completeDrag(); }}
                style={{
                  minHeight:105,borderRadius:14,
                  border:`2px dashed ${dragOver||dragging?COLORS.primary:COLORS.border}`,
                  background:dragOver?COLORS.primary+"0D":COLORS.bg,
                  display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",
                  padding:16,fontWeight:700,color:COLORS.textMuted,cursor:dragging?"pointer":"default"
                }}
              >
                Suelta aquí
              </div>
            </div>
          )}

          {current.id === "listen" && (
            <div style={{ width:"100%",maxWidth:430,textAlign:"center" }}>
              <BtnPrimary onClick={playInstruction} style={{ width:"100%",padding:mayor?16:13 }}>
                🔊 Escuchar instrucción
              </BtnPrimary>
              {!speechAvailable && heard && (
                <p style={{fontSize:".75rem",color:COLORS.textMuted,lineHeight:1.5}}>
                  El audio automático no está disponible en este dispositivo. Puedes continuar sin penalización.
                </p>
              )}
              {heard && (
                <BtnSecondary
                  onClick={next}
                  style={{ width:"100%",marginTop:12,padding:mayor?15:12 }}
                >
                  Escuché / comprendí la instrucción
                </BtnSecondary>
              )}
            </div>
          )}

          {current.id === "respondConfirm" && (
            <div style={{ width:"100%",maxWidth:430 }}>
              <p style={{fontWeight:700,textAlign:"center",marginBottom:14}}>Elige la palabra “AZUL”</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {["ROJO","AZUL","VERDE"].map(x => (
                  <button key={x} onClick={() => { addAttempt("respondConfirm"); setResponse(x); }}
                    style={{
                      padding:mayor?"15px 8px":"12px 8px",borderRadius:10,
                      border:`2px solid ${response===x?COLORS.primary:COLORS.border}`,
                      background:response===x?COLORS.primary+"10":"#fff",fontWeight:750,cursor:"pointer"
                    }}>{x}</button>
                ))}
              </div>
              <BtnPrimary
                onClick={() => {
                  addAttempt("respondConfirm");
                  if (response === "AZUL") next();
                }}
                disabled={!response}
                style={{width:"100%",marginTop:14,padding:mayor?15:12,opacity:response?1:.55}}
              >
                Confirmar respuesta
              </BtnPrimary>
              {response && response !== "AZUL" && (
                <p style={{fontSize:".76rem",color:COLORS.textMuted,textAlign:"center",marginBottom:0}}>
                  Prueba nuevamente. Esta práctica no afecta ningún resultado.
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{marginTop:22,padding:12,borderRadius:10,background:COLORS.bg,fontSize:".72rem",color:COLORS.textMuted,lineHeight:1.5}}>
          Esta fase comprueba el manejo básico de la interfaz. <strong>No genera puntuación cognitiva</strong> y los intentos adicionales se registran únicamente como contexto de administración.
        </div>

        <div style={{display:"flex",justifyContent:"space-between",gap:10,marginTop:16,flexWrap:"wrap"}}>
          <BtnSecondary onClick={onCancel}>Cancelar</BtnSecondary>
          <button
            onClick={() => {
              if (window.confirm("¿Omitir la familiarización? Quedará registrada como omitida por decisión profesional.")) {
                finish("skipped");
              }
            }}
            style={{
              border:"none",background:"transparent",color:COLORS.textMuted,
              textDecoration:"underline",cursor:"pointer",fontSize:".74rem"
            }}
          >
            Omitir por decisión profesional
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─── EVALUACIÓN COGNITIVA ADULTOS ────────────────────────────────────────────
function EvaluacionAdulto({ paciente, onFinish, onCancel }) {
  const dominios = Object.keys(DOMINIOS_ADULTO);
  const [domIdx, setDomIdx] = useState(0);
  const [exIdx, setExIdx] = useState(0);
  const [results, setResults] = useState({});
  const [phase, setPhase] = useState("intro"); // intro | familiarization | phase34 | phase35 | phase36 | phase37 | phase38 | phase39 | phase44 | demo | exercise | done
  const [demoSeen, setDemoSeen] = useState(new Set());
  const [familiarization, setFamiliarization] = useState(null);
  const [evaluationPath, setEvaluationPath] = useState("legacy");
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
    const date = new Date().toISOString();
    onFinish({
      hist,
      globalPct,
      date,
      seconds: Math.round((Date.now() - t0.current) / 1000),
      evaluationId: makeEvaluationId(date),
      evaluationVersion: NEUROFLEX_EVALUATION_VERSION,
      familiarization: familiarization || null,
      administrationContext: {
        familiarizationVersion: familiarization?.version || null,
        familiarizationStatus: familiarization?.status || "not_recorded",
        familiarizationRequiredRepetition: !!familiarization?.requiredRepetition,
      },
      validityStatus: "valid",
      validityReason: "",
      recordedAt: date,
    });
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
        <p style={{ color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.7 }}>
          Se evaluarán {dominios.length} dominios cognitivos.<br />
          Duración aproximada de esta versión: <strong>15-20 minutos</strong>.
        </p>
        <p style={{ color: COLORS.textMuted, marginBottom: 24, lineHeight: 1.6, fontSize: ".78rem" }}>
          Antes de comenzar realizaremos una familiarización breve con la interfaz. No puntúa y no forma parte del perfil cognitivo.
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
          <div style={{display:"flex",flexDirection:"column",gap:9,flex:1}}>
            <BtnPrimary onClick={() => { setEvaluationPath("legacy"); setPhase("familiarization"); }} style={{ width:"100%", padding: 14 }}>
              Continuar a evaluación actual →
            </BtnPrimary>
            <BtnSecondary onClick={() => { setEvaluationPath("phase34"); setPhase("familiarization"); }} style={{ width:"100%", padding: 12 }}>
              Probar bloque Evaluation v2 · NF-E01–E06
            </BtnSecondary>
            <BtnSecondary onClick={() => { setEvaluationPath("phase35"); setPhase("familiarization"); }} style={{ width:"100%", padding: 12 }}>
              Probar bloque de memoria · NF-E07–E11
            </BtnSecondary>
            <BtnSecondary onClick={() => { setEvaluationPath("phase36"); setPhase("familiarization"); }} style={{ width:"100%", padding: 12 }}>
              Probar lenguaje y razonamiento · NF-E12–E17
            </BtnSecondary>
            <BtnSecondary onClick={() => { setEvaluationPath("phase37"); setPhase("familiarization"); }} style={{ width:"100%", padding: 12 }}>
              Probar ejecutivo y visuoespacial · NF-E18–E23
            </BtnSecondary>
            <BtnSecondary onClick={() => { setEvaluationPath("phase38"); setPhase("familiarization"); }} style={{ width:"100%", padding: 12 }}>
              Probar cognición funcional · NF-E24–E27
            </BtnSecondary>
            <SelectiveReassessmentSuggestionCard
              paciente={paciente}
              onStart={() => { setEvaluationPath("phase44"); setPhase("familiarization"); }}
            />
            <BtnPrimary onClick={() => { setEvaluationPath("phase39"); setPhase("familiarization"); }} style={{ width:"100%", padding: 14, marginTop: 4 }}>
              Iniciar Evaluation v2 completa · NF-E01–E27
            </BtnPrimary>
          </div>
          <BtnSecondary onClick={onCancel}>Cancelar</BtnSecondary>
        </div>
      </Card>
    </div>
  );

  if (phase === "familiarization") return (
    <FamiliarizacionEvaluacion
      paciente={paciente}
      onCancel={onCancel}
      onComplete={(data) => {
        setFamiliarization(data);
        if (evaluationPath === "phase34") {
          setPhase("phase34");
          return;
        }
        if (evaluationPath === "phase35") {
          setPhase("phase35");
          return;
        }
        if (evaluationPath === "phase36") {
          setPhase("phase36");
          return;
        }
        if (evaluationPath === "phase37") {
          setPhase("phase37");
          return;
        }
        if (evaluationPath === "phase38") {
          setPhase("phase38");
          return;
        }
        if (evaluationPath === "phase39") {
          setPhase("phase39");
          return;
        }
        if (evaluationPath === "phase44") {
          setPhase("phase44");
          return;
        }
        const firstExId = EX_ADULTO[dominios[0]]?.[0]?.id;
        setPhase(paciente?.showDemo && firstExId ? "demo" : "exercise");
      }}
    />
  );

  if (phase === "phase34") return (
    <EvaluationV2Phase34Block paciente={paciente} onExit={() => setPhase("intro")} />
  );

  if (phase === "phase35") return (
    <EvaluationV2Phase35Block paciente={paciente} onExit={() => setPhase("intro")} />
  );

  if (phase === "phase36") return (
    <EvaluationV2Phase36Block paciente={paciente} onExit={() => setPhase("intro")} />
  );

  if (phase === "phase37") return (
    <EvaluationV2Phase37Block paciente={paciente} onExit={() => setPhase("intro")} />
  );

  if (phase === "phase38") return (
    <EvaluationV2Phase38Block paciente={paciente} onExit={() => setPhase("intro")} />
  );

  if (phase === "phase39") return (
    <EvaluationV2FullProtocol
      paciente={paciente}
      familiarization={familiarization}
      onSave={onFinish}
      onExit={() => setPhase("intro")}
    />
  );

  if (phase === "phase44") return (
    <SelectiveReassessmentProtocolV2
      paciente={paciente}
      familiarization={familiarization}
      onSave={onFinish}
      onExit={() => setPhase("intro")}
    />
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
                  ? <span style={{ fontWeight: 700, color: gradeColor(r.pct) }}>{r.pct}%</span>
                  : <span style={{ fontSize: ".75rem", color: COLORS.accent, fontWeight: 600 }}>Valoración profesional</span>}
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


// ─── FASE 21 · INTERPRETACIÓN DESCRIPTIVA DEL PERFIL COGNITIVO ───────────────
// Esta capa describe el desempeño observado en NeuroFlex. No emite diagnósticos,
// no usa categorías normativas y reutiliza la misma lógica en pantalla y reportes.
const DOMAIN_INTERPRETATION_LIBRARY = {
  memoria_trabajo: {
    definition: "Capacidad para mantener información activa durante un periodo breve y manipularla mientras se realiza una tarea.",
    low: "En las tareas realizadas se observó menor eficiencia relativa para mantener y manipular información simultáneamente, especialmente cuando aumentó la cantidad de elementos o la necesidad de reorganizarlos mentalmente.",
    mid: "El desempeño fue variable en tareas que exigieron mantener y manipular información. La ejecución puede beneficiarse de seguimiento cuando aumenta la carga mental o se combinan varias operaciones.",
    high: "Se observó un desempeño eficiente para mantener y manipular información durante las tareas administradas, incluso cuando fue necesario reorganizarla o actualizarla.",
  },
  memoria_episodica: {
    definition: "Capacidad para codificar, almacenar y recuperar información vinculada con experiencias, palabras o acontecimientos previamente presentados.",
    low: "En las tareas realizadas se observó menor eficiencia relativa para codificar o recuperar información presentada previamente, con mayor demanda cuando aumentó la cantidad o el contenido debía evocarse después de un intervalo.",
    mid: "El desempeño mostró variaciones en la codificación y evocación de información. Conviene observar la estabilidad del recuerdo y el beneficio de estrategias de organización.",
    high: "Se observó un desempeño eficiente para registrar y recuperar información presentada previamente dentro de las tareas administradas.",
  },
  atencion: {
    definition: "Capacidad para seleccionar información relevante, mantener el foco durante una actividad y responder mientras se controlan estímulos distractores.",
    low: "En las tareas realizadas se observó menor eficiencia relativa para sostener el foco y seleccionar estímulos relevantes, especialmente cuando aumentó la cantidad de información, los distractores o la necesidad de atender más de una condición.",
    mid: "El desempeño atencional fue funcional pero variable. La ejecución puede disminuir cuando aumenta la duración, la cantidad de estímulos o la necesidad de dividir el foco.",
    high: "Se observó un desempeño eficiente para mantener el foco y seleccionar información relevante durante las tareas administradas.",
  },
  funciones_exec: {
    definition: "Conjunto de procesos que permiten organizar la conducta, planificar, secuenciar acciones, supervisar la respuesta y ajustarla cuando cambian las demandas.",
    low: "En las tareas realizadas se observó menor eficiencia relativa para organizar o secuenciar la respuesta y mantener una estrategia cuando la actividad exigió control y supervisión.",
    mid: "El desempeño ejecutivo mostró variaciones ante tareas que exigieron organización, secuenciación o control de la respuesta. Conviene seguir observando el funcionamiento al aumentar la complejidad.",
    high: "Se observó un desempeño eficiente en tareas que requirieron organización, secuenciación y control de la respuesta.",
  },
  velocidad_proc: {
    definition: "Eficiencia con la que se percibe, procesa y responde a información sencilla, considerando conjuntamente rapidez y precisión.",
    low: "En las tareas realizadas se observó mayor demanda de tiempo o menor estabilidad de respuesta al procesar información. La velocidad debe interpretarse junto con la precisión y no de forma aislada.",
    mid: "La eficiencia de procesamiento fue variable entre tareas. Conviene observar conjuntamente tiempo, precisión y estabilidad de la respuesta.",
    high: "Se observó una respuesta eficiente y estable en las tareas de procesamiento administradas, considerando conjuntamente rapidez y precisión.",
  },
  lenguaje: {
    definition: "Procesos relacionados con comprensión y producción verbal, acceso al vocabulario, denominación y establecimiento de relaciones semánticas.",
    low: "En las tareas realizadas se observó menor eficiencia relativa en uno o más procesos verbales, como acceso a palabras, denominación, comprensión o establecimiento de relaciones semánticas.",
    mid: "El desempeño verbal fue funcional pero variable entre las tareas administradas. Conviene considerar qué subcomponentes lingüísticos concentraron la mayor demanda.",
    high: "Se observó un desempeño eficiente en las tareas verbales administradas, incluyendo acceso al vocabulario, comprensión o relaciones semánticas según las actividades realizadas.",
  },
  percepcion_visual: {
    definition: "Capacidad para discriminar, organizar e interpretar características visuales, relaciones espaciales y patrones.",
    low: "En las tareas realizadas se observó menor eficiencia relativa para discriminar, organizar o analizar información visual, especialmente cuando aumentó la similitud, la cantidad de estímulos o la transformación espacial.",
    mid: "El desempeño visuoperceptivo mostró variaciones según la complejidad de los estímulos y la demanda de análisis visual.",
    high: "Se observó un desempeño eficiente para discriminar y analizar información visual en las tareas administradas.",
  },
  orientacion: {
    definition: "Capacidad para utilizar referencias personales, temporales, espaciales y situacionales que permiten ubicarse en el contexto.",
    low: "Las respuestas de orientación requieren interpretación contextual y profesional; un resultado aislado en NeuroFlex no debe utilizarse para establecer por sí solo una dificultad de orientación.",
    mid: "Las respuestas de orientación deben interpretarse considerando contexto, antecedentes y condiciones de aplicación.",
    high: "Las respuestas observadas fueron consistentes con las referencias solicitadas en las tareas administradas, sin sustituir la valoración clínica de la orientación.",
  },
  razonamiento: {
    definition: "Capacidad para identificar relaciones, reglas y patrones, extraer conclusiones y resolver problemas a partir de la información disponible.",
    low: "En las tareas realizadas se observó menor eficiencia relativa para identificar reglas, relaciones o patrones y utilizarlos para resolver problemas.",
    mid: "El desempeño de razonamiento fue variable según la complejidad de las relaciones y la necesidad de inferir reglas.",
    high: "Se observó un desempeño eficiente para identificar relaciones, reglas y patrones en las tareas administradas.",
  },
  calculo: {
    definition: "Capacidad para comprender relaciones numéricas, realizar operaciones y manipular cantidades para resolver problemas.",
    low: "En las tareas realizadas se observó menor eficiencia relativa al operar con cantidades o identificar relaciones numéricas, especialmente cuando aumentó la carga de cálculo o fue necesario trabajar de forma inversa.",
    mid: "El desempeño numérico fue variable según la complejidad de las operaciones y la cantidad de pasos requeridos.",
    high: "Se observó un desempeño eficiente en las tareas de cálculo y razonamiento numérico administradas.",
  },
  flexibilidad: {
    definition: "Capacidad para cambiar de criterio o estrategia, inhibir una respuesta previa y adaptarse cuando se modifica una regla.",
    low: "En las tareas realizadas se observó mayor demanda para cambiar de criterio o inhibir una respuesta previamente utilizada cuando se modificaron las reglas.",
    mid: "El desempeño fue variable cuando fue necesario cambiar de criterio o adaptar la respuesta. Conviene observar la estabilidad ante cambios sucesivos.",
    high: "Se observó un desempeño eficiente para cambiar de criterio y adaptar la respuesta ante nuevas reglas dentro de las tareas administradas.",
  },
  comprension: {
    definition: "Capacidad para comprender información escrita, identificar elementos relevantes, establecer relaciones e inferir conclusiones sustentadas por el texto.",
    low: "En las tareas realizadas se observó menor eficiencia relativa para integrar información escrita, identificar relaciones o elaborar inferencias sustentadas por el contenido.",
    mid: "La comprensión fue funcional pero variable según la cantidad de información y el nivel de inferencia requerido.",
    high: "Se observó un desempeño eficiente para comprender e integrar información escrita y responder a relaciones explícitas o inferenciales según las tareas administradas.",
  },
};

function getDomainObservedSubcomponents(paciente, domId, evalItem = null) {
  const ids = new Set();
  if (evalItem?.exId) ids.add(evalItem.exId);
  (paciente?.sesiones || []).forEach(s => {
    (s.results || []).forEach(r => {
      if (r.domId === domId && r.exId) ids.add(r.exId);
    });
  });

  const names = [];
  ids.forEach(exId => {
    const meta = METADATA_EJERCICIOS[exId];
    if (meta?.subcomponente && !names.includes(meta.subcomponente)) names.push(meta.subcomponente);
  });
  return names.slice(0, 4);
}

function buildDomainInterpretation(paciente, domId, pct, evalItem = null) {
  const lib = DOMAIN_INTERPRETATION_LIBRARY[domId] || {
    definition: DOMINIOS_ADULTO[domId]?.desc || "Función cognitiva explorada mediante tareas de NeuroFlex.",
    low: "Se observó menor eficiencia relativa en las tareas administradas de este dominio.",
    mid: "Se observó un desempeño intermedio y variable en las tareas administradas de este dominio.",
    high: "Se observó un desempeño eficiente en las tareas administradas de este dominio.",
  };

  const requiresReview = !!evalItem?.requiresReview || pct === null || pct === undefined || Number.isNaN(pct);
  const subcomponents = getDomainObservedSubcomponents(paciente, domId, evalItem);

  let status = "Pendiente de valoración profesional";
  let tone = "review";
  let observation = "Las respuestas disponibles requieren revisión profesional antes de formular una interpretación descriptiva del desempeño.";

  if (!requiresReview) {
    if (pct < 60) {
      status = "Oportunidad de fortalecimiento";
      tone = "low";
      observation = lib.low;
    } else if (pct < 80) {
      status = "Área para seguimiento";
      tone = "mid";
      observation = lib.mid;
    } else {
      status = "Fortaleza relativa observada";
      tone = "high";
      observation = lib.high;
    }
  }

  return {
    domId,
    definition: lib.definition,
    status,
    tone,
    observation,
    subcomponents,
  };
}

function DomainInterpretationCard({ paciente, item }) {
  const dom = DOMINIOS_ADULTO[item.id];
  const pct = typeof item.pct === "number" && !Number.isNaN(item.pct) ? item.pct : null;
  const interpretation = buildDomainInterpretation(paciente, item.id, pct, item);
  const color = interpretation.tone === "high"
    ? COLORS.success
    : interpretation.tone === "mid"
      ? COLORS.warning
      : interpretation.tone === "low"
        ? COLORS.error
        : COLORS.accent;

  return (
    <Card style={{ padding: 16, border: `1px solid ${color}25` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 850, fontSize: ".92rem" }}>{dom?.emoji} {dom?.label}</div>
          <div style={{ marginTop: 3, fontSize: ".7rem", color, fontWeight: 750 }}>{interpretation.status}</div>
        </div>
        <div style={{ fontWeight: 850, color }}>
          {pct !== null ? `${pct}%` : "Revisión"}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: ".66rem", fontWeight: 800, color: COLORS.textMuted, marginBottom: 3 }}>¿QUÉ ES ESTA FUNCIÓN?</div>
        <p style={{ margin: 0, fontSize: ".76rem", color: COLORS.textSecond, lineHeight: 1.55 }}>{interpretation.definition}</p>
      </div>

      <div style={{ marginTop: 11, padding: "10px 11px", borderRadius: 10, background: color + "08" }}>
        <div style={{ fontSize: ".66rem", fontWeight: 800, color, marginBottom: 3 }}>¿QUÉ OBSERVAMOS EN LAS TAREAS?</div>
        <p style={{ margin: 0, fontSize: ".76rem", color: COLORS.textSecond, lineHeight: 1.55 }}>{interpretation.observation}</p>
      </div>

      {interpretation.subcomponents.length > 0 && (
        <div style={{ marginTop: 10, fontSize: ".68rem", color: COLORS.textMuted, lineHeight: 1.5 }}>
          <strong>Procesos explorados:</strong> {interpretation.subcomponents.join(" · ")}
        </div>
      )}
    </Card>
  );
}


// ─── FASE 25 · CANDIDATA ESTABLE ───────────────────────────────────────────────
// Consolidación técnica: corrige fugas de dificultad verbal, sincronización del
// paciente y evita impresión no acotada. Mantiene compatibilidad con datos previos.
const NEUROFLEX_BUILD = "60-reevaluacion-selectiva-segura-v2";

// ─── FASE 24 · GENERALIZACIÓN Y TRANSFERENCIA FUNCIONAL ───────────────────────
// Sugerencias prácticas derivadas del área trabajada. No afirman transferencia
// conseguida: proponen oportunidades para practicar la estrategia fuera de la app.
const FUNCTIONAL_TRANSFER_LIBRARY = {
  memoria_trabajo: {
    goal: "Practicar el mantenimiento y organización de información breve en actividades cotidianas.",
    activities: ["Recordar 2–4 indicaciones antes de ejecutarlas.", "Agrupar una lista corta de compras por categorías.", "Repetir y reorganizar mentalmente una instrucción antes de comenzar."],
  },
  memoria_episodica: {
    goal: "Favorecer estrategias de codificación y recuperación de información relevante.",
    activities: ["Resumir al final del día dos acontecimientos importantes.", "Asociar información nueva con una imagen, lugar o experiencia conocida.", "Recordar una conversación breve utilizando palabras clave."],
  },
  atencion: {
    goal: "Practicar el mantenimiento y selección del foco en contextos cotidianos controlados.",
    activities: ["Realizar una actividad breve reduciendo distractores y aumentar gradualmente el tiempo.", "Buscar información específica en una lista, agenda o recibo.", "Alternar periodos cortos de concentración con pausas planificadas."],
  },
  funciones_exec: {
    goal: "Practicar planificación, secuenciación y supervisión de acciones.",
    activities: ["Dividir una actividad cotidiana en pasos y comprobarlos al finalizar.", "Anticipar materiales necesarios antes de comenzar una tarea.", "Revisar el resultado antes de dar una actividad por terminada."],
  },
  velocidad_proc: {
    goal: "Favorecer una respuesta eficiente sin sacrificar precisión.",
    activities: ["Realizar tareas sencillas con ritmo cómodo y estable antes de aumentar velocidad.", "Comparar información breve priorizando primero la precisión.", "Registrar si necesita más tiempo cuando aumenta la cantidad de información."],
  },
  lenguaje: {
    goal: "Estimular acceso léxico, comprensión y organización verbal en situaciones funcionales.",
    activities: ["Describir un objeto sin nombrarlo y luego identificar la palabra.", "Explicar con sus propias palabras una noticia o conversación breve.", "Agrupar palabras por categorías y buscar relaciones entre ellas."],
  },
  percepcion_visual: {
    goal: "Practicar discriminación y organización de información visual relevante.",
    activities: ["Localizar objetos específicos en un espacio organizado.", "Comparar dos imágenes o documentos buscando diferencias.", "Seguir referencias espaciales sencillas en mapas, planos o ubicaciones conocidas."],
  },
  orientacion: {
    goal: "Reforzar referencias contextuales relevantes con apoyo profesional cuando sea necesario.",
    activities: ["Revisar fecha, actividad prevista y lugar al iniciar una rutina.", "Utilizar calendario o agenda como apoyo externo.", "Relacionar actividades del día con momentos y lugares concretos."],
  },
  razonamiento: {
    goal: "Practicar identificación de reglas, relaciones y alternativas de solución.",
    activities: ["Explicar por qué una opción es más adecuada que otra.", "Buscar patrones en secuencias cotidianas o clasificaciones.", "Plantear dos posibles soluciones antes de elegir una."],
  },
  calculo: {
    goal: "Practicar relaciones numéricas en situaciones cotidianas significativas.",
    activities: ["Calcular totales sencillos durante compras simuladas o reales.", "Estimar cantidades antes de comprobar el resultado.", "Resolver operaciones breves relacionadas con tiempo, dinero o cantidades."],
  },
  flexibilidad: {
    goal: "Practicar el cambio de estrategia cuando una regla o situación se modifica.",
    activities: ["Buscar una segunda manera de realizar una actividad conocida.", "Cambiar el criterio de clasificación de objetos o palabras.", "Identificar cuándo una estrategia no funciona y elegir otra."],
  },
  comprension: {
    goal: "Favorecer integración de información e inferencias sustentadas en material cotidiano.",
    activities: ["Leer un texto breve y explicar su idea principal.", "Distinguir información explícita de una conclusión inferida.", "Seguir instrucciones escritas de varios pasos y verificar cada uno."],
  },
};

function buildFunctionalTransferPlan(paciente) {
  const plan = paciente?.interventionPlan?.areas || [];
  const active = plan.filter(a => a.estado === "objetivo" || a.estado === "seguimiento");
  return active.map(a => {
    const lib = FUNCTIONAL_TRANSFER_LIBRARY[a.id];
    if (!lib) return null;
    return {
      domId: a.id,
      priority: a.prioridad || "media",
      clinicalGoal: a.objetivo || "",
      goal: lib.goal,
      activities: lib.activities,
    };
  }).filter(Boolean);
}

function FunctionalTransferCard({ paciente }) {
  const items = buildFunctionalTransferPlan(paciente);
  if (!items.length) return null;
  return (
    <Card style={{ marginTop: 18 }}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin:"0 0 4px",fontSize:".98rem" }}>🌱 Generalización a actividades cotidianas</h3>
        <p style={{ margin:0,color:COLORS.textMuted,fontSize:".73rem",lineHeight:1.5 }}>
          Propuestas para practicar fuera de NeuroFlex las estrategias trabajadas. No significan que la transferencia se haya producido; el profesional decide cuáles son pertinentes para cada caso.
        </p>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))",gap:10 }}>
        {items.map(item => (
          <div key={item.domId} style={{ padding:12,border:`1px solid ${COLORS.border}`,borderRadius:11 }}>
            <div style={{ fontWeight:800,fontSize:".8rem" }}>{DOMINIOS_ADULTO[item.domId]?.emoji} {DOMINIOS_ADULTO[item.domId]?.label}</div>
            <p style={{ margin:"5px 0 7px",fontSize:".71rem",color:COLORS.textSecond,lineHeight:1.45 }}>{item.goal}</p>
            <ul style={{ margin:0,paddingLeft:17,color:COLORS.textMuted,fontSize:".68rem",lineHeight:1.5 }}>
              {item.activities.map((a,i)=><li key={i}>{a}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── PERFIL COGNITIVO ─────────────────────────────────────────────────────────
function PerfilCognitivoView({ evalData, paciente, onIniciarSesion }) {
  if (evalData?.assessmentVersion === NEUROFLEX_ASSESSMENT_VERSION && Array.isArray(evalData?.domainProfile)) {
    return <AssessmentV2ProfileView evalData={evalData} paciente={paciente} onIniciarSesion={onIniciarSesion} />;
  }

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

      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontWeight: 800, margin: "0 0 3px" }}>🧠 Interpretación descriptiva por función cognitiva</p>
          <p style={{ color: COLORS.textMuted, fontSize: ".75rem", lineHeight: 1.5, margin: 0 }}>
            Explica qué representa cada función y qué patrón se observó en las tareas administradas. La interpretación se limita al desempeño dentro de NeuroFlex.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {hist.map(h => <DomainInterpretationCard key={h.id} paciente={paciente} item={h} />)}
        </div>
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
  const baselineEval = getActiveEvaluation(paciente);

  if (baselineEval?.assessmentVersion === NEUROFLEX_ASSESSMENT_VERSION && Array.isArray(baselineEval?.domainProfile)) {
    const recs = baselineEval.interventionRecommendations ||
      buildAssessmentInterventionRecommendationsV2(
        baselineEval.taskResults || [],
        baselineEval.domainProfile || [],
        baselineEval.interpretation || null
      );

    return Object.keys(DOMINIOS_ADULTO).map(id => {
      const related = recs.filter(r => (r.trainingDomains || []).includes(id));
      const high = related.filter(r=>r.priority==="high");
      const medium = related.filter(r=>r.priority==="medium");
      const primary = high[0] || medium[0] || related[0] || null;

      let estado="mantenimiento";
      let prioridad="baja";
      if(high.length){estado="objetivo";prioridad="alta";}
      else if(medium.length){estado="seguimiento";prioridad="media";}
      else if(!related.length){estado="revision";prioridad="media";}

      const bridge=(baselineEval.hist || []).find(x=>x.id===id);
      const pct=typeof bridge?.pct==="number"&&!Number.isNaN(bridge.pct)?bridge.pct:null;
      const objective = primary?.objective ||
        (estado==="revision"
          ? `Revisar profesionalmente la relación entre Evaluation v2 y ${DOMINIOS_ADULTO[id]?.label?.toLowerCase() || "esta área"} antes de definir un objetivo.`
          : `Mantener y monitorizar ${DOMINIOS_ADULTO[id]?.label?.toLowerCase() || "esta área"} dentro del plan.`);

      return {
        id,
        estado,
        prioridad,
        objetivo:objective,
        pctInicial:pct,
        generatedAt:new Date().toISOString(),
        generatedSource:"evaluation_v2_recommendations",
        recommendationIds:related.map(r=>r.id),
        suggestedExerciseIds:[...new Set(related.flatMap(r=>r.suggestedExerciseIds||[]))],
        professionalDecisionRequired:true,
      };
    });
  }

  const evalHist = baselineEval?.hist || [];
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
  const baselineEval = getActiveEvaluation(paciente);
  const summary = getPatientReportSummary(paciente);
  const plan = paciente?.interventionPlan?.areas || [];
  const evolution = getCognitiveProfileEvolution(paciente);
  const timelineV2 = buildLongitudinalClinicalTimelineV2(paciente);
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
  lines.push("", "INTERPRETACION DESCRIPTIVA DEL PERFIL COGNITIVO");
  (baselineEval?.hist || []).forEach(h => {
    const pct = typeof h.pct === "number" && !Number.isNaN(h.pct) ? h.pct : null;
    const it = buildDomainInterpretation(paciente, h.id, pct, h);
    lines.push("");
    lines.push(`${DOMINIOS_ADULTO[h.id]?.label || h.id} - ${it.status}${pct !== null ? ` - ${pct}%` : ""}`);
    lines.push(`Que es: ${it.definition}`);
    lines.push(`Desempeno observado: ${it.observation}`);
    if (it.subcomponents.length) lines.push(`Procesos explorados: ${it.subcomponents.join(", ")}`);
  });

  if (baselineEval?.assessmentVersion === NEUROFLEX_ASSESSMENT_VERSION) {
    lines.push("", "INTEGRACION LONGITUDINAL EVALUATION V2");
    lines.push(`Linea base: ${baselineEval.date ? new Date(baselineEval.date).toLocaleDateString("es") : "sin fecha"} | ${baselineEval.taskResults?.length || 0} tareas.`);
    lines.push(`Sesiones registradas: ${timelineV2.sessions.length}. Reevaluaciones selectivas vinculadas: ${timelineV2.reassessments.length}.`);
    buildIntegratedLongitudinalSynthesisV2(paciente).forEach(x => lines.push(`- ${x}`));
    timelineV2.reassessments.forEach((r,idx) => {
      lines.push("");
      lines.push(`Reevaluacion selectiva ${idx+1} - ${r.date ? new Date(r.date).toLocaleDateString("es") : "sin fecha"}`);
      (r.changeProfile?.domainChanges || []).forEach(d => {
        const dir=d.direction==="higher"?"mayor":d.direction==="lower"?"menor":d.direction==="similar"?"similar":"insuficiente";
        lines.push(`${d.label}: desempeno ${dir} en esta administracion${nfFinite(d.meanTaskDelta)?` | cambio interno ${d.meanTaskDelta>0?"+":""}${d.meanTaskDelta} puntos`:""} | ${d.comparableTasks} tarea(s) comparable(s).`);
      });
    });
  }

  lines.push("", "PLAN DE INTERVENCION");
  plan.filter(a => a.estado === "objetivo" || a.estado === "seguimiento").forEach(a => {
    lines.push(`${DOMINIOS_ADULTO[a.id]?.label || a.id} - prioridad ${a.prioridad}: ${a.objetivo || "Objetivo pendiente"}`);
  });
  const transfer = buildFunctionalTransferPlan(paciente);
  if (transfer.length) {
    lines.push("", "GENERALIZACION FUNCIONAL SUGERIDA");
    lines.push("Estas actividades son oportunidades de practica; no demuestran transferencia fuera de NeuroFlex.");
    transfer.forEach(item => {
      lines.push("", `${DOMINIOS_ADULTO[item.domId]?.label || item.domId}: ${item.goal}`);
      item.activities.forEach(a => lines.push(`- ${a}`));
    });
  }
  lines.push("", "Nota: resultados descriptivos de tareas NeuroFlex; no son puntuaciones normativas ni diagnostico.");

  lines.push("");
  lines.push("SINTESIS CLINICA DESCRIPTIVA");
  buildEvolutionClinicalSynthesis(paciente).forEach(x => lines.push(`- ${x}`));
  lines.push("");
  lines.push("NOTA DE INTERPRETACION");
  lines.push("Los resultados describen tareas de NeuroFlex; no son puntuaciones normativas ni sustituyen pruebas estandarizadas. Los cambios dentro de la plataforma no demuestran por si solos transferencia a la vida diaria.");

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
    if (r.specificMetrics && Object.keys(r.specificMetrics).length) {
      const specific = Object.entries(r.specificMetrics)
        .filter(([k]) => !["adaptiveLevel","supportLevel","totalSeconds"].includes(k))
        .map(([k,v]) => `${specificMetricLabel(k)}: ${formatSpecificMetric(k,v)}`)
        .join(" | ");
      if (specific) lines.push(`Metricas especificas: ${specific}`);
    }
    if (r.metacognition) {
      lines.push(`Estrategia percibida: ${r.metacognition.strategy || "sin registro"}${typeof r.metacognition.perceivedDifficulty === "number" ? ` | dificultad percibida ${["","facil","adecuada","dificil"][r.metacognition.perceivedDifficulty]}` : ""}${r.metacognition.changedStrategy === true ? " | cambio de estrategia" : ""}`);
    }
  });
  if (sesion?.nota) lines.push("", "NOTA CLINICA", sesion.nota);
  if (sesion?.therapeuticFollowUp?.domainFollowUp?.length) {
    lines.push("", "SEGUIMIENTO TERAPEUTICO POSTERIOR A LA SESION");
    sesion.therapeuticFollowUp.domainFollowUp.forEach(d => {
      lines.push(`${DOMINIOS_ADULTO[d.domainId]?.label || d.domainId}: ${nfFollowUpActionLabel(d.action).label}.`);
    });
    lines.push("Estas sugerencias no modifican automaticamente el plan terapeutico.");
  }
  lines.push("", "Nota: resultados descriptivos de tareas NeuroFlex; no son puntuaciones normativas ni diagnostico.");

  lines.push("");
  lines.push("SINTESIS DE LA SESION");
  buildSessionClinicalSynthesis(sesion).forEach(x => lines.push(`- ${x}`));
  lines.push("");
  lines.push("NOTA DE INTERPRETACION");
  lines.push("Los resultados describen tareas de NeuroFlex y deben integrarse con la valoracion clinica y el funcionamiento cotidiano.");

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
  const hasEval=!!getActiveEvaluation(paciente);
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
  const baselineEval = getActiveEvaluation(paciente);
  const evalHist = baselineEval?.hist || [];
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
    if (!paciente?.eval) {
      setGenerationMessage("⚠️ Este paciente no tiene una evaluación disponible para generar el plan.");
      return false;
    }

    // 1. Generar y mostrar INMEDIATAMENTE, sin depender de Firebase.
    let generatedAreas = [];
    try {
      generatedAreas = buildRehabilitationPlanFromEvaluation(paciente);
      if (!generatedAreas.length) {
        setGenerationMessage("⚠️ No fue posible construir áreas para el plan.");
        return false;
      }

      setPlan(generatedAreas);
      setGenerationMessage("✅ Plan generado en pantalla. Guardando...");
      setGenerating(true);
    } catch (e) {
      console.error("Error construyendo plan de rehabilitación:", e);
      setGenerationMessage("❌ Ocurrió un error al construir el plan.");
      return false;
    }

    // 2. Guardar después. Si Firebase falla, el plan generado permanece visible.
    const interventionPlan = {
      updatedAt: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
      generatedBy: "neuroflex",
      planType: "rehabilitacion",
      sourceEvalDate: baselineEval?.date || null,
      areas: generatedAreas,
      notas,
    };

    try {
      await updateDoc(doc(firestore, "pacientes", paciente.id), { interventionPlan });
      onUpdate?.({ ...paciente, interventionPlan });
      setGenerationMessage("✅ Plan de rehabilitación generado y guardado correctamente.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      return true;
    } catch (e) {
      console.error("Error guardando plan de rehabilitación:", e);
      setGenerationMessage("⚠️ El plan fue generado y está visible, pero no se pudo guardar en Firebase. Puedes intentar «Guardar plan».");
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
        sourceEvalDate: baselineEval?.date || null,
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
          <button
            type="button"
            onClick={generarPlanRehabilitacion}
            disabled={generating || !paciente?.eval}
            style={{
              border: "none",
              borderRadius: 12,
              padding: "13px 20px",
              minWidth: 210,
              background: generating || !paciente?.eval
                ? COLORS.textLight
                : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              color: COLORS.white,
              fontWeight: 800,
              fontSize: ".84rem",
              cursor: generating || !paciente?.eval ? "not-allowed" : "pointer",
              boxShadow: generating || !paciente?.eval ? "none" : "0 2px 8px rgba(45,78,138,.25)",
              fontFamily: "inherit"
            }}
          >
            {generating ? "💾 Guardando plan..." : "✨ Generar plan de rehabilitación"}
          </button>
        </div>
        {generationMessage && (
          <div style={{ marginTop: 10, padding: "9px 11px", borderRadius: 9, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <p style={{ margin: 0, fontSize: ".76rem", fontWeight: 700 }}>{generationMessage}</p>
            {plan?.length > 0 && (
              <p style={{ margin: "3px 0 0", fontSize: ".68rem", color: COLORS.textMuted }}>
                {plan.filter(a => a.estado === "objetivo" || a.estado === "seguimiento").length} área(s) activa(s) · {plan.filter(a => a.estado === "mantenimiento").length} en mantenimiento · {plan.filter(a => a.estado === "revision").length} para revisión
              </p>
            )}
          </div>
        )}
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

// ─── FASE 27 · AUDITORÍA DE INDICADORES DEL DASHBOARD ────────────────────────
// Regla: 0% es un dato válido y se muestra como 0%. La ausencia de un resultado
// cuantificable nunca se transforma en cero. Las evaluaciones no válidas se excluyen.
function getDashboardSessionState(session) {
  const pct = getSessionMetric(session, "taskIndicator");
  if (typeof pct === "number" && !Number.isNaN(pct)) {
    return { type: "numeric", value: pct, label: `${pct}%` };
  }
  const reviewCount = session?.metrics?.clinicalReviewExercises
    ?? (session?.results || []).filter(r => r.requiresReview || typeof r.pct !== "number").length;
  if (reviewCount > 0) {
    return { type: "review", value: null, label: "Valoración profesional" };
  }
  return { type: "nodata", value: null, label: "Sin indicador cuantificable" };
}

function getDashboardDomainAggregate(pacientes, domId) {
  const validEvaluations = (pacientes || [])
    .map(p => ({ paciente: p, evaluation: getActiveEvaluation(p) }))
    .filter(x => !!x.evaluation);

  const domainRows = validEvaluations
    .map(({ evaluation }) => (evaluation.hist || []).find(h => h.id === domId))
    .filter(Boolean);

  const numeric = domainRows
    .filter(h => !h.requiresReview && typeof h.pct === "number" && !Number.isNaN(h.pct))
    .map(h => h.pct);

  if (numeric.length) {
    return {
      type: "numeric",
      value: Math.round(numeric.reduce((a,b)=>a+b,0) / numeric.length),
      n: numeric.length,
      reviewN: domainRows.filter(h => h.requiresReview || typeof h.pct !== "number").length,
    };
  }

  const reviewN = domainRows.filter(h => h.requiresReview || typeof h.pct !== "number").length;
  if (reviewN > 0) return { type:"review", value:null, n:0, reviewN };
  return { type:"nodata", value:null, n:0, reviewN:0 };
}

function getPatientProgressDelta(paciente) {
  const quant = (paciente?.sesiones || [])
    .map(s => getSessionMetric(s, "taskIndicator"))
    .filter(v => typeof v === "number" && !Number.isNaN(v));
  if (quant.length < 2) return null;
  return quant[quant.length - 1] - quant[0];
}

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

  // Estadísticas clínicas/descriptivas auditadas.
  const total = pacientes.length;
  const activos = pacientes.filter(p => p.activo).length;
  const pacientesConEvalValida = pacientes.filter(p => !!getActiveEvaluation(p));
  const conEval = pacientesConEvalValida.length;
  const evaluacionesSinLineaBase = pacientes.filter(
    p => getEvaluationHistory(p).length > 0 && !getActiveEvaluation(p)
  ).length;
  const totalSesiones = pacientes.reduce((a, p) => a + (p.sesiones?.length || 0), 0);

  // "Progreso" significa cambio entre primera y última sesión cuantificable,
  // no promedio de porcentajes de desempeño.
  const deltasProgreso = pacientes
    .map(getPatientProgressDelta)
    .filter(v => typeof v === "number" && !Number.isNaN(v));
  const progresoPromedio = deltasProgreso.length
    ? Math.round(deltasProgreso.reduce((a,b)=>a+b,0) / deltasProgreso.length)
    : null;

  // Top 5 pacientes más activos
  const masActivos = [...pacientes]
    .sort((a, b) => (b.sesiones?.length || 0) - (a.sesiones?.length || 0))
    .slice(0, 5);

  // Pacientes que más mejoraron: primera vs última sesión cuantificable.
  const masProgreso = [...pacientes]
    .map(p => {
      const mejora = getPatientProgressDelta(p);
      return typeof mejora === "number" ? { ...p, mejora } : null;
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
          value={typeof progresoPromedio === "number" ? `${progresoPromedio > 0 ? "+" : ""}${progresoPromedio} pts` : "—"}
          sub={typeof progresoPromedio === "number"
            ? `Cambio descriptivo · ${deltasProgreso.length} paciente(s)`
            : "Requiere ≥2 sesiones cuantificables"}
          color={typeof progresoPromedio === "number"
            ? (progresoPromedio > 0 ? COLORS.success : progresoPromedio < 0 ? COLORS.error : COLORS.textMuted)
            : COLORS.textMuted}
        />
        <StatCard
          icon="🧠"
          label="Con evaluación válida"
          value={conEval}
          sub={evaluacionesSinLineaBase > 0
            ? `${evaluacionesSinLineaBase} sin línea base válida`
            : `de ${total} pacientes`}
          color={COLORS.info}
        />
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
                label={`${p.mejora > 0 ? "+" : ""}${p.mejora} pts`}
                color={p.mejora > 0 ? COLORS.success : p.mejora < 0 ? COLORS.error : COLORS.textMuted}
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
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: (() => {
                  const state = getDashboardSessionState(s);
                  return (state.type === "numeric" ? gradeColor(state.value) : state.type === "review" ? COLORS.accent : COLORS.textMuted) + "15";
                })(),
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem"
              }}>📅</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: ".85rem" }}>{s.pacienteNombre}</p>
                <p style={{ margin: 0, fontSize: ".72rem", color: COLORS.textMuted }}>Sesión {s.numero} · {new Date(s.date).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {(() => {
                const state = getDashboardSessionState(s);
                if (state.type === "numeric") {
                  return <span style={{ fontWeight: 700, color: gradeColor(state.value), fontSize: ".9rem" }}>{state.label}</span>;
                }
                if (state.type === "review") {
                  return <span style={{ fontWeight: 600, color: COLORS.accent, fontSize: ".72rem" }}>{state.label}</span>;
                }
                return <span style={{ fontWeight: 600, color: COLORS.textMuted, fontSize: ".72rem" }}>{state.label}</span>;
              })()}
              <span style={{ fontSize: ".75rem", color: COLORS.textMuted }}>{fmt(s.secs || 0)}</span>
            </div>
          </div>
        ))}
      </Card>

      {/* Rendimiento por dominio: solo líneas base válidas */}
      <Card>
        <p style={{ fontWeight: 700, marginBottom: 6, fontSize: ".95rem" }}>🧠 Rendimiento promedio por dominio cognitivo</p>
        <p style={{ fontSize: ".75rem", color: COLORS.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
          Basado únicamente en líneas base válidas ({conEval} paciente(s)). Un 0% representa un resultado cuantificable real; la ausencia de datos o la valoración profesional se muestran por separado.
        </p>

        {Object.keys(DOMINIOS_ADULTO).map(id => {
          const dom = DOMINIOS_ADULTO[id];
          const agg = getDashboardDomainAggregate(pacientes, id);

          if (agg.type === "numeric") {
            return (
              <div key={id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap:10, marginBottom: 4 }}>
                  <span style={{ fontSize: ".82rem", fontWeight: 500 }}>{dom.emoji} {dom.label}</span>
                  <span style={{ fontWeight: 700, color: gradeColor(agg.value), fontSize: ".82rem" }}>
                    {agg.value}% <span style={{ color:COLORS.textMuted,fontWeight:500,fontSize:".65rem" }}>n={agg.n}</span>
                  </span>
                </div>
                <ProgressBar value={agg.value} color={gradeColor(agg.value)} height={8} />
              </div>
            );
          }

          return (
            <div key={id} style={{ marginBottom: 10, padding:"8px 10px", borderRadius:9, background:COLORS.bg, display:"flex",justifyContent:"space-between",gap:10,alignItems:"center" }}>
              <span style={{ fontSize: ".82rem", fontWeight: 500 }}>{dom.emoji} {dom.label}</span>
              <span style={{
                fontSize:".7rem",fontWeight:700,
                color:agg.type==="review" ? COLORS.accent : COLORS.textMuted
              }}>
                {agg.type === "review" ? "Valoración profesional" : "Sin datos"}
              </span>
            </div>
          );
        })}
      </Card>
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
  useEffect(() => { setPaciente(pacienteInit); }, [pacienteInit]);
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
      const previousHistory = getEvaluationHistory(paciente);
      const normalized = normalizeEvaluationRecord(evalData, {
        validityStatus: "valid",
        evaluationVersion: NEUROFLEX_EVALUATION_VERSION,
      });

      const nextHistory = [
        ...previousHistory.filter(r => r.evaluationId !== normalized.evaluationId),
        normalized,
      ].sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0));

      const preserveBaseline = normalized.preserveCurrentBaseline === true || normalized.assessmentMode === "selective_reassessment";
      const updated = {
        ...paciente,
        eval: preserveBaseline ? paciente.eval : normalized,
        evaluationHistory: nextHistory,
        activeEvaluationId: preserveBaseline ? paciente.activeEvaluationId : normalized.evaluationId,
      };

      await updateDoc(doc(firestore, "pacientes", paciente.id), {
        eval: preserveBaseline ? (paciente.eval || null) : normalized,
        evaluationHistory: nextHistory,
        activeEvaluationId: preserveBaseline ? (paciente.activeEvaluationId || null) : normalized.evaluationId,
      });

      setPac(updated);
      setShowEval(false);
      setTab("perfil-cognitivo");
    } catch(e) {
      console.error("Error guardando evaluación:", e);
      alert("No se pudo guardar la evaluación. Los resultados no se reemplazaron.");
    }
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
            {getActiveEvaluation(paciente)
              ? <BtnPrimary onClick={onIniciarSesion} style={{ padding: "8px 16px", fontSize: ".82rem" }}>▶ Iniciar sesión</BtnPrimary>
              : <BtnPrimary onClick={() => setShowEval(true)} style={{ padding: "8px 16px", fontSize: ".82rem", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` }}>
                  {getEvaluationHistory(paciente).length ? "🔄 Reevaluar" : "🧠 Evaluar"}
                </BtnPrimary>
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
        <div>
          {getActiveEvaluation(paciente)
            ? (
              <div>
                <PerfilCognitivoView evalData={getActiveEvaluation(paciente)} paciente={paciente} onIniciarSesion={() => setTab("intervencion")} />
                <div style={{ marginTop: 20 }}>
                  <CurrentVsInitialProfile paciente={paciente} />
                </div>
              </div>
            )
            : (
              <Card>
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 12 }}>🧠</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
                    {getEvaluationHistory(paciente).length ? "Sin línea base válida" : "Evaluación pendiente"}
                  </h3>
                  <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>
                    {getEvaluationHistory(paciente).length
                      ? "Las evaluaciones conservadas no están activas como línea base. Realiza una nueva evaluación o restaura una evaluación válida del historial."
                      : "Este paciente aún no ha completado la evaluación cognitiva inicial."}
                  </p>
                  <BtnPrimary onClick={() => setShowEval(true)}>
                    {getEvaluationHistory(paciente).length ? "🔄 Realizar nueva evaluación" : "Iniciar evaluación ahora"}
                  </BtnPrimary>
                </div>
              </Card>
            )}

          <EvaluationHistoryManager
            paciente={paciente}
            onUpdate={setPac}
            onRepeat={() => {
              const ok = window.confirm(
                "Se realizará una nueva evaluación. La anterior se conservará en el historial y la nueva pasará a ser la línea base vigente. ¿Continuar?"
              );
              if (ok) setShowEval(true);
            }}
          />
        </div>
      )}

      {tab === "intervencion" && (
        getActiveEvaluation(paciente)
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
        <ProgressLongitudinal sesiones={paciente.sesiones || []} paciente={paciente} />
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
  const baselineEval = getActiveEvaluation(paciente);
  const item = (baselineEval?.hist || []).find(h => h.id === domId);
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


// ─── FASE 30 · SÍNTESIS CLÍNICA PROFESIONAL PARA REPORTES ────────────────────
// Redacción determinística basada únicamente en datos estructurados de NeuroFlex.
// No diagnostica, no usa baremos y evita inferir transferencia funcional.
function getReportActiveAreas(paciente) {
  return (paciente?.interventionPlan?.areas || [])
    .filter(a => ["objetivo","seguimiento"].includes(a.estado))
    .sort((a,b) => ({alta:0,media:1,baja:2}[a.prioridad] ?? 1) - ({alta:0,media:1,baja:2}[b.prioridad] ?? 1));
}

function buildEvolutionClinicalSynthesis(paciente) {
  const baseline = getActiveEvaluation(paciente);
  const summary = getPatientReportSummary(paciente);
  const activeAreas = getReportActiveAreas(paciente);
  const reviewAreas = (baseline?.hist || []).filter(h => h.requiresReview || typeof h.pct !== "number");
  const recent = (paciente?.sesiones || []).slice(-3);
  const trackedAutonomy = recent
    .map(s => getSessionMetric(s, "autonomyRate"))
    .filter(v => typeof v === "number");
  const trackedLevel = recent
    .map(s => getSessionMetric(s, "averageAdaptiveLevel"))
    .filter(v => typeof v === "number");
  const avgAutonomy = safeAverage(trackedAutonomy);
  const avgLevel = safeAverage(trackedLevel);

  const observations = [];
  if (!baseline) {
    observations.push("No hay una línea base válida activa; por ello no corresponde interpretar un perfil inicial ni atribuir cambios a la intervención.");
  } else {
    observations.push(`La línea base vigente explora ${baseline.hist?.length || 0} dominios de NeuroFlex${reviewAreas.length ? `, con ${reviewAreas.length} área(s) que requieren valoración profesional y no se incorporan automáticamente a indicadores porcentuales` : ""}.`);
  }

  if (summary.quantifiableSessions >= 2 && summary.delta !== null) {
    if (summary.delta > 0) observations.push(`Entre la primera y la sesión cuantificable más reciente se observa un cambio descriptivo de +${summary.delta} puntos en el indicador de tareas.`);
    else if (summary.delta < 0) observations.push(`Entre la primera y la sesión cuantificable más reciente se observa un cambio descriptivo de ${summary.delta} puntos; conviene interpretarlo junto con dificultad, apoyos y características de las tareas administradas.`);
    else observations.push("El indicador de tareas se mantiene sin cambio porcentual entre la primera y la sesión cuantificable más reciente.");
  } else if (summary.totalSessions > 0) {
    observations.push("Aún no hay suficientes sesiones cuantificables para describir una tendencia longitudinal estable.");
  } else {
    observations.push("Aún no se registran sesiones de intervención para describir evolución.");
  }

  if (avgAutonomy !== null) observations.push(`En las sesiones recientes con registro de apoyos, la autonomía media observada es aproximadamente ${Math.round(avgAutonomy)}%.`);
  if (avgLevel !== null) observations.push(`El nivel adaptativo medio reciente registrado es ${Math.round(avgLevel*10)/10}/5; este dato describe la dificultad administrada y no una puntuación normativa.`);
  if (activeAreas.length) observations.push(`El plan vigente prioriza ${activeAreas.slice(0,4).map(a => DOMINIOS_ADULTO[a.id]?.label).filter(Boolean).join(", ")}${activeAreas.length > 4 ? " y otras áreas" : ""}.`);

  if (baseline?.assessmentVersion === NEUROFLEX_ASSESSMENT_VERSION) {
    buildIntegratedLongitudinalSynthesisV2(paciente).forEach(x => {
      if (!observations.includes(x)) observations.push(x);
    });
  }

  return observations;
}

function buildSessionClinicalSynthesis(sesion) {
  const results = sesion?.results || [];
  const indicator = getSessionMetric(sesion, "taskIndicator");
  const autonomy = getSessionMetric(sesion, "autonomyRate");
  const level = getSessionMetric(sesion, "averageAdaptiveLevel");
  const review = results.filter(r => r.requiresReview || typeof r.pct !== "number").length;
  const supportUsed = results.filter(r => {
    const v = getTrackedSupportLevel(r);
    return typeof v === "number" && v > 0;
  }).length;
  const meta = sesion?.metacognitionSummary;

  const observations = [];
  observations.push(
    indicator !== null
      ? `La sesión presenta un indicador descriptivo de tareas de ${indicator}%, calculado únicamente con ejercicios cuantificables.`
      : "La sesión no presenta un indicador porcentual global cuantificable; los registros deben revisarse a partir de sus métricas específicas y valoración profesional."
  );
  if (review) observations.push(`${review} ejercicio(s) requieren valoración profesional y no se interpretan automáticamente como aciertos o errores porcentuales.`);
  if (autonomy !== null) observations.push(`La autonomía registrada fue ${autonomy}%${supportUsed ? `, con uso de apoyo en ${supportUsed} ejercicio(s)` : ", sin apoyos registrados en los ejercicios trazados"}.`);
  if (level !== null) observations.push(`La dificultad media administrada fue nivel ${level}/5; debe interpretarse junto con precisión, tiempo y necesidad de apoyo.`);
  if (meta?.preferredStrategy) observations.push(`En el registro metacognitivo, la estrategia referida con mayor frecuencia fue “${meta.preferredStrategy}”. Este dato corresponde a autorreporte durante la sesión.`);
  return observations;
}

function ClinicalSynthesisBlock({ title = "Síntesis profesional", observations = [] }) {
  if (!observations.length) return null;
  return (
    <div style={{ marginTop: 16, padding: 14, borderRadius: 10, border: "1px solid #dfe3ea", background: "#fbfcfe" }}>
      <div style={{ fontWeight: 850, fontSize: ".82rem", marginBottom: 7 }}>{title}</div>
      {observations.map((x,i) => (
        <p key={i} style={{ margin: i ? "5px 0 0" : 0, fontSize: ".73rem", color: "#475467", lineHeight: 1.55 }}>{x}</p>
      ))}
    </div>
  );
}

function ReportDisclaimer() {
  return (
    <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: "#f7f8fb", border: "1px solid #e6e8ef", fontSize: ".72rem", color: "#667085", lineHeight: 1.55 }}>
      Los resultados presentados describen exclusivamente el desempeño observado en las tareas administradas mediante NeuroFlex.
      No corresponden a puntuaciones normativas, no sustituyen instrumentos neuropsicológicos estandarizados y no constituyen por sí solos un diagnóstico.
      Los cambios observados dentro de la plataforma no demuestran automáticamente generalización a actividades de la vida diaria.
      La interpretación final debe integrarse con antecedentes, observación clínica, funcionamiento cotidiano y juicio profesional.
    </div>
  );
}

function ReporteEvolucionImprimible({ paciente }) {
  const baselineEval = getActiveEvaluation(paciente);
  const evalHist = baselineEval?.hist || [];
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

      <LongitudinalV2ReportOverview paciente={paciente} />

      <section style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>1. Línea base cognitiva vigente</h3>
        {!baselineEval ? (
          <p style={{ color: "#667085" }}>No se registra una evaluación válida activa como línea base.</p>
        ) : (
          <>
            <p style={{ fontSize: ".73rem", color: "#667085", margin: "0 0 10px" }}>
              Evaluación de referencia: {baselineEval?.date ? new Date(baselineEval.date).toLocaleDateString("es") : "fecha no registrada"}.
              Las evaluaciones históricas marcadas como no válidas no se utilizan en este reporte.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
              {baselineEval?.assessmentVersion === NEUROFLEX_ASSESSMENT_VERSION
                ? (baselineEval.domainProfile || []).map(d => {
                    const band=assessmentPerformanceBand(d.descriptiveIndex);
                    return (
                      <div key={d.domainId} style={{ padding:"8px 10px",border:"1px solid #eceef3",borderRadius:8 }}>
                        <div style={{fontWeight:700,fontSize:".8rem"}}>{d.label || ASSESSMENT_DOMAINS_V2[d.domainId]?.label || d.domainId}</div>
                        <div style={{fontSize:".74rem",color:"#667085",marginTop:2}}>
                          {nfFinite(d.descriptiveIndex) ? `Índice descriptivo ${d.descriptiveIndex} · ${band.label}` : "Revisión profesional"}
                        </div>
                        <div style={{fontSize:".66rem",color:"#98a2b3",marginTop:2}}>{d.processes?.length || 0} subproceso(s) · {d.quantifiedTaskCount || 0} tarea(s) principales cuantificables</div>
                      </div>
                    );
                  })
                : evalHist.map(h => {
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
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>2. Interpretación descriptiva del perfil cognitivo</h3>
        {(baselineEval?.hist || []).map(h => {
          const dom = DOMINIOS_ADULTO[h.id];
          const pct = typeof h.pct === "number" && !Number.isNaN(h.pct) ? h.pct : null;
          const it = buildDomainInterpretation(paciente, h.id, pct, h);
          return (
            <div key={h.id} style={{ marginBottom: 13, paddingBottom: 11, borderBottom: "1px solid #eceef3" }}>
              <div style={{ fontWeight: 800, fontSize: ".82rem" }}>{dom?.label} · {it.status}{pct !== null ? ` · ${pct}%` : ""}</div>
              <div style={{ fontSize: ".72rem", color: "#475467", marginTop: 4, lineHeight: 1.5 }}><strong>Qué es:</strong> {it.definition}</div>
              <div style={{ fontSize: ".72rem", color: "#475467", marginTop: 4, lineHeight: 1.5 }}><strong>Desempeño observado:</strong> {it.observation}</div>
              {it.subcomponents.length > 0 && <div style={{ fontSize: ".68rem", color: "#667085", marginTop: 4 }}><strong>Procesos explorados:</strong> {it.subcomponents.join(" · ")}</div>}
            </div>
          );
        })}
      </section>

<section style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>3. Perfil de intervención</h3>
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
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>4. Evolución global en NeuroFlex</h3>
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

      <ClinicalSynthesisBlock
        title="Síntesis clínica descriptiva"
        observations={buildEvolutionClinicalSynthesis(paciente)}
      />

      <section style={{ marginBottom: 22, marginTop: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>5. Evolución por dominio</h3>
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
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>6. Perfil inicial vs actual</h3>
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
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>7. Revisión sugerida del plan</h3>
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
        <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>8. Sesiones recientes</h3>
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

      
      {buildFunctionalTransferPlan(paciente).length > 0 && (
        <section style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>9. Generalización funcional sugerida</h3>
          <p style={{ fontSize: ".72rem", color: "#667085", lineHeight: 1.5 }}>
            Estas actividades son oportunidades de práctica y no constituyen evidencia de transferencia fuera de NeuroFlex.
          </p>
          {buildFunctionalTransferPlan(paciente).map(item => (
            <div key={item.domId} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: ".78rem" }}>{DOMINIOS_ADULTO[item.domId]?.label}</div>
              <div style={{ fontSize: ".7rem", color: "#475467", marginTop: 2 }}>{item.goal}</div>
              <div style={{ fontSize: ".68rem", color: "#667085", marginTop: 2 }}>{item.activities.join(" · ")}</div>
            </div>
          ))}
        </section>
      )}

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
          {r.specificMetrics && Object.keys(r.specificMetrics).length > 0 && (
            <div style={{ color:"#667085",fontSize:".68rem",marginTop:3 }}>
              Métricas específicas: {Object.entries(r.specificMetrics)
                .filter(([k]) => !["adaptiveLevel","supportLevel","totalSeconds"].includes(k))
                .map(([k,v]) => `${specificMetricLabel(k)}: ${formatSpecificMetric(k,v)}`)
                .join(" · ")}
            </div>
          )}
          {r.metacognition && (
            <div style={{ color:"#667085",fontSize:".68rem",marginTop:3 }}>
              Estrategia percibida: {r.metacognition.strategy || "—"}
              {typeof r.metacognition.perceivedDifficulty === "number" ? ` · Dificultad percibida: ${["","Fácil","Adecuada","Difícil"][r.metacognition.perceivedDifficulty]}` : ""}
              {r.metacognition.changedStrategy === true ? " · Cambió de estrategia" : ""}
            </div>
          )}
        </div>
      ))}

      <ClinicalSynthesisBlock
        title="Síntesis de la sesión"
        observations={buildSessionClinicalSynthesis(sesion)}
      />

      {sesion.nota && (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: 8 }}>Nota clínica</h3>
          <div style={{ padding: 12, background: "#f7f8fb", borderRadius: 8, fontSize: ".76rem", lineHeight: 1.55 }}>{sesion.nota}</div>
        </div>
      )}

      <SessionFollowUpReportBlock sesion={sesion} />
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
          Elige el tipo de reporte. El reporte de evolución integra línea base, intervención, seguimiento y reevaluaciones selectivas cuando existen. Puedes descargar un PDF directamente o imprimir la versión preparada para reporte.
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
        <StatCard icon="📈" label="Cambio" value={mejora !== null ? `${mejora > 0 ? "+" : ""}${mejora} pts` : "—"} color={mejora !== null && mejora > 0 ? COLORS.success : mejora !== null && mejora < 0 ? COLORS.error : COLORS.textMuted} />
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
  const intelligent = config?.seleccionInteligente !== false;

  const v2Blueprint = intelligent ? buildTherapeuticPrescriptionBlueprintV2(paciente, config) : null;
  if (v2Blueprint?.slots?.length) {
    return v2Blueprint.slots.map((slot, idx) => ({
      id:`rxv2_${Date.now()}_${idx}_${Math.random().toString(36).slice(2,7)}`,
      domId:slot.domId,
      exId:slot.exId,
      adaptiveLevel:slot.adaptiveLevel,
      selectedBy:"evaluation_v2_prescription",
      selectionScore:null,
      selectionReasons:{
        difficultyFit:`nivel inicial ${slot.adaptiveLevel}`,
        recentUse:null,
        subcomponent:EXERCISE_QUALITY_PROFILE[slot.exId]?.principal || null,
        interventionPriority:slot.priority,
        recommendationId:slot.recommendationId,
        assessmentDomain:slot.assessmentDomain,
        objective:slot.objective,
        progression:slot.progression,
      },
      professionalOverride:false,
      recommendationId:slot.recommendationId,
      assessmentDomain:slot.assessmentDomain,
      progression:slot.progression,
      prescriptionVersion:THERAPEUTIC_PRESCRIPTION_VERSION,
    }));
  }

  const domPool = areas.filter(id => EX_ADULTO[id]?.length > 0);
  if (!domPool.length) return [];
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
  if (item.selectedBy === "evaluation_v2_prescription") {
    const parts=["Derivada de Evaluation v2"];
    if(r?.interventionPriority) parts.push(`prioridad ${r.interventionPriority}`);
    if(r?.assessmentDomain) parts.push(formatAssessmentProcessLabelV2(r.assessmentDomain).toLowerCase());
    return parts.join(" · ");
  }
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
          {config?.therapeuticPrescriptionBlueprint?.version ? " La propuesta actual utiliza prioridades de Evaluation v2." : ""}
        </p>
        {config?.therapeuticPrescriptionBlueprint?.version && <div style={{marginTop:9,display:"flex",gap:7,flexWrap:"wrap"}}>
          <Badge label={config.therapeuticPrescriptionBlueprint.version} color={COLORS.primary}/>
          <Badge label={`~${config.therapeuticPrescriptionBlueprint.targetMinutes} min`} color={COLORS.info}/>
          <Badge label="Revisión profesional requerida" color={COLORS.accent}/>
        </div>}
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
      alert("No se pudo guardar la sesión. NeuroFlex no avanzará al reporte para evitar mostrar datos como guardados cuando no lo están. Intenta nuevamente.");
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


// ─── FASE 23 · MÉTRICAS ESPECÍFICAS SEGÚN LA NATURALEZA DE LA TAREA ──────────
function getExerciseSpecificMetrics(result) {
  if (!result) return {};
  const out = {};

  // Búsqueda/selección: omisiones y falsas alarmas cuando existen objetivos definidos.
  if (["sustained_attention","divided_attention","find_animal"].includes(result.exId)) {
    if (typeof result.total === "number" && typeof result.correct === "number") {
      out.omissions = Math.max(0, result.total - result.correct);
    }
    if (typeof result.errors === "number") out.falseAlarms = Math.max(0, result.errors);
  }

  // N-back: decisiones incorrectas registradas como errores.
  if (result.exId === "nback_1") {
    if (typeof result.errors === "number") out.responseErrors = result.errors;
    if (typeof result.total === "number" && typeof result.correct === "number") {
      out.correctDecisionRate = result.total > 0 ? Math.round((result.correct / result.total) * 100) : null;
    }
  }

  // Tiempo de reacción: mantener métricas crudas; no convertirlas a puntuación cognitiva.
  if (result.exId === "reaction_time") {
    if (typeof result.avgMs === "number") out.averageReactionMs = result.avgMs;
    if (typeof result.variabilityMs === "number") out.reactionVariabilityMs = result.variabilityMs;
    if (typeof result.completedTrials === "number") out.completedTrials = result.completedTrials;
  }

  // Fluidez: cantidad producida para revisión profesional, no "aciertos".
  if (result.exId === "verbal_fluency") {
    if (typeof result.wordCount === "number") out.producedWords = result.wordCount;
    if (result.category) out.category = result.category;
  }

  // Secuenciación alternante y cambio de regla.
  if (result.exId === "trail_making") {
    if (typeof result.errors === "number") out.sequenceErrors = result.errors;
    if (typeof result.seconds === "number") out.completionSeconds = result.seconds;
  }
  if (result.exId === "flex_regla") {
    if (typeof result.errors === "number") out.ruleErrors = result.errors;
    if (typeof result.total === "number" && typeof result.correct === "number") {
      out.ruleAccuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : null;
    }
  }

  // Métricas transversales disponibles cuando son válidas.
  if (typeof result.seconds === "number" && result.seconds > 0) out.totalSeconds = result.seconds;
  if (typeof result.adaptiveLevel === "number") out.adaptiveLevel = result.adaptiveLevel;
  const support = getTrackedSupportLevel(result);
  if (typeof support === "number") out.supportLevel = support;

  return out;
}

function specificMetricLabel(key) {
  const labels = {
    omissions: "Omisiones",
    falseAlarms: "Falsas alarmas",
    responseErrors: "Errores de decisión",
    correctDecisionRate: "Decisiones correctas",
    averageReactionMs: "Reacción media",
    reactionVariabilityMs: "Variabilidad",
    completedTrials: "Ensayos completados",
    producedWords: "Palabras producidas",
    category: "Categoría",
    sequenceErrors: "Errores de secuencia",
    completionSeconds: "Tiempo de finalización",
    ruleErrors: "Errores de regla",
    ruleAccuracy: "Precisión con la regla",
    totalSeconds: "Tiempo total",
    adaptiveLevel: "Nivel adaptativo",
    supportLevel: "Nivel de apoyo",
  };
  return labels[key] || key;
}

function formatSpecificMetric(key, value) {
  if (value === null || value === undefined) return "—";
  if (["correctDecisionRate","ruleAccuracy"].includes(key)) return `${value}%`;
  if (["averageReactionMs","reactionVariabilityMs"].includes(key)) return `${value} ms`;
  if (["completionSeconds","totalSeconds"].includes(key)) return `${value} s`;
  if (key === "adaptiveLevel") return `${value}/5`;
  if (key === "supportLevel") return supportLabel(value);
  return String(value);
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
    totalOmissions: results.reduce((a,r) => a + (r.specificMetrics?.omissions || 0), 0),
    totalFalseAlarms: results.reduce((a,r) => a + (r.specificMetrics?.falseAlarms || 0), 0),
    reactionTimeTasks: results.filter(r => typeof r.specificMetrics?.averageReactionMs === "number").length,
    metacognitionTrackedExercises: results.filter(r => !!r.metacognition).length,
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

function ProgressLongitudinal({ sesiones = [], paciente = null }) {
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
      {paciente && <TherapeuticFollowUpPanel paciente={paciente} />}
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
  const baselineEval = getActiveEvaluation(paciente);
  const evalHist = baselineEval?.hist || [];
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
    <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto" }}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {["1. Áreas","2. Duración","3. Adaptación","4. Prescripción"].map((s,i)=><span key={s} style={{padding:"5px 8px",borderRadius:999,background:i<3?COLORS.primary+"09":COLORS.success+"0d",color:i<3?COLORS.primary:COLORS.success,fontSize:".67rem",fontWeight:700,border:`1px solid ${i<3?COLORS.primary+"18":COLORS.success+"20"}`}}>{s}</span>)}
      </div>
      <Card style={{ marginBottom: 20, padding: "22px 24px", background: COLORS.primary + "04", border: `1px solid ${COLORS.primary}16` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontWeight: 800, margin: "0 0 4px", fontSize: "1.25rem" }}>⚙️ Configurar sesión</h2>
            <p style={{ color: COLORS.textMuted, fontSize: ".86rem", margin: 0 }}>
              {paciente.nombre} · Sesión #{(paciente.sesiones?.length || 0) + 1}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ padding: "7px 10px", borderRadius: 999, background: COLORS.white, border: `1px solid ${COLORS.border}`, fontSize: ".72rem", color: COLORS.textSecond }}>
              {modo === "auto" ? "🤖 Automático" : "✍️ Manual"}
            </span>
            <span style={{ padding: "7px 10px", borderRadius: 999, background: COLORS.white, border: `1px solid ${COLORS.border}`, fontSize: ".72rem", color: COLORS.textSecond }}>
              {duracion} ejercicios
            </span>
          </div>
        </div>
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

      {baselineEval?.assessmentVersion === NEUROFLEX_ASSESSMENT_VERSION && (
        <TherapeuticPrescriptionPreviewV2 paciente={paciente} config={{duracion,seleccionInteligente,adaptativo,areas:areasAuto}} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 20, marginBottom: 20 }}>
      {/* Modo */}
      <Card style={{ height: "100%" }}>
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

      {/* Duración */}
      <Card style={{ height: "100%" }}>
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

      </div>

      {/* Áreas */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Áreas a trabajar</p>
        {modo === "auto" ? (
          <div>
            {areasAuto.length > 0 && <p style={{ fontSize: ".82rem", color: COLORS.textMuted, marginBottom: 10 }}>Priorizando objetivos definidos en el plan de intervención:</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
              {(areasAuto.length > 0 ? areasAuto.slice(0, 3) : allDoms.slice(0, 3)).map(id => {
                const dom = DOMINIOS_ADULTO[id];
                const h = evalHist.find(x => x.id === id);
                return (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "11px 12px", background: COLORS.error + "08", borderRadius: 10, border: `1px solid ${COLORS.error}14` }}>
                    <span style={{ fontWeight: 600, fontSize: ".88rem" }}>{dom?.emoji} {dom?.label}</span>
                    {h && typeof h.pct === "number" && <Badge label={`${h.pct}%`} color={gradeColor(h.pct)} />}
                  </div>
                );
              })}
            </div>
            {areasAuto.length === 0 && (
              <p style={{ color: autoBlockedByPlan ? COLORS.warning : COLORS.textMuted, fontSize: ".85rem", lineHeight: 1.5 }}>
                {autoBlockedByPlan
                  ? "El plan de intervención no tiene objetivos activos. Ajusta el plan o utiliza el modo manual; NeuroFlex no reactivará áreas excluidas o en mantenimiento automáticamente."
                  : "No hay áreas prioritarias derivadas de la evaluación; puedes elegir las áreas manualmente."}
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 8 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20, marginBottom: 20 }}>
      {/* Selección inteligente */}
      <Card style={{ height: "100%" }}>
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
      <Card style={{ height: "100%" }}>
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

      </div>

      {/* Comprensión de la tarea */}
      <Card style={{ marginBottom: 20, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontWeight: 700, margin: "0 0 4px" }}>📘 Preparación antes de puntuar</p>
          </div>
        </div>
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

      <div style={{ display: "grid", gridTemplateColumns: mayor ? "repeat(auto-fit, minmax(330px, 1fr))" : "1fr", gap: 20, marginBottom: 20 }}>
      {/* Avance Manual vs Automático */}
      <Card style={{ height: "100%" }}>
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
        <Card style={{ height: "100%", background: COLORS.accent + "08", border: `1.5px solid ${COLORS.accent}30` }}>
          <p style={{ fontWeight: 700, color: COLORS.accent, margin: "0 0 4px" }}>♿ Modo accesible activo</p>
          <p style={{ fontSize: ".82rem", color: COLORS.textMuted, margin: 0 }}>Texto más grande, botones amplios y más tiempo por ejercicio</p>
        </Card>
      )}

      </div>

      <Card style={{ padding: 16, border: `1px solid ${COLORS.primary}18`, background: COLORS.white }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 800, fontSize: ".82rem" }}>Sesión lista para revisar</div>
            <div style={{ color: COLORS.textMuted, fontSize: ".7rem", marginTop: 2 }}>
              {duracion} ejercicios · {modo === "auto" ? "selección automática" : `${areasSelec.length} área(s) seleccionada(s)`} · {adaptativo ? "adaptativa" : "estándar"}
            </div>
          </div>
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
            interventionPlanSnapshot: paciente.interventionPlan || null,
            therapeuticPrescriptionBlueprint:
              baselineEval?.assessmentVersion === NEUROFLEX_ASSESSMENT_VERSION
                ? buildTherapeuticPrescriptionBlueprintV2(paciente,{duracion,seleccionInteligente,adaptativo,areas:modo==="auto"?areasAuto:areasSelec})
                : null
          })}
          disabled={(modo === "manual" && areasSelec.length === 0) || (modo === "auto" && autoBlockedByPlan)}
          style={{ minWidth: 220, padding: 14, opacity: ((modo === "manual" && areasSelec.length === 0) || (modo === "auto" && autoBlockedByPlan)) ? 0.4 : 1 }}>
          ▶ Iniciar sesión
        </BtnPrimary>
          <BtnSecondary onClick={onCancelar}>Cancelar</BtnSecondary>
        </div>
      </Card>
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


// ─── FASE 22 · METACOGNICIÓN CLÍNICA BREVE ────────────────────────────────────
// Registro complementario: no puntúa, no modifica el nivel adaptativo y no se
// utiliza para inferir diagnóstico. Ayuda a documentar estrategias percibidas.
const METACOGNITIVE_STRATEGIES = [
  "Repetición mental",
  "Agrupar información",
  "Ir paso a paso",
  "Buscar una regla o patrón",
  "Descartar opciones",
  "Revisar antes de responder",
  "Usar una referencia visual",
  "Otra estrategia",
  "No identifiqué una estrategia",
];

function emptyMetacognitiveRecord() {
  return {
    strategy: "",
    changedStrategy: null,
    perceivedDifficulty: null,
    note: "",
  };
}

function MetacognitiveCheck({ result, mayor, onContinue }) {
  const [data, setData] = useState(emptyMetacognitiveRecord());
  const canContinue = !!data.strategy || data.perceivedDifficulty !== null;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Card style={{ padding: mayor ? 30 : 22 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: "2.2rem", marginBottom: 6 }}>💭</div>
          <h3 style={{ margin: "0 0 4px", fontSize: mayor ? "1.3rem" : "1.05rem" }}>¿Cómo resolviste esta tarea?</h3>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: mayor ? ".95rem" : ".76rem" }}>
            Estas respuestas no cambian tu puntuación.
          </p>
        </div>

        <p style={{ fontWeight: 750, fontSize: mayor ? "1rem" : ".82rem", marginBottom: 8 }}>¿Qué estrategia utilizaste principalmente?</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 7, marginBottom: 16 }}>
          {METACOGNITIVE_STRATEGIES.map(s => (
            <button key={s} type="button" onClick={() => setData(d => ({ ...d, strategy: s }))} style={{
              padding: mayor ? "12px 10px" : "9px 8px", borderRadius: 9,
              border: `1.5px solid ${data.strategy === s ? COLORS.primary : COLORS.border}`,
              background: data.strategy === s ? COLORS.primary+"0C" : COLORS.white,
              color: data.strategy === s ? COLORS.primary : COLORS.textPrimary,
              fontFamily: "inherit", fontSize: mayor ? ".92rem" : ".72rem", cursor: "pointer"
            }}>{s}</button>
          ))}
        </div>

        <p style={{ fontWeight: 750, fontSize: mayor ? "1rem" : ".82rem", marginBottom: 8 }}>¿Tuviste que cambiar de estrategia?</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["Sí",true],["No",false]].map(([label,value]) => (
            <button key={label} type="button" onClick={() => setData(d => ({ ...d, changedStrategy: value }))} style={{
              flex:1,padding: mayor ? 12 : 9,borderRadius:9,
              border:`1.5px solid ${data.changedStrategy===value?COLORS.primary:COLORS.border}`,
              background:data.changedStrategy===value?COLORS.primary+"0C":COLORS.white,
              fontFamily:"inherit",cursor:"pointer"
            }}>{label}</button>
          ))}
        </div>

        <p style={{ fontWeight: 750, fontSize: mayor ? "1rem" : ".82rem", marginBottom: 8 }}>¿Cómo sentiste la dificultad?</p>
        <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
          {[["Fácil",1],["Adecuada",2],["Difícil",3]].map(([label,value]) => (
            <button key={label} type="button" onClick={() => setData(d => ({ ...d, perceivedDifficulty: value }))} style={{
              flex:1,minWidth:100,padding: mayor ? 12 : 9,borderRadius:9,
              border:`1.5px solid ${data.perceivedDifficulty===value?COLORS.primary:COLORS.border}`,
              background:data.perceivedDifficulty===value?COLORS.primary+"0C":COLORS.white,
              fontFamily:"inherit",cursor:"pointer"
            }}>{label}</button>
          ))}
        </div>

        <input
          value={data.note}
          onChange={e => setData(d => ({ ...d, note: e.target.value }))}
          placeholder="¿Qué te ayudó? (opcional)"
          style={{ width:"100%",boxSizing:"border-box",padding:11,borderRadius:9,border:`1px solid ${COLORS.border}`,fontFamily:"inherit",fontSize:mayor?".95rem":".76rem",marginBottom:14 }}
        />

        <div style={{ display:"flex",gap:9 }}>
          <BtnPrimary onClick={() => onContinue(data)} disabled={!canContinue} style={{ flex:2 }}>Continuar →</BtnPrimary>
          <BtnSecondary onClick={() => onContinue(null)} style={{ flex:1 }}>Omitir</BtnSecondary>
        </div>
      </Card>
    </div>
  );
}

function getMetacognitiveSummary(results = []) {
  const rows = results.filter(r => r.metacognition && (r.metacognition.strategy || r.metacognition.perceivedDifficulty !== null));
  if (!rows.length) return null;
  const strategyCounts = {};
  rows.forEach(r => {
    const s = r.metacognition?.strategy;
    if (s) strategyCounts[s] = (strategyCounts[s] || 0) + 1;
  });
  const preferred = Object.entries(strategyCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
  const changed = rows.filter(r => r.metacognition?.changedStrategy === true).length;
  const perceived = rows.map(r => r.metacognition?.perceivedDifficulty).filter(v => typeof v === "number");
  const avgPerceived = perceived.length ? Math.round((perceived.reduce((a,b)=>a+b,0)/perceived.length)*10)/10 : null;
  return {
    recordedExercises: rows.length,
    preferredStrategy: preferred,
    changedStrategyCount: changed,
    averagePerceivedDifficulty: avgPerceived,
  };
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
  const [pendingResult, setPendingResult] = useState(null);
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
    entry.specificMetrics = getExerciseSpecificMetrics(entry);
    const shouldAskMetacognition =
      queue.length <= 4 ||
      cur === queue.length - 1 ||
      cur % 2 === 1 ||
      ["funciones_exec","flexibilidad","razonamiento","memoria_trabajo"].includes(item.domId);

    if (shouldAskMetacognition) {
      setPendingResult(entry);
      setPhase("metacognition");
      return;
    }

    const newResults = [...results, entry];
    setResults(newResults);
    setLastResult(entry);
    if (cur + 1 >= queue.length) {
      setPhase("done");
    } else {
      setPhase("between");
      if (!avanceManual) autoTimer.current = setTimeout(() => siguiente(), 3000);
    }
  };

  const completeMetacognition = (meta) => {
    const completed = { ...pendingResult, metacognition: meta || null };
    const newResults = [...results, completed];
    setResults(newResults);
    setLastResult(completed);
    setPendingResult(null);
    if (cur + 1 >= queue.length) {
      setPhase("done");
    } else {
      setPhase("between");
      if (!avanceManual) autoTimer.current = setTimeout(() => siguiente(), 3000);
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
    const metacognitionSummary = getMetacognitiveSummary(results);
    const sessionBase = {
      numero: sesionNum,
      dataVersion: 6,
      date: new Date().toISOString(),
      gp: globalPct,
      byDom,
      results,
      supportSummary,
      metrics,
      metacognitionSummary,
      intelligentSelectionEnabled: config.seleccionInteligente !== false,
      prescriptionReviewed: !!config.prescriptionReviewed,
      prescriptionReviewedAt: config.prescriptionReviewedAt || null,
      prescriptionVersion: config.therapeuticPrescriptionBlueprint?.version || null,
      prescriptionSourceEvaluationId: config.therapeuticPrescriptionBlueprint?.assessmentEvaluationId || null,
      prescriptionTargetMinutes: config.therapeuticPrescriptionBlueprint?.targetMinutes || null,
      prescriptionDistribution: config.therapeuticPrescriptionBlueprint?.distribution || null,
      professionalOverrideCount: queue.filter(item => item.professionalOverride).length,
      adaptiveEnabled: config.adaptativo !== false,
      taskPreparationMode: config.preparacionTarea || "auto",
      secs: Math.round((Date.now() - t0.current) / 1000)
    };
    const patientWithCurrentSession = {
      ...paciente,
      sesiones:[...(paciente?.sesiones || []),sessionBase],
    };
    const therapeuticFollowUp = buildTherapeuticFollowUpV2(patientWithCurrentSession);
    onFinalizar({
      ...sessionBase,
      therapeuticFollowUp,
      therapeuticFollowUpVersion:THERAPEUTIC_FOLLOWUP_VERSION,
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

  if (phase === "metacognition") return (
    <MetacognitiveCheck
      result={pendingResult}
      mayor={mayor}
      onContinue={completeMetacognition}
    />
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
                <FunctionalTransferCard paciente={paciente} />

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
        <BtnSecondary onClick={() => alert("Para imprimir o guardar como PDF, abre la pestaña Reportes del perfil del paciente.")} style={{ flex: 1 }}>📄 Ir a Reportes para PDF</BtnSecondary>
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
