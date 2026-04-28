import { useEffect, useRef } from "react";

export default function PresenceStrip({ counts }) {
  const prev = useRef(counts);
  useEffect(() => {
    prev.current = counts;
  }, [counts]);

  const { focusing = 0, onBreak = 0, away = 0, online = 0 } = counts || {};

  return (
    <div className="sg2-presence-strip sg2-fade-in" aria-live="polite">
      🎯 <strong>{focusing}</strong> focusing · ☕ <strong>{onBreak}</strong> on break · 👻 <strong>{away}</strong> away · 🟢 <strong>{online}</strong> online total
    </div>
  );
}
