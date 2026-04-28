function medal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function rowStyle(rank, isSelf) {
  if (rank === 1) return { background: "#fff7d6" };
  if (rank === 2) return { background: "#f3f4f6" };
  if (rank === 3) return { background: "#ffedd5" };
  if (isSelf) return { background: "#f5efe6" };
  return { background: "#fffdf9" };
}

export default function LeaderboardPanel({ rows, myUserId }) {
  const sorted = [...(rows || [])].sort((a, b) => (b.points || 0) - (a.points || 0));
  const top = Math.max(1, sorted[0]?.points || 0);

  return (
    <div>
      <h3 className="sg2-subtitle" style={{ marginBottom: 4 }}>This Room · This Week</h3>
      <p className="sg2-soft-text" style={{ margin: "0 0 10px" }}>Points = (sessions × 10) + (minutes ÷ 5)</p>

      <ol className="sg2-clean-list" style={{ display: "grid", gap: 8 }}>
        {sorted.length === 0 ? <li className="sg2-soft-text">No points yet. Start a focus session.</li> : null}
        {sorted.map((row, idx) => {
          const rank = idx + 1;
          const pct = Math.round(((row.points || 0) / top) * 100);
          const isSelf = row.userId === myUserId;
          return (
            <li key={row.userId} className="sg2-leader-row" style={rowStyle(rank, isSelf)}>
              <span style={{ width: 32, textAlign: "center", fontWeight: 700 }}>{medal(rank)}</span>
              <div className="sg2-avatar-stack" style={{ marginLeft: 0 }}>{String(row.userName || "?").slice(0, 1).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{row.userName}</div>
                <div className="sg2-soft-text" style={{ fontSize: "0.76rem" }}>🔥 {row.streakDays || 0} days</div>
                <div className="sg2-progress-rail" style={{ marginTop: 4 }}>
                  <div className="sg2-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <strong>{row.points || 0}</strong>
            </li>
          );
        })}
      </ol>

      <p className="sg2-soft-text" style={{ marginTop: 10 }}>Resets every Monday</p>
    </div>
  );
}
