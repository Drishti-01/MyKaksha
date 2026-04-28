import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function useTimer({ socketRef, roomId, timerScope, onSessionComplete, onStatusChange, userId }) {
  const [phase, setPhase] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SEC);
  const [running, setRunning] = useState(false);
  const [sessionRound, setSessionRound] = useState(1);
  const [groupStartedBy, setGroupStartedBy] = useState(null);
  const [groupDeniedMessage, setGroupDeniedMessage] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [lastActionReason, setLastActionReason] = useState("");

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

    const onTimerSync = (payload = {}) => {
      if (payload.roomId !== roomId) return;
      const action = payload.action;
      if (action === "start") {
        const duration = Number(payload.duration) || FOCUS_SEC;
        const startTimestamp = Number(payload.startTimestamp) || Date.now();
        endsAtRef.current = startTimestamp + duration * 1000;
        setGroupStartedBy(payload.startedBy || null);
        setRunning(true);
      }
      if (action === "pause") {
        setRunning(false);
        endsAtRef.current = null;
        if (payload.reason) setLastActionReason(payload.reason);
      }
      if (action === "reset") {
        setRunning(false);
        setPhase("focus");
        setSecondsLeft(FOCUS_SEC);
        endsAtRef.current = null;
        setGroupStartedBy(null);
      }
    };

    const onDenied = (payload) => {
      setGroupDeniedMessage(payload?.message || "You cannot control this timer right now");
      setTimeout(() => setGroupDeniedMessage(""), 2600);
    };

    socket.on("timer-sync", onTimerSync);
    socket.on("timer-sync-denied", onDenied);
    return () => {
      socket.off("timer-sync", onTimerSync);
      socket.off("timer-sync-denied", onDenied);
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
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running, timerScope]);

  useEffect(() => {
    if (secondsLeft !== 0 || !running) return;

    setRunning(false);
    endsAtRef.current = null;

    (async () => {
      if (phase === "focus") {
        await onSessionComplete?.({ minutes: 25, sessions: 1 });
        setSessionRound((s) => Math.min(4, s + 1));
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1800);
      }
      const nextPhase = phase === "focus" ? "break" : "focus";
      setPhase(nextPhase);
      setSecondsLeft(nextPhase === "focus" ? FOCUS_SEC : BREAK_SEC);
    })();
  }, [secondsLeft, running, phase, onSessionComplete]);

  const start = useCallback(() => {
    if (timerScope === "group") {
      socketRef?.current?.emit("timer-sync", {
        roomId,
        action: "start",
        startTimestamp: Date.now(),
        duration: phase === "focus" ? FOCUS_SEC : BREAK_SEC,
      });
      return;
    }
    setRunning(true);
  }, [timerScope, socketRef, roomId, phase]);

  const pause = useCallback(() => {
    if (timerScope === "group") {
      socketRef?.current?.emit("timer-sync", { roomId, action: "pause" });
      return;
    }
    setRunning(false);
    endsAtRef.current = null;
  }, [timerScope, socketRef, roomId]);

  const reset = useCallback(() => {
    if (timerScope === "group") {
      socketRef?.current?.emit("timer-sync", { roomId, action: "reset" });
      return;
    }
    setRunning(false);
    setPhase("focus");
    setSecondsLeft(FOCUS_SEC);
    endsAtRef.current = null;
  }, [timerScope, socketRef, roomId]);

  const switchPhase = useCallback(() => {
    const next = phase === "focus" ? "break" : "focus";
    setPhase(next);
    setSecondsLeft(next === "focus" ? FOCUS_SEC : BREAK_SEC);
    setRunning(false);
    endsAtRef.current = null;
  }, [phase]);

  const progress = useMemo(() => {
    const total = phase === "focus" ? FOCUS_SEC : BREAK_SEC;
    const ratio = Math.max(0, Math.min(1, secondsLeft / total));
    return ratio;
  }, [phase, secondsLeft]);

  const canControlGroup = !groupStartedBy || groupStartedBy.userId === userId;

  return {
    phase,
    secondsLeft,
    running,
    formatted: formatTime(secondsLeft),
    label: phase === "focus" ? "🎯 Focus Session" : "☕ Break Time",
    sessionOf: `Session ${Math.min(sessionRound, 4)} of 4`,
    sessionRound,
    progress,
    groupStartedBy,
    canControlGroup,
    groupDeniedMessage,
    celebrate,
    lastActionReason,
    start,
    pause,
    reset,
    switchPhase,
  };
}
