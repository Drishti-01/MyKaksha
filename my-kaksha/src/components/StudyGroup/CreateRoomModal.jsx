import { useEffect, useState } from "react";

export default function CreateRoomModal({ open, onClose, onCreate, loading }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("public");
  const [focusStyle, setFocusStyle] = useState("discussion");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setName("");
    setType("public");
    setFocusStyle("discussion");
    setWeeklyGoal("");
    setError("");
    setFieldErrors({});
  }, [open]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    
    const errors = {};
    if (!name.trim()) {
      errors.name = "Room name is required";
    }
    if (name.trim().length > 50) {
      errors.name = "Room name must be 50 characters or less";
    }
    if (weeklyGoal !== "" && (Number(weeklyGoal) < 0 || Number(weeklyGoal) > 168)) {
      errors.weeklyGoal = "Weekly goal must be between 0 and 168 hours";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      await onCreate({
        name: name.trim(),
        type,
        focusStyle,
        weeklyGoalHours: weeklyGoal === "" ? null : Number(weeklyGoal),
      });
    } catch (err) {
      setError(err.message || "Could not create room");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(74, 55, 40, 0.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-room-title"
    >
      <div
        className="sg2-card"
        style={{ maxWidth: 440, width: "100%", maxHeight: "90vh", overflow: "auto" }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 id="create-room-title" style={{ margin: 0, fontSize: "1.15rem", color: "#4a3629" }}>
            Create New Room
          </h2>
          <button type="button" className="sg2-btn secondary" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={submit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontSize: "0.85rem", color: "#6e5644" }}>
            Room Name *
            <input 
              className={`sg2-input ${fieldErrors.name ? 'error' : ''}`}
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              disabled={loading}
              maxLength={50}
              style={fieldErrors.name ? { borderColor: '#dc2626', background: '#fef2f2' } : {}}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name && (
              <span id="name-error" style={{ color: '#dc2626', fontSize: '0.75rem' }} role="alert">
                {fieldErrors.name}
              </span>
            )}
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#6e5644" }}>Room Type</span>
            <button
              type="button"
              className={`sg2-btn secondary ${type === "public" ? "sg2-active-btn" : ""}`}
              onClick={() => setType("public")}
              disabled={loading}
              aria-pressed={type === "public"}
            >
              Public
            </button>
            <button
              type="button"
              className={`sg2-btn secondary ${type === "private" ? "sg2-active-btn" : ""}`}
              onClick={() => setType("private")}
              disabled={loading}
              aria-pressed={type === "private"}
            >
              Private
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#6e5644" }}>Focus Style</span>
            <button
              type="button"
              className={`sg2-btn secondary ${focusStyle === "discussion" ? "sg2-active-btn" : ""}`}
              onClick={() => setFocusStyle("discussion")}
              disabled={loading}
              aria-pressed={focusStyle === "discussion"}
            >
              Discussion
            </button>
            <button
              type="button"
              className={`sg2-btn secondary ${focusStyle === "silent" ? "sg2-active-btn" : ""}`}
              onClick={() => setFocusStyle("silent")}
              disabled={loading}
              aria-pressed={focusStyle === "silent"}
            >
              Silent Study
            </button>
          </div>

          <label style={{ display: "grid", gap: 6, fontSize: "0.85rem", color: "#6e5644" }}>
            Weekly goal (hours, optional)
            <input
              className={`sg2-input ${fieldErrors.weeklyGoal ? 'error' : ''}`}
              type="number"
              min={0}
              max={168}
              step={0.5}
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
              disabled={loading}
              style={fieldErrors.weeklyGoal ? { borderColor: '#dc2626', background: '#fef2f2' } : {}}
              aria-invalid={!!fieldErrors.weeklyGoal}
              aria-describedby={fieldErrors.weeklyGoal ? "goal-error" : undefined}
            />
            {fieldErrors.weeklyGoal && (
              <span id="goal-error" style={{ color: '#dc2626', fontSize: '0.75rem' }} role="alert">
                {fieldErrors.weeklyGoal}
              </span>
            )}
          </label>

          <p style={{ margin: 0, fontSize: "0.78rem", color: "#8b6f5e" }}>
            A 6-character room code is generated automatically after creation (copy from room header).
          </p>

          {error ? (
            <p style={{ color: "#b45309", margin: 0, fontSize: "0.86rem" }} role="alert">
              {error}
            </p>
          ) : null}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="sg2-btn secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="sg2-btn" 
              disabled={loading || !name.trim()}
              aria-label={loading ? "Creating room..." : "Create new study room"}
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
