
import React, { useMemo, useState } from "react";

const COLORS = {
  gold: "#C99A2E",
  goldSoft: "#F5EBD2",
  goldDeep: "#A77613",
  black: "#121212",
  graphite: "#1C1C1C",
  silver: "#A7ABB2",
  line: "#E7E7E7",
  text: "#1D1D1F",
  muted: "#777B82",
  bg: "#F7F7F5",
  white: "#FFFFFF",
};

const services = {
  "Cita inicial": { bg: "#E7F3DE", border: "#9BCB7C", text: "#315723" },
  "Seguimiento": { bg: "#E7F3DE", border: "#9BCB7C", text: "#315723" },
  "Socialización": { bg: "#E7F3DE", border: "#9BCB7C", text: "#315723" },
  "Neurofeedback": { bg: "#E2EFF9", border: "#8CB8DD", text: "#244E6E" },
  "Sesión de EMT": { bg: "#FCE4E1", border: "#E98C80", text: "#7D3028" },
  "Psicoterapia": { bg: "#EEE6F8", border: "#B69ADC", text: "#5A397F" },
  "Estimulación Cognitiva": { bg: "#E0F4F6", border: "#8ACED2", text: "#2F6870" },
  "Adaptación": { bg: "#FBE3EC", border: "#E9A0B8", text: "#7B3751" },
  "Mapeo": { bg: "#FBF1D8", border: "#E4BA5B", text: "#6D4D09" },
  "Reunión de Equipo": { bg: "#E9EEF2", border: "#A7BAC8", text: "#40515D" },
  "Ausencia / Bloqueo": { bg: "#ECECEC", border: "#B9B9B9", text: "#4E4E4E" },
};

const appointments = [
  { id: 1, day: 0, start: 8, duration: 1, service: "Cita inicial", patient: "Juan Camilo R.", professional: "Ana Martínez", mode: "Presencial" },
  { id: 2, day: 0, start: 10, duration: 1, service: "Neurofeedback", patient: "María López", professional: "Laura Padilla", mode: "Presencial" },
  { id: 3, day: 0, start: 12, duration: 1, service: "Psicoterapia", patient: "Carolina Mejía", professional: "Ana Martínez", mode: "Presencial" },
  { id: 4, day: 0, start: 14, duration: 1, service: "Estimulación Cognitiva", patient: "Andrés Silva", professional: "Jorge Salcedo", mode: "Presencial" },
  { id: 5, day: 0, start: 16, duration: 2, service: "Ausencia / Bloqueo", patient: "Ana Martínez", professional: "Ana Martínez", mode: "Permiso personal" },

  { id: 6, day: 1, start: 8, duration: 1.5, service: "Mapeo", patient: "Carlos Ramírez", professional: "Laura Padilla", mode: "Presencial" },
  { id: 7, day: 1, start: 10, duration: 1, service: "Sesión de EMT", patient: "Laura Torres", professional: "Jorge Salcedo", mode: "Presencial" },
  { id: 8, day: 1, start: 12, duration: 1, service: "Seguimiento", patient: "María López", professional: "Ana Martínez", mode: "Virtual" },
  { id: 9, day: 1, start: 15, duration: 1, service: "Adaptación", patient: "Samuel Vega", professional: "Ana Martínez", mode: "Presencial" },
  { id: 10, day: 1, start: 17, duration: 1, service: "Reunión de Equipo", patient: "Equipo Barranquilla", professional: "Equipo", mode: "Presencial" },

  { id: 11, day: 2, start: 8.5, duration: 1, service: "Neurofeedback", patient: "Juan Camilo R.", professional: "Laura Padilla", mode: "Presencial" },
  { id: 12, day: 2, start: 10, duration: 1, service: "Socialización", patient: "María López", professional: "Ana Martínez", mode: "Virtual" },
  { id: 13, day: 2, start: 11.5, duration: 1, service: "Seguimiento", patient: "Carlos Ramírez", professional: "Ana Martínez", mode: "Virtual" },
  { id: 14, day: 2, start: 14, duration: 1, service: "Psicoterapia", patient: "Daniela Vargas", professional: "Ana Martínez", mode: "Presencial" },
  { id: 15, day: 2, start: 16, duration: 1, service: "Neurofeedback", patient: "Laura Torres", professional: "Jorge Salcedo", mode: "Presencial" },

  { id: 16, day: 3, start: 8, duration: 1, service: "Sesión de EMT", patient: "Andrés Silva", professional: "Jorge Salcedo", mode: "Presencial" },
  { id: 17, day: 3, start: 10, duration: 1, service: "Seguimiento", patient: "Laura Torres", professional: "Ana Martínez", mode: "Virtual" },
  { id: 18, day: 3, start: 12, duration: 1.5, service: "Mapeo", patient: "Samuel Vega", professional: "Laura Padilla", mode: "Presencial" },
  { id: 19, day: 3, start: 15, duration: 1, service: "Estimulación Cognitiva", patient: "Daniela Vargas", professional: "Jorge Salcedo", mode: "Presencial" },
  { id: 20, day: 3, start: 17, duration: 1, service: "Cita inicial", patient: "María López", professional: "Ana Martínez", mode: "Presencial" },

  { id: 21, day: 4, start: 8.5, duration: 1, service: "Neurofeedback", patient: "Carlos Ramírez", professional: "Laura Padilla", mode: "Presencial" },
  { id: 22, day: 4, start: 11, duration: 1, service: "Socialización", patient: "Juan Camilo R.", professional: "Ana Martínez", mode: "Virtual" },
  { id: 23, day: 4, start: 14, duration: 1, service: "Adaptación", patient: "María López", professional: "Ana Martínez", mode: "Presencial" },
  { id: 24, day: 4, start: 16.5, duration: 1, service: "Neurofeedback", patient: "Daniela Vargas", professional: "Jorge Salcedo", mode: "Presencial" },
  { id: 25, day: 4, start: 18, duration: 1, service: "Socialización", patient: "Valentina Suárez", professional: "Ana Martínez", mode: "Virtual" },

  { id: 26, day: 5, start: 9, duration: 1.5, service: "Reunión de Equipo", patient: "Equipo Barranquilla", professional: "Equipo", mode: "Presencial" },
];

