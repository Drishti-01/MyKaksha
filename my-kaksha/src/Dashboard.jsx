import { useEffect, useMemo, useState } from "react";
import { fetchStudyData, saveStudyData } from "./api/studyData";
import { useNavigate } from "react-router-dom";

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

  .d-tracker-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .d-tracker-item {
    border: 1px solid #e7d2bf;
    border-radius: 20px;
    background: linear-gradient(145deg, #fffdf9, #f8f0e6);
    padding: 12px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 24px rgba(188, 160, 135, 0.2);
    transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
  }

  .d-tracker-item::before {
    content: "";
    position: absolute;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    top: -62px;
    right: -48px;
    background: rgba(255, 255, 255, 0.3);
    pointer-events: none;
  }

  .d-tracker-item:hover {
    transform: translateY(-5px) scale(1.015);
    box-shadow: 0 16px 30px rgba(171, 139, 111, 0.24);
    border-color: #dcbda2;
  }
  .d-tracker-preview {
    border-radius: 16px;
    min-height: 142px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 14px;
    color: #4a3728;
    margin-bottom: 0;
    border: 1px solid rgba(90, 74, 58, 0.1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  }

  .d-tracker-preview {
    border-radius: 16px;
    min-height: 142px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 14px;
    color: #4a3728;
    margin-bottom: 0;
    border: 1px solid rgba(90, 74, 58, 0.1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  }

  .d-tracker-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }

  .d-tracker-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid rgba(90, 74, 58, 0.18);
    background: rgba(255, 253, 249, 0.64);
    display: grid;
    place-items: center;
    font-size: 1rem;
    line-height: 1;
  }

  .d-tracker-chip {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    padding: 5px 8px;
    border-radius: 999px;
    border: 1px solid rgba(90, 74, 58, 0.18);
    background: rgba(255, 253, 249, 0.58);
    color: #6f5a47;
  }

  .d-tracker-meta h3 {
    margin: 0;
    font-size: 1.05rem;
    color: #4a3728;
  }

  .d-tracker-meta p {
    margin: 6px 0 0;
    font-size: 0.82rem;
    line-height: 1.55;
    color: #6f5a47;
  }

  .d-tracker-stats {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .d-stat-pill {
    border: 1px solid rgba(90, 74, 58, 0.14);
    border-radius: 999px;
    background: rgba(255, 253, 249, 0.64);
    color: #5f4d3d;
    font-size: 0.72rem;
    padding: 5px 9px;
    font-weight: 600;
  }

  .d-tracker-progress {
    margin-top: 11px;
  }

  .d-progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    font-weight: 700;
    color: #6f5a47;
    margin-bottom: 5px;
  }

  .d-progress-track {
    height: 7px;
    border-radius: 999px;
    background: rgba(90, 74, 58, 0.14);
    overflow: hidden;
  }

  .d-progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #c8b6a6, #8b6f5e);
  }

  .d-tracker-cta {
    margin-top: 12px;
    width: 100%;
    border: 1px solid rgba(90, 74, 58, 0.18);
    border-radius: 12px;
    background: rgba(255, 253, 249, 0.75);
    color: #5a4a3a;
    font-size: 0.76rem;
    font-weight: 700;
    padding: 8px 10px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .d-tracker-cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 14px rgba(172, 140, 112, 0.2);
    background: rgba(255, 253, 249, 0.92);
  }

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


const PROJECTS_STORAGE_KEY = "mykaksha_projects";
const PLANS_STORAGE_KEY = "mykaksha_plans";
const ACTIVITIES_STORAGE_KEY = "mykaksha_activities";

