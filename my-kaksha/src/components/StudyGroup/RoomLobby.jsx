import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { createRoomApi, fetchRoomsList, joinRoomByCodeApi } from "../../api/rooms";
import { readMyRooms, rememberRoom } from "../../hooks/useRoom";
import RoomCard from "./RoomCard";
import CreateRoomModal from "./CreateRoomModal";
import JoinWithCode from "./JoinWithCode";

export default function RoomLobby() {
  const navigate = useNavigate();
  const lobbySocketRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [trending, setTrending] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRoomsList();
      setRooms(data.rooms || []);
      setTrending(data.trending || []);
      setLiveCount(Number(data.globalStudyingApprox) || 0);
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
    const socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    lobbySocketRef.current = socket;
    const onConnect = () => {
      console.log("[RoomLobby] socket connected → lobby-join");
      socket.emit("lobby-join");
    };
    const onPresence = ({ count }) => {
      console.log("[RoomLobby] lobby-presence count:", count);
      setLiveCount(Number(count) || 0);
    };
    const onRoomCreated = () => {
      console.log("[RoomLobby] room-created → refresh list");
      load();
    };
    socket.on("connect", onConnect);
    socket.on("lobby-presence", onPresence);
    socket.on("room-created", onRoomCreated);
    if (socket.connected) onConnect();
    return () => {
      console.log("[RoomLobby] socket disconnect / lobby-leave");
      socket.emit("lobby-leave");
      socket.disconnect();
      lobbySocketRef.current = null;
    };
  }, []);

  async function handleCreate(body) {
    setCreating(true);
    try {
      const { room } = await createRoomApi(body);
      rememberRoom(room.id);
      lobbySocketRef.current?.emit("room-created", { room });
      setModalOpen(false);
      navigate(`/study-group/${room.id}`);
    } catch (e) {
      throw e;
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinCode(code) {
    const { room } = await joinRoomByCodeApi(code);
    rememberRoom(room.id);
    navigate(`/study-group/${room.id}`);
  }

  function joinRoom(id) {
    rememberRoom(id);
    navigate(`/study-group/${id}`);
  }

  const myRoomsResolved = readMyRooms()
    .map((id) => rooms.find((r) => r.id === id))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div>
      <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h1 className="sg2-title">Study Rooms</h1>
          <p className="sg2-sub">Find your focus. Study with others.</p>
        </div>
        <div className="sg2-badge" aria-live="polite">
          {liveCount} students studying right now
        </div>
      </header>

      {loading ? <p style={{ color: "#8b6f5e" }}>Loading rooms…</p> : null}
      {error ? (
        <p style={{ color: "#b45309" }} role="alert">
          {error}
        </p>
      ) : null}

      <div className="sg2-grid-lobby">
        <section>
          <h2 style={{ fontSize: "1.05rem", color: "#4a3629", marginBottom: 14 }}>Available Rooms</h2>
          <div className="sg2-room-grid">
            {!loading &&
              rooms.map((room) => (
                <RoomCard key={room.id} room={room} onJoin={joinRoom} />
              ))}
          </div>
        </section>

        <aside className="sg2-actions">
          <button type="button" className="sg2-btn" onClick={() => setModalOpen(true)}>
            Create New Room
          </button>
          <JoinWithCode onJoined={handleJoinCode} disabled={loading} />

          <div className="sg2-card" style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "1rem", color: "#4a3629" }}>My Rooms</h3>
            {myRoomsResolved.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.86rem", color: "#8b6f5e" }}>Join a room to see it here (last 3).</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                {myRoomsResolved.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="sg2-btn secondary" style={{ width: "100%" }} onClick={() => joinRoom(r.id)}>
                      {r.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <section className="sg2-trending">
        <h2 style={{ margin: "0 0 10px", fontSize: "1.05rem", color: "#4a3629" }}>Trending this week</h2>
        <ol style={{ margin: 0, paddingLeft: 18, color: "#5a4a3a" }}>
          {trending.length === 0 ? (
            <li>No activity data yet</li>
          ) : (
            trending.map((r, i) => (
              <li key={r.id} style={{ marginBottom: 6 }}>
                <strong>#{i + 1}</strong> {r.name} — score {r.activityScore ?? 0}
              </li>
            ))
          )}
        </ol>
      </section>

      <CreateRoomModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} loading={creating} />
    </div>
  );
}
