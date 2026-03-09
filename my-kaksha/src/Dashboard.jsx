import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudyData, saveStudyData } from "./api/studyData";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .d-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 280px 1fr;
    background: radial-gradient(circle at top right, #f3e8da 0%, #faf8f3 42%);
    color: #5a4a3a;
    font-family: 'Poppins', sans-serif;
  }

  .d-shell.collapsed { grid-template-columns: 94px 1fr; }

  .d-sidebar {
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

  .d-brand-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .d-brand { font-size: 1.2rem; font-weight: 800; color: #8b6f5e; white-space: nowrap; }
  .d-brand span { color: #c8b6a6; }

  .d-toggle {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid #eed6c4;
    background: #faf8f3;
    color: #8b6f5e;
    cursor: pointer;
    font-weight: 700;
  }

  .d-nav { display: grid; gap: 8px; }
  .d-nav-btn {
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
  .d-nav-btn:hover { background: #f5efe6; border-color: #eed6c4; }
  .d-nav-btn.active {
    background: linear-gradient(135deg, #eed6c4, #dac1ad);
    border-color: #c8b6a6;
    color: #4a3728;
  }
  .d-dot { width: 8px; height: 8px; border-radius: 50%; background: #c8b6a6; flex-shrink: 0; }

  .d-shell.collapsed .d-brand,
  .d-shell.collapsed .d-label,
  .d-shell.collapsed .d-note { display: none; }
  .d-shell.collapsed .d-nav-btn { justify-content: center; }

  .d-note {
    margin-top: auto;
    border: 1px solid #eed6c4;
    background: #faf8f3;
    border-radius: 14px;
    padding: 10px;
    color: #8b6f5e;
    font-size: 0.76rem;
    line-height: 1.5;
  }

  .d-main { padding: 26px; }
  .d-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; }
  .d-title { margin: 0; font-size: clamp(1.4rem, 2.2vw, 2rem); color: #4a3728; }
  .d-sub { margin: 5px 0 0; color: #8b6f5e; font-size: 0.9rem; }
  .d-day {
    border: 1px solid #eed6c4;
    background: #fffdf9;
    border-radius: 999px;
    padding: 10px 14px;
    color: #8b6f5e;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .d-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; align-items: start; }
  .d-card {
    background: #fffdf9;
    border: 1px solid #eed6c4;
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 10px 26px rgba(200, 182, 166, 0.2);
  }
  .d-card-title { margin: 0 0 14px; color: #4a3728; font-weight: 700; }

  .d-active-goal {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #eed6c4;
    border-radius: 999px;
    padding: 6px 10px;
    background: #faf8f3;
    font-size: 0.78rem;
    font-weight: 600;
    color: #8b6f5e;
    margin-bottom: 10px;
  }

  .d-timer-wrap { display: grid; grid-template-columns: 1fr auto; gap: 14px; }
  .d-timer {
    border: 1px solid #eed6c4;
    border-radius: 18px;
    background: linear-gradient(145deg, #f5efe6, #faf8f3);
    padding: 18px;
    text-align: center;
  }
  .d-pill {
    border: 1px solid #eed6c4;
    border-radius: 999px;
    background: #fffdf9;
    color: #8b6f5e;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 5px 10px;
    display: inline-block;
  }
  .d-time { margin: 12px 0; font-size: clamp(2.1rem, 5.2vw, 3.2rem); color: #4a3728; font-weight: 800; letter-spacing: 1px; }
  .d-actions { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }

  .d-btn {
    border: none;
    border-radius: 999px;
    padding: 8px 14px;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.82rem;
  }
  .d-btn.primary { background: linear-gradient(135deg, #c8b6a6, #8b6f5e); color: #fff; }
  .d-btn.soft { border: 1px solid #eed6c4; background: #f5efe6; color: #8b6f5e; }

  .d-settings {
    width: min(220px, 100%);
    border: 1px solid #eed6c4;
    background: #faf8f3;
    border-radius: 16px;
    padding: 12px;
  }
  .d-settings h4 { margin: 0 0 10px; color: #5a4a3a; font-size: 0.9rem; }
  .d-setting-row {
    display: grid;
    grid-template-columns: 1fr 64px;
    gap: 6px;
    align-items: center;
    margin-bottom: 7px;
  }
  .d-setting-row label { color: #8b6f5e; font-size: 0.8rem; font-weight: 600; }
  .d-setting-row input {
    width: 100%;
    border: 1px solid #e5ceb9;
    background: #fffdf9;
    border-radius: 8px;
    padding: 6px;
    font-family: inherit;
    color: #5a4a3a;
  }
  .d-skip { margin-top: 8px; display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #8b6f5e; font-weight: 600; }

  .d-task-add,
  .d-goal-add { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }

  .d-task-add input,
  .d-goal-add input {
    flex: 1;
    min-width: 220px;
    border: 1px solid #e5ceb9;
    border-radius: 12px;
    padding: 10px;
    background: #faf8f3;
    color: #5a4a3a;
    font-family: inherit;
  }

  .d-goal-add input[type="number"] { flex: 0 0 110px; min-width: 110px; }

  .d-task-list,
  .d-goal-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }

  .d-task,
  .d-goal-item {
    border: 1px solid #eed6c4;
    border-radius: 12px;
    background: #faf8f3;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
  }

  .d-task span { font-size: 0.9rem; }
  .d-task.done span { text-decoration: line-through; color: #b09f8f; }

  .d-goal-main { display: grid; gap: 4px; }
  .d-goal-title { font-weight: 700; color: #4a3728; }
  .d-goal-meta { color: #8b6f5e; font-size: 0.8rem; }
  .d-goal-actions { display: flex; gap: 6px; flex-wrap: wrap; }

  .d-tracker-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .d-tracker-item {
    border: 1px solid #eed6c4;
    border-radius: 16px;
    background: #faf8f3;
    padding: 10px;
  }
  .d-tracker-preview {
    border-radius: 12px;
    min-height: 120px;
    display: flex;
    align-items: flex-end;
    padding: 10px;
    color: #4a3728;
    font-weight: 800;
    letter-spacing: 0.2px;
    margin-bottom: 10px;
    border: 1px solid rgba(90, 74, 58, 0.12);
  }
  .d-tracker-box {
    border: 1px solid #eed6c4;
    border-radius: 14px;
    background: #f5efe6;
    padding: 12px;
  }
  .d-tracker-box p { margin: 0 0 6px; color: #5a4a3a; font-size: 0.9rem; }
  .d-tracker-box ul { margin: 0; padding-left: 18px; color: #8b6f5e; font-size: 0.85rem; line-height: 1.6; }

  @media (max-width: 980px) {
    .d-grid { grid-template-columns: 1fr; }
    .d-timer-wrap { grid-template-columns: 1fr; }
    .d-settings { width: 100%; }
    .d-tracker-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 780px) {
    .d-shell, .d-shell.collapsed { grid-template-columns: 1fr; }
    .d-sidebar {
      min-height: auto;
      position: static;
      border-right: none;
      border-bottom: 1px solid #eed6c4;
    }
    .d-shell.collapsed .d-brand,
    .d-shell.collapsed .d-label,
    .d-shell.collapsed .d-note { display: inline; }
    .d-shell.collapsed .d-nav-btn { justify-content: flex-start; }
  }
`;

const trackerData = {
  Projects: [
    "Finish dashboard UI polish",
    "Sync API for progress stats",
    "Push branch for review",
  ],
  Plans: [
    "2 focus sessions before lunch",
    "Revise DSA after break",
    "Plan top 3 for tomorrow",
  ],
  Activities: [
    "Read one chapter",
    "Solve 20 practice questions",
    "Quick stretch + hydration",
  ],
};

const trackerPreviewThemes = {
  Projects: "linear-gradient(140deg, #d6c3b1, #f5e7db)",
  Plans: "linear-gradient(140deg, #c9d7c1, #eef6e8)",
  Activities: "linear-gradient(140deg, #c4d8e8, #e8f4fb)",
};

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [skipBreaks, setSkipBreaks] = useState(false);
  const [mode, setMode] = useState("focus");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  const [tasks, setTasks] = useState([
    { id: 1, text: "Revise DBMS unit 3", done: false },
    { id: 2, text: "Complete DAA notes", done: true },
  ]);
  const [taskText, setTaskText] = useState("");

  const [goals, setGoals] = useState([]);
  const [goalStats, setGoalStats] = useState({});
  const [dataReady, setDataReady] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalMinutes, setGoalMinutes] = useState(25);
  const [activeGoalId, setActiveGoalId] = useState(null);

  const activeGoal = useMemo(
    () => goals.find((goal) => goal.id === activeGoalId) ?? null,
    [goals, activeGoalId]
  );

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }),
    []
  );

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await fetchStudyData();
        if (!mounted) return;
        setGoals(data.goals);
        setGoalStats(data.goalStats);
      } catch {
        if (!mounted) return;
        setGoals([]);
        setGoalStats({});
      } finally {
        if (mounted) setDataReady(true);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!dataReady) return;
    saveStudyData({ goals, goalStats }).catch(() => {});
  }, [goals, goalStats, dataReady]);

  useEffect(() => {
    setSecondsLeft((mode === "focus" ? focusMinutes : breakMinutes) * 60);
    setRunning(false);
  }, [focusMinutes, breakMinutes, mode]);

  function addGoalStatsSecond(goal) {
    setGoalStats((prev) => {
      const previous = prev[goal.id] ?? {
        id: goal.id,
        title: goal.title,
        targetMinutes: goal.minutes,
        sessions: 0,
        totalSeconds: 0,
      };
      return {
        ...prev,
        [goal.id]: {
          ...previous,
          title: goal.title,
          targetMinutes: goal.minutes,
          totalSeconds: previous.totalSeconds + 1,
        },
      };
    });
  }

  function markCompletedSession(goal) {
    setGoalStats((prev) => {
      const previous = prev[goal.id] ?? {
        id: goal.id,
        title: goal.title,
        targetMinutes: goal.minutes,
        sessions: 0,
        totalSeconds: 0,
      };
      return {
        ...prev,
        [goal.id]: {
          ...previous,
          title: goal.title,
          targetMinutes: goal.minutes,
          sessions: previous.sessions + 1,
        },
      };
    });
  }

  useEffect(() => {
    if (!running) return;

    const timerId = setInterval(() => {
      setSecondsLeft((current) => {
        const shouldRecord = mode === "focus" && activeGoal;

        if (current > 1) {
          if (shouldRecord) addGoalStatsSecond(activeGoal);
          return current - 1;
        }

        if (shouldRecord) {
          addGoalStatsSecond(activeGoal);
          markCompletedSession(activeGoal);
        }

        const nextMode = mode === "focus" ? "break" : "focus";
        if (nextMode === "break" && skipBreaks) {
          setMode("focus");
          return focusMinutes * 60;
        }

        setMode(nextMode);
        return (nextMode === "focus" ? focusMinutes : breakMinutes) * 60;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [running, mode, skipBreaks, focusMinutes, breakMinutes, activeGoal]);

  function resetTimer() {
    setRunning(false);
    setSecondsLeft((mode === "focus" ? focusMinutes : breakMinutes) * 60);
  }

  function addTask() {
    const value = taskText.trim();
    if (!value) return;
    setTasks((prev) => [{ id: Date.now(), text: value, done: false }, ...prev]);
    setTaskText("");
  }

  function toggleTask(id) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function addGoal() {
    const cleanTitle = goalTitle.trim();
    if (!cleanTitle) return;

    const goal = {
      id: Date.now(),
      title: cleanTitle,
      minutes: Math.max(1, Number(goalMinutes) || 1),
    };

    setGoals((prev) => [goal, ...prev]);
    setGoalTitle("");
    setGoalMinutes(25);
  }

  function useGoalInTimer(goal) {
    setActiveGoalId(goal.id);
    setFocusMinutes(goal.minutes);
    setMode("focus");
    setSecondsLeft(goal.minutes * 60);
    setRunning(false);
  }

  function navTo(label, path) {
    setActiveNav(label);
    navigate(path);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className={`d-shell ${collapsed ? "collapsed" : ""}`}>
        <aside className="d-sidebar">
          <div className="d-brand-row">
            <div className="d-brand">My <span>Kaksha</span></div>
            <button className="d-toggle" onClick={() => setCollapsed((s) => !s)} aria-label="Toggle Sidebar">
              {collapsed ? ">" : "<"}
            </button>
          </div>

          <nav className="d-nav" aria-label="Dashboard Navigation">
            <button className={`d-nav-btn ${activeNav === "Dashboard" ? "active" : ""}`} onClick={() => setActiveNav("Dashboard")}>
              <span className="d-dot" aria-hidden="true" />
              <span className="d-label">Dashboard</span>
            </button>
            <button className={`d-nav-btn ${activeNav === "Analytics" ? "active" : ""}`} onClick={() => navTo("Analytics", "/analytics")}>
              <span className="d-dot" aria-hidden="true" />
              <span className="d-label">Analytics</span>
            </button>
            <button className="d-nav-btn" onClick={() => navigate("/")}>
              <span className="d-dot" aria-hidden="true" />
              <span className="d-label">Landing</span>
            </button>
          </nav>

          <div className="d-note">
            Set a goal, load it into the timer, and your goal study sessions will auto-record for analytics.
          </div>
        </aside>

        <main className="d-main">
          <div className="d-head">
            <div>
              <h1 className="d-title">Dashboard</h1>
              <p className="d-sub">Goal-based study sessions with Pomodoro tracking.</p>
            </div>
            <div className="d-day">{todayLabel}</div>
          </div>

          <div className="d-grid">
            <section className="d-card">
              <h2 className="d-card-title">Cutesy Focus Timer</h2>

              {activeGoal ? (
                <div className="d-active-goal">
                  Active Goal: {activeGoal.title} ({activeGoal.minutes} min)
                </div>
              ) : null}

              <div className="d-timer-wrap">
                <div className="d-timer">
                  <span className="d-pill">{mode === "focus" ? "Focus Time" : "Break Time"}</span>
                  <div className="d-time">{formatTime(secondsLeft)}</div>
                  <div className="d-actions">
                    <button className="d-btn primary" onClick={() => setRunning((x) => !x)}>
                      {running ? "Pause" : "Start"}
                    </button>
                    <button className="d-btn soft" onClick={resetTimer}>Reset</button>
                    <button
                      className="d-btn soft"
                      onClick={() => {
                        const next = mode === "focus" ? "break" : "focus";
                        if (next === "break" && skipBreaks) {
                          setMode("focus");
                          setSecondsLeft(focusMinutes * 60);
                          return;
                        }
                        setMode(next);
                        setSecondsLeft((next === "focus" ? focusMinutes : breakMinutes) * 60);
                        setRunning(false);
                      }}
                    >
                      Switch
                    </button>
                  </div>
                </div>

                <div className="d-settings">
                  <h4>Timer Settings</h4>
                  <div className="d-setting-row">
                    <label htmlFor="focusMins">Focus</label>
                    <input
                      id="focusMins"
                      type="number"
                      min="1"
                      max="180"
                      value={focusMinutes}
                      onChange={(e) => setFocusMinutes(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <div className="d-setting-row">
                    <label htmlFor="breakMins">Break</label>
                    <input
                      id="breakMins"
                      type="number"
                      min="1"
                      max="60"
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <label className="d-skip" htmlFor="skipBreaks">
                    <input
                      id="skipBreaks"
                      type="checkbox"
                      checked={skipBreaks}
                      onChange={(e) => setSkipBreaks(e.target.checked)}
                    />
                    Skip breaks
                  </label>
                </div>
              </div>
            </section>

            <section className="d-card">
              <h2 className="d-card-title">Tasks of the Day</h2>
              <div className="d-task-add">
                <input
                  type="text"
                  value={taskText}
                  placeholder="Add a task for today"
                  onChange={(e) => setTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTask();
                  }}
                />
                <button className="d-btn primary" onClick={addTask}>Add</button>
              </div>

              <ul className="d-task-list">
                {tasks.map((task) => (
                  <li key={task.id} className={`d-task ${task.done ? "done" : ""}`}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      aria-label={`Mark ${task.text} complete`}
                    />
                    <span>{task.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="d-card" style={{ gridColumn: "1 / -1" }}>
              <h2 className="d-card-title">Goals</h2>
              <div className="d-goal-add">
                <input
                  type="text"
                  value={goalTitle}
                  placeholder="Goal title (ex: Physics revision)"
                  onChange={(e) => setGoalTitle(e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={goalMinutes}
                  onChange={(e) => setGoalMinutes(Math.max(1, Number(e.target.value) || 1))}
                />
                <button className="d-btn primary" onClick={addGoal}>Add Goal</button>
              </div>

              <ul className="d-goal-list">
                {goals.length === 0 ? (
                  <li className="d-goal-item">
                    <div className="d-goal-main">
                      <div className="d-goal-title">No goals yet</div>
                      <div className="d-goal-meta">Create a goal and set its focus duration to sync with Pomodoro.</div>
                    </div>
                  </li>
                ) : (
                  goals.map((goal) => {
                    const stats = goalStats[goal.id];
                    const studiedMins = Math.floor((stats?.totalSeconds ?? 0) / 60);
                    const sessions = stats?.sessions ?? 0;
                    return (
                      <li key={goal.id} className="d-goal-item">
                        <div className="d-goal-main">
                          <div className="d-goal-title">{goal.title}</div>
                          <div className="d-goal-meta">
                            Target: {goal.minutes} min • Studied: {studiedMins} min • Sessions: {sessions}
                          </div>
                        </div>
                        <div className="d-goal-actions">
                          <button className="d-btn soft" onClick={() => useGoalInTimer(goal)}>Use in Timer</button>
                          {goal.id === activeGoalId ? <span className="d-pill">Active</span> : null}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>

            <section className="d-card" style={{ gridColumn: "1 / -1" }}>
              <h2 className="d-card-title">Daily Tracker</h2>
              <div className="d-tracker-grid">
                {Object.entries(trackerData).map(([title, items]) => (
                  <article key={title} className="d-tracker-item">
                    <div
                      className="d-tracker-preview"
                      style={{ background: trackerPreviewThemes[title] }}
                      role="img"
                      aria-label={`${title} preview`}
                    >
                      {title}
                    </div>
                    <div className="d-tracker-box">
                      <p>{title} for today:</p>
                      <ul>
                        {items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
