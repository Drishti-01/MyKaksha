function initialsFromId(id) {
  if (!id || typeof id !== "string") return "?";
  return id.replace(/[^a-zA-Z0-9]/g, "").slice(-2).toUpperCase() || "?";
}

export default function RoomCard({ room, onJoin }) {
  const accent = room.type === "private" ? "accent-private" : "accent-public";
  const preview = room.memberIdsPreview || [];
  const extra = room.memberPreviewExtra || 0;

  return (
    <article className={`sg2-card ${accent}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", color: "#4a3629" }}>{room.name}</h3>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: 999,
              background: room.type === "private" ? "#fff7ed" : "#eef2ff",
              color: room.type === "private" ? "#9a3412" : "#4338ca",
            }}
          >
            {room.type === "private" ? "Private" : "Public"}
          </span>
        </div>
        <span style={{ fontSize: "0.78rem", color: "#8b6f5e", fontWeight: 600 }}>{room.status}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <div style={{ display: "flex" }}>
          {preview.slice(0, 4).map((id) => (
            <span
              key={id}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#c2a189",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                marginLeft: -6,
                border: "2px solid #fffdf8",
              }}
              title={id}
            >
              {initialsFromId(id)}
            </span>
          ))}
        </div>
        {extra > 0 ? (
          <span style={{ fontSize: "0.78rem", color: "#8b6f5e" }}>+{extra}</span>
        ) : null}
      </div>

      <p style={{ margin: "12px 0 0", fontSize: "0.86rem", color: "#6e5644" }}>
        <strong>{room.onlineCount ?? 0}</strong> studying now · Code <strong>{room.code}</strong>
      </p>

      <button type="button" className="sg2-btn" style={{ width: "100%", marginTop: 14 }} onClick={() => onJoin(room.id)}>
        Join
      </button>
    </article>
  );
}
