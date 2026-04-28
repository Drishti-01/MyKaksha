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
  peerFocusLabel,
  focusStyle,
}) {
  return (
    <section className="sg2-panel" aria-label="Group sync timer">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, color: "#4a3629" }}>Group Sync Timer</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className={`sg2-btn secondary ${timerScope === "personal" ? "" : ""}`}
            style={{ opacity: timerScope === "personal" ? 1 : 0.55 }}
            onClick={() => onTimerScopeChange("personal")}
          >
            Personal Mode
          </button>
          <button
            type="button"
            className="sg2-btn secondary"
            style={{ opacity: timerScope === "group" ? 1 : 0.55 }}
            onClick={() => onTimerScopeChange("group")}
          >
            Group Mode
          </button>
        </div>
      </div>

      {timerScope === "personal" && peerFocusLabel ? (
        <p style={{ margin: "0 0 8px", fontSize: "0.88rem", color: "#6366f1" }}>{peerFocusLabel}</p>
      ) : null}

      {focusStyle === "silent" ? (
        <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#8b6f5e" }}>
          Silent Study: chat pauses while the focus timer runs.
        </p>
      ) : null}

      <div className="sg2-timer-big" aria-live="polite">
        {formatted}
      </div>
      <p style={{ textAlign: "center", margin: "0 0 6px", color: "#6e5644", fontWeight: 600 }}>{label}</p>
      <p style={{ textAlign: "center", margin: "0 0 14px", fontSize: "0.85rem", color: "#8b6f5e" }}>{sessionOf}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        <button type="button" className="sg2-btn" onClick={running ? onPause : onStart}>
          {running ? "Pause" : "Start"}
        </button>
        <button type="button" className="sg2-btn secondary" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="sg2-btn secondary" onClick={onSwitchPhase}>
          Switch Focus / Break
        </button>
      </div>
    </section>
  );
}
