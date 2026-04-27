import { useEffect, useState } from "react";

const SIDEBAR_STORAGE_KEY = "mykaksha_sidebar_collapsed";
const SIDEBAR_EVENT = "mykaksha_sidebar_sync";

function readStoredState() {
  try {
    return globalThis.localStorage?.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function useSidebarState() {
  const [collapsed, setCollapsed] = useState(readStoredState);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
      globalThis.dispatchEvent(new CustomEvent(SIDEBAR_EVENT, { detail: { collapsed } }));
    } catch {
      // Ignore storage sync issues in private mode.
    }
  }, [collapsed]);

  useEffect(() => {
    const onSync = (event) => {
      setCollapsed(Boolean(event.detail?.collapsed));
    };

    globalThis.addEventListener(SIDEBAR_EVENT, onSync);
    return () => globalThis.removeEventListener(SIDEBAR_EVENT, onSync);
  }, []);

  return [collapsed, setCollapsed];
}
