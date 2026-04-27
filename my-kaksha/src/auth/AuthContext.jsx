import { useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, logoutUser } from "../api/auth";
import { AuthContext } from "./auth-context";

function syncStoredUser(user) {
  if (user?.email) {
    localStorage.setItem("user", user.email);
  } else {
    localStorage.removeItem("user");
  }

  if (user?.name) {
    localStorage.setItem("myKakshaUserName", user.name);
  } else {
    localStorage.removeItem("myKakshaUserName");
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      syncStoredUser(currentUser);
      return currentUser;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      await logoutUser();
    } catch {
      // Clearing local auth state still helps the user recover from a stale session.
    } finally {
      setUser(null);
      syncStoredUser(null);
    }
  }

  useEffect(() => {
    refreshUser().catch(() => {
      setUser(null);
      syncStoredUser(null);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser,
      signOut,
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