const trackerCards = [
  {
    title: "Projects",
    subtitle: "Track ongoing builds and completed milestones.",
    icon: "PR",
    chip: "Work Log",
    stats: [],
    progress: 0,
    cta: "Add Project",
  },
  {
    title: "Plans",
    subtitle: "Shape your day with clear, focused priorities.",
    icon: "PL",
    chip: "Planner",
    stats: ["Today 5 tasks", "Completed 3", "Next block 4:30 PM"],
    progress: 60,
    cta: "Update Plans",
  },
  {
    title: "Activities",
    subtitle: "Capture daily progress and learning momentum.",
    icon: "AC",
    chip: "Routine",
    stats: ["Streak 6 days", "Sessions 4", "Focus 125 min"],
    progress: 74,
    cta: "Log Activity",
  },
];

const trackerPreviewThemes = {
  Projects: "linear-gradient(140deg, #d6c3b1, #f5e7db)",
  Plans: "linear-gradient(140deg, #c9d7c1, #eef6e8)",
  Activities: "linear-gradient(140deg, #c4d8e8, #e8f4fb)",
};

const navItems = ["Dashboard", "Home", "Study Group"];

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getProjectsSummary() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    const projects = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(projects)) return { total: 0, completed: 0, active: 0 };
    const completed = projects.filter((project) => project.status === "Completed").length;
    return {
      total: projects.length,
      completed,
      active: projects.length - completed,
    };
  } catch {
    return { total: 0, completed: 0, active: 0 };
  }
}

