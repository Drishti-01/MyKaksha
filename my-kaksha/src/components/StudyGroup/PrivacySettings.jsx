export default function PrivacySettings({ settings, onChange, open, onClose }) {
  if (!open) return null;

  return (
    <div className="sg2-dropdown" role="dialog" aria-label="Privacy settings">
      <p className="sg2-subtitle" style={{ margin: "0 0 8px" }}>Privacy</p>

      <label className="sg2-toggle-row">
        <span>Show my online status</span>
        <input type="checkbox" checked={settings.showOnline} onChange={(e) => onChange({ showOnline: e.target.checked })} />
      </label>

      <label className="sg2-toggle-row">
        <span>Show my focus status to room</span>
        <input type="checkbox" checked={settings.showFocus} onChange={(e) => onChange({ showFocus: e.target.checked })} />
      </label>

      <label className="sg2-toggle-row">
        <span>Appear in leaderboard</span>
        <input type="checkbox" checked={settings.appearInLeaderboard} onChange={(e) => onChange({ appearInLeaderboard: e.target.checked })} />
      </label>

      <label className="sg2-toggle-row">
        <span>Sound notifications</span>
        <input type="checkbox" checked={settings.notificationSounds} onChange={(e) => onChange({ notificationSounds: e.target.checked })} />
      </label>

      <button type="button" className="sg2-btn secondary" style={{ width: "100%", marginTop: 8 }} onClick={onClose}>Close</button>
    </div>
  );
}
