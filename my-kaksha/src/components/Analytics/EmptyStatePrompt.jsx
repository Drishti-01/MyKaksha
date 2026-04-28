import { useNavigate } from "react-router-dom";

export default function EmptyStatePrompt() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        textAlign: "center",
        padding: "28px 16px",
        border: "1px dashed #eed6c4",
        borderRadius: "20px",
        background: "#fffdf9",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: 8 }} aria-hidden>
        🎯
      </div>
      <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#4a3728" }}>No goals tracked yet</p>
      <p style={{ margin: "0 0 16px", color: "#8b6f5e", fontSize: "0.92rem" }}>
        Add goals on your dashboard and run a Pomodoro to populate this table.
      </p>
      <button type="button" className="a-chip active" style={{ cursor: "pointer", border: "none" }} onClick={() => navigate("/dashboard")}>
        Go to Dashboard to add goals →
      </button>
    </div>
  );
}
