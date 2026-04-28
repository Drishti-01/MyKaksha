export default function PresenceStrip({ counts }) {
  const { focusing = 0, onBreak = 0, away = 0, online = 0 } = counts || {};
  return (
    <div className="sg2-presence-strip" aria-live="polite">
      <strong>{focusing}</strong> focusing · <strong>{onBreak}</strong> on break · <strong>{away}</strong> away
      {online > 0 ? (
        <>
          {" "}
          · <strong>{online}</strong> online
        </>
      ) : null}
    </div>
  );
}
