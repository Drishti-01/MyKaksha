import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { createRoomApi, fetchRoomsList, joinRoomByCodeApi, joinRoomByIdApi } from "../../api/rooms";
import { rememberRoom, syncMyRooms } from "../../hooks/useRoom";
import { useAuth } from "../../auth/useAuth";
import RoomCard from "./RoomCard";
import CreateRoomModal from "./CreateRoomModal";
import JoinWithCode from "./JoinWithCode";

function formatMins(minutes) {
  const m = Math.max(0, Number(minutes) || 0);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

function formatRelative(iso) {
  if (!iso) return "recently";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function recalculateMostActive(rooms) {
  return [...(Array.isArray(rooms) ? rooms : [])]
    .sort((a, b) => (b.onlineCount || 0) - (a.onlineCount || 0))
    .slice(0, 3);
}

export default function RoomLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const lobbySocketRef = useRef(null);
  const lobbyJoinSentRef = useRef(false);
  const [rooms, setRooms] = useState([]);
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState("");
  const [liveCount, setLiveCount] = useState(0);
  const [myTodayMinutes, setMyTodayMinutes] = useState(0);
  const [mostActiveToday, setMostActiveToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myRooms, setMyRooms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [lastJoined, setLastJoined] = useState(null);

  // Check localStorage for last joined room — show rejoin prompt
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastJoinedRoom");
      if (raw) setLastJoined(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    setTrendingError("");
    try {
      const [data, myRoomsData] = await Promise.all([
        fetchRoomsList(),
        syncMyRooms().catch(() => []),
      ]);
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
      setTrending(Array.isArray(data.trending) ? data.trending : []);
      setMostActiveToday(Array.isArray(data.mostActiveToday) ? data.mostActiveToday : recalculateMostActive(data.rooms));
      setLiveCount(Number(data.globalStudyingApprox) || 0);
      setMyTodayMinutes(Number(data.myTodayMinutes) || 0);
      setMyRooms(Array.isArray(myRoomsData) ? myRoomsData : []);
    } catch (e) {
      setError(e.message || "Failed to load rooms");
      // Set fallback data to prevent empty state
      setTrending([]);
      setMostActiveToday([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    lobbySocketRef.current = socket;
    lobbyJoinSentRef.current = false;

    const emitLobbyJoin = () => {
      if (lobbyJoinSentRef.current) return;
      lobbyJoinSentRef.current = true;
      socket.emit("lobby-join");
    };

    socket.on("connect", () => {
      console.log("Socket: lobby connected");
      emitLobbyJoin();
    });

    socket.on("disconnect", () => {
      lobbyJoinSentRef.current = false;
    });

    socket.on("lobby-presence", ({ count }) => {
      setLiveCount(Number(count) || 0);
    });

    socket.on("room-presence-update", ({ roomId, onlineCount, status }) => {
      if (!roomId) return;

      setRooms((prev) => {
        const next = (prev || []).map((room) => (
          room.id === roomId
            ? { ...room, onlineCount: Number(onlineCount) || 0, status: status || room.status }
            : room
        ));
        setMostActiveToday(recalculateMostActive(next));
        return next;
      });

      setMyRooms((prev) => (
        (prev || []).map((room) => (
          room.id === roomId
            ? { ...room, onlineCount: Number(onlineCount) || 0 }
            : room
        ))
      ));
    });

    socket.on("room-created", () => {
      load();
    });

    if (socket.connected) emitLobbyJoin();

    return () => {
      lobbyJoinSentRef.current = false;
      socket.off("room-presence-update");
      socket.emit("lobby-leave");
      socket.disconnect();
      lobbySocketRef.current = null;
    };
  }, []);

  async function handleCreate(body) {
    setCreating(true);
    try {
      const data = await createRoomApi(body);
      const room = data.room;
      rememberRoom(room.id, room.name);
      lobbySocketRef.current?.emit("room-created", { room });
      setModalOpen(false);
      navigate(`/study-group/${room.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinCode(code) {
    const data = await joinRoomByCodeApi(code);
    const room = data.room;
    rememberRoom(room.id, room.name);
    navigate(`/study-group/${room.id}`);
  }

  async function joinRoom(id) {
    const room = rooms.find((r) => r.id === id);
    if (!room) {
      setError("Room not found");
      return;
    }
    
    rememberRoom(id, room?.name);
    try { 
      localStorage.setItem("lastJoinedRoom", JSON.stringify({ id, name: room?.name || "Room" })); 
    } catch { /* ignore */ }

    // Always call join API to ensure user is added as permanent member in MongoDB
    // The backend handles duplicate prevention — if already a member, it's a no-op
    try {
      await joinRoomByIdApi(id);
      console.log("[RoomLobby] joined roomId:", id);
    } catch (e) {
      console.warn("[RoomLobby] joinRoomByIdApi failed (non-fatal):", e.message);
      // Don't block navigation on API failure - user might already be a member
    }
    
    navigate(`/study-group/${id}`);
  }

  const myRoomsResolved = useMemo(
    () => (Array.isArray(myRooms) ? myRooms.slice(0, 3) : []),
    [myRooms]
  );

  return (
    <div>
      <header className="sg2-lobby-header">
        <div>
          <h1 className="sg2-title">Study Rooms</h1>
          <p className="sg2-sub">Find your focus. Study with others.</p>
        </div>
        <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
          <div className="sg2-badge">{liveCount} students studying across all rooms right now</div>
          <div className="sg2-badge" style={{ fontSize: "0.82rem" }}>
            You&apos;ve studied {formatMins(myTodayMinutes)} today across all rooms
          </div>
        </div>
      </header>

      {loading ? <p className="sg2-soft-text">Loading rooms…</p> : null}
      {error ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <p className="sg2-error" role="alert" style={{ margin: 0 }}>{error}</p>
          <button type="button" className="sg2-btn secondary" style={{ padding: "6px 14px", fontSize: "0.82rem" }} onClick={load}>
            Retry
          </button>
        </div>
      ) : null}

      {lastJoined ? (
        <div className="sg2-banner" style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>You were in <strong>{lastJoined.name}</strong> — want to rejoin?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="sg2-btn" style={{ padding: "6px 14px", fontSize: "0.82rem" }} onClick={() => joinRoom(lastJoined.id)}>
              Rejoin
            </button>
            <button type="button" className="sg2-btn secondary" style={{ padding: "6px 10px", fontSize: "0.82rem" }} onClick={() => { setLastJoined(null); try { localStorage.removeItem("lastJoinedRoom"); } catch { /* ignore */ } }}>
              ✕
            </button>
          </div>
        </div>
      ) : null}

      <div className="sg2-grid-lobby">
        <section>
          <h2 className="sg2-section-title">Available Rooms</h2>
          <div className="sg2-room-grid">
            {!loading && rooms.map((room) => {
              const isMember = (room.members || []).some((m) => m.userId === user?.id);
              return <RoomCard key={room.id} room={room} onJoin={joinRoom} isMember={isMember} />;
            })}
          </div>
        </section>

        <aside className="sg2-actions">
          <button type="button" className="sg2-btn sg2-create-btn" onClick={() => setModalOpen(true)}>
            ✨ Create New Room
          </button>

          <JoinWithCode onJoined={handleJoinCode} disabled={loading} />

          <div className="sg2-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="sg2-subtitle" style={{ margin: 0 }}>My Rooms</h3>
              {myRooms.length > 3 && (
                <button 
                  type="button" 
                  className="sg2-btn secondary" 
                  style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                  onClick={() => navigate('/study-group')} // Could expand to show all rooms
                >
                  +{myRooms.length - 3} more
                </button>
              )}
            </div>
            {myRoomsResolved.length === 0 ? (
              <p className="sg2-soft-text" style={{ margin: 0 }}>Join a room to see it here.</p>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {myRoomsResolved.map((r) => (
                  <button 
                    key={r.id}
                    type="button" 
                    className="sg2-btn secondary" 
                    style={{ 
                      width: "100%", 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '10px 12px'
                    }} 
                    onClick={() => joinRoom(r.id)}
                    aria-label={`Enter ${r.name} room, last active ${formatRelative(r.lastActiveAt)}`}
                  >
                    <span style={{ fontWeight: '600' }}>{r.name}</span>
                    <small style={{ opacity: 0.7, fontSize: '0.7rem' }}>
                      {formatRelative(r.lastActiveAt)}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sg2-card" style={{ padding: 16 }}>
            <h3 className="sg2-subtitle">Most Active Today</h3>
            <ol className="sg2-clean-list">
              {mostActiveToday.slice(0, 3).map((r) => (
                <li key={r.id} className="sg2-inline-row">
                  <span>{r.name}</span>
                  <strong>{r.onlineCount || 0} live</strong>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <section className="sg2-trending">
        <h2 className="sg2-section-title" style={{ marginBottom: 10 }}>Trending This Week</h2>
        {loading ? (
          <div style={{ display: 'grid', gap: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                style={{
                  height: '48px',
                  background: 'linear-gradient(90deg, #f5efe6 25%, #fffdf9 50%, #f5efe6 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                  borderRadius: '12px',
                  border: '1px solid #eed6c4'
                }}
              />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="sg2-soft-text">No weekly room activity yet. Complete Pomodoro sessions to contribute to trending!</p>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {trending.map((r, i) => (
              <div 
                key={r.id} 
                className="sg2-trending-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#fffdf9',
                  border: '1px solid #eed6c4',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => joinRoom(r.id)}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f5efe6';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fffdf9';
                  e.target.style.transform = 'translateY(0)';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    joinRoom(r.id);
                  }
                }}
                aria-label={`Join ${r.name} room - ${r.weeklyHours || 0} hours focus this week, ${r.memberCount || 0} members`}
                tabIndex={0}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: '700'
                  }}>
                    #{i + 1}
                  </span>
                  <span style={{ fontWeight: '600', color: '#4a3728' }}>{r.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: '#8b6f5e' }}>
                  <span>🔥 {r.weeklyHours || 0}h focus</span>
                  <span>👥 {r.memberCount || 0} members</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <CreateRoomModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} loading={creating} />
    </div>
  );
}
