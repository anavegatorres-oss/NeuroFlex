import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc, query, where, orderBy, addDoc, updateDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";

// ─── FIREBASE CONFIG ───────────────────────────────────────────────────────────
// TODO: Reemplazar con las credenciales del proyecto Firebase de NeuroFlex
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
      Component: ({ onDone }) => {
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
            <p style={{ color: COLORS.textMuted, marginBottom: 16 }}>Memoriza esta secuencia · {tl}s</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {seq.map((n, i) => <div key={i} style={{ width: 52, height: 52, borderRadius: 12, background: COLORS.primary + "22", border: `2px solid ${COLORS.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 800, color: COLORS.primary }}>{n}</div>)}
            </div>
          </div>
        );
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontWeight: 600, marginBottom: 16 }}>Escribe la secuencia en orden</p>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && check()}
              placeholder="Ej: 3 7 2 8 4" autoFocus
              style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: "1.1rem", textAlign: "center", width: "100%", maxWidth: 280, marginBottom: 16 }} />
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
      Component: ({ onDone }) => {
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
            <p style={{ color: COLORS.textMuted, marginBottom: 16 }}>Memoriza esta secuencia · {tl}s</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {seq.map((n, i) => <div key={i} style={{ width: 52, height: 52, borderRadius: 12, background: COLORS.primary + "22", border: `2px solid ${COLORS.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 800, color: COLORS.primary }}>{n}</div>)}
            </div>
          </div>
        );
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Escríbelos al <span style={{ color: COLORS.error }}>revés</span></p>
            <p style={{ color: COLORS.textMuted, fontSize: ".85rem", marginBottom: 16 }}>Si viste 3-7-2, escribe 2-7-3</p>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && check()}
              placeholder="Secuencia invertida" autoFocus
              style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: "1.1rem", textAlign: "center", width: "100%", maxWidth: 280, marginBottom: 16 }} />
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
      Component: ({ onDone }) => {
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
            <p style={{ color: COLORS.textMuted, marginBottom: 16 }}>Lee y memoriza estas palabras · {tl}s</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 360, margin: "0 auto" }}>
              {WORDS.map((w, i) => <div key={i} style={{ padding: "8px 16px", background: COLORS.primary + "15", border: `1.5px solid ${COLORS.primary}30`, borderRadius: 20, fontWeight: 600, color: COLORS.primary }}>{w}</div>)}
            </div>
          </div>
        );
        if (phase === "distract") return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>Tarea de distracción</p>
            <p style={{ color: COLORS.textMuted, marginBottom: 16 }}>Cuenta hacia atrás desde 20 en voz alta · {distTl}s</p>
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
      Component: ({ onDone }) => {
        const TARGET = 3;
        const [grid] = useState(() => Array.from({ length: 40 }, () => Math.floor(Math.random() * 9) + 1));
        const [tapped, setTapped] = useState(new Set());
        const [wrong, setWrong] = useState(new Set());
        const [done, setDone] = useState(false);
        const totalTargets = grid.filter(n => n === TARGET).length;
        const tap = (i) => {
          if (done) return;
          if (grid[i] === TARGET) {
            const n = new Set([...tapped, i]);
            setTapped(n);
            if (n.size === totalTargets) {
              setDone(true);
              setTimeout(() => onDone({ correct: n.size, total: totalTargets, errors: wrong.size, seconds: 0 }), 600);
            }
          } else {
            setWrong(w => new Set([...w, i]));
          }
        };
        return (
          <div>
            <p style={{ color: COLORS.textMuted, marginBottom: 4, fontSize: ".88rem" }}>Toca todos los <strong style={{ color: COLORS.error }}>3</strong> · {tapped.size}/{totalTargets} encontrados</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, marginBottom: 16 }}>
              {grid.map((n, i) => (
                <button key={i} onClick={() => tap(i)} style={{
                  aspectRatio: "1", borderRadius: 8, border: "1.5px solid",
                  fontWeight: 700, fontSize: ".95rem", cursor: "pointer",
                  borderColor: tapped.has(i) ? COLORS.success : wrong.has(i) ? COLORS.error : COLORS.border,
                  background: tapped.has(i) ? COLORS.success + "20" : wrong.has(i) ? COLORS.error + "20" : COLORS.bg,
                  color: tapped.has(i) ? COLORS.success : wrong.has(i) ? COLORS.error : COLORS.textPrimary,
                }}>
                  {n}
                </button>
              ))}
            </div>
            {done && <p style={{ color: COLORS.success, fontWeight: 700, textAlign: "center" }}>✅ ¡Completado!</p>}
            {!done && <BtnSecondary onClick={() => onDone({ correct: tapped.size, total: totalTargets, errors: wrong.size, seconds: 0 })} style={{ width: "100%", fontSize: ".85rem" }}>Terminar</BtnSecondary>}
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
      Component: ({ onDone }) => {
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
            <BtnPrimary onClick={start}>▶ Comenzar</BtnPrimary>
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
      Component: ({ onDone }) => {
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
              width: 160, height: 160, borderRadius: "50%", border: "none", cursor: phase === "go" ? "pointer" : "default",
              background: phase === "go" ? COLORS.success : phase === "wait" ? COLORS.error + "40" : COLORS.textLight,
              transition: "background .1s", fontSize: "1rem", fontWeight: 700,
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
      instruccion: "¿Cómo se llama cada cosa? Escribe el nombre",
      Component: ({ onDone }) => {
        const ITEMS = shuffle([
          { emoji: "⌚", answer: ["reloj", "reloj de pulsera"] },
          { emoji: "✂️", answer: ["tijeras", "tijera"] },
          { emoji: "🌡️", answer: ["termómetro"] },
          { emoji: "🔑", answer: ["llave"] },
          { emoji: "⚓", answer: ["ancla"] },
          { emoji: "🎻", answer: ["violín", "violin"] },
          { emoji: "🌵", answer: ["cactus"] },
          { emoji: "🦦", answer: ["nutria"] },
        ]).slice(0, 6);
        const [cur, setCur] = useState(0);
        const [input, setInput] = useState("");
        const [score, setScore] = useState(0);
        const t0 = useRef(Date.now());
        const check = () => {
          const ok = ITEMS[cur].answer.includes(input.toLowerCase().trim());
          if (ok) setScore(s => s + 1);
          if (cur + 1 >= ITEMS.length) {
            const ns = score + (ok ? 1 : 0);
            onDone({ correct: ns, total: ITEMS.length, errors: ITEMS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
          } else { setCur(c => c + 1); setInput(""); }
        };
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16 }}>{cur + 1} / {ITEMS.length}</p>
            <div style={{ fontSize: "5rem", marginBottom: 20 }}>{ITEMS[cur].emoji}</div>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && check()}
              placeholder="¿Cómo se llama?" autoFocus
              style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: "1rem", textAlign: "center", width: "100%", maxWidth: 280, marginBottom: 16 }} />
            <br />
            <BtnPrimary onClick={check}>Siguiente →</BtnPrimary>
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
      Component: ({ onDone }) => {
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
  ],
  orientacion: [
    {
      id: "temporal_orientation",
      nombre: "Orientación temporal",
      instruccion: "Responde las siguientes preguntas sobre el tiempo y lugar",
      Component: ({ onDone }) => {
        const now = new Date();
        const QUESTIONS = [
          { q: "¿En qué año estamos?", answer: String(now.getFullYear()) },
          { q: "¿En qué mes estamos?", answer: String(now.getMonth() + 1), hint: `(${now.toLocaleString("es", { month: "long" })})` },
          { q: "¿Qué día del mes es hoy?", answer: String(now.getDate()) },
          { q: "¿Qué día de la semana es hoy?", answer: now.toLocaleString("es", { weekday: "long" }).toLowerCase() },
          { q: "¿En qué estación del año estamos?", answer: (() => { const m = now.getMonth() + 1; return m >= 3 && m <= 5 ? "primavera" : m >= 6 && m <= 8 ? "verano" : m >= 9 && m <= 11 ? "otoño" : "invierno"; })() },
        ];
        const [cur, setCur] = useState(0);
        const [input, setInput] = useState("");
        const [score, setScore] = useState(0);
        const t0 = useRef(Date.now());
        const check = () => {
          const ok = input.toLowerCase().trim() === QUESTIONS[cur].answer.toLowerCase();
          if (ok) setScore(s => s + 1);
          if (cur + 1 >= QUESTIONS.length) {
            const ns = score + (ok ? 1 : 0);
            onDone({ correct: ns, total: QUESTIONS.length, errors: QUESTIONS.length - ns, seconds: Math.round((Date.now() - t0.current) / 1000) });
          } else { setCur(c => c + 1); setInput(""); }
        };
        const q = QUESTIONS[cur];
        return (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: COLORS.textMuted, marginBottom: 16 }}>{cur + 1}/{QUESTIONS.length}</p>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 8 }}>{q.q}</p>
            {q.hint && <p style={{ color: COLORS.textMuted, fontSize: ".82rem", marginBottom: 12 }}>{q.hint}</p>}
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && check()}
              placeholder="Tu respuesta..." autoFocus
              style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${COLORS.border}`, fontSize: "1rem", textAlign: "center", width: "100%", maxWidth: 280, marginBottom: 16 }} />
            <br />
            <BtnPrimary onClick={check}>Siguiente →</BtnPrimary>
          </div>
        );
      }
    },
  ],
};

// ─── EVALUACIÓN COGNITIVA ADULTOS ─────────────────────────────────────────────
function EvaluacionAdulto({ paciente, onFinish, onCancel }) {
  const dominios = Object.keys(DOMINIOS_ADULTO);
  const [domIdx, setDomIdx] = useState(0);
  const [exIdx, setExIdx] = useState(0);
  const [results, setResults] = useState({});
  const [phase, setPhase] = useState("intro"); // intro | exercise | done
  const t0 = useRef(Date.now());

  const curDom = dominios[domIdx];
  const curExs = EX_ADULTO[curDom] || [];
  const curEx = curExs[exIdx];
  const progress = Math.round((domIdx / dominios.length) * 100);

  const handleExDone = (res) => {
    const pct = Math.round((res.correct / res.total) * 100);
    setResults(prev => ({
      ...prev,
      [curDom]: { ...res, pct, exName: curEx?.nombre }
    }));
    // Siguiente dominio
    if (domIdx + 1 >= dominios.length) {
      setPhase("done");
    } else {
      setDomIdx(d => d + 1);
      setExIdx(0);
    }
  };

  const finishEval = () => {
    const hist = Object.entries(results).map(([id, r]) => ({ id, ...r }));
    const globalPct = Math.round(hist.reduce((a, b) => a + b.pct, 0) / hist.length);
    onFinish({ hist, globalPct, date: new Date().toISOString(), seconds: Math.round((Date.now() - t0.current) / 1000) });
  };

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
          <BtnPrimary onClick={() => setPhase("exercise")} style={{ flex: 1, padding: 14 }}>▶ Comenzar evaluación</BtnPrimary>
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

  const cargar = async () => {
    const snap = await getDocs(collection(firestore, "profesionales"));
    setProfesionales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { cargar(); }, []);

  const crearProfesional = async () => {
    if (!form.nombre || !form.email || !form.password) { setError("Completa todos los campos obligatorios."); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
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
              {["Profesional", "Especialidad", "Centro", "Estado", ""].map((h, i) => (
                <th key={i} style={{ padding: "12px 20px", textAlign: "left", fontSize: ".75rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: .5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profesionales.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: COLORS.textMuted }}>No hay profesionales registrados aún.</td></tr>
            ) : profesionales.map((p, i) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
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
                <td style={{ padding: "14px 20px" }}>
                  <button style={{ fontSize: ".75rem", color: COLORS.textMuted, background: "transparent", border: "none", cursor: "pointer" }}>Editar</button>
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
  const [stats, setStats] = useState({ total: 0, activos: 0, sesionesHoy: 0 });

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(firestore, "pacientes"), where("profesionalId", "==", user.uid)));
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPacientes(lista);
        setStats({ total: lista.length, activos: lista.filter(p => p.activo).length, sesionesHoy: 0 });
      } catch(e) {}
    })();
  }, []);

  return (
    <>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
        <StatCard icon="👥" label="Mis pacientes" value={stats.total} color={COLORS.primary} />
        <StatCard icon="✅" label="Pacientes activos" value={stats.activos} color={COLORS.accent} />
        <StatCard icon="📅" label="Sesiones hoy" value={stats.sesionesHoy} color={COLORS.warning} />
      </div>

      {/* Pacientes recientes */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Mis pacientes recientes</h3>
        </div>
        {pacientes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 10 }}>👥</div>
            <p style={{ color: COLORS.textMuted }}>Aún no tienes pacientes registrados.</p>
            <p style={{ color: COLORS.textMuted, fontSize: ".85rem" }}>Ve a "Mis pacientes" para agregar el primero.</p>
          </div>
        ) : pacientes.slice(0, 5).map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={p.nombre} size={38} />
              <div>
                <p style={{ fontWeight: 600, fontSize: ".9rem", margin: 0 }}>{p.nombre}</p>
                <p style={{ color: COLORS.textMuted, fontSize: ".75rem", margin: 0 }}>{p.diagnostico || "Sin diagnóstico"} · {p.edad} años</p>
              </div>
            </div>
            <Badge label={p.activo ? "Activo" : "Inactivo"} color={p.activo ? COLORS.success : COLORS.textMuted} />
          </div>
        ))}
      </Card>
    </>
  );
}

// ─── GESTIÓN PACIENTES (PROFESIONAL) ─────────────────────────────────────────
function GestionPacientes({ user, onVerPaciente }) {
  const [pacientes, setPacientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ nombre: "", edad: "", diagnostico: "", motivo: "", email: "", telefono: "" });
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    try {
      const snap = await getDocs(query(collection(firestore, "pacientes"), where("profesionalId", "==", user.uid)));
      setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn)));
    } catch(e) {}
  };

  useEffect(() => { cargar(); }, []);

  const crearPaciente = async () => {
    if (!form.nombre || !form.edad) return;
    setLoading(true);
    try {
      await addDoc(collection(firestore, "pacientes"), {
        nombre: form.nombre, edad: parseInt(form.edad),
        diagnostico: form.diagnostico, motivo: form.motivo,
        email: form.email, telefono: form.telefono,
        profesionalId: user.uid, activo: true,
        creadoEn: new Date().toISOString(),
        sesiones: [], plan: null, eval: null,
      });
      setShowForm(false);
      setForm({ nombre: "", edad: "", diagnostico: "", motivo: "", email: "", telefono: "" });
      await cargar();
    } catch(e) {}
    setLoading(false);
  };

  const filtrados = pacientes.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <>
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

function PerfilPaciente({ paciente: pacienteInit, onVolver, profesionalUid }) {
  const [paciente, setPaciente] = useState(pacienteInit);
  const [tab, setTab] = useState("info");
  const [showEval, setShowEval] = useState(false);
  const TABS = [
    { id: "info", label: "Información" },
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
          <div style={{ display: "flex", gap: 10 }}>
            <Badge label={paciente.activo ? "Activo" : "Inactivo"} color={paciente.activo ? COLORS.success : COLORS.textMuted} />
            {paciente.eval
              ? <BtnPrimary style={{ padding: "8px 16px", fontSize: ".82rem" }}>▶ Iniciar sesión</BtnPrimary>
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
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <Card style={{ marginBottom: 20, textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: "3rem", marginBottom: 10 }}>👋</div>
        <h2 style={{ fontWeight: 700, fontSize: "1.3rem", marginBottom: 6 }}>¡Hola, {user.nombre?.split(" ")[0] || "paciente"}!</h2>
        <p style={{ color: COLORS.textMuted }}>Bienvenido a tu espacio de entrenamiento cognitivo.</p>
      </Card>
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1rem" }}>Sesión del día</h3>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ color: COLORS.textMuted, marginBottom: 16 }}>Tu terapeuta configurará tu programa de ejercicios. Cuando esté listo, aparecerá aquí.</p>
          <BtnPrimary disabled style={{ opacity: 0.5 }}>Comenzar sesión</BtnPrimary>
        </div>
      </Card>
      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1rem" }}>Mi progreso</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[["0", "Sesiones"], ["0 min", "Tiempo total"], ["—", "Última sesión"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center", padding: "14px 10px", background: COLORS.bg, borderRadius: 12 }}>
              <p style={{ fontSize: "1.4rem", fontWeight: 800, color: COLORS.primary, margin: "0 0 4px" }}>{v}</p>
              <p style={{ fontSize: ".72rem", color: COLORS.textMuted, margin: 0 }}>{l}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
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
          <PerfilPaciente
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
