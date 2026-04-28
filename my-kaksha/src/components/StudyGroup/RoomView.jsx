import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { recordSessionCompleteApi } from "../../api/rooms";
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

function toStatsMap(rows) {
  const map = {};
  for (const row of rows || []) {
    map[row.userId] = row;
  }
  return map;
}

function roomAccent(name) {
  if (name === "DSA Practice") return "#6366F1";
  if (name === "DBMS Prep") return "#10B981";
  if (name === "OS Revision") return "#F59E0B";
  if (name === "Web Dev Zone") return "#3B82F6";
  if (name === "Silent Focus") return "#8B5CF6";
  return "#a67556";
}

export default function RoomView() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("chat");
  const [timerScope, setTimerScope] = useState("personal");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [copyCodeDone, setCopyCodeDone] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);

  const { settings, update, privacyPayload } = usePresence();

  const displayName = user?.name || localStorage.getItem("myKakshaUserName") || "Student";
  const userId = user?.id || "guest";

  const {
    room,
    leaderboard,
    roomStats,
    myStats,
    loading,
    error,
    reload,
    leaveRoom,
    setLeaderboardRows,
    setRoomStatsRows,
    setMyStats,
  } = useRoom(roomId);

  const statsByUser = useMemo(() => toStatsMap(roomStats), [roomStats]);

  const onSessionComplete = useCallback(async ({ minutes = 25, sessions = 1 }) => {
    try {
      const data = await recordSessionCompleteApi(roomId, minutes, sessions);
      if (data?.stats) {
        setMyStats(data.stats);
      }
      socketRef.current?.emit("session-complete", { roomId, sessionNumber: sessions });
      socketRef.current?.emit("study-time-update", {
        roomId,
        userId,
        name: displayName,
        todayMinutes: minutes,
        sessionsToday: sessions,
      });
      const roomStatsPayload = await new Promise((resolve) => {
        socketRef.current?.emit("room-stats-request", { roomId }, (resp) => resolve(resp));
      });
      if (roomStatsPayload?.success && Array.isArray(roomStatsPayload.stats)) {
        setRoomStatsRows(roomStatsPayload.stats);
        setLeaderboardRows(roomStatsPayload.stats.map((r) => ({
          userId: r.userId,
          userName: r.userName,
          points: r.focusPoints || 0,
          streakDays: r.streakDays || 0,
        })));
      }
    } catch {
      /* non-blocking */
    }
  }, [roomId, userId, displayName, setMyStats, setRoomStatsRows, setLeaderboardRows]);

  const emitStatus = useCallback((status) => {
    const finalStatus = !settings.showOnline && status === "online" ? "invisible" : status;
    socketRef.current?.emit("user-status-update", {
      roomId,
      userId,
      name: displayName,
      status: finalStatus,
    });
  }, [settings.showOnline, roomId, userId, displayName]);

  const timer = useTimer({
    socketRef,
    roomId,
    timerScope,
    onSessionComplete,
    onStatusChange: emitStatus,
    userId,
  });

  useEffect(() => {
    if (!roomId) return undefined;
    rememberRoom(roomId, room?.name);

    const socket = io({ path: "/socket.io", transports: ["websocket", "polling"], reconnection: true });
    socketRef.current = socket;

    const emitJoin = () => {
      socket.emit("join-room", {
        roomId,
        userId,
        username: displayName,
        privacy: privacyPayload,
      });
      socket.emit("get-room-members", (res) => {
        if (Array.isArray(res?.members)) setMembers(res.members);
      });
      socket.emit("room-stats-request", { roomId }, (res) => {
        if (res?.success && Array.isArray(res.stats)) {
          setRoomStatsRows(res.stats);
          setLeaderboardRows(res.stats.map((r) => ({
            userId: r.userId,
            userName: r.userName,
            points: r.focusPoints || 0,
            streakDays: r.streakDays || 0,
          })));
        }
      });
    };

    socket.on("connect", () => {
      setReconnecting(false);
      emitJoin();
    });

    socket.io.on("reconnect_attempt", () => {
      setReconnecting(true);
    });

    socket.on("room-members-update", (payload) => {
      if (payload?.roomId !== roomId) return;
      setMembers(Array.isArray(payload.members) ? payload.members : []);
    });

    socket.on("room-stats", (payload) => {
      if (payload?.roomId !== roomId || !Array.isArray(payload.stats)) return;
      setRoomStatsRows(payload.stats);
      setLeaderboardRows(payload.stats.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        points: r.focusPoints || 0,
        streakDays: r.streakDays || 0,
      })));
      const mine = payload.stats.find((s) => s.userId === userId);
      if (mine) setMyStats(mine);
    });

    if (socket.connected) emitJoin();

    return () => {
      socket.disconnect();
      leaveRoom().catch(() => {});
    };
  }, [roomId, userId, displayName, privacyPayload, leaveRoom, setRoomStatsRows, setLeaderboardRows, setMyStats, room?.name]);

  useEffect(() => {
    if (tab === "chat") {
      setUnreadChat(0);
    }
  }, [tab]);

  const membersStudyRows = useMemo(() => {
    const enriched = (members || []).map((m) => {
      const s = statsByUser[m.userId] || {};
      return {
        ...m,
        todayMinutes: Number(s.totalFocusMinutes || 0),
      };
    });
    const max = Math.max(1, ...enriched.map((e) => e.todayMinutes || 0));
    return { rows: enriched.sort((a, b) => (b.todayMinutes || 0) - (a.todayMinutes || 0)), max };
  }, [members, statsByUser]);

  const chatPaused = room?.focusStyle === "silent" && timer.phase === "focus" && timer.running;

  async function handleLeave() {
    await leaveRoom();
    navigate("/study-group");
  }

  function copyCode() {
    if (!room?.code) return;
    navigator.clipboard?.writeText(room.code).then(() => {
      setCopyCodeDone(true);
      setTimeout(() => setCopyCodeDone(false), 1200);
    }).catch(() => {});
  }

  if (loading && !room) return <p className="sg2-soft-text">Loading room...</p>;
  if (error || !room) return (
    <div>
      <p className="sg2-error">{error || "Room not found"}</p>
      <button type="button" className="sg2-btn secondary" onClick={() => navigate("/study-group")}>Back to lobby</button>
    </div>
  );

  const accent = roomAccent(room.name);
  const presenceCounts = stripCounts(members);

  return (
    <div>
      {reconnecting ? <div className="sg2-banner">Reconnecting...</div> : null}

      <div className="sg2-topbar sg2-room-topbar">
        <div>
          <div className="sg2-inline-row" style={{ gap: 8 }}>
            <span className="sg2-room-dot" style={{ background: accent }} />
            <h1 className="sg2-title" style={{ fontSize: "1.45rem" }}>{room.name}</h1>
          </div>
          <div className="sg2-inline-row" style={{ gap: 8, marginTop: 4 }}>
            <span className="sg2-mini-badge">{room.type === "private" ? "Private" : "Public"}</span>
            <button type="button" className="sg2-code-btn" onClick={copyCode}>{room.code} {copyCodeDone ? "Copied!" : "Copy"}</button>
          </div>
        </div>

        <div style={{ display: "grid", justifyItems: "end", gap: 8 }}>
          <div className="sg2-inline-row" style={{ gap: 6 }}>
            {(members || []).slice(0, 5).map((m) => (
              <span key={`${m.userId}-${m.name}`} className="sg2-avatar-stack" title={m.name}>{String(m.name || "?").slice(0, 1).toUpperCase()}</span>
            ))}
            <span className="sg2-badge">{presenceCounts.online + presenceCounts.focusing + presenceCounts.onBreak + presenceCounts.away} online</span>
          </div>
          <div className="sg2-inline-row" style={{ gap: 8 }}>
            <div className="sg2-gear-wrap">
              <button type="button" className="sg2-btn secondary" onClick={() => setPrivacyOpen((v) => !v)}>⚙</button>
              <PrivacySettings open={privacyOpen} onClose={() => setPrivacyOpen(false)} settings={settings} onChange={update} />
            </div>
            <button type="button" className="sg2-btn secondary" onClick={handleLeave}>Leave Room</button>
          </div>
        </div>
      </div>

      <div className="sg2-room-view">
        <div>
          <TimerPanel
            timerScope={timerScope}
            onTimerScopeChange={setTimerScope}
            formatted={timer.formatted}
            label={timer.label}
            sessionOf={timer.sessionOf}
            running={timer.running}
            onStart={timer.start}
            onPause={timer.pause}
            onReset={timer.reset}
            onSwitchPhase={timer.switchPhase}
            focusStyle={room.focusStyle}
            progress={timer.progress}
            personalTodayMinutes={myStats?.totalFocusMinutes || 0}
            groupStartedBy={timer.groupStartedBy}
            canControlGroup={timer.canControlGroup}
            groupDeniedMessage={timer.groupDeniedMessage}
            celebrate={timer.celebrate}
            lastActionReason={timer.lastActionReason}
          />

          <section className="sg2-panel" style={{ marginTop: 16 }}>
            <h3 className="sg2-subtitle">Members&apos; Study Time Today</h3>
            <ul className="sg2-clean-list" style={{ display: "grid", gap: 8, marginTop: 10 }}>
              {membersStudyRows.rows.map((m) => {
                const pct = Math.round(((m.todayMinutes || 0) / membersStudyRows.max) * 100);
                return (
                  <li key={`${m.userId}-${m.name}`} className="sg2-study-row">
                    <span className="sg2-avatar-stack" style={{ marginLeft: 0 }}>{String(m.name).slice(0, 1).toUpperCase()}</span>
                    <div style={{ flex: 1 }}>
                      <div className="sg2-inline-row"><strong>{m.name}</strong><span className={`sg2-status-chip ${m.status || "online"}`}>{m.status || "online"}</span></div>
                      <div className="sg2-progress-rail" style={{ marginTop: 4 }}><div className="sg2-progress-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                    <strong>{m.todayMinutes || 0} min</strong>
                  </li>
                );
              })}
            </ul>
          </section>

          <SharedNotes roomId={roomId} userId={userId} socketRef={socketRef} />
        </div>

        <div className="sg2-panel">
          <div className="sg2-tabs" role="tablist">
            <button type="button" className={`sg2-tab ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>
              Chat {unreadChat > 0 && tab !== "chat" ? <span className="sg2-unread">{unreadChat}</span> : null}
            </button>
            <button type="button" className={`sg2-tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>Members</button>
            <button type="button" className={`sg2-tab ${tab === "leaderboard" ? "active" : ""}`} onClick={() => setTab("leaderboard")}>Leaderboard</button>
          </div>

          {tab === "chat" ? (
            <ChatPanel
              roomId={roomId}
              socketRef={socketRef}
              meUserId={userId}
              meName={displayName}
              chatPaused={chatPaused}
              pausedMessage="Chat paused during focus session"
              isActiveTab={tab === "chat"}
              onUnreadChange={setUnreadChat}
            />
          ) : null}
          {tab === "members" ? <MembersPanel members={members} roomCode={room.code} meName={displayName} statsByUser={statsByUser} /> : null}
          {tab === "leaderboard" ? <LeaderboardPanel rows={leaderboard} myUserId={userId} /> : null}

          <PresenceStrip counts={presenceCounts} />
        </div>
      </div>
    </div>
  );
}
