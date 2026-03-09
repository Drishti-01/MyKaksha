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

  .a-main { padding: 26px; }
  .a-title { margin: 0 0 8px; color: #4a3728; font-size: clamp(1.4rem, 2.2vw, 2rem); }
  .a-sub { margin: 0 0 20px; color: #8b6f5e; font-size: 0.95rem; }

  .a-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  .a-card {
    background: #fffdf9;
    border: 1px solid #eed6c4;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 10px 26px rgba(200, 182, 166, 0.2);
  }
  .a-card-label { color: #8b6f5e; font-size: 0.8rem; font-weight: 600; }
  .a-card-value { color: #4a3728; font-weight: 800; font-size: 1.6rem; margin-top: 6px; }

  .a-table-card {
    background: #fffdf9;
    border: 1px solid #eed6c4;
    border-radius: 24px;
    padding: 18px;
    box-shadow: 0 10px 26px rgba(200, 182, 166, 0.2);
  }
  .a-table { width: 100%; border-collapse: collapse; }
  .a-table th,
  .a-table td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid #eed6c4;
    font-size: 0.9rem;
  }
  .a-table th { color: #8b6f5e; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .a-empty { color: #8b6f5e; font-size: 0.9rem; }

  @media (max-width: 980px) {
    .a-cards { grid-template-columns: 1fr; }
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
  }
`;

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await fetchStudyData();
        if (!mounted) return;
        setStatsMap(data.goalStats);
      } catch {
        if (!mounted) return;
        setStatsMap({});
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => Object.values(statsMap), [statsMap]);

  const totalGoals = rows.length;
  const totalSessions = rows.reduce((sum, row) => sum + (row.sessions ?? 0), 0);
  const totalSeconds = rows.reduce((sum, row) => sum + (row.totalSeconds ?? 0), 0);

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
            <button className="a-nav-btn" onClick={() => navigate("/dashboard")}>
              <span className="a-dot" aria-hidden="true" />
              <span className="a-label">Dashboard</span>
            </button>
            <button className="a-nav-btn active">
              <span className="a-dot" aria-hidden="true" />
              <span className="a-label">Analytics</span>
            </button>
            <button className="a-nav-btn" onClick={() => navigate("/")}>
              <span className="a-dot" aria-hidden="true" />
              <span className="a-label">Landing</span>
            </button>
          </nav>

          <div className="a-note">
            Goal sessions from your Pomodoro runs are summarized here.
          </div>
        </aside>

        <main className="a-main">
          <h1 className="a-title">Goal Analytics</h1>
          <p className="a-sub">Track how much time each goal has received and how many sessions you completed.</p>

          <div className="a-cards">
            <article className="a-card">
              <div className="a-card-label">Tracked Goals</div>
              <div className="a-card-value">{totalGoals}</div>
            </article>
            <article className="a-card">
              <div className="a-card-label">Completed Sessions</div>
              <div className="a-card-value">{totalSessions}</div>
            </article>
            <article className="a-card">
              <div className="a-card-label">Total Focus Time</div>
              <div className="a-card-value">{formatDuration(totalSeconds)}</div>
            </article>
          </div>

          <section className="a-table-card">
            {loading ? (
              <p className="a-empty">Loading analytics...</p>
            ) : rows.length === 0 ? (
              <p className="a-empty">No analytics yet. Create a goal in Dashboard and start the timer to record sessions.</p>
            ) : (
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Goal</th>
                    <th>Target</th>
                    <th>Sessions</th>
                    <th>Focus Time</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.targetMinutes} min</td>
                      <td>{row.sessions ?? 0}</td>
                      <td>{formatDuration(row.totalSeconds ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