function loadStringList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function shorten(text, max = 16) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function getDateKey(date = new Date()) {
  const offsetMins = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offsetMins * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function normalizeTask(task) {
  return {
    ...task,
    createdAt: Number(task.createdAt) || Date.now(),
  };
}

export default function Dashboard({ onBackToLanding, onGoToStudyGroup }) {

  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [skipBreaks, setSkipBreaks] = useState(false);
  const [mode, setMode] = useState("focus");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  const [tasks, setTasks] = useState([]);
  const [taskEvents, setTaskEvents] = useState({});
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
  const [projectsSummary, setProjectsSummary] = useState(() => getProjectsSummary());
  const [plans, setPlans] = useState(() => loadStringList(PLANS_STORAGE_KEY));
  const [activities, setActivities] = useState(() => loadStringList(ACTIVITIES_STORAGE_KEY));

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }),
    []
  );
  const todayKey = useMemo(() => getDateKey(), []);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await fetchStudyData();
        if (!mounted) return;
        setGoals(data.goals);
        setGoalStats(data.goalStats);
        setTasks(data.tasks.map(normalizeTask));
        setTaskEvents(data.taskEvents);
      } catch {
        if (!mounted) return;
        setGoals([]);
        setGoalStats({});
        setTasks([]);
        setTaskEvents({});
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
    saveStudyData({ goals, goalStats, tasks, taskEvents }).catch(() => {});
  }, [goals, goalStats, tasks, taskEvents, dataReady]);

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
          dailySeconds: {
            ...(previous.dailySeconds ?? {}),
            [todayKey]: (previous.dailySeconds?.[todayKey] ?? 0) + 1,
          },
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
  }, [running, mode, skipBreaks, focusMinutes, breakMinutes]);

  useEffect(() => {
    setProjectsSummary(getProjectsSummary());
    const onStorage = () => setProjectsSummary(getProjectsSummary());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  function addPlan() {
    const value = window.prompt("Add a plan for today:");
    if (!value) return;
    const text = value.trim();
    if (!text) return;
    setPlans((prev) => [text, ...prev]);
  }

  function addActivity() {
    const value = window.prompt("Add an activity:");
    if (!value) return;
    const text = value.trim();
    if (!text) return;
    setActivities((prev) => [text, ...prev]);
  }

  const trackerCardsWithProjects = useMemo(
    () =>
      trackerCards.map((card) => {
        if (card.title === "Projects") {
          const progress =
            projectsSummary.total === 0 ? 0 : Math.round((projectsSummary.completed / projectsSummary.total) * 100);
          return {
            ...card,
            stats: [
              `Total ${projectsSummary.total}`,
              `Active ${projectsSummary.active}`,
              `Completed ${projectsSummary.completed}`,
            ],
            progress,
          };
        }

        if (card.title === "Plans") {
          const totalPlans = plans.length;
          const latestPlan = plans[0] ? shorten(plans[0]) : "None";
          const progress = Math.min(100, totalPlans * 20);
          return {
            ...card,
            stats: [`Total ${totalPlans}`, `Added today ${totalPlans}`, `Latest ${latestPlan}`],
            progress,
          };
        }

        if (card.title === "Activities") {
          const totalActivities = activities.length;
          const latestActivity = activities[0] ? shorten(activities[0]) : "None";
          const progress = Math.min(100, totalActivities * 20);
          return {
            ...card,
            stats: [`Total ${totalActivities}`, `Logged ${totalActivities}`, `Latest ${latestActivity}`],
            progress,
          };
        }

        return card;
      }),
    [projectsSummary, plans, activities]
  );

  function resetTimer() {
    setRunning(false);
    setSecondsLeft((mode === "focus" ? focusMinutes : breakMinutes) * 60);
  }

  function addTask() {
    const value = taskText.trim();
    if (!value) return;
    setTasks((prev) => [{ id: Date.now(), text: value, done: false, createdAt: Date.now() }, ...prev]);
    setTaskEvents((prev) => {
      const day = prev[todayKey] ?? { added: 0, completed: 0 };
      return {
        ...prev,
        [todayKey]: { ...day, added: day.added + 1 },
      };
    });
    setTaskText("");
  }

  function toggleTask(id) {
    let becameDone = false;
    let becameUndone = false;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const nextDone = !task.done;
        if (!task.done && nextDone) becameDone = true;
        if (task.done && !nextDone) becameUndone = true;
        return { ...task, done: nextDone, updatedAt: Date.now() };
      })
    );

    if (!becameDone && !becameUndone) return;

    setTaskEvents((prev) => {
      const day = prev[todayKey] ?? { added: 0, completed: 0 };
      const delta = becameDone ? 1 : -1;
      return {
        ...prev,
        [todayKey]: { ...day, completed: Math.max(0, day.completed + delta) },
      };
    });
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
            {navItems.map((item) => (
              <button
                key={item}
                className={`d-nav-btn ${activeNav === item ? "active" : ""}`}
                onClick={() => {
                  setActiveNav(item);
                  if (item === "Home") {
                    onBackToLanding?.();
                    return;
                  }
                  if (item === "Study Group") {
                    onGoToStudyGroup?.();
                  }
                }}
              >
                <span className="d-dot" aria-hidden="true" />
                <span className="d-label">{item}</span>
              </button>
            ))}
          </nav>

          <button className="d-btn soft d-back-btn" onClick={onBackToLanding}>Back to Home</button>

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
                {trackerCardsWithProjects.map((card) => (
                  <article key={card.title} className="d-tracker-item">
                    <div
                      className="d-tracker-preview"
                      style={{ background: trackerPreviewThemes[card.title] }}
                    >
                      <div className="d-tracker-top">
                        <span className="d-tracker-icon" aria-hidden="true">{card.icon}</span>
                        <span className="d-tracker-chip">{card.chip}</span>
                      </div>
                      <div className="d-tracker-meta">
                        <h3>{card.title}</h3>
                        <p>{card.subtitle}</p>
                      </div>

                      <div className="d-tracker-stats">
                        {card.stats.map((stat) => (
                          <span key={stat} className="d-stat-pill">{stat}</span>
                        ))}
                      </div>

                      <div className="d-tracker-progress">
                        <div className="d-progress-label">
                          <span>Today</span>
                          <span>{card.progress}%</span>
                        </div>
                        <div className="d-progress-track">
                          <div className="d-progress-fill" style={{ width: `${card.progress}%` }} />
                        </div>
                      </div>

                      <button
                        className="d-tracker-cta"
                        type="button"
                        onClick={() => {
                          if (card.title === "Projects") navigate("/projects");
                          if (card.title === "Plans") addPlan();
                          if (card.title === "Activities") addActivity();
                        }}
                      >
                        {card.cta}
                      </button>
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
