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

function dedupeByUserId(rows) {
  const seen = new Set();
  return (rows || []).filter((row) => {
    const key = String(row?.userId || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Socket presence can miss updates if the server broadcast was delayed; MongoDB `room.members` is the source of roster truth. */
function mergeRoomMembersWithPresence(socketRows, roomMemberRows, viewerUserId) {
  const byId = new Map();
  for (const m of dedupeByUserId(socketRows || [])) {
    const id = String(m.userId || "");
    if (!id) continue;
    byId.set(id, { ...m, userId: id });
  }
  const vid = String(viewerUserId || "");
  for (const m of roomMemberRows || []) {
    const id = String(m.userId ?? "");
    if (!id) continue;
    if (!byId.has(id)) {
      byId.set(id, {
        userId: id,
        name: (m.name && String(m.name).trim()) || "Member",
        status: "offline",
        appearInLeaderboard: true,
        isSelf: id === vid,
      });
    } else {
      const cur = byId.get(id);
      const nm = (m.name && String(m.name).trim()) || "";
      if (nm && (!cur.name || String(cur.name).trim() === "" || cur.name === "Student")) {
        byId.set(id, { ...cur, name: nm });
      }
    }
  }
  return [...byId.values()];
}

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
  const joinSentRef = useRef(false);
  const [socketKey, setSocketKey] = useState(0); // increments on each new socket connection
  const [members, setMembers] = useState([]);
  const [studyTimes, setStudyTimes] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
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
    roomStats,
    loading,
    error,
    leaveRoom,
    reload,
    setRoomStatsRows,
    setMyStats,
  } = useRoom(roomId);

  const statsByUser = useMemo(() => toStatsMap(dedupeByUserId(studyTimes)), [studyTimes]);
  const roomStatsByUser = useMemo(() => toStatsMap(dedupeByUserId(roomStats)), [roomStats]);

  const mergedMembers = useMemo(
    () => mergeRoomMembersWithPresence(members, room?.members, userId),
    [members, room?.members, userId]
  );

  const todayMinutesForMe = Number(statsByUser[userId]?.totalFocusMinutes || 0);

  const onSessionComplete = useCallback(async ({ minutes = 25, sessions = 1 }) => {
    try {
      const data = await recordSessionCompleteApi(roomId, minutes, sessions);
      if (data?.session) {
        setStudyTimes((prev) => {
          const next = prev.filter((row) => String(row.userId) !== String(userId));
          next.push({
            userId,
            userName: displayName,
            totalFocusMinutes: Number(data.session.totalFocusMinutes || 0),
            sessionsCompleted: Number(data.session.sessionsCompleted || 0),
            lastActive: data.session.lastActive,
            date: data.session.date,
          });
          return dedupeByUserId(next).sort((a, b) => (b.totalFocusMinutes || 0) - (a.totalFocusMinutes || 0));
        });
      }
    } catch {
      /* non-blocking */
    }
  }, [roomId, userId, displayName]);

  const emitStatus = useCallback((status) => {
    // Always send real timer status in-room so others see online / focus / break.
    // "Hide online" is not applied to people in the same study room together.
    socketRef.current?.emit("user-status-update", {
      roomId,
      userId,
      name: displayName,
      status,
    });
  }, [roomId, userId, displayName]);

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

    const socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      withCredentials: true,
    });
    socketRef.current = socket;
    joinSentRef.current = false;
    const loadStudyTimes = async () => {
      try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/study-times`, { credentials: "include" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.success === false) return;
        const rows = Array.isArray(payload?.data?.sessions) ? payload.data.sessions : Array.isArray(payload?.sessions) ? payload.sessions : [];
        const unique = dedupeByUserId(rows).map((row) => ({
          ...row,
          userId: String(row.userId),
          // Only show Pomodoro focus minutes — not raw join time
          totalFocusMinutes: Number(row.totalFocusMinutes || 0),
        })).sort((a, b) => (b.totalFocusMinutes || 0) - (a.totalFocusMinutes || 0));
        setStudyTimes(unique);
      } catch {
        setStudyTimes([]);
      }
    };

    const loadLeaderboard = async () => {
      try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/leaderboard`, { credentials: "include" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.success === false) return;
        const rows = Array.isArray(payload?.data?.leaderboard) ? payload.data.leaderboard : Array.isArray(payload?.leaderboard) ? payload.leaderboard : [];
        setWeeklyLeaderboard(rows);
      } catch {
        setWeeklyLeaderboard([]);
      }
    };

    const emitJoin = () => {
      if (joinSentRef.current) return;
      joinSentRef.current = true;
      socket.emit("join-room", {
        roomId,
        privacy: privacyPayload,
      });
      socket.emit("get-room-members", (res) => {
        if (Array.isArray(res?.members)) setMembers(dedupeByUserId(res.members));
      });
      socket.emit("room-stats-request", { roomId }, (res) => {
        if (res?.success && Array.isArray(res.stats)) {
          setRoomStatsRows(res.stats);
        }
      });
      loadStudyTimes();
      loadLeaderboard();
    };

    socket.on("connect", () => {
      setReconnecting(false);
      setSocketKey((k) => k + 1); // force ChatPanel to re-register listeners
      emitJoin();
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] Connection error in RoomView:", err.message);
      // If auth failed, redirect to login
      if (err.message === "Authentication required" || err.message === "Invalid token") {
        navigate("/login", { replace: true });
      }
    });

    socket.on("disconnect", () => {
      joinSentRef.current = false;
      setReconnecting(true);
    });

    socket.io.on("reconnect_attempt", () => {
      setReconnecting(true);
    });

    socket.on("room-members-update", (payload) => {
      if (payload?.roomId !== roomId) return;
      setMembers(dedupeByUserId(Array.isArray(payload.members) ? payload.members : []));
    });

    socket.on("study-time-updated", (payload) => {
      if (payload?.roomId !== roomId) return;
      setStudyTimes((prev) => {
        const next = prev.filter((row) => String(row.userId) !== String(payload.userId));
        next.push({
          userId: String(payload.userId),
          userName: payload.userName,
          totalFocusMinutes: Number(payload.totalFocusMinutes || 0),
          sessionsCompleted: Number(payload.sessionsCompleted || 0),
        });
        return dedupeByUserId(next).sort((a, b) => (b.totalFocusMinutes || 0) - (a.totalFocusMinutes || 0));
      });
    });

    socket.on("room-stats", (payload) => {
      if (payload?.roomId !== roomId || !Array.isArray(payload.stats)) return;
      setRoomStatsRows(payload.stats);
      const mine = payload.stats.find((s) => s.userId === userId);
      if (mine) setMyStats(mine);
    });

    const onRoomRosterHint = () => {
      reload({ silent: true });
    };
    socket.on("user-joined-room", onRoomRosterHint);
    socket.on("user-left-room", onRoomRosterHint);

    if (socket.connected) emitJoin();

    return () => {
      joinSentRef.current = false;
      socket.off("user-joined-room", onRoomRosterHint);
      socket.off("user-left-room", onRoomRosterHint);
      socket.disconnect();
      // DO NOT call leaveRoom() here — user is just closing tab, not leaving the room
      // Members should persist in MongoDB until they explicitly click "Leave Room"
      // The socket disconnect event on server will handle presence cleanup only
    };
  }, [roomId, privacyPayload, reload, setRoomStatsRows, setMyStats, room?.name, userId, displayName]);

  useEffect(() => {
    if (tab === "chat") {
      setUnreadChat(0);
    }
  }, [tab]);

  const membersStudyRows = useMemo(() => {
    const enriched = dedupeByUserId(mergedMembers).map((m) => {
      const s = statsByUser[m.userId] || {};
      return {
        ...m,
        todayMinutes: Number(s.totalFocusMinutes || 0),
      };
    });
    const max = Math.max(1, ...enriched.map((e) => e.todayMinutes || 0));
    return { rows: enriched.sort((a, b) => (b.todayMinutes || 0) - (a.todayMinutes || 0)), max };
  }, [mergedMembers, statsByUser]);

  const chatPaused = room?.focusStyle === "silent" && timer.phase === "focus" && timer.running;

  async function handleLeave() {
    // Emit leave-room socket event so server cleans up presence immediately
    socketRef.current?.emit("leave-room", { roomId });
    // Call REST API to update MongoDB (remove from members, close session)
    await leaveRoom();
    // Clear last joined room from localStorage
    try { localStorage.removeItem("lastJoinedRoom"); } catch { /* ignore */ }
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
  const visibleMembers = dedupeByUserId(mergedMembers);
  const presenceCounts = stripCounts(visibleMembers);
  const leaderboardRows = weeklyLeaderboard.length > 0
    ? weeklyLeaderboard.map((row) => ({
        userId: row.userId,
        userName: row.userName,
        points: row.focusPoints || Math.round((Number(row.sessionsCompleted || 0) * 10) + (Number(row.totalMinutes || 0) / 5)),
        streakDays: row.daysStudied || 0,
      }))
    : roomStatsByUser && Object.keys(roomStatsByUser).length > 0
      ? Object.values(roomStatsByUser).map((row) => ({
          userId: row.userId,
          userName: row.userName,
          points: row.focusPoints || 0,
          streakDays: row.streakDays || 0,
        }))
      : [];

  return (
    <div className="sg2-room-page">
      {reconnecting ? <div className="sg2-banner">Reconnecting...</div> : null}

      <div className="sg2-topbar sg2-room-topbar">
        <div>
          <div className="sg2-inline-row" style={{ gap: 8 }}>
            <button 
              type="button" 
              className="sg2-btn secondary" 
              style={{ padding: "6px 12px", fontSize: "0.85rem", marginRight: 8 }}
              onClick={() => navigate("/study-group")}
              title="Back to lobby"
            >
              ← Back
            </button>
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
            {visibleMembers.slice(0, 5).map((m) => (
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
        <div className="sg2-left-column">
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
            personalTodayMinutes={todayMinutesForMe}
            groupStartedBy={timer.groupStartedBy}
            canControlGroup={timer.canControlGroup}
            groupDeniedMessage={timer.groupDeniedMessage}
            celebrate={timer.celebrate}
            lastActionReason={timer.lastActionReason}
          />

          <section className="sg2-panel" style={{ marginTop: 16 }}>
            <h3 className="sg2-subtitle">Members&apos; Study Time Today</h3>
            <ul className="sg2-clean-list" style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {membersStudyRows.rows.map((m) => {
                const pct = Math.round(((m.todayMinutes || 0) / membersStudyRows.max) * 100);
                return (
                  <li key={`${m.userId}-${m.name}`} className="sg2-study-row">
                    <span className="sg2-avatar-stack sg2-avatar-lg" style={{ marginLeft: 0 }}>{String(m.name).slice(0, 1).toUpperCase()}</span>
                    <div className="sg2-study-main">
                      <div className="sg2-inline-row sg2-study-head">
                        <strong>{m.isSelf ? `You (${m.name})` : m.name}</strong>
                        <span className={`sg2-status-chip ${m.status || "online"}`}>{m.status || "online"}</span>
                      </div>
                      <div className="sg2-progress-rail" style={{ marginTop: 4 }}><div className="sg2-progress-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                    <strong className="sg2-study-minutes">{m.todayMinutes || 0} min</strong>
                  </li>
                );
              })}
            </ul>
          </section>

          <SharedNotes roomId={roomId} userId={userId} socketRef={socketRef} />
        </div>

        <div className="sg2-panel sg2-right-panel">
          <div className="sg2-right-content">
          <div className="sg2-tabs" role="tablist">
            <button type="button" className={`sg2-tab ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>
              Chat {unreadChat > 0 && tab !== "chat" ? <span className="sg2-unread">{unreadChat}</span> : null}
            </button>
            <button type="button" className={`sg2-tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>Members</button>
            <button type="button" className={`sg2-tab ${tab === "leaderboard" ? "active" : ""}`} onClick={() => setTab("leaderboard")}>Leaderboard</button>
          </div>

          <div className="sg2-right-body">
            {tab === "chat" ? (
              <ChatPanel
                key={socketKey}
                socketEpoch={socketKey}
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
            {tab === "members" ? <MembersPanel members={membersStudyRows.rows} roomCode={room.code} meName={displayName} statsByUser={statsByUser} maxFocus={membersStudyRows.max} /> : null}
            {tab === "leaderboard" ? <LeaderboardPanel rows={leaderboardRows} myUserId={userId} /> : null}
          </div>
          </div>

          <PresenceStrip counts={presenceCounts} />
        </div>
      </div>
    </div>
  );
}
