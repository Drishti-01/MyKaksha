import { useCallback, useEffect, useState } from "react";
import { fetchRoomDetail, leaveRoomApi } from "../api/rooms";

const MY_ROOMS_KEY = "myKakshaMyRooms";

export function readMyRooms() {
  try {
    const raw = localStorage.getItem(MY_ROOMS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function rememberRoom(roomId) {
  if (!roomId) return;
  try {
    const prev = readMyRooms().filter((id) => id !== roomId);
    const next = [roomId, ...prev].slice(0, 3);
    localStorage.setItem(MY_ROOMS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/**
 * Loads room detail from REST; exposes leaveRoom for cleanup on unmount/navigation.
 */
export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    if (!roomId) return;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await fetchRoomDetail(roomId);
      setRoom(data.room);
      setLeaderboard(data.leaderboard || []);
    } catch (e) {
      if (!silent) {
        setError(e.message || "Could not load room");
        setRoom(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const leaveRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      await leaveRoomApi(roomId);
    } catch {
      /* still navigate away */
    }
  }, [roomId]);

  const setLeaderboardRows = useCallback((rows) => {
    setLeaderboard(rows);
  }, []);

  return { room, leaderboard, loading, error, reload, leaveRoom, setLeaderboardRows };
}
