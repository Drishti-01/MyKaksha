import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudyData } from "./api/studyData";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }

  .a-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 280px 1fr;
    background: radial-gradient(circle at top right, #f3e8da 0%, #faf8f3 42%);
    color: #5a4a3a;
    font-family: 'Poppins', sans-serif;
  }
  .a-shell.collapsed { grid-template-columns: 94px 1fr; }

  .a-sidebar {
    background: linear-gradient(180deg, #fffdf9, #f5efe6);
    border-right: 1px solid #eed6c4;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 100vh;
    position: sticky;
    top: 0;
  }
  .a-brand-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .a-brand { font-size: 1.2rem; font-weight: 800; color: #8b6f5e; white-space: nowrap; }
  .a-brand span { color: #c8b6a6; }
  .a-toggle {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid #eed6c4;
    background: #faf8f3;
    color: #8b6f5e;
    cursor: pointer;
    font-weight: 700;
  }
  .a-nav { display: grid; gap: 8px; }
  .a-nav-btn {
    border: 1px solid transparent;
    background: transparent;
    color: #8b6f5e;
    padding: 12px;
    border-radius: 12px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .a-nav-btn:hover { background: #f5efe6; border-color: #eed6c4; }
  .a-nav-btn.active {
    background: linear-gradient(135deg, #eed6c4, #dac1ad);
    border-color: #c8b6a6;
    color: #4a3728;
  }
  .a-dot { width: 8px; height: 8px; border-radius: 50%; background: #c8b6a6; flex-shrink: 0; }

  .a-shell.collapsed .a-brand,
  .a-shell.collapsed .a-label,
  .a-shell.collapsed .a-note { display: none; }
  .a-shell.collapsed .a-nav-btn { justify-content: center; }

  .a-note {
    margin-top: auto;
    border: 1px solid #eed6c4;
    background: #faf8f3;
    border-radius: 14px;
    padding: 10px;
    color: #8b6f5e;
    font-size: 0.76rem;
    line-height: 1.5;
  }

  .a-back-btn {
    margin-top: 6px;
    width: 100%;
    border: 1px solid #eed6c4;
    background: #fffdf9;
    border-radius: 999px;
    padding: 10px 14px;
    color: #8b6f5e;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
  }
  .a-back-btn:hover { background: #f5efe6; }

  .a-main { padding: 26px; overflow: hidden; }
  .a-head-wrap {
    position: relative;
    background: linear-gradient(130deg, #fffdf9, #f7f0e6);
    border: 1px solid #eed6c4;
    border-radius: 28px;
    padding: 22px;
    margin-bottom: 16px;
    overflow: hidden;
    box-shadow: 0 14px 30px rgba(200, 182, 166, 0.24);
  }
  .a-title { margin: 0 0 6px; color: #4a3728; font-size: clamp(1.4rem, 2.2vw, 2rem); }
  .a-sub { margin: 0; color: #8b6f5e; font-size: 0.95rem; max-width: 640px; }
  .a-shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(0.5px);
    opacity: 0.55;
    animation: drift 8s ease-in-out infinite;
    pointer-events: none;
  }
  .a-s1 { width: 180px; height: 180px; right: -35px; top: -30px; background: radial-gradient(circle, #eed6c4, #f5efe6); }
  .a-s2 { width: 130px; height: 130px; right: 100px; bottom: -45px; background: radial-gradient(circle, #d6e8dc, #eef8f2); animation-delay: 0.9s; }
  .a-s3 { width: 95px; height: 95px; right: 35px; bottom: 42px; background: radial-gradient(circle, #dce8f4, #edf6ff); animation-delay: 1.6s; }

  .a-control-row {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .a-chip {
    border: 1px solid #eed6c4;
    background: #fffdf9;
    border-radius: 999px;
    color: #8b6f5e;
    padding: 7px 14px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }
  .a-chip.active {
    border-color: #c8b6a6;
    background: linear-gradient(135deg, #eed6c4, #dac1ad);
    color: #4a3728;
  }

  .a-grid-main {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 14px;
    margin-bottom: 14px;
  }

  .a-card {
    background: #fffdf9;
    border: 1px solid #eed6c4;
    border-radius: 24px;
    padding: 18px;
    box-shadow: 0 10px 26px rgba(200, 182, 166, 0.2);
  }
  .a-card-title { margin: 0 0 10px; color: #4a3728; font-size: 1rem; }
  .a-card-sub { margin: 0; font-size: 0.82rem; color: #8b6f5e; }

  .a-chart-wrap {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(var(--count), minmax(0, 1fr));
    gap: 8px;
    align-items: end;
    min-height: 220px;
  }
  .a-bar-col { display: grid; gap: 6px; justify-items: center; }
  .a-bar {
    width: 100%;
    max-width: 28px;
    border-radius: 8px 8px 3px 3px;
    background: linear-gradient(180deg, #8b6f5e, #c8b6a6);
    min-height: 4px;
    transform-origin: bottom;
    animation: rise 0.7s ease both;
  }
  .a-bar-label { font-size: 0.72rem; color: #8b6f5e; font-weight: 600; }
  .a-bar-value { font-size: 0.68rem; color: #5a4a3a; }

  .a-snapshot-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .a-snap {
    background: #faf6f1;
    border: 1px solid #eed6c4;
    border-radius: 16px;
    padding: 12px;
  }
  .a-snap-label { color: #8b6f5e; font-size: 0.78rem; font-weight: 600; }
  .a-snap-val { margin-top: 4px; color: #4a3728; font-size: 1.4rem; font-weight: 800; }

  .a-donut-wrap {
    display: grid;
    gap: 12px;
    justify-items: center;
    padding: 10px 0 2px;
  }
  .a-donut {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    position: relative;
    background: conic-gradient(#8b6f5e var(--percent), #eed6c4 0);
    transition: background 0.5s ease;
    animation: pulseRing 3.2s ease-in-out infinite;
  }
  .a-donut::before {
    content: "";
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: #fffdf9;
    border: 1px solid #eed6c4;
  }
  .a-donut-center {
    position: absolute;
    text-align: center;
  }
  .a-donut-big { font-size: 1.35rem; font-weight: 800; color: #4a3728; }
  .a-donut-small { font-size: 0.72rem; color: #8b6f5e; font-weight: 600; }

  .a-legend { display: grid; gap: 6px; width: 100%; }
  .a-legend-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; color: #5a4a3a; }
  .a-legend-left { display: flex; align-items: center; gap: 7px; color: #8b6f5e; }
  .a-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
  .a-legend-dot.done { background: #8b6f5e; }
  .a-legend-dot.pending { background: #eed6c4; }

  .a-goal-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  .a-goal-table th, .a-goal-table td {
    text-align: left;
    padding: 10px 6px;
    border-bottom: 1px solid #eed6c4;
    font-size: 0.86rem;
  }
  .a-goal-table th {
    color: #8b6f5e;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }
  .a-progress {
    width: 100%;
    height: 7px;
    border-radius: 999px;
    background: #f1e4d8;
    overflow: hidden;
  }
  .a-progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #8b6f5e, #c8b6a6);
  }

  .a-empty { color: #8b6f5e; font-size: 0.9rem; margin-top: 8px; }
  .a-illus {
    position: absolute;
    right: 22px;
    bottom: 8px;
    width: 122px;
    height: 92px;
    opacity: 0.94;
  }

  @keyframes drift {
    0%, 100% { transform: translateY(0) translateX(0); }
    50% { transform: translateY(-10px) translateX(-6px); }
  }
  @keyframes rise {
    from { transform: scaleY(0.1); opacity: 0.25; }
    to { transform: scaleY(1); opacity: 1; }
  }
  @keyframes pulseRing {
    0%,100% { box-shadow: 0 0 0 0 rgba(139,111,94,0.14); }
    50% { box-shadow: 0 0 0 10px rgba(139,111,94,0.04); }
  }

  @media (max-width: 1050px) {
    .a-grid-main { grid-template-columns: 1fr; }
  }
  @media (max-width: 780px) {
    .a-shell, .a-shell.collapsed { grid-template-columns: 1fr; }
    .a-sidebar {
      min-height: auto;
      position: static;
      border-right: none;
      border-bottom: 1px solid #eed6c4;
    }
    .a-shell.collapsed .a-brand,
    .a-shell.collapsed .a-label,
    .a-shell.collapsed .a-note { display: inline; }
    .a-shell.collapsed .a-nav-btn { justify-content: flex-start; }
    .a-snapshot-grid { grid-template-columns: 1fr; }
  }
`;

function getDateKey(date = new Date()) {
  const offsetMins = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offsetMins * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getRecentDays(dayCount) {
  const today = new Date();
  const days = [];
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getDateKey(d);
    days.push({
      key,
      label: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 3),
    });
  }
  return days;
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function shortDuration(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  return `${mins}m`;
}

const navItems = ["Dashboard", "Analytics", "Study Group"];

export default function Analytics() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studyData, setStudyData] = useState({
    goals: [],
    goalStats: {},
    tasks: [],
    taskEvents: {},
  });
  const [windowSize, setWindowSize] = useState(7);
  const [chartMode, setChartMode] = useState("focus");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await fetchStudyData();
        if (!mounted) return;
        setStudyData(data);
      } catch {
        if (!mounted) return;
        setStudyData({ goals: [], goalStats: {}, tasks: [], taskEvents: {} });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(
    () =>
      Object.values(studyData.goalStats).sort(
        (a, b) => (b.totalSeconds ?? 0) - (a.totalSeconds ?? 0)
      ),
    [studyData.goalStats]
  );

  const totalGoals = rows.length;
  const totalSessions = rows.reduce((sum, row) => sum + (row.sessions ?? 0), 0);
  const totalSeconds = rows.reduce((sum, row) => sum + (row.totalSeconds ?? 0), 0);

  const todayKey = useMemo(() => getDateKey(), []);
  const todayTaskEvent = studyData.taskEvents[todayKey] ?? { added: 0, completed: 0 };
  const todayTasks = useMemo(
    () =>
      studyData.tasks.filter((task) => {
        const createdAt = Number(task.createdAt);
        if (!createdAt) return false;
        return getDateKey(new Date(createdAt)) === todayKey;
      }),
    [studyData.tasks, todayKey]
  );

  const todayAdded = Math.max(todayTaskEvent.added, todayTasks.length);
  const todayCompleted = Math.min(todayAdded, Math.max(0, todayTaskEvent.completed));
  const todayPending = Math.max(todayAdded - todayCompleted, 0);
  const todayCompletionRate = todayAdded > 0 ? Math.round((todayCompleted / todayAdded) * 100) : 0;

  const dayWindow = useMemo(() => getRecentDays(windowSize), [windowSize]);

  const series = useMemo(() => {
    return dayWindow.map((day) => {
      const focusSeconds = rows.reduce(
        (sum, row) => sum + (row.dailySeconds?.[day.key] ?? 0),
        0
      );
      const dayTasks = studyData.taskEvents[day.key] ?? { added: 0, completed: 0 };
      return {
        key: day.key,
        label: day.label,
        focusSeconds,
        sessions: Math.floor(focusSeconds / (25 * 60)),
        tasksCompleted: dayTasks.completed ?? 0,
      };
    });
  }, [dayWindow, rows, studyData.taskEvents]);

  const chartValues = useMemo(() => {
    if (chartMode === "sessions") {
      return series.map((item) => ({ ...item, value: item.sessions, valueLabel: `${item.sessions}` }));
    }
    if (chartMode === "tasks") {
      return series.map((item) => ({ ...item, value: item.tasksCompleted, valueLabel: `${item.tasksCompleted}` }));
    }
    return series.map((item) => ({ ...item, value: item.focusSeconds, valueLabel: shortDuration(item.focusSeconds) }));
  }, [series, chartMode]);

  const maxValue = useMemo(
    () => Math.max(...chartValues.map((item) => item.value), 1),
    [chartValues]
  );

  const topGoal = rows[0] ?? null;
  const topGoalPercent = totalSeconds > 0
    ? Math.round(((topGoal?.totalSeconds ?? 0) / totalSeconds) * 100)
    : 0;

  function handleNav(item) {
    if (item === "Analytics") return;
    if (item === "Dashboard") {
      navigate("/dashboard");
      return;
    }
    if (item === "Study Group") {
      navigate("/study-group");
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className={`a-shell ${collapsed ? "collapsed" : ""}`}>
        <aside className="a-sidebar">
          <div className="a-brand-row">
            <div className="a-brand">My <span>Kaksha</span></div>
            <button className="a-toggle" onClick={() => setCollapsed((v) => !v)} aria-label="Toggle Sidebar">
              {collapsed ? ">" : "<"}
            </button>
          </div>

          <nav className="a-nav" aria-label="Analytics Navigation">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                className={`a-nav-btn ${item === "Analytics" ? "active" : ""}`}
                onClick={() => handleNav(item)}
              >
                <span className="a-dot" aria-hidden="true" />
                <span className="a-label">{item}</span>
              </button>
            ))}
          </nav>

          <button className="a-back-btn" onClick={() => navigate("/")}>Back to Home</button>

          <div className="a-note">
            Visual analytics combines your goal focus time and daily task completion trends.
          </div>
        </aside>

        <main className="a-main">
          <section className="a-head-wrap">
            <div className="a-shape a-s1" />
            <div className="a-shape a-s2" />
            <div className="a-shape a-s3" />

            <h1 className="a-title">Study Analytics Studio</h1>
            <p className="a-sub">
              Interactive view of focus performance, goal contributions, and your tasks analysis of the day.
            </p>
            <svg className="a-illus" viewBox="0 0 140 110" fill="none" aria-hidden="true">
              <rect x="22" y="62" width="95" height="30" rx="7" fill="#E6D3C2" />
              <rect x="18" y="54" width="58" height="12" rx="4" fill="#F8EFE6" />
              <rect x="78" y="50" width="45" height="16" rx="4" fill="#D6E8DC" />
              <circle cx="107" cy="36" r="16" fill="#DDEAF7" />
              <path d="M107 27V45" stroke="#7D8FA7" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M98 36H116" stroke="#7D8FA7" strokeWidth="2.5" strokeLinecap="round" />
            </svg>

            <div className="a-control-row">
              <button className={`a-chip ${windowSize === 7 ? "active" : ""}`} onClick={() => setWindowSize(7)}>Last 7 days</button>
              <button className={`a-chip ${windowSize === 14 ? "active" : ""}`} onClick={() => setWindowSize(14)}>Last 14 days</button>
              <button className={`a-chip ${chartMode === "focus" ? "active" : ""}`} onClick={() => setChartMode("focus")}>Focus</button>
              <button className={`a-chip ${chartMode === "sessions" ? "active" : ""}`} onClick={() => setChartMode("sessions")}>Sessions</button>
              <button className={`a-chip ${chartMode === "tasks" ? "active" : ""}`} onClick={() => setChartMode("tasks")}>Tasks</button>
            </div>
          </section>

          {loading ? (
            <p className="a-empty">Loading analytics...</p>
          ) : (
            <>
              <section className="a-grid-main">
                <article className="a-card">
                  <h2 className="a-card-title">Trend Graph</h2>
                  <p className="a-card-sub">
                    {chartMode === "focus" ? "Daily focus minutes" : chartMode === "sessions" ? "Estimated sessions/day" : "Tasks completed/day"}
                  </p>

                  <div className="a-chart-wrap" style={{ "--count": chartValues.length }}>
                    {chartValues.map((item, idx) => {
                      const barHeight = Math.max(8, Math.round((item.value / maxValue) * 170));
                      return (
                        <div className="a-bar-col" key={item.key}>
                          <div className="a-bar-value">{item.valueLabel}</div>
                          <div className="a-bar" style={{ height: `${barHeight}px`, animationDelay: `${idx * 0.04}s` }} />
                          <div className="a-bar-label">{item.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="a-card">
                  <h2 className="a-card-title">Today Task Analysis</h2>
                  <p className="a-card-sub">Snapshot for {todayKey}</p>

                  <div className="a-donut-wrap">
                    <div className="a-donut" style={{ "--percent": `${todayCompletionRate}%` }}>
                      <div className="a-donut-center">
                        <div className="a-donut-big">{todayCompletionRate}%</div>
                        <div className="a-donut-small">done today</div>
                      </div>
                    </div>

                    <div className="a-legend">
                      <div className="a-legend-row">
                        <div className="a-legend-left"><span className="a-legend-dot done" /> Completed</div>
                        <strong>{todayCompleted}</strong>
                      </div>
                      <div className="a-legend-row">
                        <div className="a-legend-left"><span className="a-legend-dot pending" /> Pending</div>
                        <strong>{todayPending}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="a-snapshot-grid">
                    <div className="a-snap">
                      <div className="a-snap-label">Tasks Added</div>
                      <div className="a-snap-val">{todayAdded}</div>
                    </div>
                    <div className="a-snap">
                      <div className="a-snap-label">Completion Rate</div>
                      <div className="a-snap-val">{todayCompletionRate}%</div>
                    </div>
                    <div className="a-snap">
                      <div className="a-snap-label">Tracked Goals</div>
                      <div className="a-snap-val">{totalGoals}</div>
                    </div>
                    <div className="a-snap">
                      <div className="a-snap-label">Focus Logged</div>
                      <div className="a-snap-val">{formatDuration(totalSeconds)}</div>
                    </div>
                  </div>
                </article>
              </section>

              <section className="a-card">
                <h2 className="a-card-title">Goal Contribution Table</h2>
                <p className="a-card-sub">
                  Top goal: {topGoal ? `${topGoal.title} (${topGoalPercent}% of total focus)` : "No data yet"}
                </p>

                {rows.length === 0 ? (
                  <p className="a-empty">No analytics yet. Add goals and run Pomodoro sessions in Dashboard.</p>
                ) : (
                  <table className="a-goal-table">
                    <thead>
                      <tr>
                        <th>Goal</th>
                        <th>Sessions</th>
                        <th>Focus Time</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const completion = row.targetMinutes > 0
                          ? Math.min(100, Math.round(((row.totalSeconds ?? 0) / (row.targetMinutes * 60)) * 100))
                          : 0;
                        return (
                          <tr key={row.id}>
                            <td>{row.title}</td>
                            <td>{row.sessions ?? 0}</td>
                            <td>{formatDuration(row.totalSeconds ?? 0)}</td>
                            <td>
                              <div className="a-progress">
                                <div className="a-progress-fill" style={{ width: `${completion}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </>
  );
}
