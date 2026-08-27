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
};

// ─── BANCO DE EJERCICIOS PARA ADULTOS ────────────────────────────────────────
const EX_ADULTO = {
  memoria_trabajo: [
    {
      id: "digits_forward",
      nombre: "Dígitos en orden",
      instruccion: "Escucha la secuencia de números y repítela en el mismo orden",
      nivel: (age) => age > 70 ? 4 : 5,
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const len = 5;
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
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
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
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const len = 4;
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
  ],
  memoria_episodica: [
    {
      id: "word_recall",
      nombre: "Recuerdo de palabras",
      instruccion: "Lee las palabras con atención. Luego deberás recordarlas.",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const WORDS = shuffle(["MANZANA", "CAMISA", "RÍO", "SILLA", "PERRO", "LIBRO", "MESA", "FLOR", "LLAVE", "NUBE", "PAN", "ZAPATO"]).slice(0, 8);
        const [phase, setPhase] = useState("study");
        const [tl, setTl] = useState(20);
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
  ],
  atencion: [
    {
      id: "sustained_attention",
      nombre: "Atención sostenida",
      instruccion: "Toca SOLO los números 3. Ignora todos los demás.",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const TARGET = 3;
        const timeLimit = M ? 120 : 90;
        const [grid] = useState(() => Array.from({ length: M ? 30 : 40 }, () => Math.floor(Math.random() * 9) + 1));
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
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${M ? 6 : 8}, 1fr)`, gap: M ? 8 : 6, marginBottom: 16 }}>
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
          setTimeout(() => onDone({ correct: Math.min(allWords.length, 20), total: 20, errors: Math.max(0, 20 - allWords.length), seconds: 60 }), 500);
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
            const score = avg < 400 ? 5 : avg < 600 ? 4 : avg < 800 ? 3 : avg < 1000 ? 2 : 1;
            onDone({ correct: score, total: 5, errors: 5 - score, seconds: 0, avgMs: avg });
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
  ],
  lenguaje: [
    {
      id: "naming",
      nombre: "Denominación",
      instruccion: "¿Cómo se llama cada cosa? Escribe el nombre y toca Siguiente",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const ITEMS = shuffle([
          { emoji: "⌚", answer: ["reloj", "reloj de pulsera"] },
          { emoji: "✂️", answer: ["tijeras", "tijera"] },
          { emoji: "🌡️", answer: ["termómetro"] },
          { emoji: "🔑", answer: ["llave"] },
          { emoji: "⚓", answer: ["ancla"] },
          { emoji: "🎻", answer: ["violín", "violin"] },
          { emoji: "🌵", answer: ["cactus"] },
          { emoji: "🦦", answer: ["nutria"] },
          { emoji: "🧲", answer: ["imán", "iman"] },
          { emoji: "🪗", answer: ["acordeón", "acordeon"] },
        ]).slice(0, 6);
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
  ],
  percepcion_visual: [
    {
      id: "visual_matching",
      nombre: "Emparejamiento visual",
      instruccion: "Encuentra la figura idéntica al modelo",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const SHAPES = ["🔺", "🔵", "🟥", "⭐", "🔷", "🟡", "🟤", "⬛"];
        const ROUNDS = 6;
        const [data] = useState(() => Array.from({ length: ROUNDS }, () => {
          const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
          const opts = shuffle([target, ...shuffle(SHAPES.filter(s => s !== target)).slice(0, 3)]);
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
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const POOL = ["🐕","🐈","🌹","🎈","⭐","🍎","🏠","🚗","🌙","☀️","🦋","🔑"];
        const ROUNDS = M ? 4 : 6;
        const [data] = useState(() => Array.from({ length: ROUNDS }, () => {
          const target = POOL[Math.floor(Math.random() * POOL.length)];
          const others = POOL.filter(p => p !== target);
          const count = Math.floor(Math.random() * 4) + 2; // 2-5 targets
          const total = M ? 12 : 16;
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 280, margin: "0 auto" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 280, margin: "0 auto" }}>
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
      Component: ({ onDone, paciente }) => {
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
            onDone({ correct: newAnswers.length, total: QUESTIONS.length, errors: 0, seconds: Math.round((Date.now() - t0.current) / 1000), answers: newAnswers });
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
            onDone({ correct: newAns.length, total: QUESTIONS.length, errors: 0, seconds: Math.round((Date.now() - t0.current) / 1000) });
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
            onDone({ correct: newAns.length, total: QUESTIONS.length, errors: 0, seconds: Math.round((Date.now() - t0.current) / 1000) });
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
  // ── Ejercicios adicionales de memoria de trabajo ──
  memoria_trabajo: [
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
          onDone({ correct: ok ? 1 : 0, total: 1, errors: ok ? 0 : 1, seconds: 0 });
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
          onDone({ correct, total: ops.length, errors: ops.length - correct, seconds: 0 });
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
      Component: ({ onDone, modoMayor }) => {
        const EMOJIS = ["🐕","🐈","🌹","🎈","⭐","🍎","🏠","🚗","🌙","☀️"];
        const LEN = 10;
        const [seq] = useState(() => {
          const s = [];
          for (let i = 0; i < LEN; i++) {
            if (i > 0 && Math.random() < 0.4) s.push(s[i-1]);
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
  // ── Ejercicios adicionales de atención ──
  atencion: [
    {
      id: "divided_attention",
      nombre: "Atención dividida",
      instruccion: "Toca solo los números PARES que sean MAYORES que 5",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const [grid] = useState(() => Array.from({ length: 36 }, () => Math.floor(Math.random() * 18) + 1));
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 5, marginBottom: 14 }}>
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
      Component: ({ onDone, modoMayor }) => {
        const ANIMALS = ["🐕","🐈","🐦","🐠","🐇","🦋","🐢","🐄"];
        const OTHERS = ["🌹","🚗","🏠","📚","⌚","🎈","🍎","✂️","🌙","🔑"];
        const [grid] = useState(() => {
          const tc = modoMayor ? 4 : 6, total = modoMayor ? 12 : 16;
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
  // ── Ejercicios adicionales de funciones ejecutivas ──
  funciones_exec: [
    {
      id: "trail_making",
      nombre: "Secuencia alternante",
      instruccion: "Toca en orden alternando: 1-A-2-B-3-C... lo más rápido posible",
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const sequence = ["1","A","2","B","3","C","4","D","5","E"];
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
  // ── Ejercicios adicionales de memoria episódica ──
  memoria_episodica: [
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
  // ── Ejercicios adicionales de velocidad ──
  velocidad_proc: [
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 300, margin: "0 auto" }}>
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
  // ── Ejercicios adicionales de lenguaje ──
  lenguaje: [
    {
      id: "analogias_verbales",
      nombre: "Analogías verbales",
      instruccion: "Completa la analogía eligiendo la palabra correcta",
      Component: ({ onDone, modoMayor }) => {
        const ITEMS = shuffle([
          { enunciado: "El médico cura enfermos, el maestro ___", opts: ["cocina","enseña","construye","maneja"], ans: "enseña" },
          { enunciado: "El pájaro tiene alas, el pez tiene ___", opts: ["patas","escamas","aletas","plumas"], ans: "aletas" },
          { enunciado: "El día tiene sol, la noche tiene ___", opts: ["lluvia","luna","viento","nubes"], ans: "luna" },
          { enunciado: "El zapato va en el pie, el guante va en la ___", opts: ["cabeza","mano","rodilla","espalda"], ans: "mano" },
          { enunciado: "La abeja produce miel, la vaca produce ___", opts: ["lana","leche","huevos","carne"], ans: "leche" },
          { enunciado: "El libro tiene páginas, el cuaderno tiene ___", opts: ["capítulos","hojas","tapas","índice"], ans: "hojas" },
        ]).slice(0, 5);
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 380, margin: "0 auto" }}>
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
      Component: ({ onDone, modoMayor }) => {
        const M = modoMayor || false;
        const ITEMS = shuffle([
          { oracion: "El sol sale por el ___.", ans: "este", opts: ["norte", "sur", "este", "oeste"] },
          { oracion: "El hijo de mi hermana es mi ___.", ans: "sobrino", opts: ["primo", "sobrino", "nieto", "cuñado"] },
          { oracion: "Cuando el río suena, piedras ___.", ans: "lleva", opts: ["trae", "lleva", "mueve", "rompe"] },
          { oracion: "El agua hierve a ___ grados centígrados.", ans: "100", opts: ["50", "75", "100", "120"] },
          { oracion: "El corazón ___ unas 70 veces por minuto.", ans: "late", opts: ["salta", "late", "bombea", "corre"] },
          { oracion: "Los peces respiran con ___.", ans: "branquias", opts: ["pulmones", "branquias", "agallas", "aletas"] },
        ]).slice(0, 5);
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 320, margin: "0 auto" }}>
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

  const curDom = dominios[domIdx];
  const curExs = EX_ADULTO[curDom] || [];
  const curEx = curExs[exIdx];
  const progress = Math.round((domIdx / dominios.length) * 100);

  const handleExDone = (res) => {
    const pct = Math.round((res.correct / res.total) * 100);
    setResults(prev => ({ ...prev, [curDom]: { ...res, pct, exName: curEx?.nombre } }));
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
    const globalPct = Math.round(hist.reduce((a, b) => a + b.pct, 0) / hist.length);
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
                <span style={{ fontWeight: 700, color: gradeColor(r.pct) }}>{r.pct}%</span>
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
  const globalPct = evalData.globalPct || 0;

  // Clasificar áreas
  const debiles = hist.filter(h => h.pct < 60).sort((a, b) => a.pct - b.pct);
  const moderadas = hist.filter(h => h.pct >= 60 && h.pct < 80);
  const fuertes = hist.filter(h => h.pct >= 80);

  return (
    <div>
      {/* Resumen global */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
        <Card style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: gradeColor(globalPct) + "20", border: `4px solid ${gradeColor(globalPct)}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 900, color: gradeColor(globalPct) }}>{globalPct}%</span>
          </div>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>Rendimiento global</p>
          <Badge label={globalPct >= 80 ? "Normal" : globalPct >= 60 ? "Leve" : globalPct >= 40 ? "Moderado" : "Severo"}
            color={gradeColor(globalPct)} />
        </Card>

        <Card>
          <p style={{ fontWeight: 700, marginBottom: 16, fontSize: ".9rem" }}>Rendimiento por dominio</p>
          {hist.map(h => {
            const dom = DOMINIOS_ADULTO[h.id];
            return (
              <div key={h.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: ".82rem", fontWeight: 500 }}>{dom?.emoji} {dom?.label}</span>
                  <span style={{ fontSize: ".82rem", fontWeight: 700, color: gradeColor(h.pct) }}>{h.pct}%</span>
                </div>
                <ProgressBar value={h.pct} color={gradeColor(h.pct)} height={6} />
              </div>
            );
          })}
        </Card>
      </div>

      {/* Áreas de intervención */}
      {debiles.length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.error}30` }}>
          <p style={{ fontWeight: 700, color: COLORS.error, marginBottom: 12 }}>🔴 Áreas prioritarias de intervención</p>
          {debiles.map(h => {
            const dom = DOMINIOS_ADULTO[h.id];
            return (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: ".88rem" }}>{dom?.emoji} {dom?.label}</span>
                <Badge label={`${h.pct}% — Déficit significativo`} color={COLORS.error} />
              </div>
            );
          })}
        </Card>
      )}

      {moderadas.length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.warning}30` }}>
          <p style={{ fontWeight: 700, color: COLORS.warning, marginBottom: 12 }}>🟡 Áreas a trabajar</p>
          {moderadas.map(h => {
            const dom = DOMINIOS_ADULTO[h.id];
            return (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: ".88rem" }}>{dom?.emoji} {dom?.label}</span>
                <Badge label={`${h.pct}% — Dificultad leve`} color={COLORS.warning} />
              </div>
            );
          })}
        </Card>
      )}

      {fuertes.length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.success}30` }}>
          <p style={{ fontWeight: 700, color: COLORS.success, marginBottom: 12 }}>🟢 Áreas preservadas</p>
          {fuertes.map(h => {
            const dom = DOMINIOS_ADULTO[h.id];
            return (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: ".88rem" }}>{dom?.emoji} {dom?.label}</span>
                <Badge label={`${h.pct}% — Rendimiento normal`} color={COLORS.success} />
              </div>
            );
          })}
        </Card>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <BtnPrimary onClick={onIniciarSesion} style={{ flex: 1, padding: 14 }}>
          ▶ Generar plan de rehabilitación
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
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

  // Progreso promedio global
  const promedioGlobal = (() => {
    const conSesiones = pacientes.filter(p => p.sesiones?.length > 0);
    if (!conSesiones.length) return 0;
    const sum = conSesiones.reduce((a, p) => {
      const avg = p.sesiones.reduce((s, ses) => s + (ses.gp || 0), 0) / p.sesiones.length;
      return a + avg;
    }, 0);
    return Math.round(sum / conSesiones.length);
  })();

  // Top 5 pacientes más activos
  const masActivos = [...pacientes]
    .sort((a, b) => (b.sesiones?.length || 0) - (a.sesiones?.length || 0))
    .slice(0, 5);

  // Pacientes que más mejoraron (comparar primera vs última sesión)
  const masProgreso = [...pacientes]
    .filter(p => p.sesiones?.length >= 2)
    .map(p => {
      const primera = p.sesiones[0].gp || 0;
      const ultima = p.sesiones[p.sesiones.length - 1].gp || 0;
      return { ...p, mejora: ultima - primera };
    })
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" label="Pacientes" value={total} sub={`${activos} activos`} color={COLORS.primary} />
        <StatCard icon="📅" label="Sesiones totales" value={totalSesiones} color={COLORS.accent} />
        <StatCard icon="📊" label="Progreso promedio" value={`${promedioGlobal}%`} color={gradeColor(promedioGlobal)} />
        <StatCard icon="🧠" label="Con evaluación" value={conEval} sub={`de ${total} pacientes`} color={COLORS.info} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
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
              <div style={{ width: 36, height: 36, borderRadius: 10, background: gradeColor(s.gp || 0) + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>📅</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: ".85rem" }}>{s.pacienteNombre}</p>
                <p style={{ margin: 0, fontSize: ".72rem", color: COLORS.textMuted }}>Sesión {s.numero} · {new Date(s.date).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, color: gradeColor(s.gp || 0), fontSize: ".9rem" }}>{s.gp || 0}%</span>
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
            const vals = pacientes.filter(p => p.eval?.hist).map(p => p.eval.hist.find(h => h.id === id)?.pct || 0).filter(v => v > 0);
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
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
  const TABS = [
    { id: "info", label: "Información" },
    { id: "hc", label: "Historia Clínica" },
    { id: "perfil-cognitivo", label: "Perfil cognitivo" },
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
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 10, border: "none",
            background: tab === t.id ? COLORS.primary : "transparent",
            color: tab === t.id ? COLORS.white : COLORS.textSecond,
            fontWeight: tab === t.id ? 600 : 400, fontSize: ".82rem", cursor: "pointer", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "info" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <h3 style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 16 }}>Datos generales</h3>
            {[["Nombre", paciente.nombre], ["Edad", `${paciente.edad} años`], ["Email", paciente.email || "—"], ["Teléfono", paciente.telefono || "—"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: ".82rem", color: COLORS.textMuted, fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: ".85rem", color: COLORS.textPrimary }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 16 }}>Información clínica</h3>
            {[["Diagnóstico", paciente.diagnostico || "—"], ["Motivo de consulta", paciente.motivo || "—"], ["Sesiones realizadas", paciente.sesiones?.length || 0], ["Evaluación", paciente.eval ? "✅ Completada" : "⏳ Pendiente"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: ".82rem", color: COLORS.textMuted, fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: ".85rem", color: COLORS.textPrimary }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "hc" && (
        <HistoriaClinicaEditor paciente={paciente} onUpdate={p => { setPac(p); }} />
      )}

      {tab === "perfil-cognitivo" && (
        paciente.eval
          ? <PerfilCognitivoView evalData={paciente.eval} paciente={paciente} onIniciarSesion={() => {}} />
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
                    <td style={{ padding: "12px 16px" }}><span style={{ fontWeight: 700, color: gradeColor(s.gp || 0) }}>{s.gp || 0}%</span></td>
                    <td style={{ padding: "12px 16px", fontSize: ".85rem", color: COLORS.textSecond }}>{fmt(s.secs || 0)}</td>
                    <td style={{ padding: "12px 16px" }}><button style={{ fontSize: ".75rem", color: COLORS.primary, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>Ver reporte</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "progreso" && (
        <Card>
          {paciente.sesiones?.length > 1 ? (
            <div>
              <p style={{ fontWeight: 700, marginBottom: 16 }}>Evolución del rendimiento</p>
              <svg width="100%" height="120" viewBox={`0 0 ${paciente.sesiones.length * 60} 100`} preserveAspectRatio="none">
                <polyline
                  points={paciente.sesiones.map((s, i) => `${i * 60 + 30},${100 - (s.gp || 0)}`).join(" ")}
                  fill="none" stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
                {paciente.sesiones.map((s, i) => (
                  <circle key={i} cx={i * 60 + 30} cy={100 - (s.gp || 0)} r="4" fill={COLORS.primary} />
                ))}
              </svg>
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
                {paciente.sesiones.map((s, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: ".72rem", color: COLORS.textMuted }}>
                    <div style={{ fontWeight: 700, color: gradeColor(s.gp || 0) }}>{s.gp}%</div>
                    <div>S{s.numero}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ color: COLORS.textMuted }}>Se necesitan al menos 2 sesiones para ver el progreso.</p>
            </div>
          )}
        </Card>
      )}

      {tab === "reportes" && (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📄</div>
            <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>Reportes descargables — próximamente</p>
            <BtnSecondary>📥 Generar reporte PDF</BtnSecondary>
          </div>
        </Card>
      )}
    </>
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
  const promedioGlobal = sesiones.length > 0
    ? Math.round(sesiones.reduce((a, s) => a + (s.gp || 0), 0) / sesiones.length)
    : 0;
  const mejora = sesiones.length >= 2
    ? (sesiones[sesiones.length - 1].gp || 0) - (sesiones[0].gp || 0)
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
        <StatCard icon="📊" label="Promedio" value={`${promedioGlobal}%`} color={gradeColor(promedioGlobal)} />
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
              <p style={{ fontSize: "1.5rem", fontWeight: 900, color: gradeColor(ultimaSesion.gp || 0), margin: 0 }}>{ultimaSesion.gp || 0}%</p>
              <p style={{ color: COLORS.textMuted, fontSize: ".75rem", margin: 0 }}>{fmt(ultimaSesion.secs || 0)}</p>
            </div>
          </div>
          {Object.entries(ultimaSesion.byDom || {}).map(([id, d]) => {
            const dom = DOMINIOS_ADULTO[id];
            const pct = Math.round((d.correct / d.total) * 100);
            return (
              <div key={id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: ".78rem" }}>{dom?.emoji} {dom?.label}</span>
                  <span style={{ fontSize: ".78rem", fontWeight: 700, color: gradeColor(pct) }}>{pct}%</span>
                </div>
                <ProgressBar value={pct} color={gradeColor(pct)} height={5} />
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
      {sesiones.length > 1 && (
        <Card style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, marginBottom: 16, fontSize: ".95rem" }}>📈 Mi progreso</p>
          <svg width="100%" height="100" viewBox={`0 0 ${sesiones.length * 50} 80`} preserveAspectRatio="none">
            {[25, 50, 75].map(ref => (
              <line key={ref} x1="0" y1={80 - ref * 0.7} x2={sesiones.length * 50} y2={80 - ref * 0.7}
                stroke={COLORS.border} strokeWidth="1" strokeDasharray="4 4" />
            ))}
            <polyline
              points={sesiones.map((s, i) => `${i * 50 + 25},${80 - (s.gp || 0) * 0.7}`).join(" ")}
              fill="none" stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
            <polygon
              points={[
                ...sesiones.map((s, i) => `${i * 50 + 25},${80 - (s.gp || 0) * 0.7}`),
                `${(sesiones.length - 1) * 50 + 25},80`, `25,80`
              ].join(" ")}
              fill={COLORS.primary + "15"}
            />
            {sesiones.map((s, i) => (
              <circle key={i} cx={i * 50 + 25} cy={80 - (s.gp || 0) * 0.7} r={i === sesiones.length - 1 ? 5 : 3.5}
                fill={i === sesiones.length - 1 ? COLORS.primary : COLORS.primary + "80"} stroke={COLORS.white} strokeWidth="1.5" />
            ))}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {sesiones.map((s, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: ".68rem" }}>
                <div style={{ fontWeight: 700, color: i === sesiones.length - 1 ? COLORS.primary : COLORS.textMuted }}>{s.gp}%</div>
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
    titulo: "Orientación espacial",
    pasos: [
      { icono: "📍", texto: "Se harán preguntas sobre el lugar donde estás" },
      { icono: "🧠", texto: "Piensa bien antes de responder" },
      { icono: "✍️", texto: "Escribe tu respuesta y toca Siguiente" },
    ],
    ejemplo: { muestra: "¿En qué ciudad estás?", respuesta: "Escribe: Barranquilla" }
  },

function DemoScreen({ exId, onContinuar, mayor }) {
  const demo = DEMOS[exId];
  if (!demo) { onContinuar(); return null; }

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

function ConfiguradorSesion({ paciente, onIniciar, onCancelar }) {
  const evalHist = paciente.eval?.hist || [];
  const debiles = evalHist.filter(h => h.pct < 60).sort((a, b) => a.pct - b.pct).map(h => h.id);
  const moderadas = evalHist.filter(h => h.pct >= 60 && h.pct < 80).map(h => h.id);
  const [modo, setModo] = React.useState("auto");
  const [areasSelec, setAreasSelec] = React.useState(debiles.slice(0, 3));
  const [duracion, setDuracion] = React.useState(6);
  const [avanceManual, setAvanceManual] = React.useState(true); // true = paciente toca Siguiente, false = avanza solo
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
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 4 }}>⚙️ Configurar sesión</h2>
        <p style={{ color: COLORS.textMuted, fontSize: ".88rem" }}>{paciente.nombre} · Sesión #{(paciente.sesiones?.length || 0) + 1}</p>
      </Card>

      {/* Modo */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Modo de sesión</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
          {[{ id: "auto", label: "🤖 Automático", desc: "Basado en perfil cognitivo" }, { id: "manual", label: "✍️ Manual", desc: "Elijo las áreas" }].map(m => (
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
            {debiles.length > 0 && <p style={{ fontSize: ".82rem", color: COLORS.textMuted, marginBottom: 10 }}>Priorizando áreas con déficit:</p>}
            {(debiles.length > 0 ? debiles.slice(0, 3) : allDoms.slice(0, 3)).map(id => {
              const dom = DOMINIOS_ADULTO[id];
              const h = evalHist.find(x => x.id === id);
              return (
                <div key={id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: COLORS.error + "08", borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: ".88rem" }}>{dom?.emoji} {dom?.label}</span>
                  {h && <Badge label={`${h.pct}%`} color={gradeColor(h.pct)} />}
                </div>
              );
            })}
            {debiles.length === 0 && <p style={{ color: COLORS.textMuted, fontSize: ".85rem" }}>Se usarán todas las áreas evaluadas.</p>}
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
                  {h && <Badge label={`${h.pct}%`} color={gradeColor(h.pct)} />}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Duración */}
      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Duración</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {DURACIONES.map(d => (
            <button key={d.value} onClick={() => setDuracion(d.value)} style={{ padding: "12px", borderRadius: 12, border: `2px solid ${duracion === d.value ? COLORS.primary : COLORS.border}`, background: duracion === d.value ? COLORS.primary + "10" : COLORS.white, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: duracion === d.value ? COLORS.primary : COLORS.textPrimary }}>{d.label}</div>
              <div style={{ fontSize: ".75rem", color: COLORS.textMuted, marginTop: 2 }}>{d.desc}</div>
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
        <BtnPrimary onClick={() => onIniciar({ modo, areas: modo === "auto" ? (debiles.slice(0, 3).length > 0 ? debiles.slice(0, 3) : allDoms) : areasSelec, duracion, avanceManual, modoMayor: mayor })}
          disabled={modo === "manual" && areasSelec.length === 0}
          style={{ flex: 1, padding: 14, opacity: modo === "manual" && areasSelec.length === 0 ? 0.4 : 1 }}>
          ▶ Iniciar sesión
        </BtnPrimary>
        <BtnSecondary onClick={onCancelar}>Cancelar</BtnSecondary>
      </div>
    </div>
  );
}

function SesionActiva({ paciente, config, sesionNum, onFinalizar, onCancelar }) {
  const mayor = config.modoMayor || false;
  const avanceManual = config.avanceManual !== false; // default true
  const ST = getStyles(mayor);

  // Construir cola de ejercicios según config
  const buildQueue = () => {
    const { areas, duracion } = config;
    const queue = [];
    const domPool = areas.filter(id => EX_ADULTO[id]?.length > 0);
    if (domPool.length === 0) return [];
    let added = 0, idx = 0;
    while (added < duracion) {
      const domId = domPool[idx % domPool.length];
      const exs = EX_ADULTO[domId] || [];
      const ex = exs[Math.floor(Math.random() * exs.length)];
      if (ex) queue.push({ domId, ex, key: `${domId}_${added}` });
      idx++; added++;
    }
    return queue;
  };

  const [queue] = useState(buildQueue);
  const [cur, setCur] = useState(0);
  const [results, setResults] = useState([]);
  const showDemo = config.showDemo || paciente?.showDemo || false;
  const [phase, setPhase] = useState(showDemo ? "demo" : "exercise");
  const [demoSeen, setDemoSeen] = useState(new Set());
  const [lastResult, setLastResult] = useState(null);
  const t0 = useRef(Date.now());
  const autoTimer = useRef();

  // Leer instrucción en voz al montar cada ejercicio
  useEffect(() => {
    if (phase !== "exercise") return;
    const instruccion = queue[cur]?.ex?.instruccion;
    if (instruccion) speakInstruction(instruccion);
    return () => { try { window.speechSynthesis?.cancel(); } catch(e) {} };
  }, [cur, phase]);

  const handleExDone = (res) => {
    const entry = { domId: queue[cur].domId, exId: queue[cur].ex.id, nombre: queue[cur].ex.nombre, ...res, pct: Math.round((res.correct / res.total) * 100) };
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
    // Mostrar demo si está activo y no se ha visto para este ejercicio
    if (showDemo && nextExId && !demoSeen.has(nextExId)) {
      setCur(nextIdx);
      setPhase("demo");
    } else {
      setCur(nextIdx);
      setPhase("exercise");
    }
    setLastResult(null);
  };

  const finalizar = () => {
    const byDom = {};
    results.forEach(r => {
      if (!byDom[r.domId]) byDom[r.domId] = { correct: 0, total: 0, errors: 0, count: 0 };
      byDom[r.domId].correct += r.correct;
      byDom[r.domId].total += r.total;
      byDom[r.domId].errors += r.errors || 0;
      byDom[r.domId].count++;
    });
    const globalPct = results.length > 0 ? Math.round(results.reduce((a, b) => a + b.pct, 0) / results.length) : 0;
    onFinalizar({ numero: sesionNum, date: new Date().toISOString(), gp: globalPct, byDom, results, secs: Math.round((Date.now() - t0.current) / 1000) });
  };

  const progress = Math.round((cur / queue.length) * 100);
  const curItem = queue[cur];
  const curDom = curItem ? DOMINIOS_ADULTO[curItem.domId] : null;
  const ExComp = curItem?.ex?.Component;

  const handleExDone = (res) => {
    const entry = { domId: queue[cur].domId, exId: queue[cur].ex.id, nombre: queue[cur].ex.nombre, ...res, pct: Math.round((res.correct / res.total) * 100) };
    const newResults = [...results, entry];
    setResults(newResults);
    setLastResult(entry);
    if (cur + 1 >= queue.length) {
      setPhase("done");
    } else {
      setPhase("between");
    }
  };

  const siguiente = () => { setCur(c => c + 1); setPhase("exercise"); setLastResult(null); };

  const finalizar = () => {
    const byDom = {};
    results.forEach(r => {
      if (!byDom[r.domId]) byDom[r.domId] = { correct: 0, total: 0, errors: 0, count: 0 };
      byDom[r.domId].correct += r.correct;
      byDom[r.domId].total += r.total;
      byDom[r.domId].errors += r.errors || 0;
      byDom[r.domId].count++;
    });
    const globalPct = results.length > 0 ? Math.round(results.reduce((a, b) => a + b.pct, 0) / results.length) : 0;
    onFinalizar({ numero: sesionNum, date: new Date().toISOString(), gp: globalPct, byDom, results, secs: Math.round((Date.now() - t0.current) / 1000) });
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
          {results.length} ejercicios · {fmt(Math.round((Date.now() - t0.current) / 1000))} · {Math.round(results.reduce((a, b) => a + b.pct, 0) / results.length)}% rendimiento
        </p>
        <div style={{ marginBottom: 24 }}>
          {results.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: ".85rem" }}>{DOMINIOS_ADULTO[r.domId]?.emoji} {r.nombre}</span>
              <span style={{ fontWeight: 700, color: gradeColor(r.pct) }}>{r.pct}%</span>
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
          {lastResult?.pct >= 80 ? "🌟" : lastResult?.pct >= 60 ? "👍" : "💪"}
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: mayor ? "1.4rem" : "1.1rem" }}>
          {lastResult?.pct >= 80 ? "¡Excelente trabajo!" : lastResult?.pct >= 60 ? "¡Bien hecho!" : "¡Sigue adelante!"}
        </h3>
        <p style={{ color: COLORS.textMuted, marginBottom: 6, fontSize: mayor ? "1rem" : ".9rem" }}>{lastResult?.nombre}</p>
        <p style={{ fontSize: mayor ? "2rem" : "1.5rem", fontWeight: 900, color: gradeColor(lastResult?.pct || 0), marginBottom: 24 }}>{lastResult?.pct}%</p>
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
            <p style={{ color: COLORS.textMuted, fontSize: mayor ? ".88rem" : ".75rem", margin: 0 }}>{curItem?.ex?.nombre}</p>
          </div>
        </div>

        {/* Instrucción — más grande en modo mayor */}
        <div style={{ background: COLORS.primary + "08", borderRadius: mayor ? 14 : 10, padding: mayor ? "16px 18px" : "10px 14px", marginBottom: 20, border: `1px solid ${COLORS.primary}15` }}>
          <p style={{ margin: 0, fontSize: mayor ? "1.05rem" : ".85rem", color: COLORS.primary, lineHeight: 1.6, fontWeight: mayor ? 600 : 400 }}>
            📋 {curItem?.ex?.instruccion}
          </p>
          {/* Botón para repetir la instrucción en voz */}
          <button onClick={() => speakInstruction(curItem?.ex?.instruccion)} style={{ marginTop: 8, background: "transparent", border: `1px solid ${COLORS.primary}30`, borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: mayor ? ".85rem" : ".72rem", color: COLORS.primary, fontFamily: "inherit" }}>
            🔊 Repetir instrucción
          </button>
        </div>

        {/* Ejercicio */}
        {ExComp && <ExComp onDone={handleExDone} paciente={paciente} modoMayor={mayor} />}
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
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: COLORS.white, padding: "28px 24px" }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
        <h2 style={{ fontWeight: 800, marginBottom: 4 }}>Sesión {sesion.numero} · {paciente.nombre}</h2>
        <p style={{ opacity: .85, fontSize: ".88rem" }}>{new Date(sesion.date).toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Rendimiento", value: `${sesion.gp}%`, color: gradeColor(sesion.gp) },
          { label: "Ejercicios", value: sesion.results?.length || 0, color: COLORS.primary },
          { label: "Duración", value: fmt(sesion.secs || 0), color: COLORS.accent },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: ".72rem", color: COLORS.textMuted, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 14 }}>Rendimiento por dominio</p>
        {Object.entries(sesion.byDom || {}).map(([id, d]) => {
          const dom = DOMINIOS_ADULTO[id];
          const pct = Math.round((d.correct / d.total) * 100);
          return (
            <div key={id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: ".85rem", fontWeight: 600 }}>{dom?.emoji} {dom?.label}</span>
                <span style={{ fontWeight: 700, color: gradeColor(pct) }}>{pct}%</span>
              </div>
              <ProgressBar value={pct} color={gradeColor(pct)} height={8} />
            </div>
          );
        })}
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 14 }}>Detalle por ejercicio</p>
        {(sesion.results || []).map((r, i) => {
          const dom = DOMINIOS_ADULTO[r.domId];
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: ".85rem" }}>{dom?.emoji} {r.nombre}</p>
                <p style={{ margin: 0, fontSize: ".72rem", color: COLORS.textMuted }}>✅ {r.correct}/{r.total} correctos</p>
              </div>
              <Badge label={`${r.pct}%`} color={gradeColor(r.pct)} />
            </div>
          );
        })}
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

      <BtnPrimary onClick={onVolver} style={{ width: "100%", padding: 14 }}>← Volver al perfil</BtnPrimary>
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
