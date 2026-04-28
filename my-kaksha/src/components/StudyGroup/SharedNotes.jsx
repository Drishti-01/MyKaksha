import { useEffect, useRef, useState } from "react";
import { fetchRoomNotesApi, saveRoomNotesApi } from "../../api/rooms";

const privateKey = (userId, roomId) => `myKakshaPrivateNotes:${userId}:${roomId}`;

function relativeFrom(iso) {
  if (!iso) return "just now";
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export default function SharedNotes({ roomId, userId, socketRef }) {
  const [shared, setShared] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [openPrivate, setOpenPrivate] = useState(false);
  const [error, setError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchRoomNotesApi(roomId);
        if (!cancelled) setShared(data.content || "");
      } catch {
        if (!cancelled) setShared("");
      }
    })();

    try {
      setPrivateNotes(localStorage.getItem(privateKey(userId, roomId)) || "");
    } catch {
      setPrivateNotes("");
    }

    return () => {
      cancelled = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [roomId, userId]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const onSync = (payload) => {
      if (payload?.roomId !== roomId) return;
      setShared(payload.content || "");
      setLastSavedAt(payload.updatedAt || new Date().toISOString());
    };

    socket.on("notes-sync", onSync);
    return () => socket.off("notes-sync", onSync);
  }, [socketRef, roomId]);

  async function persistNow(nextValue) {
    setSaving(true);
    setError("");
    try {
      await saveRoomNotesApi(roomId, nextValue);
      const updatedAt = new Date().toISOString();
      setLastSavedAt(updatedAt);
      socketRef?.current?.emit("notes-sync", { roomId, content: nextValue, updatedBy: userId, updatedAt });
    } catch (e) {
      setError("Save failed, retrying...");
    } finally {
      setSaving(false);
    }
  }

  function onSharedChange(e) {
    const next = e.target.value;
    setShared(next);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistNow(next);
    }, 3000);
  }

  function onPrivateChange(e) {
    const next = e.target.value;
    setPrivateNotes(next);
    try {
      localStorage.setItem(privateKey(userId, roomId), next);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="sg2-panel" style={{ marginTop: 16 }}>
      <h2 className="sg2-subtitle" style={{ marginBottom: 8 }}>Shared Notes</h2>
      <textarea className="sg2-input" style={{ minHeight: 180, resize: "vertical" }} value={shared} onChange={onSharedChange} placeholder="Capture links, agenda, formulas, quick recap..." />

      <div className="sg2-inline-row" style={{ marginTop: 6 }}>
        <small className="sg2-soft-text">{shared.length} chars</small>
        <small className="sg2-soft-text">Last saved {relativeFrom(lastSavedAt)}</small>
      </div>

      {saving ? <p className="sg2-soft-text" style={{ marginTop: 6 }}>Saving...</p> : null}
      {error ? <p className="sg2-error" style={{ marginTop: 6 }}>{error}</p> : null}

      <button type="button" className="sg2-btn secondary" style={{ marginTop: 10, width: "100%" }} onClick={() => setOpenPrivate((v) => !v)}>
        {openPrivate ? "Hide" : "Show"} Private Notes
      </button>

      {openPrivate ? (
        <div style={{ marginTop: 10 }}>
          <p className="sg2-soft-text" style={{ marginBottom: 6 }}>Only visible to you.</p>
          <textarea className="sg2-input" style={{ minHeight: 120, resize: "vertical" }} value={privateNotes} onChange={onPrivateChange} />
        </div>
      ) : null}
    </section>
  );
}
