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

// ─── LOGIN ────────────────────────────────────────────────────────────────────
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

// ─── PERFIL DE PACIENTE ───────────────────────────────────────────────────────
function PerfilPaciente({ paciente, onVolver, profesionalUid }) {
  const [tab, setTab] = useState("info");
  const TABS = [
    { id: "info", label: "Información" },
    { id: "perfil-cognitivo", label: "Perfil cognitivo" },
    { id: "sesiones", label: "Sesiones" },
    { id: "progreso", label: "Progreso" },
    { id: "reportes", label: "Reportes" },
  ];

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
            <BtnPrimary style={{ padding: "8px 16px", fontSize: ".82rem" }}>▶ Iniciar sesión</BtnPrimary>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: COLORS.white, padding: 4, borderRadius: 12, border: `1px solid ${COLORS.border}`, width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 10, border: "none",
            background: tab === t.id ? COLORS.primary : "transparent",
            color: tab === t.id ? COLORS.white : COLORS.textSecond,
            fontWeight: tab === t.id ? 600 : 400, fontSize: ".82rem", cursor: "pointer",
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
            {[["Diagnóstico", paciente.diagnostico || "—"], ["Motivo de consulta", paciente.motivo || "—"], ["Sesiones realizadas", paciente.sesiones?.length || 0], ["Creado", new Date(paciente.creadoEn).toLocaleDateString("es")]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: ".82rem", color: COLORS.textMuted, fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: ".85rem", color: COLORS.textPrimary }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "perfil-cognitivo" && (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🧠</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Perfil cognitivo pendiente</h3>
            <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>Este paciente aún no ha completado la evaluación inicial.</p>
            <BtnPrimary>Iniciar evaluación</BtnPrimary>
          </div>
        </Card>
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
                      <span style={{ fontWeight: 700, color: gradeColor(s.gp || 0) }}>{s.gp || 0}%</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: ".85rem", color: COLORS.textSecond }}>{fmt(s.secs || 0)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button style={{ fontSize: ".75rem", color: COLORS.primary, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>Ver reporte</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "progreso" && (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📈</div>
            <p style={{ color: COLORS.textMuted }}>Los gráficos de progreso estarán disponibles cuando el paciente tenga sesiones registradas.</p>
          </div>
        </Card>
      )}

      {tab === "reportes" && (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📄</div>
            <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>Los reportes descargables estarán disponibles próximamente.</p>
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
