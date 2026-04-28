import { useCallback, useEffect, useState } from "react";
import { fetchRoomDetail, leaveRoomApi, fetchRoomStatsApi, fetchMyRoomStatsApi } from "../api/rooms";

const MY_ROOMS_KEY = "myKakshaMyRooms";
const MY_ROOMS_META_KEY = "myKakshaMyRoomsMeta";

export function readMyRooms() {
  try {
    const raw = localStorage.getItem(MY_ROOMS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function readMyRoomMeta() {
  try {
    const raw = localStorage.getItem(MY_ROOMS_META_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map && typeof map === "object" ? map : {};
  } catch {
    return {};
  }
}

export function rememberRoom(roomId, roomName) {
  if (!roomId) return;
  try {
    const prev = readMyRooms().filter((id) => id !== roomId);
    const next = [roomId, ...prev].slice(0, 3);
    localStorage.setItem(MY_ROOMS_KEY, JSON.stringify(next));

    const meta = readMyRoomMeta();
    meta[roomId] = {
      roomName: roomName || meta[roomId]?.roomName || "Room",
      lastActiveAt: new Date().toISOString(),
    };
    localStorage.setItem(MY_ROOMS_META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [roomStats, setRoomStats] = useState([]);
  const [myStats, setMyStats] = useState(null);
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
      const [detail, statsRes, myRes] = await Promise.all([
        fetchRoomDetail(roomId),
        fetchRoomStatsApi(roomId).catch(() => ({ stats: [] })),
        fetchMyRoomStatsApi(roomId).catch(() => ({ stats: null })),
      ]);
      setRoom(detail.room);
      setLeaderboard(Array.isArray(detail.leaderboard) ? detail.leaderboard : []);
      setRoomStats(Array.isArray(statsRes.stats) ? statsRes.stats : []);
      setMyStats(myRes.stats || null);
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

  return {
    room,
    leaderboard,
    roomStats,
    myStats,
    loading,
    error,
    reload,
    leaveRoom,
    setLeaderboardRows: setLeaderboard,
    setRoomStatsRows: setRoomStats,
    setMyStats,
  };
}
