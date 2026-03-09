import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; }

  .sg-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 260px 1fr;
    background: radial-gradient(circle at top, #f6ecdf 0%, #faf8f3 55%);
    color: #544437;
    font-family: 'Outfit', 'Segoe UI', sans-serif;
  }

  .sg-sidebar {
    background: linear-gradient(180deg, #fffdfa, #f5eee4);
    border-right: 1px solid #ead8c7;
    padding: 28px 18px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .sg-brand {
    font-size: 1.3rem;
    font-weight: 700;
    color: #7f6654;
  }

  .sg-brand span { color: #c1a792; }

  .sg-nav { display: grid; gap: 10px; }

  .sg-nav button {
    border: 1px solid transparent;
    background: transparent;
    padding: 12px 14px;
    border-radius: 14px;
    text-align: left;
    font-weight: 600;
    color: #866f5d;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sg-nav button.active {
    background: linear-gradient(135deg, #f2dfd0, #e5cbbb);
    border-color: #d7baa5;
    color: #4b3528;
  }

  .sg-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d7baa5;
  }

  .sg-note {
    margin-top: auto;
    border: 1px solid #ead8c7;
    border-radius: 16px;
    padding: 14px;
    background: #fffdf9;
    font-size: 0.85rem;
    color: #7c6655;
  }

  .sg-main { padding: 32px; }

  .sg-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
  }

  .sg-title {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    color: #442f24;
  }

  .sg-subtitle {
    margin: 6px 0 0;
    color: #8c7766;
    font-size: 0.95rem;
  }

  .sg-day-pill {
    border: 1px solid #ead8c7;
    padding: 10px 18px;
    border-radius: 999px;
    background: #fffdf9;
    color: #7c6655;
    font-weight: 600;
  }

  .sg-sections {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .sg-card {
    background: #fffdf8;
    border: 1px solid #ead8c7;
    border-radius: 24px;
    padding: 24px;
    box-shadow: 0 10px 28px rgba(176, 152, 132, 0.16);
  }

  .sg-card h2 {
    margin: 0 0 16px;
    font-size: 1.1rem;
    color: #4a3629;
  }

  .sg-overview-stats {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .sg-overview-pill {
    border: 1px solid #ead8c7;
    border-radius: 14px;
    padding: 10px 14px;
    background: #f7efe4;
    font-weight: 600;
    color: #6e5644;
  }

  .sg-progress-bar {
    width: 100%;
    height: 12px;
    border-radius: 999px;
    background: #f1dfcf;
    overflow: hidden;
    margin: 10px 0 6px;
  }

  .sg-progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(135deg, #d4b79a, #b48c6b);
    transition: width 0.3s ease;
  }

  .sg-overview-footer {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .sg-btn {
    border: none;
    border-radius: 999px;
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
    background: #c2a189;
    color: #fff;
  }

  .sg-btn.soft {
    background: #fffdf9;
    color: #8a7765;
    border: 1px solid #ead8c7;
  }

  .sg-focus-grid,
  .sg-collab-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }

  .sg-pill {
    display: inline-block;
    border-radius: 999px;
    padding: 6px 12px;
    background: #fff4eb;
    border: 1px solid #ead8c7;
    font-size: 0.78rem;
    color: #7a5c49;
  }

  .sg-timer-display {
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    text-align: center;
    font-weight: 700;
    color: #422b1f;
    margin: 12px 0 18px;
  }

  .sg-timer-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .sg-leaderboard {
    margin: 0;
    padding-left: 18px;
    color: #6e5645;
    display: grid;
    gap: 8px;
  }

  .sg-members-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .sg-member-card {
    border: 1px solid #ead8c7;
    border-radius: 18px;
    padding: 16px 14px;
    background: #fff9f2;
    display: grid;
    gap: 8px;
    align-content: start;
  }

  .sg-member-info {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .sg-avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-weight: 700;
    color: #fff;
  }

  .sg-member-name { margin: 0; font-weight: 600; }
  .sg-member-meta { margin: 2px 0 0; font-size: 0.8rem; color: #7c6655; }

  .sg-member-progress {
    height: 8px;
    margin-top: 6px;
  }

  .sg-textarea {
    width: 100%;
    min-height: 180px;
    border-radius: 18px;
    border: 1px solid #ead8c7;
    padding: 16px;
    background: #fffdf9;
    font-family: inherit;
    resize: vertical;
    color: #4a3629;
  }

  .sg-chat-box {
    border: 1px solid #ead8c7;
    border-radius: 18px;
    background: #fffdf9;
    padding: 14px;
    margin-bottom: 14px;
    height: 220px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sg-message {
    background: #f5ece1;
    border-radius: 14px;
    padding: 10px 12px;
  }

  .sg-message strong {
    display: block;
    color: #6b4d3a;
  }

  .chat-input {
    display: flex;
    gap: 10px;
  }

  .chat-input input {
    flex: 1;
    border-radius: 14px;
    border: 1px solid #ead8c7;
    padding: 10px 12px;
    background: #fffdf9;
    font-family: inherit;
  }

  @media (max-width: 960px) {
    .sg-shell { grid-template-columns: 1fr; }
    .sg-sidebar { border-right: none; border-bottom: 1px solid #ead8c7; }
    .sg-focus-grid,
    .sg-collab-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 1100px) {
    .sg-members-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 720px) {
    .sg-members-grid { grid-template-columns: 1fr; }
  }
`;

const navItems = ["Dashboard", "Home", "Study Group"];

const groupInfo = {
  name: "Placement Prep",
  members: 6,
  goalHours: 40,
  completedHours: 24,
  inviteLink: "https://mykaksha/group/placement-prep",
};

const leaderboardData = [
  { name: "Ananya", hours: 6 },
  { name: "Rahul", hours: 5 },
  { name: "Arjun", hours: 4 },
  { name: "Meera", hours: 3 },
];

const members = [
  { name: "Ananya", goal: 10, completed: 6 },
  { name: "Rahul", goal: 8, completed: 5 },
  { name: "Arjun", goal: 9, completed: 4 },
  { name: "Meera", goal: 7, completed: 3 },
  { name: "Sanya", goal: 6, completed: 2 },
  { name: "Kabir", goal: 8, completed: 4 },
];

const chatSeeds = [
  { id: 1, author: "Ananya", text: "Let's finish recursion today." },
  { id: 2, author: "Rahul", text: "Starting a pomodoro session now." },
];

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function GroupOverview({ group }) {
  const [copied, setCopied] = useState(false);
  const completion = Math.round((group.completedHours / group.goalHours) * 100);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  function copyLink() {
    navigator.clipboard?.writeText(group.inviteLink).finally(() => setCopied(true));
  }

  return (
    <section className="sg-card" aria-labelledby="group-overview">
      <h2 id="group-overview">Group Overview</h2>
      <div className="sg-overview-stats">
        <span className="sg-overview-pill">{group.name}</span>
        <span className="sg-overview-pill">Members: {group.members}</span>
        <span className="sg-overview-pill">Weekly Goal: {group.goalHours} hrs</span>
      </div>
      <p>Progress: {group.completedHours} / {group.goalHours} hours completed</p>
      <div className="sg-progress-bar" role="img" aria-label={`${group.completedHours} of ${group.goalHours} hours`}>
        <div className="sg-progress-fill" style={{ width: `${completion}%` }} />
      </div>
      <div className="sg-overview-footer">
        <button className="sg-btn" onClick={copyLink}>{copied ? "Link Copied" : "Copy Invite Link"}</button>
        <span style={{ color: "#8a7765", fontSize: "0.92rem" }}>{group.inviteLink}</span>
      </div>
    </section>
  );
}

function PomodoroTimer() {
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const timerId = setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;
        const nextMode = mode === "focus" ? "break" : "focus";
        setMode(nextMode);
        return nextMode === "focus" ? 25 * 60 : 5 * 60;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [running, mode]);

  useEffect(() => {
    setSecondsLeft(mode === "focus" ? 25 * 60 : 5 * 60);
  }, [mode]);

  function resetTimer() {
    setRunning(false);
    setSecondsLeft(mode === "focus" ? 25 * 60 : 5 * 60);
  }

  function switchMode() {
    setMode((prev) => (prev === "focus" ? "break" : "focus"));
    setRunning(false);
  }

  return (
    <section className="sg-card" aria-labelledby="pomodoro">
      <h2 id="pomodoro">Pomodoro Timer</h2>
      <span className="sg-pill">{mode === "focus" ? "Focus" : "Break"} Session</span>
      <div className="sg-timer-display">{formatTime(secondsLeft)}</div>
      <div className="sg-timer-actions">
        <button className="sg-btn" onClick={() => setRunning((prev) => !prev)}>
          {running ? "Pause" : "Start"}
        </button>
        <button className="sg-btn soft" onClick={resetTimer}>Reset</button>
        <button className="sg-btn soft" onClick={switchMode}>Switch Focus/Break</button>
      </div>
    </section>
  );
}

function Leaderboard({ entries }) {
  return (
    <article className="sg-card" aria-labelledby="leaderboard">
      <h2 id="leaderboard">Leaderboard</h2>
      <ol className="sg-leaderboard">
        {entries.map((entry) => (
          <li key={entry.name}>
            {entry.name} — {entry.hours} hrs
          </li>
        ))}
      </ol>
    </article>
  );
}

function FocusZone({ entries }) {
  return (
    <section aria-label="Focus zone">
      <div className="sg-focus-grid">
        <PomodoroTimer />
        <Leaderboard entries={entries} />
      </div>
    </section>
  );
}

function MemberCard({ member }) {
  const completion = Math.round((member.completed / member.goal) * 100);
  const colors = ["#c29b83", "#9f8e7b", "#d2a374", "#bfa58c", "#c59b86", "#a98c77"];
  const color = colors[member.name.length % colors.length];

  return (
    <article className="sg-member-card">
      <div className="sg-member-info">
        <div className="sg-avatar" style={{ background: color }} aria-hidden="true">
          {member.name.charAt(0)}
        </div>
        <div>
          <p className="sg-member-name">{member.name}</p>
          <p className="sg-member-meta">Goal: {member.goal} hrs · Completed: {member.completed} hrs</p>
        </div>
      </div>
      <div className="sg-progress-bar sg-member-progress" role="img" aria-label={`${completion}% of goal`}>
        <div className="sg-progress-fill" style={{ width: `${completion}%` }} />
      </div>
    </article>
  );
}

function MembersGrid({ members: list }) {
  return (
    <section className="sg-card" aria-labelledby="members">
      <h2 id="members">Members</h2>
      <div className="sg-members-grid">
        {list.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}

function CollaborativeNotes() {
  const [notes, setNotes] = useState("");

  return (
    <article className="sg-card" aria-labelledby="notes">
      <h2 id="notes">Collaborative Notes</h2>
      <textarea
        className="sg-textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write shared study notes, important topics, or resources here."
      />
    </article>
  );
}

function GroupChat() {
  const [messages, setMessages] = useState(chatSeeds);
  const [text, setText] = useState("");

  function sendMessage(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setMessages((prev) => [...prev, { id: Date.now(), author: "You", text: value }]);
    setText("");
  }

  return (
    <article className="sg-card" aria-labelledby="chat">
      <h2 id="chat">Group Chat</h2>
      <div className="sg-chat-box" aria-live="polite">
        {messages.map((msg) => (
          <div key={msg.id} className="sg-message">
            <strong>{msg.author}</strong>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={text}
          placeholder="Send a quick update"
          onChange={(e) => setText(e.target.value)}
          aria-label="Type a message"
        />
        <button className="sg-btn" type="submit">Send</button>
      </form>
    </article>
  );
}

function CollaborationSection() {
  return (
    <section aria-label="Collaboration tools">
      <div className="sg-collab-grid">
        <CollaborativeNotes />
        <GroupChat />
      </div>
    </section>
  );
}

// Progress visibility settings moved to Settings page

export default function StudyGroupPage() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Study Group");
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }),
    []
  );

  function handleNav(item) {
    setActiveNav(item);
    if (item === "Dashboard") {
      navigate("/dashboard");
      return;
    }
    if (item === "Home") {
      navigate("/");
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="sg-shell">
        <aside className="sg-sidebar">
          <div className="sg-brand">My <span>Kaksha</span></div>
          <nav className="sg-nav" aria-label="Study group navigation">
            {navItems.map((item) => (
              <button
                key={item}
                className={item === activeNav ? "active" : ""}
                onClick={() => handleNav(item)}
              >
                <span className="sg-dot" aria-hidden="true" />
                <span>{item}</span>
              </button>
            ))}
          </nav>
          <div className="sg-note">
            Study together, keep it gentle, and celebrate every focused block.
          </div>
        </aside>
        <main className="sg-main">
          <header className="sg-head">
            <div>
              <h1 className="sg-title">Study Group</h1>
              <p className="sg-subtitle">Collaborate and stay accountable with your friends.</p>
            </div>
            <div className="sg-day-pill">{todayLabel}</div>
          </header>

          <div className="sg-sections">
            <GroupOverview group={groupInfo} />
            <FocusZone entries={leaderboardData} />
            <MembersGrid members={members} />
            <CollaborationSection />
          </div>
        </main>
      </div>
    </>
  );
}
