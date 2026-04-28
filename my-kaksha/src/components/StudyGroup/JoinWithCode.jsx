import { useState } from "react";

export default function JoinWithCode({ onJoined, disabled }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    setError("");
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) {
      setError("Enter a 6-character code");
      return;
    }
    setLoading(true);
    try {
      await onJoined(trimmed.slice(0, 6));
    } catch (err) {
      setError(err.message === "Room not found" ? "Room not found" : err.message || "Could not join");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="sg2-card" onSubmit={handleJoin} style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 10px", fontSize: "1rem", color: "#4a3629" }}>Join with Code</h3>
      <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "#8b6f5e" }}>Paste the 6-character room code.</p>
      <input
        className="sg2-input"
        maxLength={8}
        placeholder="e.g. DSPRC1"
        value={code}
        onChange={(ev) => setCode(ev.target.value.toUpperCase())}
        disabled={disabled || loading}
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <p style={{ color: "#b45309", fontSize: "0.82rem", margin: "8px 0 0" }} role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="sg2-btn" style={{ width: "100%", marginTop: 12 }} disabled={disabled || loading}>
        {loading ? "Joining…" : "Join"}
      </button>
    </form>
  );
}