const menu = [
  ["Inicio", "home"],
  ["Agenda", "calendar"],
  ["Pacientes", "person"],
  ["Neurofeedback", "brain"],
  ["Psicología", "psi"],
  ["EMT", "pulse"],
  ["Estimulación Cognitiva", "puzzle"],
  ["Documentos", "folder"],
  ["Profesionales", "group"],
  ["Sedes", "pin"],
  ["Reportes", "chart"],
  ["Administración", "gear"],
  ["Configuración", "sliders"],
];

const iconPaths = {
  home: "M3 11.5 12 4l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  calendar: "M6 2v3M18 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  brain: "M9 4a4 4 0 0 0-4 4v1a4 4 0 0 0 0 7v1a4 4 0 0 0 4 4m6-17a4 4 0 0 1 4 4v1a4 4 0 0 1 0 7v1a4 4 0 0 1-4 4M9 4v16M15 4v16",
  psi: "M12 3v18M6 4c0 4 2 7 6 7m6-7c0 4-2 7-6 7",
  pulse: "M3 12h4l2-5 4 10 2-5h6",
  puzzle: "M8 3h5v4a2 2 0 1 0 4 0V3h4v6h-4a2 2 0 1 0 0 4h4v8h-8v-4a2 2 0 1 0-4 0v4H3v-8h4a2 2 0 1 0 0-4H3V3z",
  folder: "M3 6h7l2 2h9v12H3z",
  group: "M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6M2 21a6 6 0 0 1 12 0m2-7a5 5 0 0 1 6 5",
  pin: "M12 22s7-6.2 7-13a7 7 0 1 0-14 0c0 6.8 7 13 7 13Zm0-10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  gear: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12 1 2.1 2.3.4 1.6-1.6 2.7 2.7-1.6 1.6.4 2.3 2.1 1v4l-2.1 1-.4 2.3 1.6 1.6-2.7 2.7-1.6-1.6-2.3.4-1 2.1H8l-1-2.1-2.3-.4-1.6 1.6-2.7-2.7 1.6-1.6L1.6 14l-2.1-1V9l2.1-1 .4-2.3L.4 4.1 3.1 1.4 4.7 3l2.3-.4L8 .5h4Z",
  sliders: "M4 5h16M7 5v4M4 12h16m-5 0v4M4 19h16M10 19v-4",
};

