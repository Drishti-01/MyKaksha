import { useEffect, useState } from "react";
import { saveRoomNotesApi } from "../../api/rooms";

const privateKey = (roomId) => `myKakshaPrivateNotes:${roomId}`;

export default function SharedNotes({ roomId, initialShared, socketRef, onSaved }) {
  const [shared, setShared] = useState(initialShared || "");
  const [privateNotes, setPrivateNotes] = useState("");
  const [openPrivate, setOpenPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    setShared(initialShared || "");
  }, [initialShared, roomId]);

  useEffect(() => {
    try {
      setPrivateNotes(localStorage.getItem(privateKey(roomId)) || "");
    } catch {
      setPrivateNotes("");
    }
  }, [roomId]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const onRemote = (payload) => {
      if (!payload || payload.roomId !== roomId) return;
      console.log("[SharedNotes] notes-updated from socket");
      setShared(payload.content ?? "");
    };
    socket.on("notes-updated", onRemote);
    return () => socket.off("notes-updated", onRemote);
  }, [socketRef, roomId]);

  async function saveShared() {
    setSaving(true);
    setError("");
    setSaveOk(false);
    try {
      await saveRoomNotesApi(roomId, shared);
      socketRef?.current?.emit("notes-update", { roomId, content: shared });
      setSaveOk(true);
      onSaved?.();
      setTimeout(() => setSaveOk(false), 2000);
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function persistPrivate(next) {
    setPrivateNotes(next);
    try {
      localStorage.setItem(privateKey(roomId), next);
    } catch {
      /* quota */
    }
  }

  return (
    <section className="sg2-panel" style={{ marginTop: 16 }} aria-label="Shared notes">
      <h2 style={{ margin: "0 0 10px", fontSize: "1rem", color: "#4a3629" }}>Shared Notes</h2>
      <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#8b6f5e" }}>Shared with room members</p>
      <textarea
        className="sg2-input"
        style={{ minHeight: 140, resize: "vertical" }}
        value={shared}
        onChange={(e) => setShared(e.target.value)}
        placeholder="Resources, agenda, reminders…"
      />
      <button type="button" className="sg2-btn" style={{ marginTop: 10 }} onClick={saveShared} disabled={saving}>
        {saving ? "Saving…" : "Save Notes"}
      </button>
      {saveOk ? (
        <span style={{ marginLeft: 10, fontSize: "0.82rem", color: "#166534" }}>Saved</span>
      ) : null}
      {error ? (
        <p style={{ color: "#b45309", fontSize: "0.82rem", marginTop: 8 }} role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className="sg2-btn secondary"
        style={{ marginTop: 14, width: "100%" }}
        onClick={() => setOpenPrivate((v) => !v)}
      >
        {openPrivate ? "Hide" : "Show"} My Private Notes
      </button>
      {openPrivate ? (
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.78rem", color: "#8b6f5e" }}>Only visible on this device</p>
          <textarea
            className="sg2-input"
            style={{ minHeight: 100, resize: "vertical" }}
            value={privateNotes}
            onChange={(e) => persistPrivate(e.target.value)}
          />
        </div>
      ) : null}
    </section>
  );
}
