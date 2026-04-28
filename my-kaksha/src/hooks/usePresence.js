import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "myKakshaStudyPrivacy";

const defaultSettings = {
  showOnline: true,
  showFocus: true,
  appearInLeaderboard: true,
  notificationSounds: false,
};

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

/**
 * Privacy + presence preferences (localStorage).
 * Passed into socket join-room as `privacy` payload; server respects flags when broadcasting.
 */
export function usePresence() {
  const [settings, setSettings] = useState(() => readStored());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota */
    }
  }, [settings]);

  const update = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const privacyPayload = useMemo(
    () => ({
      showOnline: settings.showOnline,
      showFocus: settings.showFocus,
      appearInLeaderboard: settings.appearInLeaderboard,
    }),
    [settings.showOnline, settings.showFocus, settings.appearInLeaderboard]
  );

  return { settings, update, privacyPayload };
}
