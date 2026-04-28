const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMondayIndex(d) {
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

function buildWeekActivity(series) {
  const today = new Date();
  const mondayOffset = getMondayIndex(today);
  const keysThisWeek = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - mondayOffset + i);
    const offsetMins = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offsetMins * 60_000);
    const key = localDate.toISOString().slice(0, 10);
    keysThisWeek.push(key);
  }
  const byKey = Object.fromEntries((series || []).map((s) => [s.key, s]));
  return keysThisWeek.map((key, idx) => ({
    label: DAYS[idx],
    key,
    active: (byKey[key]?.focusSeconds ?? 0) > 0 || (byKey[key]?.tasksCompleted ?? 0) > 0,
  }));
}

function streakFromKeys(weekDays) {
  const todayKey = weekDays[weekDays.length - 1]?.key;
  if (!todayKey) return 0;
  let streak = 0;
  for (let i = weekDays.length - 1; i >= 0; i -= 1) {
    if (weekDays[i].active) streak += 1;
    else break;
  }
  if (streak === 0) {
    for (let i = weekDays.length - 2; i >= 0; i -= 1) {
      if (weekDays[i].active) streak += 1;
      else break;
    }
  }
  return streak;
}

export default function StreakTracker({ series }) {
  const week = buildWeekActivity(series);
  const streak = streakFromKeys(week);
  const any = week.some((d) => d.active);

  return (
    <div className="a-card" style={{ marginTop: 14 }}>
      <h2 className="a-card-title">Study streak</h2>
      <p className="a-card-sub">This calendar week (Mon–Sun)</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 14, flexWrap: "wrap" }}>
        {week.map((d) => (
          <div key={d.key} style={{ textAlign: "center", flex: "1 0 36px" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                margin: "0 auto 6px",
                border: `2px solid ${d.active ? "#8b6f5e" : "#eed6c4"}`,
                background: d.active ? "linear-gradient(135deg,#eed6c4,#c8b6a6)" : "#faf6f1",
                boxShadow: d.active ? "0 4px 12px rgba(139,111,94,0.25)" : "none",
              }}
              aria-label={`${d.label} ${d.active ? "studied" : "no study"}`}
            />
            <div className="a-bar-label">{d.label}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 14, fontWeight: 700, color: "#4a3728" }}>
        {any ? `🔥 ${streak} day streak` : "Start your streak today"}
      </p>
    </div>
  );
}