function Icon({ name, size = 22, stroke = "currentColor" }) {
  const d = iconPaths[name] || iconPaths.calendar;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Logo() {
  return (
    <div className="logo">
      <div className="logoMark">
        <div className="yin yinA" />
        <div className="yin yinB" />
      </div>
      <div>
        <div className="logoNeuro">Neuro</div>
        <div className="logoCoaching">Coaching</div>
        <div className="logoSub">GESTIÓN CLÍNICA</div>
      </div>
    </div>
  );
}

function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">
      <Logo />
      <div className="menu">
        {menu.map(([label, icon]) => (
          <button
            key={label}
            className={`menuItem ${active === label ? "active" : ""}`}
            onClick={() => setActive(label)}
          >
            <Icon name={icon} size={21} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="sidebarBottom">
        <div className="smallLabel">SEDE ACTUAL</div>
        <div className="locationRow">
          <div className="buildingIcon">▥</div>
          <div>
            <strong>Barranquilla</strong>
          </div>
          <span className="chev">⌄</span>
        </div>

        <div className="userCard">
          <div className="avatar">AM</div>
          <div className="userText">
            <strong>Ana Martínez</strong>
            <span>Psicóloga</span>
          </div>
          <span className="chev">⌄</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ active }) {
  return (
    <div className="topbar">
      <div className="titleBlock">
        <div className="titleLine">
          <Icon name={active === "Agenda" ? "calendar" : "home"} size={28} />
          <h1>{active}</h1>
        </div>
        <p>
          {active === "Agenda"
            ? "Organiza y gestiona citas y actividades de tu sede."
            : "Resumen general de la operación clínica de Neurocoaching."}
        </p>
      </div>

      <div className="topActions">
        <div className="selectBox">
          <span>Sede</span>
          <strong>Barranquilla</strong>
          <span>⌄</span>
        </div>
        <button className="primaryBtn">＋ Nueva cita</button>
        <button className="iconBtn">✉</button>
        <button className="iconBtn hasDot">♢<span>3</span></button>
        <div className="topAvatar">AM</div>
      </div>
    </div>
  );
}

const days = [
  ["Lun", "5"],
  ["Mar", "6"],
  ["Mié", "7"],
  ["Jue", "8"],
  ["Vie", "9"],
  ["Sáb", "10"],
  ["Dom", "11"],
];

const hours = Array.from({ length: 12 }, (_, i) => i + 7);

function fmtHour(h) {
  const hour = Math.floor(h);
  const mins = Math.round((h - hour) * 60);
  const ampm = hour < 12 ? "AM" : "PM";
  const display = hour > 12 ? hour - 12 : hour;
  return `${display}:${String(mins).padStart(2, "0")} ${ampm}`;
}

function CalendarEvent({ item, onClick, selected }) {
  const s = services[item.service];
  const top = (item.start - 7) * 64 + 4;
  const height = Math.max(item.duration * 64 - 8, 48);
  const blocked = item.service === "Ausencia / Bloqueo";
  return (
    <button
      className={`calendarEvent ${blocked ? "blocked" : ""} ${selected ? "selectedEvent" : ""}`}
      style={{
        top,
        height,
        background: s.bg,
        borderColor: s.border,
        color: s.text,
      }}
      onClick={() => onClick(item)}
    >
      <strong>{item.service}</strong>
      <span>{item.patient}</span>
      <small>{fmtHour(item.start)} – {fmtHour(item.start + item.duration)}</small>
      {item.mode === "Virtual" && <span className="virtualTag">▣ Virtual</span>}
    </button>
  );
}

function DetailPanel({ selected, onClose }) {
  const item = selected || appointments[12];
  const service = services[item.service];
  return (
    <aside className="detailPanel">
      <div className="detailHead">
        <h3>Detalle de la cita</h3>
        <button onClick={onClose}>×</button>
      </div>

      <div className="detailPills">
        <span style={{ background: service.bg, color: service.text }}>{item.service}</span>
        <span className="statusPill">Programada</span>
      </div>

      <div className="patientBlock">
        <div className="patientAvatar">{item.patient.split(" ").map(x => x[0]).slice(0,2).join("")}</div>
        <div>
          <strong>{item.patient}</strong>
          <span>CC 1.045.678.901 · 31 años</span>
        </div>
        <span>›</span>
      </div>

      <div className="detailList">
        <div><span>▣</span><p>Miércoles, 7 de mayo de 2026</p></div>
        <div><span>◷</span><p>{fmtHour(item.start)} – {fmtHour(item.start + item.duration)} ({item.duration} h)</p></div>
        <div><span>▢</span><p>{item.mode === "Virtual" ? "Virtual (Google Meet)" : item.mode}</p></div>
        {item.mode === "Virtual" && (
          <div><span>↗</span><p className="linkText">meet.google.com/abc-defg-hij</p></div>
        )}
        <div><span>♙</span><p>{item.professional}</p></div>
        <div><span>⌂</span><p>Barranquilla</p></div>
        <div><span>⌑</span><p>{item.service === "Seguimiento" ? "Seguimiento cada 10 sesiones" : "Cita clínica programada"}</p></div>
      </div>

      <div className="divider" />

      <h4>Acciones</h4>
      <div className="actionGrid">
        <button className="goldAction">▷ Iniciar sesión</button>
        <button>✎ Editar cita</button>
        <button>▣ Reprogramar</button>
        <button>⊗ Cancelar cita</button>
      </div>
      <button className="wideAction">⌁ Enviar recordatorio</button>

      <div className="reminderCard">
        <div className="reminderTitle">
          <strong>Recordatorios programados</strong>
          <button>Editar</button>
        </div>
        <div className="reminderRow"><span>✉</span><p>24 horas antes</p><small>06/05/2026 · 11:30 AM</small></div>
        <div className="reminderRow"><span>✉</span><p>2 horas antes</p><small>07/05/2026 · 9:30 AM</small></div>
        <div className="successBox">✓ El paciente recibirá un correo con el recordatorio{item.mode === "Virtual" ? " y el enlace de acceso." : "."}</div>
      </div>
    </aside>
  );
}

function Agenda() {
  const [selected, setSelected] = useState(appointments[12]);
  const [serviceFilter, setServiceFilter] = useState("Todos");
  const [professionalFilter, setProfessionalFilter] = useState("Todos");

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const sOk = serviceFilter === "Todos" || a.service === serviceFilter;
      const pOk = professionalFilter === "Todos" || a.professional === professionalFilter;
      return sOk && pOk;
    });
  }, [serviceFilter, professionalFilter]);

  return (
    <div className="agendaLayout">
      <section className="agendaCard">
        <div className="toolbar">
          <div className="toolbarGroup">
            <label>Vista<select><option>Semana</option></select></label>
            <button className="navBtn">←</button>
            <button className="dateBtn">▣ &nbsp; 5 – 11 Mayo 2026</button>
            <button className="navBtn">→</button>
          </div>

          <div className="toolbarGroup">
            <label>Profesional
              <select value={professionalFilter} onChange={e=>setProfessionalFilter(e.target.value)}>
                <option>Todos</option>
                <option>Ana Martínez</option>
                <option>Laura Padilla</option>
                <option>Jorge Salcedo</option>
                <option>Equipo</option>
              </select>
            </label>
            <label>Servicio
              <select value={serviceFilter} onChange={e=>setServiceFilter(e.target.value)}>
                <option>Todos</option>
                {Object.keys(services).map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>Estado<select><option>Todos</option><option>Programada</option><option>Confirmada</option></select></label>
            <button className="filterBtn">☷ Filtros</button>
          </div>
        </div>

        <div className="calendarModeBar">
          <div className="segmented">
            <button>Día</button>
            <button className="selected">Semana</button>
            <button>Mes</button>
          </div>
          <label className="checkLine"><input type="checkbox" /> Mostrar solo mis citas</label>
          <button className="todayBtn">Hoy</button>
        </div>

        <div className="calendarShell">
          <div className="calendarHeader">
            <div className="timeHead">Hora</div>
            {days.map(([name, num], idx) => (
              <div className={`dayHead ${idx === 2 ? "todayHead" : ""}`} key={name}>
                <span>{name}</span>
                <strong>{num}</strong>
              </div>
            ))}
          </div>

          <div className="calendarBody">
            <div className="timeColumn">
              {hours.map(h => <div className="timeSlot" key={h}>{fmtHour(h)}</div>)}
            </div>

            {days.map((_, d) => (
              <div className={`dayColumn ${d === 2 ? "todayColumn" : ""}`} key={d}>
                {hours.map(h => <div className="gridCell" key={h} />)}
                {filtered.filter(a => a.day === d).map(item => (
                  <CalendarEvent
                    item={item}
                    key={item.id}
                    onClick={setSelected}
                    selected={selected?.id === item.id}
                  />
                ))}
              </div>
            ))}

            <div className="nowLine" style={{ top: (11.5 - 7) * 64 + 32 }}>
              <span />
            </div>
          </div>
        </div>

        <div className="legend">
          <strong>Servicios</strong>
          {Object.entries(services).map(([name, s]) => (
            <div className="legendItem" key={name}>
              <span className="legendDot" style={{background:s.bg, borderColor:s.border}} />
              <span>{name}</span>
            </div>
          ))}
        </div>

        <div className="summary">
          <div><span>Total citas</span><strong>28</strong></div>
          <div><span>Neurofeedback</span><strong>10</strong></div>
          <div><span>Seguimientos</span><strong>6</strong></div>
          <div><span>Socializaciones</span><strong>3</strong></div>
          <div><span>EMT</span><strong>2</strong></div>
          <div><span>Psicoterapia</span><strong>3</strong></div>
          <button>Ver reporte</button>
        </div>
      </section>

      <DetailPanel selected={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Dashboard() {
  const cards = [
    ["Pacientes activos", "48", "person"],
    ["Sesiones hoy", "12", "calendar"],
    ["Neurofeedback", "32", "brain"],
    ["Psicología", "26", "psi"],
  ];
  const pending = [
    ["Seguimientos Neurofeedback", 5],
    ["Tareas por revisar", 3],
    ["Evaluaciones pendientes", 2],
    ["Historias clínicas incompletas", 4],
    ["Pacientes sin sesión reciente", 6],
  ];
  return (
    <div className="dashboard">
      <div className="welcome">
        <div><h2>Bienvenida, Ana</h2><p>Aquí tienes un resumen de tu actividad clínica de hoy.</p></div>
        <div className="searchBox">Buscar paciente... <span>⌕</span></div>
      </div>

      <div className="metricGrid">
        {cards.map(([title, value, icon]) => (
          <div className="metricCard" key={title}>
            <div className="metricIcon"><Icon name={icon} /></div>
            <div><span>{title}</span><strong>{value}</strong></div>
            <button>Ver más →</button>
          </div>
        ))}
      </div>

      <div className="dashGrid">
        <section className="panel">
          <h3>Pendientes</h3>
          <div className="pendingGrid">
            {pending.map(([label, n]) => (
              <div className="pendingCard" key={label}>
                <strong>{n}</strong>
                <span>{label}</span>
                <button>Ver detalles →</button>
              </div>
            ))}
          </div>
        </section>
        <aside className="panel alerts">
          <h3>Alertas importantes</h3>
          <div className="alertLine"><b>3 pacientes alcanzaron sesión 20</b><span>Requieren seguimiento</span></div>
          <div className="alertLine"><b>2 planes próximos a finalizar</b><span>En los próximos 7 días</span></div>
          <div className="alertLine"><b>1 evaluación pendiente</b><span>Programada y no registrada</span></div>
          <div className="alertLine"><b>4 pacientes sin sesión reciente</b><span>Más de 21 días sin actividad</span></div>
        </aside>
      </div>

      <div className="dashGrid">
        <section className="panel">
          <div className="panelTitleRow"><h3>Próximas sesiones</h3><button>Ver agenda completa →</button></div>
          <table className="sessionTable">
            <thead><tr><th>Hora</th><th>Paciente</th><th>Servicio</th><th>Tipo</th><th>Profesional</th><th>Sede</th></tr></thead>
            <tbody>
              {appointments.slice(0,5).map(a => (
                <tr key={a.id}>
                  <td>{fmtHour(a.start)}</td>
                  <td>{a.patient}</td>
                  <td><span className="tablePill" style={{background:services[a.service].bg,color:services[a.service].text}}>{a.service}</span></td>
                  <td>{a.mode}</td>
                  <td>{a.professional}</td>
                  <td>Barranquilla</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="panel">
          <h3>Actividad por sede</h3>
          {[
            ["Barranquilla", "156 pacientes", 342, 78],
            ["Cartagena", "93 pacientes", 208, 52],
            ["Bogotá", "88 pacientes", 190, 46],
          ].map(([city,pats,sessions,pct]) => (
            <div className="siteRow" key={city}>
              <div className="siteTop"><strong>{city}</strong><span>{sessions} sesiones</span></div>
              <small>{pats}</small>
              <div className="bar"><span style={{width:`${pct}%`}} /></div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div className="placeholder panel">
      <div className="placeholderIcon"><Icon name="folder" size={44} /></div>
      <h2>{title}</h2>
      <p>Este módulo será desarrollado en la siguiente fase manteniendo la misma identidad visual y arquitectura clínica.</p>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("Agenda");
  return (
    <>
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;font-family:Inter,Manrope,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:${COLORS.bg};color:${COLORS.text}}
        button,select,input{font:inherit}
        button{cursor:pointer}
        .app{min-height:100vh;display:flex}
        .sidebar{width:245px;background:linear-gradient(180deg,#101112 0%,#171819 100%);color:white;padding:22px 12px;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:20}
        .logo{display:flex;gap:11px;align-items:center;padding:4px 10px 20px}
        .logoMark{width:58px;height:58px;border:3px solid ${COLORS.gold};border-radius:50%;position:relative;overflow:hidden}
        .yin{position:absolute;width:34px;height:34px;border-radius:50%}
        .yinA{background:${COLORS.silver};left:11px;top:2px}
        .yinB{background:#E8C46D;left:11px;bottom:2px}
        .logoNeuro{font-size:27px;color:#D9AC49;line-height:1;font-weight:500;letter-spacing:.2px}
        .logoCoaching{font-size:19px;color:#C5C8CC;line-height:1.05;letter-spacing:1px}
        .logoSub{font-size:9px;color:#C7C7C7;letter-spacing:1.5px;margin-top:6px}
        .menu{display:flex;flex-direction:column;gap:4px;overflow:auto;padding-right:2px}
        .menuItem{border:0;background:transparent;color:#EEE;display:flex;align-items:center;gap:13px;padding:11px 14px;border-radius:5px;text-align:left;font-size:14px}
        .menuItem:hover{background:#242526}
        .menuItem.active{background:linear-gradient(90deg,#C18D22,#D8AE4F);color:white}
        .sidebarBottom{margin-top:auto;border-top:1px solid rgba(201,154,46,.45);padding:14px 8px 0}
        .smallLabel{font-size:10px;color:#E2B642;font-weight:700;margin-bottom:8px}
        .locationRow,.userCard{display:flex;align-items:center;gap:10px;padding:10px 4px}
        .buildingIcon{color:${COLORS.gold};font-size:25px}
        .locationRow .chev,.userCard .chev{margin-left:auto;color:#E1B33B}
        .userCard{margin-top:8px;border-top:1px solid rgba(201,154,46,.4);padding-top:16px}
        .avatar,.topAvatar,.patientAvatar{border-radius:50%;display:grid;place-items:center;font-weight:700}
        .avatar{width:40px;height:40px;background:#F1F1F1;color:#333}
        .userText{display:flex;flex-direction:column;font-size:13px}
        .userText span{color:#D8D8D8;margin-top:2px}

        .main{margin-left:245px;width:calc(100% - 245px);min-height:100vh}
        .topbar{height:92px;background:#fff;border-bottom:1px solid #ececec;display:flex;align-items:center;justify-content:space-between;padding:18px 28px;position:sticky;top:0;z-index:15}
        .titleLine{display:flex;align-items:center;gap:12px}
        .titleLine h1{font-size:24px;margin:0}
        .titleBlock p{margin:3px 0 0 40px;color:#70747A;font-size:13px}
        .topActions{display:flex;align-items:center;gap:12px}
        .selectBox{min-width:165px;border:1px solid #DDD;border-radius:8px;padding:8px 12px;display:grid;grid-template-columns:1fr auto;font-size:12px;background:#fff}
        .selectBox span:first-child{grid-column:1/3;color:#777}
        .selectBox strong{font-size:13px}
        .primaryBtn{border:0;border-radius:6px;background:linear-gradient(90deg,#B88422,#D0A343);color:white;padding:13px 18px;font-weight:700}
        .iconBtn{border:0;background:white;font-size:20px;position:relative}
        .iconBtn.hasDot span{position:absolute;right:-5px;top:-8px;background:${COLORS.gold};color:#fff;border-radius:10px;font-size:10px;padding:2px 5px}
        .topAvatar{width:40px;height:40px;border:1px solid #B8B8B8;background:#fff;font-size:13px}

        .content{padding:18px}
        .agendaLayout{display:grid;grid-template-columns:minmax(0,1fr) 315px;gap:14px}
        .agendaCard,.detailPanel,.panel{background:#fff;border:1px solid #E5E5E5;border-radius:11px;box-shadow:0 2px 8px rgba(0,0,0,.035)}
        .toolbar{padding:12px 14px;border-bottom:1px solid #ECECEC;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .toolbarGroup{display:flex;gap:8px;align-items:flex-end}
        .toolbar label{display:flex;flex-direction:column;font-size:10px;color:#666}
        .toolbar select{border:1px solid #DDD;border-radius:6px;padding:7px 10px;background:white;min-width:106px;color:#222}
        .navBtn,.dateBtn,.filterBtn,.todayBtn{border:1px solid #DDD;background:white;border-radius:6px;padding:8px 12px}
        .dateBtn{min-width:168px}
        .calendarModeBar{padding:12px 14px;display:flex;align-items:center;gap:16px}
        .segmented{display:flex;border:1px solid #DDD;border-radius:5px;overflow:hidden}
        .segmented button{border:0;background:white;padding:8px 23px}
        .segmented .selected{background:linear-gradient(90deg,#B98524,#D7AB4C);color:white}
        .checkLine{margin-left:auto;font-size:12px;color:#444;display:flex;align-items:center;gap:6px}
        .calendarShell{border-top:1px solid #ECECEC;border-bottom:1px solid #ECECEC;margin:0 14px}
        .calendarHeader{display:grid;grid-template-columns:64px repeat(7,1fr);height:58px;border-bottom:1px solid #DDD}
        .timeHead,.dayHead{display:flex;align-items:center;justify-content:center;border-right:1px solid #EEE}
        .timeHead{font-size:12px;font-weight:600}
        .dayHead{flex-direction:column;gap:2px}
        .dayHead span{font-size:11px}.dayHead strong{font-size:17px}
        .todayHead{background:#FFF9EC;color:#A57414}
        .calendarBody{display:grid;grid-template-columns:64px repeat(7,1fr);height:768px;position:relative;overflow:hidden}
        .timeColumn{position:relative}
        .timeSlot{height:64px;border-bottom:1px solid #EEE;border-right:1px solid #EEE;font-size:10px;padding:7px 5px;text-align:center;color:#555}
        .dayColumn{position:relative;border-right:1px solid #EEE}
        .todayColumn{background:#FFFDF7}
        .gridCell{height:64px;border-bottom:1px solid #EEE}
        .calendarEvent{position:absolute;left:5px;right:5px;border:1px solid;border-radius:4px;text-align:left;padding:6px;overflow:hidden;display:flex;flex-direction:column;gap:2px;z-index:4;font-size:10px}
        .calendarEvent strong{font-size:10px}.calendarEvent span{font-size:9px}.calendarEvent small{font-size:9px;color:inherit;opacity:.9}
        .calendarEvent:hover{filter:brightness(.98);box-shadow:0 2px 7px rgba(0,0,0,.12)}
        .selectedEvent{outline:2px solid rgba(201,154,46,.35)}
        .virtualTag{font-weight:700}
        .blocked{background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.35) 0,rgba(255,255,255,.35) 6px,rgba(0,0,0,.025) 6px,rgba(0,0,0,.025) 12px)!important}
        .nowLine{position:absolute;left:64px;right:0;height:1px;background:#EE6352;z-index:7;pointer-events:none}
        .nowLine span{width:7px;height:7px;background:#EE6352;border-radius:50%;position:absolute;left:-3px;top:-3px}
        .legend{padding:13px 14px;display:flex;gap:15px;align-items:center;flex-wrap:wrap;font-size:10px}
        .legend strong{font-size:12px;margin-right:2px}
        .legendItem{display:flex;gap:5px;align-items:center}
        .legendDot{width:9px;height:9px;border-radius:2px;border:1px solid}
        .summary{border-top:1px solid #EEE;padding:12px 14px;display:flex;gap:10px;align-items:stretch}
        .summary>div{border:1px solid #E8E8E8;border-radius:6px;padding:8px 10px;min-width:96px;display:flex;flex-direction:column}
        .summary span{font-size:10px}.summary strong{font-size:18px;margin-top:3px}
        .summary button{margin-left:auto;border:1px solid #DDD;background:white;border-radius:6px;padding:0 14px}

        .detailPanel{padding:0 14px;height:max-content;position:sticky;top:110px}
        .detailHead{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #EEE;padding:16px 0}
        .detailHead h3{margin:0;font-size:16px}.detailHead button{border:0;background:white;font-size:23px;color:#555}
        .detailPills{display:flex;gap:8px;margin:14px 0}
        .detailPills span{font-size:10px;padding:5px 10px;border-radius:5px}.statusPill{background:#E7F3DE;color:#315723}
        .patientBlock{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;padding:10px 0 14px;border-bottom:1px solid #EEE}
        .patientAvatar{width:42px;height:42px;background:#E8E8E8;font-size:12px}
        .patientBlock div:nth-child(2){display:flex;flex-direction:column}.patientBlock span{font-size:11px;color:#666;margin-top:3px}
        .detailList{padding:12px 0}.detailList>div{display:grid;grid-template-columns:20px 1fr;gap:7px;align-items:start;padding:6px 0}
        .detailList p{margin:0;font-size:11px;line-height:1.35}.linkText{color:#1476C6}
        .divider{height:1px;background:#EEE}.detailPanel h4{margin:14px 0 9px}
        .actionGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.actionGrid button,.wideAction{border:1px solid #D8B05B;background:#fff;border-radius:5px;padding:9px;font-size:10px}
        .actionGrid .goldAction{background:linear-gradient(90deg,#BA8627,#D1A343);color:white;border:0}
        .wideAction{width:100%;margin-top:8px}
        .reminderCard{margin:14px -14px 0;border-top:1px solid #EEE;padding:14px}
        .reminderTitle{display:flex;justify-content:space-between;font-size:11px}.reminderTitle button{border:0;background:white;color:#B27E1B}
        .reminderRow{display:grid;grid-template-columns:20px 1fr auto;align-items:center;margin-top:10px;font-size:10px}
        .reminderRow p{margin:0}.reminderRow small{font-size:9px;color:#666}
        .successBox{margin-top:12px;background:#EDF7EB;border:1px solid #C5DFC0;color:#3F6C38;border-radius:5px;padding:10px;font-size:9px;line-height:1.4}

        .dashboard{display:flex;flex-direction:column;gap:14px}
        .welcome{display:flex;justify-content:space-between;align-items:center}
        .welcome h2{margin:0 0 4px;font-size:22px}.welcome p{margin:0;color:#73767B;font-size:13px}
        .searchBox{width:280px;background:#fff;border:1px solid #DDD;border-radius:7px;padding:12px 14px;color:#999;display:flex;justify-content:space-between}
        .metricGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .metricCard{background:#fff;border:1px solid #E5E5E5;border-radius:10px;padding:18px;display:grid;grid-template-columns:48px 1fr;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.03)}
        .metricIcon{width:48px;height:48px;border-radius:50%;background:${COLORS.goldSoft};color:${COLORS.goldDeep};display:grid;place-items:center}
        .metricCard div:nth-child(2){display:flex;flex-direction:column}.metricCard span{font-size:11px;text-transform:uppercase}.metricCard strong{font-size:28px}
        .metricCard button{grid-column:1/3;border:0;background:white;color:#B47B13;text-align:left;padding:0}
        .dashGrid{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(260px,.8fr);gap:12px}
        .panel{padding:18px}.panel h3{margin:0 0 14px}
        .pendingGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
        .pendingCard{border:1px solid #ECECEC;border-radius:8px;padding:13px;display:flex;flex-direction:column;min-height:126px}
        .pendingCard strong{font-size:24px}.pendingCard span{font-size:10px;line-height:1.3}.pendingCard button{margin-top:auto;border:0;background:white;color:#B77E16;text-align:left;padding:0;font-size:10px}
        .alertLine{padding:12px 0;border-bottom:1px solid #EEE;display:flex;flex-direction:column}.alertLine b{font-size:11px}.alertLine span{font-size:10px;color:#777;margin-top:3px}
        .panelTitleRow{display:flex;justify-content:space-between}.panelTitleRow button{border:0;background:#fff;color:#B47B13}
        .sessionTable{width:100%;border-collapse:collapse;font-size:10px}.sessionTable th,.sessionTable td{padding:10px;border-bottom:1px solid #EEE;text-align:left}.sessionTable th{color:#666;font-weight:600}
        .tablePill{padding:4px 7px;border-radius:4px}
        .siteRow{padding:9px 0}.siteTop{display:flex;justify-content:space-between;font-size:11px}.siteRow small{color:#777}.bar{height:5px;background:#EEE;border-radius:5px;margin-top:7px}.bar span{display:block;height:100%;background:${COLORS.gold};border-radius:5px}
        .placeholder{text-align:center;padding:70px 20px}.placeholderIcon{width:80px;height:80px;border-radius:50%;background:${COLORS.goldSoft};color:${COLORS.goldDeep};display:grid;place-items:center;margin:0 auto 16px}.placeholder p{color:#777}

        @media (max-width:1200px){
          .agendaLayout{grid-template-columns:1fr}.detailPanel{position:relative;top:auto}
          .metricGrid{grid-template-columns:repeat(2,1fr)}
          .dashGrid{grid-template-columns:1fr}
          .pendingGrid{grid-template-columns:repeat(3,1fr)}
        }
        @media (max-width:900px){
          .sidebar{width:76px}.main{margin-left:76px;width:calc(100% - 76px)}
          .logo>div:last-child,.menuItem span,.sidebarBottom{display:none}
          .logo{justify-content:center;padding:0 0 18px}.logoMark{width:44px;height:44px}
          .menuItem{justify-content:center;padding:12px}
          .topActions .selectBox{display:none}
          .calendarShell{overflow:auto}
          .calendarHeader,.calendarBody{min-width:850px}
        }
      `}</style>

      <div className="app">
        <Sidebar active={active} setActive={setActive} />
        <main className="main">
          <Topbar active={active} />
          <div className="content">
            {active === "Agenda" ? <Agenda /> : active === "Inicio" ? <Dashboard /> : <Placeholder title={active} />}
          </div>
        </main>
      </div>
    </>
  );
}
