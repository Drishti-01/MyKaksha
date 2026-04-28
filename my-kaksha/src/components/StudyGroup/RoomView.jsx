import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { addFocusPointApi } from "../../api/rooms";
import { useAuth } from "../../auth/useAuth";
import { rememberRoom, useRoom } from "../../hooks/useRoom";
import { usePresence } from "../../hooks/usePresence";
import { useTimer } from "../../hooks/useTimer";
import ChatPanel from "./ChatPanel";
import LeaderboardPanel from "./LeaderboardPanel";
import MembersPanel from "./MembersPanel";
import PresenceStrip from "./PresenceStrip";
import PrivacySettings from "./PrivacySettings";
import SharedNotes from "./SharedNotes";
import TimerPanel from "./TimerPanel";

function stripCounts(members) {
  let focusing = 0;
  let onBreak = 0;
  let away = 0;
  let online = 0;
  for (const m of members || []) {
    if (m.status === "offline") continue;
    if (m.status === "focusing") focusing += 1;
    else if (m.status === "break") onBreak += 1;
    else if (m.status === "away") away += 1;
    else online += 1;
  }
  return { focusing, onBreak, away, online };
}

export default function RoomView() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, update, privacyPayload } = usePresence();
  const socketRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("chat");
  const [timerScope, setTimerScope] = useState("personal");
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const displayName = user?.name || (typeof localStorage !== "undefined" ? localStorage.getItem("myKakshaUserName") : null) || "Student";
  const userId = user?.id || "guest";

  const joinPayloadRef = useRef({ roomId, displayName, userId, privacyPayload });
  useEffect(() => {
    joinPayloadRef.current = { roomId, displayName, userId, privacyPayload };
  }, [roomId, displayName, userId, privacyPayload]);

  const { room, leaderboard, loading, error, reload, leaveRoom, setLeaderboardRows } = useRoom(roomId);

  const onSessionComplete = useCallback(async () => {
    if (!roomId || !settings.appearInLeaderboard) return;
    try {
      const data = await addFocusPointApi(roomId, 1);
      setLeaderboardRows(data.leaderboard || []);
    } catch {
      /* ignore */
    }
  }, [roomId, settings.appearInLeaderboard, setLeaderboardRows]);

  const emitStatus = useCallback(
    (status) => {
      let next = status;
      if (!settings.showOnline && status === "online") {
        next = "invisible";
      }
      socketRef.current?.emit("user-status-update", { status: next });
    },
    [settings.showOnline]
  );

  const timer = useTimer({
    socketRef,
    roomId,
    timerScope,
    onSessionComplete,
    onStatusChange: emitStatus,
  });

  function emitJoin() {
    const { roomId: rid, displayName: dn, userId: uid, privacyPayload: pr } = joinPayloadRef.current;
    if (!rid || !socketRef.current?.connected) return;
    console.log("[RoomView] emit join-room", { rid, uid });
    socketRef.current.emit("join-room", {
      roomId: rid,
      username: dn,
      userId: uid,
      privacy: pr,
    });
    socketRef.current.emit("get-room-members", (res) => {
      if (Array.isArray(res?.members)) setMembers(res.members);
    });
  }

  useEffect(() => {
    if (!roomId) return undefined;
    rememberRoom(roomId);

    const socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    const onMembers = (payload) => {
      if (!payload || payload.roomId !== roomId) return;
      setMembers(payload.members || []);
    };

    socket.on("connect", () => {
      emitJoin();
    });
    socket.on("room-members-update", onMembers);

    if (socket.connected) emitJoin();

    return () => {
      console.log("[RoomView] socket teardown + REST leave");
      socket.off("room-members-update", onMembers);
      socket.disconnect();
      leaveRoom().catch(() => {});
    };
  }, [roomId, leaveRoom]);

  useEffect(() => {
    emitJoin();
  }, [privacyPayload, displayName, userId, roomId]);

  const peerFocusLabel = useMemo(() => {
    const other = (members || []).find((m) => !m.isSelf && m.status === "focusing");
    return other ? `${other.name} is focusing 🎯` : "";
  }, [members]);

  const nameResolver = useCallback(
    (uid) => {
      const row = members.find((m) => m.userId === uid);
      if (row?.name) return row.name;
      if (uid === user?.id) return user?.name || "";
      return "";
    },
    [members, user]
  );

  const chatPaused =
    room?.focusStyle === "silent" && timer.phase === "focus" && timer.running;

  const leaderboardRows = useMemo(
    () =>
      (leaderboard || []).map((row) => ({
        userId: row.userId,
        points: row.points ?? 0,
      })),
    [leaderboard]
  );

  async function handleLeave() {
    await leaveRoom();
    navigate("/study-group");
  }

  function copyCode() {
    if (!room?.code) return;
    navigator.clipboard?.writeText(room.code).catch(() => {});
  }

  if (loading && !room) {
    return <p style={{ color: "#8b6f5e" }}>Loading room…</p>;
  }

  if (error || !room) {
    return (
      <div>
        <p style={{ color: "#b45309" }} role="alert">
          {error || "Room not found"}
        </p>
        <button type="button" className="sg2-btn secondary" onClick={() => navigate("/study-group")}>
          Back to lobby
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="sg2-topbar" style={{ border: "none", paddingBottom: 0, marginBottom: 12 }}>
        <div>
          <h1 className="sg2-title" style={{ fontSize: "1.5rem" }}>
            {room.name}
          </h1>
          <p className="sg2-sub" style={{ marginTop: 4 }}>
            <span className="sg2-badge" style={{ fontSize: "0.75rem" }}>
              {room.type === "private" ? "Private" : "Public"}
            </span>{" "}
            · Code{" "}
            <button type="button" className="sg2-btn secondary" style={{ padding: "4px 10px" }} onClick={copyCode}>
              {room.code} (copy)
            </button>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="sg2-badge">{room.onlineCount ?? 0} online</span>
          <div className="sg2-gear-wrap">
            <button type="button" className="sg2-btn secondary" aria-label="Privacy settings" onClick={() => setPrivacyOpen((v) => !v)}>
              ⚙
            </button>
            {privacyOpen ? (
              <PrivacySettings open={privacyOpen} onClose={() => setPrivacyOpen(false)} settings={settings} onChange={update} />
            ) : null}
          </div>
          <button type="button" className="sg2-btn secondary" onClick={handleLeave}>
            Leave Room
          </button>
        </div>
      </div>

      <div className="sg2-room-view">
        <div>
          <TimerPanel
            timerScope={timerScope}
            onTimerScopeChange={(next) => {
              timer.pause();
              timer.reset();
              setTimerScope(next);
            }}
            formatted={timer.formatted}
            label={timer.label}
            sessionOf={timer.sessionOf}
            running={timer.running}
            onStart={timer.start}
            onPause={timer.pause}
            onReset={timer.reset}
            onSwitchPhase={timer.switchPhase}
            peerFocusLabel={timerScope === "personal" ? peerFocusLabel : ""}
            focusStyle={room.focusStyle}
          />

          <SharedNotes
            roomId={roomId}
            initialShared={room.sharedNotes || ""}
            socketRef={socketRef}
            onSaved={() => reload({ silent: true })}
          />
        </div>

        <div className="sg2-panel">
          <div className="sg2-tabs" role="tablist">
            <button type="button" className={`sg2-tab ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>
              Chat
            </button>
            <button type="button" className={`sg2-tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>
              Members
            </button>
            <button
              type="button"
              className={`sg2-tab ${tab === "leaderboard" ? "active" : ""}`}
              onClick={() => setTab("leaderboard")}
            >
              Leaderboard
            </button>
          </div>

          {tab === "chat" ? (
            <ChatPanel
              roomId={roomId}
              socketRef={socketRef}
              displayName={displayName}
              chatPaused={chatPaused}
              pausedMessage="Chat paused during focus session"
            />
          ) : null}
          {tab === "members" ? <MembersPanel members={members} createdByName={room.creatorName || "—"} /> : null}
          {tab === "leaderboard" ? <LeaderboardPanel rows={leaderboardRows} nameResolver={nameResolver} /> : null}

          <PresenceStrip counts={stripCounts(members)} />
        </div>
      </div>
    </div>
  );
}
