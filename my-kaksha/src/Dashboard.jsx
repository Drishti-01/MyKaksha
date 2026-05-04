import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudyData, saveStudyData } from "./api/studyData";
import { useAuth } from "./auth/useAuth";
import AppSidebar from "./components/AppSidebar";
import timerBg from "./components/download (13).jpg";
import taskBg from "./components/Taskbg.jpg";
import goalsBg from "./components/bg.png";
import useSidebarState from "./components/useSidebarState";

const PROJECTS_STORAGE_KEY = "mykaksha_projects";
const FOCUS_STATS_STORAGE_KEY = "mykaksha_focus_stats";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .d-shell {
    min-height: 100vh;
    height: 100vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 280px 1fr;
    background: radial-gradient(circle at top right, #f3e8da 0%, #faf8f3 42%);
    color: #5a4a3a;
    font-family: 'Poppins', sans-serif;
  }

  .d-shell.collapsed {
    grid-template-columns: 94px 1fr;
  }

  .d-main {
    padding: 28px 32px 40px;
    height: 100vh;
    overflow-y: auto;
    min-width: 0;
  }

  @media (max-width: 780px) {
    .d-shell, .d-shell.collapsed { 
      grid-template-columns: 1fr; 
    }
  }
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

  .d-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; align-items: stretch; }
  .d-card {
    background: #fffdf9;
    border: 1px solid #eed6c4;
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 10px 26px rgba(200, 182, 166, 0.2);
  }
  .d-card-title { margin: 0 0 14px; color: #4a3728; font-weight: 700; }

  .d-task-card {
    position: relative;
    background-image: url("${taskBg}");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .d-task-card::before,
  .goals-card::before {
    content: "";
    position: absolute;
    inset: 12px;
    border: 1px dashed rgba(139, 111, 94, 0.18);
    border-radius: 20px;
    pointer-events: none;
  }

  .d-task-card::after {
    content: "";
    position: absolute;
    width: 90px;
    height: 90px;
    right: -26px;
    top: -24px;
    border-radius: 50%;
    background: radial-gradient(circle, #ffe3a3 0 34%, transparent 36%),
      conic-gradient(from 12deg, #eaa0a2 0 12%, transparent 12% 24%, #9ec7d7 24% 36%, transparent 36% 50%, #b5cf8d 50% 62%, transparent 62% 100%);
    opacity: 0.8;
    pointer-events: none;
  }

  .d-task-card-top {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }

  .d-section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .d-section-heading .d-card-title { margin: 0; }

  .d-mini-badge {
    min-height: 32px;
    border-radius: 999px;
    border: 1px solid rgba(139, 111, 94, 0.16);
    background: rgba(255, 253, 249, 0.78);
    color: #7a6151;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 11px;
    font-size: 0.74rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .d-badge-mark {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #e8a76f;
    box-shadow: 14px 0 0 #8bb6c8, 28px 0 0 #9dbb73;
    margin-right: 28px;
    flex-shrink: 0;
  }

  .d-task-scroll {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    max-height: 260px;
    overflow-y: auto;
    scroll-behavior: smooth;
    padding-right: 6px;
  }

  .d-active-goal-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .d-active-goal {
    display: inline-flex;
    align-items: center;
    border: 1px solid #eed6c4;
    border-radius: 999px;
    padding: 6px 10px;
    background: #faf8f3;
    font-size: 0.78rem;
    font-weight: 600;
    color: #8b6f5e;
  }

  .d-active-goal-clear {
    border: 1px solid #eed6c4;
    border-radius: 999px;
    background: #fffdf9;
    color: #8b6f5e;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    padding: 6px 12px;
  }
  .d-active-goal-clear:hover {
    color: #4a3728;
    background: #f5efe6;
  }

  .d-timer-wrap { display: grid; grid-template-columns: 1fr auto; gap: 14px; }
  .d-timer {
    border: 1px solid #eed6c4;
    border-radius: 18px;
    background-color: #e6f5e7;
    background-image: url("${timerBg}");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    padding: 18px;
    text-align: center;
  }
  .d-pill {
    border: 1px solid #733c11;
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
  .d-btn:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
    transform: none !important;
    box-shadow: none !important;
  }

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

  .d-productivity-strip {
    margin-top: 14px;
    border: 1px solid #e4d0be;
    border-radius: 1rem;
    background: #f3ebdf;
    box-shadow: 0 10px 22px rgba(182, 156, 133, 0.12);
    padding: 14px;
  }

  .d-productivity-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .d-productivity-stat {
    min-height: 82px;
    border-radius: 14px;
    background: rgba(255, 253, 249, 0.72);
    border: 1px solid rgba(140, 111, 94, 0.08);
    display: grid;
    place-items: center;
    text-align: center;
    padding: 12px 8px;
    transition: transform 160ms ease, box-shadow 160ms ease;
  }

  .d-productivity-stat:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(182, 156, 133, 0.14);
  }

  .d-productivity-value {
    display: block;
    color: #4a3728;
    font-size: 1.15rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .d-productivity-label {
    display: block;
    margin-top: 4px;
    color: #8b6f5e;
    font-size: 0.78rem;
    font-weight: 600;
    opacity: 0.88;
  }

  .d-task-add,
  .d-goal-add { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }

  .d-task-add input,
  .d-goal-add input {
    flex: 1;
    min-width: 220px;
    border: 1px solid #e5ceb9;
    border-radius: 12px;
    padding: 10px;
    background: rgba(255, 253, 249, 0.9);
    color: #5a4a3a;
    font-family: inherit;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  }

  .d-goal-add input[type="number"] { flex: 0 0 110px; min-width: 110px; }

  .d-task-list,
  .d-goal-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }

  .d-task-list {
    align-content: start;
  }

  .d-task-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .d-task-scroll::-webkit-scrollbar-thumb {
    background: #d9c4b2;
    border-radius: 999px;
  }

  .d-task-scroll::-webkit-scrollbar-track {
    background: #f5efe6;
    border-radius: 999px;
  }

  .d-task,
  .d-goal-item {
    border: 1px solid rgba(226, 203, 181, 0.86);
    border-radius: 16px;
    background: rgba(255, 253, 249, 0.86);
    padding: 11px;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
    box-shadow: 0 8px 18px rgba(156, 132, 112, 0.09);
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }

  .d-task:hover,
  .d-goal-item:hover {
    transform: translateY(-1px);
    border-color: #d9bda4;
    box-shadow: 0 12px 24px rgba(156, 132, 112, 0.13);
  }

  .d-task {
    justify-content: flex-start;
  }

  .d-task input[type="checkbox"] {
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 8px;
    border: 2px solid #d8bea8;
    background: #fffdf9;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .d-task input[type="checkbox"]::before {
    content: "";
    width: 10px;
    height: 6px;
    border-left: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: rotate(-45deg) scale(0);
    transform-origin: center;
    transition: transform 140ms ease;
  }

  .d-task input[type="checkbox"]:checked {
    border-color: #6f9b74;
    background: #6f9b74;
  }

  .d-task input[type="checkbox"]:checked::before {
    transform: rotate(-45deg) scale(1);
  }

  .d-task-icon {
    width: 30px;
    height: 30px;
    border-radius: 10px;
    background: linear-gradient(135deg, #ffe2aa, #f1b582);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #7d5435;
    font-size: 0.78rem;
    font-weight: 900;
    flex: 0 0 auto;
  }

  .d-task span { font-size: 0.9rem; }
  .d-task.done > span:not(.d-task-icon) { text-decoration: line-through; color: #b09f8f; }
  .d-task.done .d-task-icon {
    background: linear-gradient(135deg, #dceccd, #9fbe7b);
    color: #526f3f;
  }

  .goals-card {
    position: relative;
    overflow: hidden;
    display: grid;
    gap: 14px;
    background-image: url("${goalsBg}");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .goals-card::after {
    content: "";
    position: absolute;
    right: 22px;
    bottom: 18px;
    width: 104px;
    height: 62px;
    border-radius: 18px;
    background:
      linear-gradient(90deg, transparent 15px, rgba(139, 111, 94, 0.14) 16px 17px, transparent 18px),
      linear-gradient(#fff8ec 0 0);
    border: 1px solid rgba(139, 111, 94, 0.12);
    transform: rotate(-5deg);
    opacity: 0.68;
    pointer-events: none;
  }

  .goals-card > * {
    position: relative;
    z-index: 1;
  }

  .d-goal-add {
    padding: 12px;
    border-radius: 18px;
    border: 1px solid rgba(226, 203, 181, 0.7);
    background: rgba(255, 253, 249, 0.66);
    backdrop-filter: blur(8px);
  }

  .d-goal-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .d-goal-list .d-goal-item:only-child {
    grid-column: 1 / -1;
  }

  .d-goal-main { display: grid; gap: 7px; flex: 1; min-width: 0; }
  .d-goal-title { font-weight: 700; color: #4a3728; }
  .d-goal-meta { color: #8b6f5e; font-size: 0.8rem; }
  .d-goal-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }

  .d-goal-progress {
    height: 8px;
    border-radius: 999px;
    background: #eadccb;
    overflow: hidden;
  }

  .d-goal-progress span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #e9a66e, #7eb3c6, #83a95f);
  }

  .d-goal-kicker {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #7a6151;
    font-size: 0.76rem;
    font-weight: 800;
  }

  .d-goal-dot {
    width: 18px;
    height: 18px;
    border-radius: 6px;
    background: #8bb6c8;
    box-shadow: inset 0 0 0 4px #e7f4f7;
    flex: 0 0 auto;
  }

  .d-tracker-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .d-tracker-item {
    border: 1px solid;
    border-radius: 1rem;
    padding: 18px;
    box-shadow: 0 14px 30px rgba(119, 108, 96, 0.08);
    display: grid;
    gap: 16px;
  }
  .d-tracker-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .d-tracker-badge {
    min-width: 42px;
    height: 42px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #4a3728;
    font-size: 0.82rem;
    font-weight: 800;
  }
  .d-tracker-tag {
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(90, 74, 58, 0.08);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #6c5a4d;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }
  .d-tracker-copy { display: grid; gap: 6px; }
  .d-tracker-title {
    margin: 0;
    color: #4a3728;
    font-size: 1.15rem;
    font-weight: 800;
  }
  .d-tracker-desc {
    margin: 0;
    color: #7b6a5d;
    font-size: 0.88rem;
    line-height: 1.5;
  }
  .d-tracker-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .d-tracker-stat {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(90, 74, 58, 0.08);
    background: rgba(255, 255, 255, 0.55);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #5f4d40;
    font-size: 0.78rem;
    font-weight: 700;
  }
  .d-tracker-stat strong {
    color: #4a3728;
    font-size: 0.8rem;
  }
  .d-tracker-btn {
    width: 100%;
    min-height: 44px;
    border: none;
    border-radius: 999px;
    font-family: inherit;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .d-tracker-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .d-tracker-btn:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 980px) {
    .d-grid { grid-template-columns: 1fr; }
    .d-timer-wrap { grid-template-columns: 1fr; }
    .d-settings { width: 100%; }
    .d-tracker-grid { grid-template-columns: 1fr; }
    .d-productivity-grid { grid-template-columns: 1fr; }
    .d-goal-list { grid-template-columns: 1fr; }
  }

  .d-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; }
`;

const trackerData = {
  Projects: {
    badge: "PR",
    tag: "WORK LOG",
    description: "Track project work, status, and next moves for the day.",
    buttonLabel: "Add Project",
  },
  Plans: {
    badge: "PL",
    tag: "PLANNER",
    description: "Organize today's priorities, study blocks, and planned goals.",
    buttonLabel: "Update Plans",
    progress: 0,
    stats: [
      { label: "Total", value: 3 },
      { label: "Active", value: 0 },
      { label: "Completed", value: 0 },
    ],
  },
  Activities: {
    badge: "AC",
    tag: "ROUTINE",
    description: "Log daily habits, routines, and small wins in one place.",
    buttonLabel: "Log Activity",
    progress: 0,
    stats: [
      { label: "Total", value: 3 },
      { label: "Active", value: 0 },
      { label: "Completed", value: 0 },
    ],
  },
};

const trackerPreviewThemes = {
  Projects: {
    background: "#fff4eb",
    border: "#f2dac8",
    badge: "#f5d4bb",
    tag: "#fff8f1",
    track: "#f2dfd1",
    fill: "#d89a76",
    button: "#8f5f44",
    buttonText: "#fffaf6",
  },
  Plans: {
    background: "#f3f8ee",
    border: "#d7e6ca",
    badge: "#dceccb",
    tag: "#fbfdf8",
    track: "#dfebd6",
    fill: "#8bb06e",
    button: "#5f8150",
    buttonText: "#f8fff5",
  },
  Activities: {
    background: "#eef6fb",
    border: "#d1e3ef",
    badge: "#d5e9f7",
    tag: "#f8fcff",
    track: "#dae9f3",
    fill: "#7ea8c7",
    button: "#4f7595",
    buttonText: "#f7fbff",
  },
};

const navItems = ["Dashboard", "Analytics", "Projects", "Study Group"];

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
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

function loadFocusStats() {
  try {
    const raw = globalThis.localStorage?.getItem(FOCUS_STATS_STORAGE_KEY);
    if (!raw) {
      return { dailyCompleted: {}, totalFocusSeconds: 0, dailyActiveByUser: {} };
    }
    const parsed = JSON.parse(raw);
    return {
      dailyCompleted:
        parsed?.dailyCompleted && typeof parsed.dailyCompleted === "object" ? parsed.dailyCompleted : {},
      totalFocusSeconds: Number(parsed?.totalFocusSeconds) || 0,
      dailyActiveByUser:
        parsed?.dailyActiveByUser && typeof parsed.dailyActiveByUser === "object" ? parsed.dailyActiveByUser : {},
    };
  } catch {
    return { dailyCompleted: {}, totalFocusSeconds: 0, dailyActiveByUser: {} };
  }
}

function formatFocusDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getPreviousDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() - 1);
  return getDateKey(date);
}

function calculateStreak(dailyCompleted, todayKey) {
  let streak = 0;
  let cursor = todayKey;

  while ((Number(dailyCompleted[cursor]) || 0) > 0) {
    streak += 1;
    cursor = getPreviousDateKey(cursor);
  }

  return streak;
}

function loadProjectsSnapshot() {
  try {
    const raw = globalThis.localStorage?.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Dashboard({ onBackToLanding, onGoToAnalytics, onGoToStudyGroup, onGoToProjects }) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useSidebarState();
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
  const [projectsSnapshot, setProjectsSnapshot] = useState([]);
  const [focusStats, setFocusStats] = useState(loadFocusStats);

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
  const todayKey = useMemo(() => getDateKey(), []);
  const streakUserKey = useMemo(() => user?.id || user?.email || "guest", [user]);
  const projectStats = useMemo(() => {
    const total = projectsSnapshot.length;
    const completed = projectsSnapshot.filter((project) => project.status === "Completed").length;
    const ongoing = projectsSnapshot.filter((project) => project.status !== "Completed").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      ongoing,
      completed,
      progress,
    };
  }, [projectsSnapshot]);
  const productivityStats = useMemo(() => {
    const sessionsToday = Number(focusStats.dailyCompleted?.[todayKey]) || 0;
    const userActiveDays = focusStats.dailyActiveByUser?.[streakUserKey] ?? {};
    const streakSource = Object.keys(userActiveDays).length > 0 ? userActiveDays : (focusStats.dailyCompleted ?? {});
    const streak = calculateStreak(streakSource, todayKey);

    return {
      streak,
      sessionsToday,
      totalFocusTime: formatFocusDuration(focusStats.totalFocusSeconds || 0),
    };
  }, [focusStats, todayKey, streakUserKey]);

  useEffect(() => {
    if (!streakUserKey || streakUserKey === "guest") return;
    setFocusStats((prev) => {
      const byUser = prev.dailyActiveByUser ?? {};
      const currentUserDays = byUser[streakUserKey] ?? {};
      if (currentUserDays[todayKey]) return prev;
      return {
        ...prev,
        dailyActiveByUser: {
          ...byUser,
          [streakUserKey]: {
            ...currentUserDays,
            [todayKey]: 1,
          },
        },
      };
    });
  }, [streakUserKey, todayKey]);

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
    function syncProjectsSnapshot() {
      setProjectsSnapshot(loadProjectsSnapshot());
    }

    syncProjectsSnapshot();
    globalThis.addEventListener("focus", syncProjectsSnapshot);
    globalThis.addEventListener("storage", syncProjectsSnapshot);

    return () => {
      globalThis.removeEventListener("focus", syncProjectsSnapshot);
      globalThis.removeEventListener("storage", syncProjectsSnapshot);
    };
  }, []);

  useEffect(() => {
    globalThis.localStorage?.setItem(FOCUS_STATS_STORAGE_KEY, JSON.stringify(focusStats));
  }, [focusStats]);

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

  function recordCompletedFocusSession(durationSeconds) {
    setFocusStats((prev) => {
      const dailyCompleted = {
        ...(prev.dailyCompleted ?? {}),
        [todayKey]: (Number(prev.dailyCompleted?.[todayKey]) || 0) + 1,
      };

      return {
        dailyCompleted,
        totalFocusSeconds: (Number(prev.totalFocusSeconds) || 0) + durationSeconds,
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

        if (mode === "focus") {
          recordCompletedFocusSession(focusMinutes * 60);
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

  function clearGoalFromTimer() {
    setActiveGoalId(null);
    setMode("focus");
    setSecondsLeft(focusMinutes * 60);
    setRunning(false);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className={`d-shell ${collapsed ? "collapsed" : ""}`}>
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((s) => !s)}
          navItems={navItems}
          activeItem={activeNav}
          onNavigate={(item) => {
            setActiveNav(item);
            if (item === "Dashboard") return;
            if (item === "Analytics") {
              onGoToAnalytics?.();
              return;
            }
            if (item === "Projects") {
              onGoToProjects?.();
              return;
            }
            if (item === "Study Group") {
              onGoToStudyGroup?.();
            }
          }}
          primaryAction={{ label: "Back to Home", onClick: () => onBackToLanding?.() }}
          secondaryAction={{
            label: "Sign Out",
            onClick: async () => {
              await signOut();
              navigate("/login", { replace: true });
            },
          }}
          noteTitle={`Signed in as ${user?.name || "Student"}`}
          noteText="Set a goal, load it into the timer, and your study sessions auto-record for analytics."
          navAriaLabel="Dashboard navigation"
        />

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
              <h2 className="d-card-title">Focus Timer</h2>

              {activeGoal ? (
                <div className="d-active-goal-row">
                  <div className="d-active-goal">
                    Active Goal: {activeGoal.title} ({activeGoal.minutes} min)
                  </div>
                  <button
                    type="button"
                    className="d-active-goal-clear"
                    onClick={clearGoalFromTimer}
                  >
                    Remove
                  </button>
                </div>
              ) : null}

              <div className="d-timer-wrap">
                <div className="d-timer" style={{ backgroundImage: `url(${timerBg})` }}>
                  <span className="d-pill">{mode === "focus" ? "Focus Time" : "Break Time"}</span>
                  <div className="d-time">{formatTime(secondsLeft)}</div>
                  <div className="d-actions">
                    <button 
                      className="d-btn primary" 
                      onClick={() => setRunning((x) => !x)}
                      disabled={!dataReady}
                      aria-label={running ? "Pause timer" : "Start timer"}
                    >
                      {running ? "Pause" : "Start"}
                    </button>
                    <button 
                      className="d-btn soft" 
                      onClick={resetTimer}
                      disabled={!dataReady}
                      aria-label="Reset timer"
                    >
                      Reset
                    </button>
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
                      disabled={!dataReady}
                      aria-label={`Switch to ${mode === "focus" ? "break" : "focus"} mode`}
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

              <div className="d-productivity-strip">
                <div className="d-productivity-grid">
                  <div className="d-productivity-stat">
                    <div>
                      <span className="d-productivity-value">🔥 {productivityStats.streak}</span>
                      <span className="d-productivity-label">Day Streak</span>
                    </div>
                  </div>
                  <div className="d-productivity-stat">
                    <div>
                      <span className="d-productivity-value">🎯 {productivityStats.sessionsToday}</span>
                      <span className="d-productivity-label">Sessions Today</span>
                    </div>
                  </div>
                  <div className="d-productivity-stat">
                    <div>
                      <span className="d-productivity-value">⏱️ {productivityStats.totalFocusTime}</span>
                      <span className="d-productivity-label">Focus Time</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="d-card d-task-card">
              <div className="d-task-card-top">
                <div className="d-section-heading">
                  <h2 className="d-card-title">Tasks of the Day</h2>
                  <span className="d-mini-badge">
                    <span className="d-badge-mark" />
                    {tasks.filter((task) => !task.done).length} open
                  </span>
                </div>
                <div className="d-task-add">
                  <input
                    type="text"
                    value={taskText}
                    placeholder="Add a task for today"
                    onChange={(e) => setTaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask();
                    }}
                    disabled={!dataReady}
                  />
                  <button 
                    className="d-btn primary" 
                    onClick={addTask}
                    disabled={!dataReady || !taskText.trim()}
                    aria-label="Add new task"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="d-task-scroll">
                <ul className="d-task-list">
                  {tasks.map((task) => (
                    <li key={task.id} className={`d-task ${task.done ? "done" : ""}`}>
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                        aria-label={`Mark ${task.text} complete`}
                      />
                      <span className="d-task-icon">{task.done ? "OK" : "DO"}</span>
                      <span>{task.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section
              className="d-card goals-card"
              style={{ gridColumn: "1 / -1" }}
            >
              <div className="d-section-heading">
                <h2 className="d-card-title">Goals</h2>
                <span className="d-mini-badge">
                  <span className="d-badge-mark" />
                  {goals.length} goals
                </span>
              </div>
              <div className="d-goal-add">
                <input
                  type="text"
                  value={goalTitle}
                  placeholder="Goal title (ex: Physics revision)"
                  onChange={(e) => setGoalTitle(e.target.value)}
                  disabled={!dataReady}
                />
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={goalMinutes}
                  onChange={(e) => setGoalMinutes(Math.max(1, Number(e.target.value) || 1))}
                  disabled={!dataReady}
                />
                <button 
                  className="d-btn primary" 
                  onClick={addGoal}
                  disabled={!dataReady || !goalTitle.trim()}
                  aria-label="Add new goal"
                >
                  Add Goal
                </button>
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
                    const progress = Math.min(100, Math.round((studiedMins / goal.minutes) * 100));
                    return (
                      <li key={goal.id} className="d-goal-item">
                        <div className="d-goal-main">
                          <div className="d-goal-kicker">
                            <span className="d-goal-dot" />
                            Study target
                          </div>
                          <div className="d-goal-title">{goal.title}</div>
                          <div className="d-goal-meta">
                            Target: {goal.minutes} min • Studied: {studiedMins} min • Sessions: {sessions}
                          </div>
                          <div className="d-goal-progress" aria-label={`${goal.title} progress`}>
                            <span style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <div className="d-goal-actions">
                          <button 
                            className="d-btn soft" 
                            onClick={() => useGoalInTimer(goal)}
                            disabled={!dataReady}
                            aria-label={`Use ${goal.title} in timer`}
                          >
                            Use in Timer
                          </button>
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
                {Object.entries(trackerData).map(([title, card]) => {
                  const theme = trackerPreviewThemes[title];
                  const stats = title === "Projects"
                    ? [
                        { label: "Total", value: projectStats.total },
                        { label: "Ongoing", value: projectStats.ongoing },
                        { label: "Completed", value: projectStats.completed },
                      ]
                    : card.stats;
                  const progress = title === "Projects" ? projectStats.progress : card.progress;
                  const handleAction = title === "Projects" ? onGoToProjects : undefined;

                  return (
                    <article
                      key={title}
                      className="d-tracker-item"
                      style={{ background: theme.background, borderColor: theme.border }}
                    >
                      <div className="d-tracker-top">
                        <div className="d-tracker-badge" style={{ background: theme.badge }}>
                          {card.badge}
                        </div>
                        <div className="d-tracker-tag" style={{ background: theme.tag }}>
                          {card.tag}
                        </div>
                      </div>

                      <div className="d-tracker-copy">
                        <h3 className="d-tracker-title">{title}</h3>
                        <p className="d-tracker-desc">{card.description}</p>
                      </div>

                      <div className="d-tracker-stats">
                        {stats.map((stat) => (
                          <div key={stat.label} className="d-tracker-stat">
                            <strong>{stat.value}</strong>
                            <span>{stat.label}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="d-tracker-btn"
                        style={{ background: theme.button, color: theme.buttonText }}
                        onClick={handleAction}
                        disabled={!dataReady}
                        aria-label={`${card.buttonLabel} for ${title}`}
                      >
                        {!dataReady ? "Loading..." : card.buttonLabel}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
