import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudyData } from "./api/studyData";
import { fetchRoomContributionApi, fetchWeeklySummaryApi } from "./api/rooms";
import { useAuth } from "./auth/useAuth";
import AppSidebar from "./components/AppSidebar";
import EmptyStatePrompt from "./components/Analytics/EmptyStatePrompt";
import QuickInsights from "./components/Analytics/QuickInsights";
import StreakTracker from "./components/Analytics/StreakTracker";
import useSidebarState from "./components/useSidebarState";
import WeeklySummaryCard from "./components/Analytics/WeeklySummaryCard";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }

  .a-shell {
    min-height: 100vh;
    height: 100vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 280px 1fr;
    background: radial-gradient(circle at top right, #f3e8da 0%, #faf8f3 42%);
    color: #5a4a3a;
    font-family: 'Poppins', sans-serif;
  }
  
  .a-shell.collapsed { 
    grid-template-columns: 94px 1fr; 
  }

  .a-main { 
    padding: 32px 40px 48px;
    overflow-y: auto; 
    height: 100vh; 
    min-width: 0; 
  }

  @media (max-width: 780px) {
    .a-shell, .a-shell.collapsed { 
      grid-template-columns: 1fr; 
    }
    .a-main {
      padding: 24px 20px 32px;
    }
  }

  .a-head-wrap {
    position: relative;
    background: linear-gradient(130deg, #fffdf9, #f7f0e6);
    border: 1px solid #eed6c4;
    border-radius: 24px;
    padding: 32px 28px;
    margin-bottom: 32px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(200, 182, 166, 0.15);
  }
  .a-title { 
    margin: 0 0 8px; 
    color: #4a3728; 
    font-size: clamp(1.6rem, 2.4vw, 2.2rem);
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  
  .a-sub { 
    margin: 0 0 24px; 
    color: #8b6f5e; 
    font-size: 1rem; 
    max-width: 640px;
    line-height: 1.6;
  }
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
    margin-top: 20px;
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .a-chip {
    border: 1px solid #eed6c4;
    background: #fffdf9;
    border-radius: 999px;
    color: #8b6f5e;
    padding: 10px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(200, 182, 166, 0.1);
  }
  
  .a-chip:hover {
    background: #f5efe6;
    border-color: #c8b6a6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(200, 182, 166, 0.15);
  }
  
  .a-chip:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    pointer-events: none;
  }
  
  .a-chip.loading {
    background: #f0f9ff;
    border-color: #93c5fd;
    color: #1e40af;
  }
  
  .a-spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .a-chip.active {
    border-color: #c8b6a6;
    background: linear-gradient(135deg, #eed6c4, #dac1ad);
    color: #4a3728;
    box-shadow: 0 4px 16px rgba(200, 182, 166, 0.25);
  }
  
  .a-chip-export {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe) !important;
    color: #3730a3 !important;
    border-color: #a5b4fc !important;
  }
  
  .a-chip-export:hover {
    background: linear-gradient(135deg, #c7d2fe, #a5b4fc) !important;
    transform: translateY(-2px);
  }
  
  .a-chip-success {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0) !important;
    color: #065f46 !important;
    border-color: #10b981 !important;
  }

  .a-grid-main {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 24px;
    margin-bottom: 24px;
  }

  @media (max-width: 1200px) {
    .a-grid-main {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }
  
  @media (max-width: 768px) {
    .a-performance-grid {
      grid-template-columns: 1fr;
    }
    
    .a-performance-card {
      flex-direction: column;
      text-align: center;
      gap: 12px;
    }
    
    .a-insight-card {
      flex-direction: column;
      text-align: center;
      gap: 12px;
    }
    
    .a-control-row {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
    
    .a-chip {
      text-align: center;
      min-height: 44px; /* Better touch target */
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .a-card {
    background: #fffdf9;
    border: 1px solid #eed6c4;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 8px 24px rgba(200, 182, 166, 0.12);
    transition: all 0.3s ease;
  }
  
  .a-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(200, 182, 166, 0.18);
  }
  
  .a-card-title { 
    margin: 0 0 8px; 
    color: #4a3728; 
    font-size: 1.1rem;
    font-weight: 700;
  }
  
  .a-card-sub { 
    margin: 0 0 20px; 
    font-size: 0.9rem; 
    color: #8b6f5e;
    line-height: 1.5;
  }

  .a-chart-wrap {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(var(--count), minmax(0, 1fr));
    gap: 12px;
    align-items: end;
    min-height: 240px;
    padding: 20px 16px;
    background: linear-gradient(180deg, #faf8f3 0%, #f5efe6 100%);
    border-radius: 16px;
    border: 1px solid #eed6c4;
  }
  .a-bar-col { 
    display: grid; 
    gap: 8px; 
    justify-items: center; 
  }
  
  .a-bar {
    width: 100%;
    max-width: 32px;
    border-radius: 8px 8px 4px 4px;
    background: linear-gradient(180deg, #8b6f5e, #c8b6a6);
    min-height: 3px;
    transform-origin: bottom;
    animation: rise 0.8s ease both;
    cursor: help;
    transition: all 0.2s ease;
  }
  
  .a-bar:hover {
    transform: scaleY(1.05);
    box-shadow: 0 4px 12px rgba(139, 111, 94, 0.3);
  }
  
  .a-bar.placeholder {
    background: repeating-linear-gradient(
      180deg,
      #e5d8cd 0px,
      #e5d8cd 4px,
      #f5efe6 4px,
      #f5efe6 8px
    );
    opacity: 0.7;
  }
  
  .a-bar-label { 
    font-size: 0.75rem; 
    color: #8b6f5e; 
    font-weight: 600; 
  }
  
  .a-bar-value { 
    font-size: 0.7rem; 
    color: #5a4a3a; 
    font-weight: 600;
  }

  .a-snapshot-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 20px;
  }
  
  .a-snap {
    background: linear-gradient(135deg, #faf6f1, #f5efe6);
    border: 1px solid #eed6c4;
    border-radius: 16px;
    padding: 16px;
    text-align: center;
    transition: all 0.2s ease;
  }
  
  .a-snap:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(200, 182, 166, 0.15);
  }
  
  .a-snap-label { 
    color: #8b6f5e; 
    font-size: 0.8rem; 
    font-weight: 600;
    margin-bottom: 8px;
    display: block;
  }
  
  .a-snap-val { 
    margin-top: 4px; 
    color: #4a3728; 
    font-size: 1.6rem; 
    font-weight: 800;
    line-height: 1.2;
  }

  .a-donut-wrap {
    display: grid;
    gap: 20px;
    justify-items: center;
    padding: 20px 0;
  }
  
  .a-donut {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    position: relative;
    background: conic-gradient(#8b6f5e var(--percent), #eed6c4 0);
    transition: background 0.6s ease;
    animation: pulseRing 3.5s ease-in-out infinite;
    box-shadow: 0 8px 24px rgba(139, 111, 94, 0.2);
  }
  
  .a-donut.spin-in {
    animation: donutIn 1s ease-out both, pulseRing 3.5s ease-in-out infinite;
  }
  
  .a-donut::before {
    content: "";
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: #fffdf9;
    border: 1px solid #eed6c4;
    box-shadow: inset 0 2px 8px rgba(200, 182, 166, 0.1);
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

  .a-goal-table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-top: 8px; 
  }
  
  .a-goal-table th, .a-goal-table td {
    text-align: left;
    padding: 16px 12px;
    border-bottom: 1px solid #eed6c4;
    font-size: 0.9rem;
  }
  
  .a-goal-table th {
    color: #8b6f5e;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 700;
    background: linear-gradient(135deg, #faf6f1, #f5efe6);
  }
  
  .a-goal-table tbody tr:hover {
    background: #faf6f1;
  }
  
  .a-table-wrapper {
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid #eed6c4;
    margin-top: 16px;
  }
  
  .a-goal-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .a-goal-name {
    font-weight: 600;
    color: #4a3728;
  }
  
  .a-goal-target {
    font-size: 0.75rem;
    color: #8b6f5e;
    opacity: 0.8;
  }
  
  .a-sessions-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 24px;
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    color: #3730a3;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 700;
  }
  
  .a-time-display {
    font-weight: 600;
    color: #4a3728;
  }
  
  .a-progress-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .a-progress {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: #f1e4d8;
    overflow: hidden;
  }
  
  .a-progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #8b6f5e, #c8b6a6);
    transition: width 0.6s ease;
  }
  
  .a-progress-text {
    font-size: 0.8rem;
    font-weight: 600;
    color: #8b6f5e;
    min-width: 35px;
  }

  .a-empty { color: #8b6f5e; font-size: 0.9rem; margin-top: 8px; }
  
  .a-empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #8b6f5e;
  }
  
  .a-empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    display: block;
  }
  
  .a-empty-text {
    font-size: 1rem;
    font-weight: 600;
    color: #4a3728;
    margin: 0 0 8px;
  }
  
  .a-empty-hint {
    font-size: 0.9rem;
    color: #8b6f5e;
    margin: 0;
    line-height: 1.5;
  }
  
  .a-room-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .a-room-name {
    font-weight: 600;
    color: #4a3728;
  }
  
  .a-room-id {
    font-size: 0.75rem;
    color: #8b6f5e;
    opacity: 0.7;
    font-family: monospace;
  }
  
  .a-performance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 20px;
  }
  
  .a-performance-card {
    background: linear-gradient(135deg, #faf6f1, #f5efe6);
    border: 1px solid #eed6c4;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s ease;
  }
  
  .a-performance-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(200, 182, 166, 0.2);
    border-color: #c8b6a6;
  }
  
  .a-performance-icon {
    font-size: 2rem;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fffdf9;
    border-radius: 50%;
    border: 2px solid #eed6c4;
    flex-shrink: 0;
  }
  
  .a-performance-content {
    flex: 1;
    min-width: 0;
  }
  
  .a-performance-title {
    margin: 0 0 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #8b6f5e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .a-performance-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: #4a3728;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  
  .a-performance-desc {
    margin: 0;
    font-size: 0.8rem;
    color: #8b6f5e;
    line-height: 1.4;
  }
  
  .a-insights-grid {
    display: grid;
    gap: 16px;
    margin-top: 20px;
  }
  
  .a-insight-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    border-radius: 16px;
    border: 1px solid;
    transition: all 0.3s ease;
  }
  
  .a-insight-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  
  .a-insight-warning {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border-color: #f59e0b;
    color: #92400e;
  }
  
  .a-insight-success {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    border-color: #10b981;
    color: #065f46;
  }
  
  .a-insight-info {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    border-color: #3b82f6;
    color: #1e40af;
  }
  
  .a-insight-motivational {
    background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
    border-color: #8b5cf6;
    color: #5b21b6;
  }
  
  .a-insight-icon {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .a-insight-content {
    flex: 1;
    min-width: 0;
  }
  
  .a-insight-title {
    margin: 0 0 8px;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.3;
  }
  
  .a-insight-text {
    margin: 0 0 12px;
    font-size: 0.9rem;
    line-height: 1.5;
    opacity: 0.9;
  }
  
  .a-insight-action {
    margin-top: 12px;
  }
  
  .a-insight-btn {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    color: inherit;
  }
  
  .a-insight-btn:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
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
  @keyframes donutIn {
    from { transform: rotate(-85deg) scale(0.88); opacity: 0.35; }
    to { transform: rotate(0deg) scale(1); opacity: 1; }
  }

  .a-stat-card {
    position: relative;
    border-left: 4px solid #8b6f5e;
    padding-left: 10px;
  }
  .a-stat-card.s2 { border-left-color: #6366f1; }
  .a-stat-card.s3 { border-left-color: #059669; }
  .a-stat-card.s4 { border-left-color: #d97706; }
  .a-stat-ico { font-size: 1.1rem; margin-bottom: 4px; }

  .a-head-wrap {
    position: relative;
    background: linear-gradient(130deg, #fffdf9, #f7f0e6);
    border: 1px solid #eed6c4;
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
  if (totalSeconds < 60) {
    return `${Math.max(0, Math.floor(totalSeconds))}s`;
  }

  const mins = Math.floor(totalSeconds / 60);
  if (mins < 60) {
    return `${mins}m`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

function AnimatedStat({ value }) {
  const num = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    if (num === 0) return undefined;
    let raf;
    const start = performance.now();
    const dur = 650;
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      setShown(Math.round(num * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [num]);

  return shown;
}

const navItems = ["Dashboard", "Analytics", "Projects", "Study Group"];

export default function Analytics() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const isMountedRef = useRef(true);
  const [collapsed, setCollapsed] = useSidebarState();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [studyData, setStudyData] = useState({
    goals: [],
    goalStats: {},
    tasks: [],
    taskEvents: {},
  });
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [roomContribution, setRoomContribution] = useState([]);
  const [windowSize, setWindowSize] = useState(7);
  const [chartMode, setChartMode] = useState("focus");

  async function loadData({ showLoader = false } = {}) {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [data, weeklySummaryData, roomContributionData] = await Promise.all([
        fetchStudyData(),
        fetchWeeklySummaryApi().catch(() => ({ summary: null })),
        fetchRoomContributionApi().catch(() => ({ rooms: [] })),
      ]);
      if (!isMountedRef.current) return;
      setStudyData(data);
      setWeeklySummary(weeklySummaryData?.summary || null);
      setRoomContribution(Array.isArray(roomContributionData?.rooms) ? roomContributionData.rooms : []);
      setLoadError("");
    } catch {
      if (!isMountedRef.current) return;
      setStudyData({ goals: [], goalStats: {}, tasks: [], taskEvents: {} });
      setWeeklySummary(null);
      setRoomContribution([]);
      setLoadError("Unable to load your analytics right now. Please try refreshing.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true;

    function handleFocus() {
      if (!isMountedRef.current) return;
      loadData();
    }

    loadData({ showLoader: true });
    globalThis.addEventListener("focus", handleFocus);
    const refreshTimer = globalThis.setInterval(() => {
      if (!isMountedRef.current) return;
      loadData();
    }, 5000);

    return () => {
      isMountedRef.current = false;
      globalThis.removeEventListener("focus", handleFocus);
      globalThis.clearInterval(refreshTimer);
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

  const chartAllZero = useMemo(
    () => chartValues.length > 0 && chartValues.every((item) => Number(item.value) === 0),
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
    if (item === "Projects") {
      navigate("/projects");
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
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          navItems={navItems}
          activeItem="Analytics"
          onNavigate={handleNav}
          primaryAction={{ label: "Back to Home", onClick: () => navigate("/") }}
          secondaryAction={{
            label: "Sign Out",
            onClick: async () => {
              await signOut();
              navigate("/login", { replace: true });
            },
          }}
          noteTitle={`Signed in as ${user?.name || "Student"}`}
          noteText="Visual analytics combines your goal focus time and daily task completion trends."
          navAriaLabel="Analytics navigation"
        />

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
              <button 
                className={`a-chip ${windowSize === 7 ? "active" : ""}`} 
                onClick={() => setWindowSize(7)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setWindowSize(7);
                  }
                }}
                aria-pressed={windowSize === 7}
                type="button"
              >
                Last 7 days
              </button>
              <button 
                className={`a-chip ${windowSize === 14 ? "active" : ""}`} 
                onClick={() => setWindowSize(14)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setWindowSize(14);
                  }
                }}
                aria-pressed={windowSize === 14}
                type="button"
              >
                Last 14 days
              </button>
              <button 
                className={`a-chip ${chartMode === "focus" ? "active" : ""}`} 
                onClick={() => setChartMode("focus")}
                aria-pressed={chartMode === "focus"}
                type="button"
              >
                Focus
              </button>
              <button 
                className={`a-chip ${chartMode === "sessions" ? "active" : ""}`} 
                onClick={() => setChartMode("sessions")}
                aria-pressed={chartMode === "sessions"}
                type="button"
              >
                Sessions
              </button>
              <button 
                className={`a-chip ${chartMode === "tasks" ? "active" : ""}`} 
                onClick={() => setChartMode("tasks")}
                aria-pressed={chartMode === "tasks"}
                type="button"
              >
                Tasks
              </button>
              <button 
                className={`a-chip ${refreshing ? 'loading' : ''}`}
                onClick={() => loadData()} 
                disabled={refreshing}
                type="button"
                aria-label={refreshing ? "Refreshing data..." : "Refresh analytics data"}
              >
                {refreshing ? (
                  <>
                    <span className="a-spinner" aria-hidden="true">⟳</span>
                    Refreshing...
                  </>
                ) : (
                  "Refresh data"
                )}
              </button>
              
              {/* Export Data Button */}
              <button 
                className="a-chip a-chip-export" 
                onClick={() => {
                  const data = {
                    studyData,
                    series,
                    totalSessions,
                    totalSeconds: formatDuration(totalSeconds),
                    exportDate: new Date().toISOString(),
                    windowSize,
                    chartMode
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `my-kaksha-analytics-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  
                  // Show success feedback with better UX
                  const button = document.activeElement;
                  const originalText = button.textContent;
                  const originalClass = button.className;
                  button.textContent = '✓ Exported!';
                  button.className = originalClass + ' a-chip-success';
                  button.disabled = true;
                  setTimeout(() => {
                    button.textContent = originalText;
                    button.className = originalClass;
                    button.disabled = false;
                  }, 2000);
                }}
                title="Export your analytics data as JSON file"
                type="button"
                aria-label="Export analytics data to JSON file"
              >
                📊 Export Data
              </button>
            </div>
          </section>

          {loading ? (
            <p className="a-empty">Loading analytics...</p>
          ) : (
            <>
              {loadError ? <p className="a-empty">{loadError}</p> : null}
              <section className="a-grid-main">
                <article className="a-card">
                  <h2 className="a-card-title">Trend Graph</h2>
                  <p className="a-card-sub">
                    {chartMode === "focus" ? "Daily focus minutes" : chartMode === "sessions" ? "Estimated sessions/day" : "Tasks completed/day"}
                  </p>

                  <div className="a-chart-wrap" style={{ "--count": chartValues.length }}>
                    {chartValues.map((item, idx) => {
                      const barHeight = chartAllZero
                        ? 10
                        : Math.max(2, Math.round((item.value / maxValue) * 170));
                      const tip =
                        chartMode === "focus"
                          ? `${Math.round((item.value ?? 0) / 60)} min focus`
                          : chartMode === "sessions"
                            ? `${item.value} sessions`
                            : `${item.value} tasks completed`;
                      return (
                        <div className="a-bar-col" key={item.key}>
                          <div className="a-bar-value">{item.valueLabel}</div>
                          <div
                            className={`a-bar ${chartAllZero ? "placeholder" : ""}`}
                            style={{ height: `${barHeight}px`, animationDelay: `${idx * 0.04}s` }}
                            title={tip}
                          />
                          <div className="a-bar-label">{item.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  {chartAllZero ? (
                    <p className="a-empty" style={{ marginTop: 12 }}>
                      Start a Pomodoro session to see your trends — placeholder bars show the week layout.
                    </p>
                  ) : null}
                </article>

                <article className="a-card">
                  <h2 className="a-card-title">Today Task Analysis</h2>
                  <p className="a-card-sub">Snapshot for {todayKey}</p>

                  <div className="a-donut-wrap">
                    <div className="a-donut spin-in" style={{ "--percent": `${todayCompletionRate}%` }}>
                      <div className="a-donut-center">
                        <div className="a-donut-big">{todayCompleted === 0 ? "—" : `${todayCompletionRate}%`}</div>
                        <div className="a-donut-small">
                          {todayCompleted === 0 ? "No tasks completed yet today" : "done today"}
                        </div>
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
                    <div className="a-snap a-stat-card">
                      <div className="a-stat-ico" aria-hidden>
                        📝
                      </div>
                      <div className="a-snap-label">Tasks Added</div>
                      <div className="a-snap-val">
                        <AnimatedStat value={todayAdded} />
                      </div>
                    </div>
                    <div className="a-snap a-stat-card s2">
                      <div className="a-stat-ico" aria-hidden>
                        ⏱️
                      </div>
                      <div className="a-snap-label">Focus Sessions</div>
                      <div className="a-snap-val">
                        <AnimatedStat value={totalSessions} />
                      </div>
                    </div>
                    <div className="a-snap a-stat-card s3">
                      <div className="a-stat-ico" aria-hidden>
                        🎯
                      </div>
                      <div className="a-snap-label">Tracked Goals</div>
                      <div className="a-snap-val">
                        <AnimatedStat value={totalGoals} />
                      </div>
                    </div>
                    <div className="a-snap a-stat-card s4">
                      <div className="a-stat-ico" aria-hidden>
                        📚
                      </div>
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
                  <EmptyStatePrompt />
                ) : (
                  <div className="a-table-wrapper">
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
                              <td>
                                <div className="a-goal-cell">
                                  <span className="a-goal-name">{row.title}</span>
                                  <span className="a-goal-target">{row.targetMinutes} min target</span>
                                </div>
                              </td>
                              <td>
                                <span className="a-sessions-badge">{row.sessions ?? 0}</span>
                              </td>
                              <td>
                                <span className="a-time-display">{formatDuration(row.totalSeconds ?? 0)}</span>
                              </td>
                              <td>
                                <div className="a-progress-cell">
                                  <div className="a-progress">
                                    <div className="a-progress-fill" style={{ width: `${completion}%` }} />
                                  </div>
                                  <span className="a-progress-text">{completion}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="a-card" style={{ marginTop: 24 }}>
                <h2 className="a-card-title">Study Group Room Contribution</h2>
                <p className="a-card-sub">Minutes contributed per room this week (Mongo-backed).</p>
                {roomContribution.length === 0 ? (
                  <div className="a-empty-state">
                    <div className="a-empty-icon">📊</div>
                    <p className="a-empty-text">No room contribution data yet this week.</p>
                    <p className="a-empty-hint">Join study rooms and complete Pomodoro sessions to see your contributions!</p>
                  </div>
                ) : (
                  <div className="a-table-wrapper">
                    <table className="a-goal-table">
                      <thead>
                        <tr>
                          <th>Room</th>
                          <th>Minutes</th>
                          <th>Sessions</th>
                          <th>Contribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomContribution.map((row) => {
                          const totalMinutes = roomContribution.reduce((sum, r) => sum + (Number(r.totalMinutes) || 0), 0);
                          const contribution = totalMinutes > 0 ? Math.round(((Number(row.totalMinutes) || 0) / totalMinutes) * 100) : 0;
                          return (
                            <tr key={row.roomId}>
                              <td>
                                <div className="a-room-cell">
                                  <span className="a-room-name">{row.roomName}</span>
                                  <span className="a-room-id">ID: {row.roomId.slice(0, 8)}...</span>
                                </div>
                              </td>
                              <td>
                                <span className="a-time-display">{Math.max(0, Number(row.totalMinutes) || 0)} min</span>
                              </td>
                              <td>
                                <span className="a-sessions-badge">{Math.max(0, Number(row.sessionsCompleted) || 0)}</span>
                              </td>
                              <td>
                                <div className="a-progress-cell">
                                  <div className="a-progress">
                                    <div className="a-progress-fill" style={{ width: `${contribution}%` }} />
                                  </div>
                                  <span className="a-progress-text">{contribution}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Weekly Performance Summary */}
              <section className="a-card" style={{ marginTop: 24 }}>
                <h2 className="a-card-title">Weekly Performance Summary</h2>
                <p className="a-card-sub">Your study performance insights and achievements this week.</p>
                
                <div className="a-performance-grid">
                  <div className="a-performance-card">
                    <div className="a-performance-icon">🎯</div>
                    <div className="a-performance-content">
                      <h3 className="a-performance-title">Focus Consistency</h3>
                      <div className="a-performance-value">
                        {series.filter(day => day.focusSeconds > 0).length}/{series.length} days
                      </div>
                      <p className="a-performance-desc">Days with study activity</p>
                    </div>
                  </div>
                  
                  <div className="a-performance-card">
                    <div className="a-performance-icon">⚡</div>
                    <div className="a-performance-content">
                      <h3 className="a-performance-title">Peak Performance</h3>
                      <div className="a-performance-value">
                        {Math.max(...series.map(s => Math.round(s.focusSeconds / 60)), 0)} min
                      </div>
                      <p className="a-performance-desc">Best single day focus</p>
                    </div>
                  </div>
                  
                  <div className="a-performance-card">
                    <div className="a-performance-icon">📈</div>
                    <div className="a-performance-content">
                      <h3 className="a-performance-title">Total Sessions</h3>
                      <div className="a-performance-value">{totalSessions}</div>
                      <p className="a-performance-desc">Pomodoro sessions completed</p>
                    </div>
                  </div>
                  
                  <div className="a-performance-card">
                    <div className="a-performance-icon">🏆</div>
                    <div className="a-performance-content">
                      <h3 className="a-performance-title">Study Score</h3>
                      <div className="a-performance-value">
                        {Math.round((totalSessions * 10) + (totalSeconds / 300))}
                      </div>
                      <p className="a-performance-desc">Based on sessions + time</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Productivity Insights & Recommendations */}
              <section className="a-card" style={{ marginTop: 24 }}>
                <h2 className="a-card-title">Productivity Insights & Recommendations</h2>
                <p className="a-card-sub">AI-powered insights to improve your study habits.</p>
                
                <div className="a-insights-grid">
                  {/* Consistency Insight */}
                  {series.filter(day => day.focusSeconds > 0).length < 4 && (
                    <div className="a-insight-card a-insight-warning">
                      <div className="a-insight-icon">⚠️</div>
                      <div className="a-insight-content">
                        <h4 className="a-insight-title">Improve Consistency</h4>
                        <p className="a-insight-text">
                          You've studied on {series.filter(day => day.focusSeconds > 0).length} out of {series.length} days. 
                          Try to maintain a daily study routine, even if it's just 25 minutes.
                        </p>
                        <div className="a-insight-action">
                          <button 
                            className="a-insight-btn"
                            onClick={() => navigate('/study-group')}
                          >
                            Join Study Room
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Peak Performance Insight */}
                  {Math.max(...series.map(s => s.focusSeconds)) > 3600 && (
                    <div className="a-insight-card a-insight-success">
                      <div className="a-insight-icon">🌟</div>
                      <div className="a-insight-content">
                        <h4 className="a-insight-title">Great Focus Sessions!</h4>
                        <p className="a-insight-text">
                          You had an excellent focus day with {Math.round(Math.max(...series.map(s => s.focusSeconds)) / 60)} minutes! 
                          Keep up this momentum.
                        </p>
                        <div className="a-insight-action">
                          <button 
                            className="a-insight-btn"
                            onClick={() => navigate('/dashboard')}
                          >
                            Set New Goals
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Task Completion Insight */}
                  {todayCompletionRate < 50 && todayAdded > 0 && (
                    <div className="a-insight-card a-insight-info">
                      <div className="a-insight-icon">📝</div>
                      <div className="a-insight-content">
                        <h4 className="a-insight-title">Task Management Tip</h4>
                        <p className="a-insight-text">
                          Your task completion rate is {todayCompletionRate}%. Try breaking large tasks into smaller, 
                          manageable chunks to improve completion rates.
                        </p>
                        <div className="a-insight-action">
                          <button 
                            className="a-insight-btn"
                            onClick={() => navigate('/dashboard')}
                          >
                            Manage Tasks
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Motivational Insight */}
                  {totalSessions === 0 && (
                    <div className="a-insight-card a-insight-motivational">
                      <div className="a-insight-icon">🚀</div>
                      <div className="a-insight-content">
                        <h4 className="a-insight-title">Ready to Start?</h4>
                        <p className="a-insight-text">
                          Begin your study journey! Start with a 25-minute Pomodoro session and track your progress. 
                          Small consistent efforts lead to big results.
                        </p>
                        <div className="a-insight-action">
                          <button 
                            className="a-insight-btn"
                            onClick={() => navigate('/dashboard')}
                          >
                            Start Timer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <StreakTracker series={series} />
              <QuickInsights series={series} rows={rows} totalSeconds={totalSeconds} totalSessions={totalSessions} />
              <WeeklySummaryCard
                series={series}
                rows={rows}
                totalSeconds={totalSeconds}
                totalSessions={totalSessions}
                weeklySummary={weeklySummary}
              />
            </>
          )}
        </main>
      </div>
    </>
  );
}
