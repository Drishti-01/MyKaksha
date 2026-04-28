function badgeClass(status) {
  if (status === "focusing") return "sg2-status-focusing";
  if (status === "break") return "sg2-status-break";
  if (status === "away") return "sg2-status-away";
  if (status === "offline") return "sg2-status-offline";
  return "sg2-status-online";
}

function badgeLabel(status) {
  if (status === "focusing") return "Focusing 🎯";
  if (status === "break") return "On Break ☕";
  if (status === "away") return "Away";
  if (status === "offline") return "Offline";
  return "Online";
}

function borderColor(status) {
  if (status === "focusing" || status === "online") return "#22c55e";
  if (status === "break") return "#f59e0b";
  return "#9ca3af";
}

export default function MembersPanel({ members, createdByName }) {
  return (
    <div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        {(members || []).map((m) => (
          <li
            key={m.socketId || m.userId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid #ead8c7",
              background: "#fffdf9",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                color: "#fff",
                background: "#c2a189",
                border: `3px solid ${borderColor(m.status)}`,
              }}
              aria-hidden
            >
              {(m.name || "?").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "#4a3629" }}>{m.name}</div>
              <span className={badgeClass(m.status)} style={{ fontSize: "0.72rem", padding: "4px 8px", borderRadius: 999 }}>
                {badgeLabel(m.status)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {createdByName ? (
        <p style={{ marginTop: 14, fontSize: "0.82rem", color: "#8b6f5e" }}>
          Room created by: <strong>{createdByName}</strong>
        </p>
      ) : null}
    </div>
  );
}
