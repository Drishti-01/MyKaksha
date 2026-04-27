import "./appSidebar.css";

const SIDEBAR_ICONS = {
  Dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2.1" />
      <rect x="13" y="3.5" width="7.5" height="5.2" rx="2.1" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="2.1" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2.1" />
    </svg>
  ),
  Analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 19.5h16" />
      <path d="M7 15.5V11" />
      <path d="M12 15.5V7.5" />
      <path d="M17 15.5v-4" />
      <path d="M4.5 9.2 10 5.5l3.2 2.5 6-4" />
    </svg>
  ),
  Projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3.8 7.8h16.4v11.7a1.8 1.8 0 0 1-1.8 1.8H5.6a1.8 1.8 0 0 1-1.8-1.8z" />
      <path d="M8.2 7.8V5.9a1.8 1.8 0 0 1 1.8-1.8H14a1.8 1.8 0 0 1 1.8 1.8v1.9" />
    </svg>
  ),
  "Study Group": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="8" cy="9" r="2.6" />
      <circle cx="16.2" cy="8.4" r="2.2" />
      <path d="M3.8 18.8a4.2 4.2 0 0 1 8.4 0" />
      <path d="M13.4 18.8a3.6 3.6 0 0 1 7.2 0" />
    </svg>
  ),
};

export default function AppSidebar({
  collapsed,
  onToggle,
  navItems,
  activeItem,
  onNavigate,
  primaryAction,
  secondaryAction,
  noteTitle,
  noteText,
  navAriaLabel = "Primary navigation",
}) {
  return (
    <aside className={`mk-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="mk-sidebar-header">
        <div className="mk-brand">My <span>Kaksha</span></div>
        <button type="button" className="mk-toggle" onClick={onToggle} aria-label="Toggle Sidebar">
          {collapsed ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
              <path d="m15 6-6 6 6 6" />
            </svg>
          )}
        </button>
      </div>

      <nav className="mk-nav" aria-label={navAriaLabel}>
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={`mk-nav-btn ${item === activeItem ? "active" : ""}`}
            onClick={() => onNavigate(item)}
          >
            <span className="mk-nav-icon">{SIDEBAR_ICONS[item] ?? SIDEBAR_ICONS.Dashboard}</span>
            <span className="mk-label">{item}</span>
          </button>
        ))}
      </nav>

      <div className="mk-footer">
        {primaryAction ? (
          <button type="button" className="mk-action-btn" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </button>
        ) : null}

        {secondaryAction ? (
          <button type="button" className="mk-action-btn" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </button>
        ) : null}

        {noteText ? (
          <div className="mk-note">
            {noteTitle ? <strong>{noteTitle}</strong> : null}
            {noteText}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
