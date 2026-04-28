function pctToStrokeOffset(progress) {
  const circumference = 2 * Math.PI * 80;
  return circumference * (1 - progress);
}

export default function TimerPanel({
  timerScope,
  onTimerScopeChange,
  formatted,
  label,
  sessionOf,
  running,
  onStart,
  onPause,
  onReset,
  onSwitchPhase,
  focusStyle,
  progress,
  personalTodayMinutes,
  groupStartedBy,
  canControlGroup,
  groupDeniedMessage,
  celebrate,
  lastActionReason,
}) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = pctToStrokeOffset(progress);
  const ringColor = String(label || "").toLowerCase().includes("break") ? "#D97706" : "#4F46E5";

  return (
    <section className="sg2-panel" aria-label="Group sync timer">
      <div className="sg2-inline-row" style={{ alignItems: "center", marginBottom: 10 }}>
        <span className="sg2-section-title" style={{ margin: 0 }}>Group Sync Timer</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className={`sg2-btn secondary ${timerScope === "personal" ? "sg2-active-btn" : ""}`} onClick={() => onTimerScopeChange("personal")}>Personal Mode</button>
          <button type="button" className={`sg2-btn secondary ${timerScope === "group" ? "sg2-active-btn" : ""}`} onClick={() => onTimerScopeChange("group")}>Group Mode</button>
        </div>
      </div>

      {timerScope === "group" && groupStartedBy ? (
        <div className="sg2-banner">Group session started by {groupStartedBy.name}</div>
      ) : null}
      {lastActionReason ? <div className="sg2-soft-text" style={{ marginBottom: 8 }}>{lastActionReason}</div> : null}
      {groupDeniedMessage ? <div className="sg2-error" style={{ marginBottom: 8 }}>{groupDeniedMessage}</div> : null}

      {focusStyle === "silent" ? (
        <p className="sg2-soft-text" style={{ marginBottom: 8 }}>Silent room: chat is paused while focus timer runs.</p>
      ) : null}

      <div className="sg2-timer-ring-wrap">
        <svg viewBox="0 0 200 200" className="sg2-timer-ring">
          <circle cx="100" cy="100" r={radius} className="sg2-timer-ring-bg" />
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="sg2-timer-ring-fg"
            style={{ stroke: ringColor }}
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <div className="sg2-timer-center">
          <div className="sg2-timer-big">{formatted}</div>
          <p className="sg2-soft-text" style={{ margin: 0 }}>{label}</p>
          <p className="sg2-soft-text" style={{ margin: 0 }}>{sessionOf}</p>
        </div>
      </div>

      <p className="sg2-soft-text" style={{ textAlign: "center", marginTop: 8 }}>
        You&apos;ve focused {Math.max(0, Number(personalTodayMinutes) || 0)} min today in this room
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 12 }}>
        <button type="button" className="sg2-btn" onClick={running ? onPause : onStart} disabled={timerScope === "group" && !canControlGroup}>
          {running ? "Pause" : "Start"}
        </button>
        <button type="button" className="sg2-btn secondary" onClick={onReset} disabled={timerScope === "group" && !canControlGroup}>Reset</button>
        <button type="button" className="sg2-btn secondary" onClick={onSwitchPhase}>Switch Focus/Break</button>
      </div>

      {celebrate ? (
        <div className="sg2-confetti" aria-hidden>
          <span /> <span /> <span /> <span /> <span /> <span />
        </div>
      ) : null}
    </section>
  );
}
