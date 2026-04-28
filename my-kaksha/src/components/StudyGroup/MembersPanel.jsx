function badgeClass(status) {
  if (status === "focusing") return "sg2-status-focusing";
  if (status === "break") return "sg2-status-break";
  if (status === "away") return "sg2-status-away";
  return "sg2-status-online";
}

function badgeLabel(status) {
  if (status === "focusing") return "🎯 Focusing";
  if (status === "break") return "☕ Break";
  if (status === "away") return "Away";
  return "Online";
}

function statusDot(status) {
  if (status === "focusing" || status === "online") return "#22c55e";
  if (status === "break") return "#f59e0b";
  return "#9ca3af";
}

export default function MembersPanel({ members, roomCode, meName, statsByUser, maxFocus = 1 }) {
  if (!members || members.length === 0) {
    return (
      <div className="sg2-empty-room">
        <p className="sg2-soft-text" style={{ margin: 0 }}>You&apos;re the first one here. Invite friends!</p>
        <div className="sg2-room-code-hero">Room code: <strong>{roomCode}</strong></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sg2-inline-row" style={{ marginBottom: 8 }}>
        <h3 className="sg2-subtitle" style={{ margin: 0 }}>In This Room</h3>
        <span className="sg2-soft-text">Code: <strong>{roomCode}</strong></span>
      </div>

      <ul className="sg2-clean-list" style={{ display: "grid", gap: 10 }}>
        {members.map((m) => {
          const stats = statsByUser[m.userId] || {};
          const focusMin = Number(stats.totalFocusMinutes || 0);
          const isMe = meName && m.name === meName;
          return (
            <li key={m.socketId || `${m.userId}-${m.name}`} className="sg2-member-row">
              <span className="sg2-status-dot" style={{ background: statusDot(m.status) }} />
              <div className="sg2-avatar-stack sg2-avatar-lg" style={{ marginLeft: 0 }}>{String(m.name || "?").slice(0, 1).toUpperCase()}</div>
              <div className="sg2-member-body">
                <div className="sg2-member-topline">
                  <div style={{ fontWeight: 700, color: "#4a3629" }}>
                    {isMe ? `You (${m.name})` : m.name}
                  </div>
                  <span className={badgeClass(m.status)} style={{ fontSize: "0.72rem", padding: "4px 8px", borderRadius: 999 }}>
                    {badgeLabel(m.status)}
                  </span>
                </div>
                <div className="sg2-progress-rail" style={{ marginTop: 6 }}>
                  <div className="sg2-progress-fill" style={{ width: `${Math.max(8, Math.round((focusMin / Math.max(1, maxFocus)) * 100))}%` }} />
                </div>
              </div>
              <strong className="sg2-study-minutes">{focusMin} min</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
