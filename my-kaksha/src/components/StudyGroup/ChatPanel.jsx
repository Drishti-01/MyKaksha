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
  return {
    id: msg.id || `${Date.now()}-${Math.random()}`,
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
    const key = String(row.id || row.timestamp || row.content || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function ChatPanel({ roomId, socketRef, meUserId, meName, chatPaused, pausedMessage, isActiveTab, onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingName, setTypingName] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const boxRef = useRef(null);
  const typingTimerRef = useRef(null);

  const newestTimestamp = useMemo(() => messages[messages.length - 1]?.timestamp, [messages]);
  const oldestTimestamp = useMemo(() => messages[0]?.timestamp, [messages]);

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
      setMessages((prev) => (prev.some((existing) => existing.id === msg.id) ? prev : [...prev, msg]));
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

    if (retryId) {
      setMessages((prev) => prev.map((m) => (m.id === retryId ? { ...m, failed: false, pending: true } : m)));
    }

    const optimistic = retryId
      ? null
      : normalizeIncoming({
          id: `tmp-${Date.now()}-${Math.random()}`,
          sender: { userId: meUserId, name: meName },
          content: value,
          timestamp: new Date().toISOString(),
          type: "user",
          pending: true,
        });

    if (optimistic) {
      setMessages((prev) => [...prev, optimistic]);
      setText("");
    }

    try {
      const data = await sendRoomMessageApi(roomId, value, "user");
      const sent = normalizeIncoming(data.message);
      setMessages((prev) => {
        if (retryId) {
          return prev.map((m) => (m.id === retryId ? sent : m));
        }
        return prev.map((m) => (m.id === optimistic.id ? sent : m));
      });
    } catch {
      setMessages((prev) => {
        if (retryId) {
          return prev.map((m) => (m.id === retryId ? { ...m, pending: false, failed: true } : m));
        }
        return prev.map((m) => (m.id === optimistic.id ? { ...m, pending: false, failed: true } : m));
      });
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
          disabled={chatPaused}
        />
        <button type="submit" className="sg2-btn" disabled={chatPaused}>Send</button>
      </form>
    </div>
  );
}
