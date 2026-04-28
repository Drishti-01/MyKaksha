export default function PrivacySettings({ settings, onChange, open, onClose, anchorRef }) {
  if (!open) return null;

  return (
    <div className="sg2-dropdown" role="dialog" aria-label="Study privacy settings">
      <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#4a3629", fontSize: "0.9rem" }}>Room privacy</p>
      <label style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10, fontSize: "0.85rem" }}>
        Show my online status
        <input
          type="checkbox"
          checked={settings.showOnline}
          onChange={(e) => onChange({ showOnline: e.target.checked })}
        />
      </label>
      <label style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10, fontSize: "0.85rem" }}>
        Show my focus status
        <input
          type="checkbox"
          checked={settings.showFocus}
          onChange={(e) => onChange({ showFocus: e.target.checked })}
        />
      </label>
      <label style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10, fontSize: "0.85rem" }}>
        Appear in leaderboard
        <input
          type="checkbox"
          checked={settings.appearInLeaderboard}
          onChange={(e) => onChange({ appearInLeaderboard: e.target.checked })}
        />
      </label>
      <label style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4, fontSize: "0.85rem" }}>
        Notification sounds
        <input
          type="checkbox"
          checked={settings.notificationSounds}
          onChange={(e) => onChange({ notificationSounds: e.target.checked })}
        />
      </label>
      <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: "#8b6f5e" }}>
        Stored in this browser only. When online status is off, others see you as offline.
      </p>
      <button type="button" className="sg2-btn secondary" style={{ width: "100%", marginTop: 10 }} onClick={onClose}>
        Close
      </button>
    </div>
  );
}
