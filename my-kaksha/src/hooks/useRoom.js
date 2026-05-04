import { useCallback, useEffect, useState } from "react";
import { fetchRoomDetail, leaveRoomApi, fetchRoomStatsApi, fetchMyRoomStatsApi, fetchMyRoomsApi } from "../api/rooms";

const myRoomsCache = {
  ids: [],
  meta: {},
  loadedAt: 0,
};

// Attempt to hydrate cache from localStorage for instant UI
// Cache key v2 — bumped to invalidate old seed-dsa string IDs
const CACHE_KEY = "myRooms_cache_v2";
try {
  // Clear old v1 cache that may contain stale seed-dsa IDs
  localStorage.removeItem("myRooms_cache_v1");
  const raw = localStorage.getItem(CACHE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.rooms)) {
      myRoomsCache.ids = parsed.rooms.map((r) => r.id).slice(0, 3);
      myRoomsCache.meta = parsed.rooms.reduce((acc, room) => {
        acc[room.id] = { roomName: room.name, lastActiveAt: room.lastActiveAt };
        return acc;
      }, {});
      myRoomsCache.loadedAt = parsed.loadedAt || Date.now();
    }
  }
} catch (e) {
  // ignore storage errors
}

export function readMyRooms() {
  return myRoomsCache.ids.slice(0, 3);
}

export function readMyRoomMeta() {
  return { ...myRoomsCache.meta };
}

export async function syncMyRooms() {
  const data = await fetchMyRoomsApi();
  const rooms = Array.isArray(data.rooms) ? data.rooms : [];
  myRoomsCache.ids = rooms.map((room) => room.id).slice(0, 3);
  myRoomsCache.meta = rooms.reduce((acc, room) => {
    acc[room.id] = {
      roomName: room.name,
      lastActiveAt: room.lastActiveAt,
    };
    return acc;
  }, {});
  myRoomsCache.loadedAt = Date.now();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rooms, loadedAt: myRoomsCache.loadedAt }));
  } catch (e) {
    // ignore storage errors
  }
  return rooms;
}

export function rememberRoom(roomId, roomName) {
  if (!roomId) return;
  const prev = readMyRooms().filter((id) => id !== roomId);
  myRoomsCache.ids = [roomId, ...prev].slice(0, 3);
  myRoomsCache.meta = {
    ...myRoomsCache.meta,
    [roomId]: {
      roomName: roomName || myRoomsCache.meta?.[roomId]?.roomName || "Room",
      lastActiveAt: new Date().toISOString(),
    },
  };
  try {
    const rooms = myRoomsCache.ids.map((id) => ({ id, name: myRoomsCache.meta?.[id]?.roomName || "Room", lastActiveAt: myRoomsCache.meta?.[id]?.lastActiveAt }));
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rooms, loadedAt: myRoomsCache.loadedAt || Date.now() }));
  } catch (e) {
    // ignore storage errors
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
