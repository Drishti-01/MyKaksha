export default function WeeklySummaryCard({ series, rows, weeklySummary }) {
  if (!series || series.length === 0) {
    return (
      <div className="a-card" style={{ marginTop: 14, textAlign: "center" }}>
        <h2 className="a-card-title">This Week at a Glance</h2>
        <p className="a-card-sub" style={{ marginBottom: 14 }}>
          Your weekly report will appear here after your first session.
        </p>
      </div>
    );
  }

  const weekTotal = Number(weeklySummary?.totalMinutes)
    ? Number(weeklySummary.totalMinutes) * 60
    : series.reduce((sum, day) => sum + (day.focusSeconds || 0), 0);
  const weekSessions = Number(weeklySummary?.sessionsCompleted)
    ? Number(weeklySummary.sessionsCompleted)
    : series.reduce((sum, day) => sum + (day.sessions || 0), 0);
  const weekTasks = series.reduce((sum, day) => sum + (day.tasksCompleted || 0), 0);
  const mostProductiveDay = [...series].sort((a, b) => (b.focusSeconds || 0) - (a.focusSeconds || 0))[0];

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }

  const topGoal = rows?.[0]?.title || "No data";

  return (
    <div className="a-card" style={{ marginTop: 14 }}>
      <h2 className="a-card-title">This Week at a Glance</h2>

      <div className="a-snapshot-grid" style={{ marginTop: 12 }}>
        <div className="a-snap a-stat-card">
          <div className="a-stat-ico" aria-hidden>⏱️</div>
          <div className="a-snap-label">Total Focus Time</div>
          <div className="a-snap-val">{formatDuration(weekTotal)}</div>
        </div>

        <div className="a-snap a-stat-card s2">
          <div className="a-stat-ico" aria-hidden>🎯</div>
          <div className="a-snap-label">Sessions Completed</div>
          <div className="a-snap-val">{weekSessions}</div>
        </div>

        <div className="a-snap a-stat-card s3">
          <div className="a-stat-ico" aria-hidden>✅</div>
          <div className="a-snap-label">Tasks Completed</div>
          <div className="a-snap-val">{weekTasks}</div>
        </div>

        <div className="a-snap a-stat-card s4">
          <div className="a-stat-ico" aria-hidden>📚</div>
          <div className="a-snap-label">Most Studied</div>
          <div className="a-snap-val" style={{ fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
            {topGoal}
          </div>
        </div>
      </div>

      {mostProductiveDay ? (
        <div style={{ marginTop: 14, padding: "12px", background: "#faf6f1", borderRadius: "10px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.78rem", fontWeight: 600, color: "#8b6f5e" }}>Most Productive Day</p>
          <p style={{ margin: 0, fontWeight: 700, color: "#4a3728", fontSize: "0.95rem" }}>
            {mostProductiveDay.label}: {Math.round((mostProductiveDay.focusSeconds || 0) / 60)} min
          </p>
        </div>
      ) : null}
    </div>
  );
}
