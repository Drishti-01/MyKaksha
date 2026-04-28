function formatAvgMins(totalSeconds, sessions) {
  if (!sessions || sessions < 1) return "Not enough data yet";
  const m = Math.round(totalSeconds / sessions / 60);
  return `${m} min`;
}

export default function QuickInsights({ series, rows, totalSeconds, totalSessions }) {
  const best = (() => {
    if (!series?.length) return "Not enough data yet";
    const bestDay = [...series].sort((a, b) => (b.focusSeconds ?? 0) - (a.focusSeconds ?? 0))[0];
    if (!bestDay || (bestDay.focusSeconds ?? 0) <= 0) return "Not enough data yet";
    const full = new Date(bestDay.key + "T12:00:00");
    return full.toLocaleDateString("en-IN", { weekday: "long" });
  })();

  const topGoal = rows?.[0]?.title;
  const mostStudied = topGoal && (rows[0].totalSeconds ?? 0) > 0 ? topGoal : "No data";

  const cards = [
    { title: "Best focus day", value: best },
    { title: "Average session", value: formatAvgMins(totalSeconds, totalSessions) },
    { title: "Most studied", value: mostStudied },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
        marginTop: 14,
      }}
    >
      {cards.map((c) => (
        <div key={c.title} className="a-card" style={{ padding: 14, boxShadow: "0 6px 16px rgba(200,182,166,0.18)" }}>
          <div style={{ fontSize: "0.78rem", color: "#8b6f5e", fontWeight: 600 }}>{c.title}</div>
          <div style={{ marginTop: 8, fontWeight: 700, color: "#4a3728", fontSize: "0.95rem", lineHeight: 1.35 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
