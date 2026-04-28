import { useCallback, useEffect, useRef, useState } from "react";

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Pomodoro: `timerScope` "personal" keeps time local; "group" listens for `timer-start` / `timer-pause` / `timer-reset`.
 */
export function useTimer({ socketRef, roomId, timerScope, onSessionComplete, onStatusChange }) {
  const [phase, setPhase] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SEC);
  const [running, setRunning] = useState(false);
  const [sessionRound, setSessionRound] = useState(1);
  const endsAtRef = useRef(null);

  useEffect(() => {
    if (!running) {
      onStatusChange?.("online");
      return;
    }
    onStatusChange?.(phase === "focus" ? "focusing" : "break");
  }, [running, phase, onStatusChange]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || timerScope !== "group") return;

    const onStart = (payload) => {
      if (payload?.roomId && payload.roomId !== roomId) return;
      console.log("[useTimer] timer-start", payload);
      const durationSec = Number(payload?.durationSec) || FOCUS_SEC;
      const startTs = Number(payload?.startTimestamp) || Date.now();
      endsAtRef.current = startTs + durationSec * 1000;
      if (payload?.phase === "break" || payload?.phase === "focus") setPhase(payload.phase);
      setRunning(true);
    };

    const onPause = (payload) => {
      if (payload?.roomId && payload.roomId !== roomId) return;
      console.log("[useTimer] timer-pause");
      setRunning(false);
      endsAtRef.current = null;
    };

    const onReset = (payload) => {
      if (payload?.roomId && payload.roomId !== roomId) return;
      console.log("[useTimer] timer-reset");
      setRunning(false);
      endsAtRef.current = null;
      setSecondsLeft(FOCUS_SEC);
      setPhase("focus");
    };

    socket.on("timer-start", onStart);
    socket.on("timer-pause", onPause);
    socket.on("timer-reset", onReset);
    return () => {
      socket.off("timer-start", onStart);
      socket.off("timer-pause", onPause);
      socket.off("timer-reset", onReset);
    };
  }, [socketRef, roomId, timerScope]);

  useEffect(() => {
    if (!running) return undefined;

    const id = setInterval(() => {
      if (timerScope === "group" && endsAtRef.current) {
        const next = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000));
        setSecondsLeft(next);
        return;
      }
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [running, timerScope]);

  const zeroHandledRef = useRef(false);

  useEffect(() => {
    if (secondsLeft > 0) {
      zeroHandledRef.current = false;
    }
  }, [secondsLeft]);

  useEffect(() => {
    if (secondsLeft !== 0 || !running || zeroHandledRef.current) return undefined;
    zeroHandledRef.current = true;
    setRunning(false);
    endsAtRef.current = null;

    let cancelled = false;
    (async () => {
      if (phase === "focus") {
        try {
          await onSessionComplete?.();
        } catch {
          /* ignore */
        }
        if (!cancelled) setSessionRound((r) => Math.min(4, r + 1));
      }
      if (!cancelled) {
        const nextPhase = phase === "focus" ? "break" : "focus";
        setPhase(nextPhase);
        setSecondsLeft(nextPhase === "focus" ? FOCUS_SEC : BREAK_SEC);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [secondsLeft, running, phase, onSessionComplete]);

  const start = useCallback(() => {
    if (timerScope === "group" && socketRef?.current) {
      const durationSec = phase === "focus" ? FOCUS_SEC : BREAK_SEC;
      const startTimestamp = Date.now();
      endsAtRef.current = startTimestamp + durationSec * 1000;
      socketRef.current.emit("timer-start", { roomId, durationSec, startTimestamp, phase });
      socketRef.current.emit("group-timer-sync", {
        roomId,
        state: { running: true, phase, durationSec, endsAt: endsAtRef.current },
      });
    } else {
      endsAtRef.current = null;
    }
    setRunning(true);
  }, [timerScope, socketRef, roomId, phase]);

  const pause = useCallback(() => {
    if (timerScope === "group" && socketRef?.current) {
      socketRef.current.emit("timer-pause", { roomId });
      socketRef.current.emit("group-timer-sync", {
        roomId,
        state: { running: false, phase, secondsLeft, isPaused: true },
      });
    }
    setRunning(false);
    endsAtRef.current = null;
  }, [timerScope, socketRef, roomId, phase, secondsLeft]);

  const reset = useCallback(() => {
    if (timerScope === "group" && socketRef?.current) {
      socketRef.current.emit("timer-reset", { roomId });
    }
    setRunning(false);
    endsAtRef.current = null;
    setPhase("focus");
    setSecondsLeft(FOCUS_SEC);
  }, [timerScope, socketRef, roomId]);

  const switchPhase = useCallback(() => {
    const next = phase === "focus" ? "break" : "focus";
    setPhase(next);
    setSecondsLeft(next === "focus" ? FOCUS_SEC : BREAK_SEC);
    setRunning(false);
    endsAtRef.current = null;
  }, [phase]);

  return {
    phase,
    secondsLeft,
    running,
    formatted: formatTime(secondsLeft),
    label: phase === "focus" ? "Focus Session" : "Break Time",
    sessionOf: `Session ${Math.min(sessionRound, 4)} of 4`,
    sessionRound,
    start,
    pause,
    reset,
    switchPhase,
  };
}
