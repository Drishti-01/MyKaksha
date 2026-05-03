import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { createRoomApi, fetchRoomsList, joinRoomByCodeApi, joinRoomByIdApi } from "../../api/rooms";
import { rememberRoom, syncMyRooms } from "../../hooks/useRoom";
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

export default function RoomLobby() {
  const navigate = useNavigate();
  const lobbySocketRef = useRef(null);
  const lobbyJoinSentRef = useRef(false);
  const [rooms, setRooms] = useState([]);
  const [trending, setTrending] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [myTodayMinutes, setMyTodayMinutes] = useState(0);
  const [mostActiveToday, setMostActiveToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myRooms, setMyRooms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [data, myRoomsData] = await Promise.all([
        fetchRoomsList(),
        syncMyRooms().catch(() => []),
      ]);
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
      setTrending(Array.isArray(data.trending) ? data.trending : []);
      setMostActiveToday(Array.isArray(data.mostActiveToday) ? data.mostActiveToday : []);
      setLiveCount(Number(data.globalStudyingApprox) || 0);
      setMyTodayMinutes(Number(data.myTodayMinutes) || 0);
      setMyRooms(Array.isArray(myRoomsData) ? myRoomsData : []);
    } catch (e) {
      setError(e.message || "Failed to load rooms");
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

    socket.on("room-created", () => {
      load();
    });

    if (socket.connected) emitLobbyJoin();

    return () => {
      lobbyJoinSentRef.current = false;
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

  // BUG 1 FIX — call join API before navigating so user is added to Room.members in MongoDB
  // Previously this just navigated without any API call, leaving members array empty
  async function joinRoom(id) {
    const room = rooms.find((r) => r.id === id);
    rememberRoom(id, room?.name);
    try {
      await joinRoomByIdApi(id);
      console.log("[RoomLobby] joinRoomByIdApi success for roomId:", id);
    } catch (e) {
      // Non-fatal — still navigate even if API fails (socket join-room will also add to members)
      console.warn("[RoomLobby] joinRoomByIdApi failed (non-fatal):", e.message);
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
      {error ? <p className="sg2-error" role="alert">{error}</p> : null}

      <div className="sg2-grid-lobby">
        <section>
          <h2 className="sg2-section-title">Available Rooms</h2>
          <div className="sg2-room-grid">
            {!loading && rooms.map((room) => <RoomCard key={room.id} room={room} onJoin={joinRoom} />)}
          </div>
        </section>

        <aside className="sg2-actions">
          <button type="button" className="sg2-btn sg2-create-btn" onClick={() => setModalOpen(true)}>
            ✨ Create New Room
          </button>

          <JoinWithCode onJoined={handleJoinCode} disabled={loading} />

          <div className="sg2-card" style={{ padding: 16 }}>
            <h3 className="sg2-subtitle">My Rooms</h3>
            {myRoomsResolved.length === 0 ? (
              <p className="sg2-soft-text" style={{ margin: 0 }}>Join a room to see it here (last 3).</p>
            ) : (
              <ul className="sg2-clean-list">
                {myRoomsResolved.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="sg2-btn secondary" style={{ width: "100%" }} onClick={() => joinRoom(r.id)}>
                      <span>{r.name}</span>
                      <small style={{ marginLeft: 8, opacity: 0.7 }}>
                        {formatRelative(r.lastActiveAt)}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
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
        {trending.length === 0 ? (
          <p className="sg2-soft-text">No weekly room activity yet.</p>
        ) : (
          <ol className="sg2-clean-list">
            {trending.map((r, i) => (
              <li key={r.id} className="sg2-inline-row">
                <span>#{i + 1} {r.name}</span>
                <span>{r.weeklyHours || 0}h · {r.weeklyMembers || 0} members</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <CreateRoomModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} loading={creating} />
    </div>
  );
}
