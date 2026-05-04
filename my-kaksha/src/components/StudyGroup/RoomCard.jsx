const ROOM_ACCENTS = {
  "DSA Practice": { top: "linear-gradient(90deg,#6366F1,#818CF8)", button: "#4f46e5" },
  "DBMS Prep": { top: "linear-gradient(90deg,#10B981,#34D399)", button: "#059669" },
  "OS Revision": { top: "linear-gradient(90deg,#F59E0B,#FBBF24)", button: "#d97706" },
  "Web Dev Zone": { top: "linear-gradient(90deg,#3B82F6,#60A5FA)", button: "#2563eb" },
  "Silent Focus": { top: "linear-gradient(90deg,#8B5CF6,#A78BFA)", button: "#7c3aed" },
};

function getAccent(name) {
  return ROOM_ACCENTS[name] || { top: "linear-gradient(90deg,#c2a189,#d8b9a2)", button: "#a67556" };
}

function initials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatWeeklyProgress(room) {
  const goal = Number(room.weeklyGoalHours || 0);
  const weeklyMinutes = Number(room.weeklyMinutes || 0);
  if (!goal || goal <= 0) return null;
  const pct = Math.max(0, Math.min(100, Math.round((weeklyMinutes / (goal * 60)) * 100)));
  return { pct, text: `${Math.round(weeklyMinutes / 60)}h / ${goal}h weekly` };
}

export default function RoomCard({ room, onJoin, isMember = false }) {
  const accent = getAccent(room.name);
  const preview = Array.isArray(room.memberPreview) ? room.memberPreview : [];
  const progress = formatWeeklyProgress(room);

  function copyCode() {
    navigator.clipboard?.writeText(room.code || "").catch(() => {});
  }

  return (
    <article className="sg2-card sg2-room-card" style={{ borderLeft: "1px solid #ead8c7" }}>
      <div className="sg2-room-accent" style={{ background: accent.top }} />

      <h3 className="sg2-room-title">{room.name}</h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span className="sg2-mini-badge">{room.type === "private" ? "Private" : "Public"}</span>
        <span className="sg2-mini-badge alt">{room.focusStyle === "silent" ? "Silent" : "Discussion"}</span>
        <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "#8b6f5e", fontWeight: 600 }}>{room.status}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ display: "flex" }}>
          {preview.slice(0, 4).map((m, i) => (
            <span
              key={`${m.userId || m.name}-${i}`}
              className="sg2-avatar-stack"
              title={m.name}
              style={{ marginLeft: i === 0 ? 0 : -6 }}
            >
              {initials(m.name)}
            </span>
          ))}
        </div>
        <span style={{ fontSize: "0.84rem", color: "#6e5644" }}>
          <strong>{room.onlineCount ?? 0}</strong> studying now
        </span>
      </div>

      <button type="button" className="sg2-code-btn" onClick={copyCode} title="Copy room code">
        Code: <code>{room.code}</code>
      </button>

      {progress ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "#8b6f5e" }}>
            <span>Weekly goal</span>
            <span>{progress.text}</span>
          </div>
          <div className="sg2-progress-rail">
            <div className="sg2-progress-fill" style={{ width: `${progress.pct}%`, background: accent.button }} />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="sg2-btn"
        style={{ width: "100%", marginTop: 12, background: accent.button }}
        onClick={() => onJoin(room.id)}
      >
        {isMember ? "Enter Room" : "Join Room"}
      </button>
    </article>
  );
}
