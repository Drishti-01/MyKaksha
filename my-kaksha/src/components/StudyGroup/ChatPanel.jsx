import { useEffect, useMemo, useRef, useState } from "react";
import { fetchRoomMessages, sendRoomMessageApi } from "../../api/rooms";

function formatTs(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function normalizeIncoming(msg) {
  const senderName = msg?.sender?.name || msg?.username || "Guest";
  const stableId = msg?.id || msg?._id || "";
  return {
    id: stableId || `${Date.now()}-${Math.random()}`,
    serverId: stableId || "",
    clientMessageId: typeof msg?.clientMessageId === "string" ? msg.clientMessageId : "",
    sender: { userId: msg?.sender?.userId || "guest", name: senderName },
    content: msg.content || msg.text || "",
    timestamp: msg.timestamp || new Date().toISOString(),
    type: msg.type || "user",
    pending: Boolean(msg.pending),
    failed: Boolean(msg.failed),
  };
}

function dedupeMessages(rows) {
  const seen = new Set();
  return (rows || []).filter((row) => {
    const key = String(
      row.serverId ||
      row.id ||
      row.clientMessageId ||
      `${row.timestamp || ""}-${row.sender?.userId || ""}-${row.content || ""}`
    );
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function ChatPanel({ roomId, socketRef, meUserId, meName, chatPaused, pausedMessage, isActiveTab, onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typingName, setTypingName] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const boxRef = useRef(null);
  const typingTimerRef = useRef(null);

  const newestTimestamp = useMemo(() => messages[messages.length - 1]?.timestamp, [messages]);
  const oldestTimestamp = useMemo(() => messages[0]?.timestamp, [messages]);

  function upsertIncoming(prev, incoming) {
    const msg = normalizeIncoming(incoming);
    const byServer = msg.serverId || msg.id;
    if (byServer && prev.some((existing) => (existing.serverId || existing.id) === byServer)) {
      return prev;
    }
    if (msg.clientMessageId) {
      const pendingIdx = prev.findIndex((existing) => existing.clientMessageId === msg.clientMessageId);
      if (pendingIdx !== -1) {
        const next = [...prev];
        next[pendingIdx] = msg;
        return dedupeMessages(next);
      }
    }
    return dedupeMessages([...prev, msg]);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchRoomMessages(roomId);
        if (cancelled) return;
        const list = dedupeMessages((data.messages || []).map(normalizeIncoming));
        setMessages(list);
        setHasOlder(list.length >= 50);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const onReceive = (incoming) => {
      const msg = normalizeIncoming(incoming);
      setMessages((prev) => upsertIncoming(prev, msg));
      // If this message is from the current user it confirms delivery — re-enable send
      try {
        if ((msg.sender?.userId || "") === String(meUserId)) {
          setSending(false);
          setText("");
        }
      } catch (e) {
        console.error("ChatPanel:onReceive re-enable send error", e);
      }
      if (!isActiveTab && msg.sender.userId !== meUserId) {
        onUnreadChange?.((v) => (v || 0) + 1);
      }
    };

    const onTyping = ({ username }) => {
      setTypingName(username || "");
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingName(""), 1200);
    };

    const onTypingStart = ({ name }) => {
      setTypingName(name || "");
    };

    const onTypingStop = () => {
      setTypingName("");
    };

    const onSystem = (notice) => {
      if (!notice?.text) return;
      const systemMsg = normalizeIncoming({
        id: `sys-${Date.now()}-${Math.random()}`,
        sender: { userId: "system", name: "System" },
        content: notice.text,
        timestamp: notice.timestamp,
        type: "system",
      });
      setMessages((prev) => (prev.some((existing) => existing.id === systemMsg.id) ? prev : [...prev, systemMsg]));
    };

    socket.on("receive-message", onReceive);
    socket.on("typing", onTyping);
    socket.on("typing-start", onTypingStart);
    socket.on("typing-stop", onTypingStop);
    socket.on("user-joined-room", onSystem);
    socket.on("user-left-room", onSystem);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.off("receive-message", onReceive);
      socket.off("typing", onTyping);
      socket.off("typing-start", onTypingStart);
      socket.off("typing-stop", onTypingStop);
      socket.off("user-joined-room", onSystem);
      socket.off("user-left-room", onSystem);
    };
  }, [socketRef, roomId, isActiveTab, meUserId, onUnreadChange]);

  useEffect(() => {
    if (!boxRef.current) return;
    boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [newestTimestamp, typingName]);

  async function loadOlder() {
    if (!hasOlder || loadingOlder || !oldestTimestamp) return;
    setLoadingOlder(true);
    try {
      const data = await fetchRoomMessages(roomId, oldestTimestamp);
      const older = dedupeMessages((data.messages || []).map(normalizeIncoming));
      if (older.length === 0) {
        setHasOlder(false);
      } else {
        setMessages((prev) => dedupeMessages([...older, ...prev]));
        if (older.length < 50) setHasOlder(false);
      }
    } finally {
      setLoadingOlder(false);
    }
  }

  function onScroll(e) {
    if (e.currentTarget.scrollTop <= 10) {
      loadOlder();
    }
  }

  async function sendMessage(rawText, retryId) {
    const value = String(rawText || "").trim();
    if (!value || chatPaused) return;
    const fallbackToRest = async () => {
      const data = await sendRoomMessageApi(roomId, value, "user");
      const sent = normalizeIncoming(data.message);
      setMessages((prev) => {
        if (retryId) {
          return dedupeMessages(prev.map((m) => (m.id === retryId ? sent : m)));
        }
        // Append server-saved message if not already present
        const exists = prev.find((m) => (m.serverId || m.id) === (sent.serverId || sent.id));
        if (exists) return prev;
        return dedupeMessages([...prev, sent]);
      });
    };

    try {
      const socket = socketRef?.current;
      // If socket not available, fallback to REST API
      if (!socket || !socket.connected) {
        console.log("ChatPanel: socket unavailable, falling back to REST for sendMessage");
        await fallbackToRest();
        return;
      }

      // Use socket-only send. Do not add optimistic message locally —
      // server will persist and broadcast 'receive-message' to all clients (including sender).
      setSending(true);
      try {
        socket.emit("send-message", { roomId, content: value, type: "user" });
        // we will re-enable `sending` when receive-message arrives for this user
        // also clear input to give instant feedback
        setText("");
      } catch (e) {
        console.error("ChatPanel: socket emit failed, falling back to REST", e);
        await fallbackToRest();
        setSending(false);
      }
    } catch (e) {
      console.error("ChatPanel: sendMessage error", e);
      setSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(text);
    socketRef.current?.emit("typing-stop");
  }

  function onInputChange(e) {
    const v = e.target.value;
    setText(v);
    if (!v.trim()) {
      socketRef.current?.emit("typing-stop");
      return;
    }
    socketRef.current?.emit("typing", { roomId, username: meName });
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="sg2-chat-container">
      {chatPaused ? <div className="sg2-banner">💬 {pausedMessage}</div> : null}
      <div ref={boxRef} className="sg2-chat-box" onScroll={onScroll}>
        {loadingOlder ? <p className="sg2-soft-text">Loading older messages...</p> : null}

        {messages.length === 0 && !loadingOlder ? (
          <div className="sg2-chat-empty">
            <div className="sg2-chat-empty-emoji" aria-hidden>💬</div>
            <p className="sg2-chat-empty-title">No messages yet. Say hello! 👋</p>
          </div>
        ) : null}

        {messages.map((msg) => {
          const isMine = msg.sender.userId === meUserId;
          const isSystem = msg.type === "system";
          if (isSystem) {
            return (
              <div key={msg.id} className="sg2-system-msg">
                {msg.content}
              </div>
            );
          }

          return (
            <div key={msg.id} className={`sg2-message-row ${isMine ? "mine" : "other"}`}>
              {!isMine ? <span className="sg2-avatar-stack sg2-avatar-lg" style={{ marginLeft: 0 }}>{msg.sender.name.slice(0, 1).toUpperCase()}</span> : null}
              <div className={`sg2-bubble ${isMine ? "mine" : "other"}`}>
                {!isMine ? <strong>{msg.sender.name}</strong> : null}
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                <small className="sg2-message-time">{formatTs(msg.timestamp)}</small>
                {msg.pending ? <small className="sg2-soft-text">sending...</small> : null}
                {msg.failed ? (
                  <button type="button" className="sg2-retry-btn" onClick={() => sendMessage(msg.content, msg.id)}>
                    retry
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}

        {typingName && typingName !== meName ? (
          <div className="sg2-typing">{typingName} is typing<span>.</span><span>.</span><span>.</span></div>
        ) : null}
      </div>

      <form className="sg2-chat-input" onSubmit={handleSubmit}>
        <textarea
          className="sg2-input"
          value={text}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={chatPaused ? "Chat paused during focus" : "Type message... Enter to send, Shift+Enter new line"}
          disabled={chatPaused || sending}
        />
        <button type="submit" className="sg2-btn" disabled={chatPaused || sending}>{sending ? "Sending..." : "Send"}</button>
      </form>
    </div>
  );
}
