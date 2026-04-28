import { useEffect, useState } from "react";

export default function CreateRoomModal({ open, onClose, onCreate, loading }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("public");
  const [focusStyle, setFocusStyle] = useState("discussion");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setType("public");
    setFocusStyle("discussion");
    setWeeklyGoal("");
    setError("");
  }, [open]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Room name is required");
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
            Room Name
            <input className="sg2-input" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#6e5644" }}>Room Type</span>
            <button
              type="button"
              className={`sg2-btn secondary ${type === "public" ? "" : ""}`}
              onClick={() => setType("public")}
              style={{ opacity: type === "public" ? 1 : 0.6 }}
            >
              Public
            </button>
            <button
              type="button"
              className={`sg2-btn secondary`}
              onClick={() => setType("private")}
              style={{ opacity: type === "private" ? 1 : 0.6 }}
            >
              Private
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#6e5644" }}>Focus Style</span>
            <button
              type="button"
              className="sg2-btn secondary"
              onClick={() => setFocusStyle("discussion")}
              style={{ opacity: focusStyle === "discussion" ? 1 : 0.6 }}
            >
              Discussion
            </button>
            <button
              type="button"
              className="sg2-btn secondary"
              onClick={() => setFocusStyle("silent")}
              style={{ opacity: focusStyle === "silent" ? 1 : 0.6 }}
            >
              Silent Study
            </button>
          </div>

          <label style={{ display: "grid", gap: 6, fontSize: "0.85rem", color: "#6e5644" }}>
            Weekly goal (hours, optional)
            <input
              className="sg2-input"
              type="number"
              min={0}
              step={0.5}
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
              disabled={loading}
            />
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
            <button type="submit" className="sg2-btn" disabled={loading}>
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
