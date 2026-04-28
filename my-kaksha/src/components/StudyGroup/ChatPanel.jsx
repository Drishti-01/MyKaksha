import { useEffect, useRef, useState } from "react";

function formatTs(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPanel({
  roomId,
  socketRef,
  displayName,
  userId,
  chatPaused,
  pausedMessage,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingName, setTypingName] = useState("");
  const boxRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const onMsg = (incoming) => {
      setMessages((prev) => [...prev, incoming]);
    };
    const onHistory = (history) => {
      if (!Array.isArray(history)) return;
      setMessages(history);
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

    const pushSystem = (text, ts) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${ts}-${Math.random()}`,
          username: "System",
          text,
          timestamp: ts,
          type: "system",
        },
      ]);
    };

    const onJoinedRoom = (notice) => {
      if (notice?.text) pushSystem(notice.text, notice.timestamp);
    };
    const onLeftRoom = (notice) => {
      if (notice?.text) pushSystem(notice.text, notice.timestamp);
    };

    socket.on("receive-message", onMsg);
    socket.on("chat-history", onHistory);
    socket.on("typing", onTyping);
    socket.on("typing-start", onTypingStart);
    socket.on("typing-stop", onTypingStop);
    socket.on("user-joined-room", onJoinedRoom);
    socket.on("user-left-room", onLeftRoom);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.off("receive-message", onMsg);
      socket.off("chat-history", onHistory);
      socket.off("typing", onTyping);
      socket.off("typing-start", onTypingStart);
      socket.off("typing-stop", onTypingStop);
      socket.off("user-joined-room", onJoinedRoom);
      socket.off("user-left-room", onLeftRoom);
    };
  }, [socketRef, roomId]);

  useEffect(() => {
    if (!boxRef.current) return;
    boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, typingName]);

  function send(e) {
    e.preventDefault();
    const v = text.trim();
    if (!v || chatPaused) return;
    socketRef.current?.emit("send-message", {
      roomId,
      username: displayName,
      text: v,
    });
    setText("");
    socketRef.current?.emit("typing-stop");
  }

  function onChange(e) {
    const v = e.target.value;
    setText(v);
    if (!v.trim()) {
      socketRef.current?.emit("typing-stop");
      return;
    }
    socketRef.current?.emit("typing", { roomId, username: displayName });
  }

  return (
    <div>
      {chatPaused ? <div className="sg2-banner">{pausedMessage}</div> : null}
      <div
        ref={boxRef}
        style={{
          border: "1px solid #ead8c7",
          borderRadius: 14,
          padding: 12,
          height: 280,
          overflowY: "auto",
          background: "#fffdf9",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
        aria-live="polite"
      >
        {messages.map((msg) => {
          const isSystem = msg.type === "system" || msg.username === "System";
          return (
            <div
              key={msg.id}
              style={{
                background: isSystem ? "#f0fdf4" : "#f5ece1",
                borderRadius: 12,
                padding: "8px 10px",
                border: isSystem ? "1px solid #bbf7d0" : "1px solid transparent",
              }}
            >
              <strong style={{ display: "block", color: "#6b4d3a", fontSize: "0.82rem" }}>{msg.username}</strong>
              <span style={{ color: "#4a3629", fontSize: "0.9rem" }}>{msg.text}</span>
              {msg.timestamp ? (
                <small style={{ display: "block", marginTop: 4, color: "#8c7766", fontSize: "0.72rem" }}>
                  {formatTs(msg.timestamp)}
                </small>
              ) : null}
            </div>
          );
        })}
        {typingName && typingName !== displayName ? (
          <div style={{ fontStyle: "italic", color: "#8b6f5e", fontSize: "0.82rem" }}>{typingName} is typing…</div>
        ) : null}
      </div>
      <form style={{ display: "flex", gap: 8, marginTop: 10 }} onSubmit={send}>
        <input
          className="sg2-input"
          value={text}
          onChange={onChange}
          placeholder={chatPaused ? "Chat paused" : "Message the room"}
          disabled={chatPaused}
          aria-label="Chat message"
        />
        <button type="submit" className="sg2-btn" disabled={chatPaused}>
          Send
        </button>
      </form>
    </div>
  );
}
