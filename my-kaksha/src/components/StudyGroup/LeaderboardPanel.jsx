function rankStyle(rank) {
  if (rank === 1) return { background: "linear-gradient(135deg,#fde68a,#f59e0b)", color: "#422006" };
  if (rank === 2) return { background: "linear-gradient(135deg,#e5e7eb,#9ca3af)", color: "#111827" };
  if (rank === 3) return { background: "linear-gradient(135deg,#fed7aa,#ea580c)", color: "#431407" };
  return { background: "#f5efe6", color: "#6b4d3a" };
}

export default function LeaderboardPanel({ rows, nameResolver }) {
  const sorted = [...(rows || [])].sort((a, b) => (b.points || 0) - (a.points || 0));
  const top = sorted[0]?.points || 1;

  return (
    <div>
      <h3 style={{ margin: "0 0 6px", fontSize: "1rem", color: "#4a3629" }}>{"This Week's Focus Points"}</h3>
      <p style={{ margin: "0 0 12px", fontSize: "0.78rem", color: "#8b6f5e" }}>Points reset every Monday · Soft scoring per session</p>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        {sorted.length === 0 ? (
          <li style={{ color: "#8b6f5e", fontSize: "0.9rem" }}>Complete a focus session to earn points.</li>
        ) : (
          sorted.map((row, idx) => {
            const rank = idx + 1;
            const name = nameResolver(row.userId) || `Student ${String(row.userId).slice(-4)}`;
            const pts = row.points || 0;
            const pct = Math.round((pts / top) * 100);
            return (
              <li
                key={row.userId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid #ead8c7",
                  background: "#fffdf9",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    ...rankStyle(rank),
                  }}
                >
                  {rank === 1 ? "👑" : `#${rank}`}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#4a3629" }}>{name}</div>
                  <div style={{ fontSize: "0.82rem", color: "#8b6f5e" }}>{pts} focus points</div>
                  <div style={{ height: 6, borderRadius: 999, background: "#f1dfcf", marginTop: 6, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#8b6f5e,#c8b6a6)" }} />
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ol>
    </div>
  );
}
